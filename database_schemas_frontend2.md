# Database Schema — Frontend-Authoritative Reference

> **Audience:** MCP Bypass Server developers.
>
> The frontend (Next.js billing app) now owns **all table creation** via Drizzle ORM migrations. The backend's `database_schemas.md` is the *old expected* schema; this document is the **ground truth**. Read it in full before writing any query or migration on the backend side.

---

## Authoritative DDL

These are the exact tables the frontend creates. The backend must be compatible with this layout.

### `users`

```sql
CREATE TABLE "users" (
  "id"                            SERIAL PRIMARY KEY,
  "email"                         VARCHAR(255) NOT NULL,
  "password_hash"                 TEXT NOT NULL,
  "api_key"                       VARCHAR(255) NOT NULL,
  "balance"                       NUMERIC(10, 6) NOT NULL DEFAULT 0.000000,
  "role"                          VARCHAR(20)  NOT NULL DEFAULT 'member',
  "email_verified"                TIMESTAMP,
  "verification_token"            VARCHAR(255),
  "verification_token_expires_at" TIMESTAMP,
  "reset_token"                   VARCHAR(255),
  "reset_token_expires_at"        TIMESTAMP,
  "created_at"                    TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at"                    TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at"                    TIMESTAMP,
  CONSTRAINT "users_email_unique"              UNIQUE ("email"),
  CONSTRAINT "users_api_key_unique"            UNIQUE ("api_key"),
  CONSTRAINT "users_verification_token_unique" UNIQUE ("verification_token"),
  CONSTRAINT "users_reset_token_unique"        UNIQUE ("reset_token")
);
```

### `user_preferences`

```sql
CREATE TABLE "user_preferences" (
  "user_id"    INTEGER PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "preferences" JSONB NOT NULL DEFAULT '{}',
  "updated_at"  TIMESTAMP NOT NULL DEFAULT now()
);
```

### `token_usages`

```sql
CREATE TABLE "token_usages" (
  "id"                SERIAL PRIMARY KEY,
  "user_id"           INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "request_id"        VARCHAR(255) NOT NULL,
  "model"             VARCHAR(255) NOT NULL,
  "prompt_tokens"     INTEGER NOT NULL,
  "completion_tokens" INTEGER NOT NULL,
  "reasoning_tokens"  INTEGER NOT NULL DEFAULT 0,
  "total_tokens"      INTEGER NOT NULL,
  "cost"              NUMERIC(12, 8) NOT NULL,
  "claude_cost"       NUMERIC(12, 8) NOT NULL DEFAULT 0,
  "savings"           NUMERIC(12, 8) NOT NULL DEFAULT 0,
  "opus_cost"         NUMERIC(12, 8) NOT NULL DEFAULT 0,
  "opus_savings"      NUMERIC(12, 8) NOT NULL DEFAULT 0,
  "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "token_usages_request_id_unique" UNIQUE ("request_id")
);
```

### `activity_logs` *(frontend-only — backend may ignore)*

```sql
CREATE TABLE "activity_logs" (
  "id"         SERIAL PRIMARY KEY,
  "user_id"    INTEGER NOT NULL REFERENCES "users"("id"),
  "action"     TEXT NOT NULL,
  "timestamp"  TIMESTAMP NOT NULL DEFAULT now(),
  "ip_address" VARCHAR(45)
);
```

### `debug_logs`

```sql
CREATE TABLE "debug_logs" (
  "id"            SERIAL PRIMARY KEY,
  "request_id"    VARCHAR(255),
  "api_key"       VARCHAR(255),
  "model"         VARCHAR(255),
  "prompt"        TEXT,
  "messages"      JSONB,
  "response_text" TEXT,
  "thinking_text" TEXT,
  "raw_usage"     JSONB,
  "created_at"    TIMESTAMP DEFAULT now()
);
```

---

## Delta: What Changed vs. `database_schemas.md`

### 1. `users` — nine extra columns

| Column | Type | Notes |
|---|---|---|
| `password_hash` | `TEXT NOT NULL` | Required for every row. Backend must never INSERT into `users` (frontend owns creation), but reads must tolerate this column. |
| `role` | `VARCHAR(20) NOT NULL DEFAULT 'member'` | Always present. Values used by frontend: `'owner'`, `'member'`. |
| `email_verified` | `TIMESTAMP` | `NULL` until the user clicks their verification link. Unverified users cannot sign in. |
| `verification_token` | `VARCHAR(255)` | One-time token; cleared after use. |
| `verification_token_expires_at` | `TIMESTAMP` | Expiry for the above. |
| `reset_token` | `VARCHAR(255)` | One-time password-reset token; cleared after use. |
| `reset_token_expires_at` | `TIMESTAMP` | Expiry for the above. |
| `updated_at` | `TIMESTAMP NOT NULL` | Maintained by the frontend on every user update. |
| `deleted_at` | `TIMESTAMP` | Soft-delete marker — see §3 below. |

### 2. `users.balance` — default is `0`, currency is EUR

- **Default changed**: The old schema defaulted to `5.000000` (free trial). The live schema defaults to `0.000000`. New users start with zero balance and fund their wallet via Stripe.
- **Currency is EUR**: `users.balance` and `wallet:balance:{apiKey}` in Redis both store **EUR** amounts. The backend's architecture docs incorrectly described these as USD. Costs and savings logged by the backend in `token_usages` and Redis stats (`wallet:stats:{apiKey}`) are still **USD** — the frontend converts them to EUR for display using a cached FX rate.

### 3. Soft-delete pattern on `users`

When a user deletes their account:
- `deleted_at` is set to the current timestamp.
- `email` is mangled to `{email}-{id}-deleted` to free the unique constraint.
- The row is **not removed from the table**.

**Action required:** Any backend query that looks up a user by `api_key` should add `AND deleted_at IS NULL` to avoid serving deleted accounts:

```sql
-- Before
SELECT * FROM users WHERE api_key = $1;

-- After
SELECT * FROM users WHERE api_key = $1 AND deleted_at IS NULL;
```

### 4. `user_preferences` — no `id` column; `user_id` is the primary key

The old expected schema had:
```sql
id      SERIAL PRIMARY KEY,
user_id INT REFERENCES users(id) UNIQUE,
```

The actual table has:
```sql
user_id INTEGER PRIMARY KEY REFERENCES users(id),
```

**There is no `id` column.** Any backend code that does `SELECT id FROM user_preferences` or `ORDER BY id` will fail with a column-not-found error. Use `user_id` as the unique identifier:

```sql
-- Read preferences for a user
SELECT preferences FROM user_preferences WHERE user_id = $1;

-- Upsert preferences (backend background digestion worker)
INSERT INTO user_preferences (user_id, preferences, updated_at)
VALUES ($1, $2, now())
ON CONFLICT (user_id) DO UPDATE
  SET preferences = $2, updated_at = now();
```

### 5. `token_usages.user_id` is `NOT NULL`

The old schema declared `user_id INT REFERENCES users(id)` (implicitly nullable). The live schema marks it `NOT NULL`. The write-behind sync worker **must** include `user_id` in every INSERT — rows without it will be rejected.

### 6. `debug_logs` — now created by the frontend

This table is now part of the frontend's Drizzle schema and is created by `npm run db:migrate` alongside all other tables. The backend no longer needs to create it itself. The schema is identical to what the backend's `database_schemas.md` specified.

### 7. `activity_logs` — exists, backend should ignore it

This table is created by the frontend and is used solely for audit logging of user auth events (sign-in, password change, deposit, etc.). The backend does not need to read or write it.

---

## Redis Key Space (unchanged)

No changes from the existing `database_schemas.md`. Confirmed key patterns:

| Key | Type | Owner | Notes |
|---|---|---|---|
| `wallet:balance:{apiKey}` | String | Both (write) | EUR float as string. Frontend: `INCRBYFLOAT` on deposit, `SET` on new user. Backend: `DECRBYFLOAT` on usage. |
| `wallet:stats:{apiKey}` | Hash | Backend | Fields: `prompt_tokens`, `completion_tokens`, `reasoning_tokens`, `total_tokens`, `cost`, `claude_cost`, `savings`, `opus_cost`, `opus_savings`, `call_count`. Costs/savings in USD. |
| `wallet:calls:{apiKey}` | List | Backend | Capped at 500. JSON entries include `request_id`, `model`, token counts, `cost`, `savings`, `created_at`. |
| `wallet:sync_queue` | List | Backend | FIFO queue for write-behind worker. |
| `payment:processed:{paymentIntentId}` | String (NX+EX) | Frontend | 72-hour idempotency guard for Stripe events. |
| `thinking:{id}` | String | Backend | 10-minute TTL for reasoning traces. |

---

## Division of Responsibility (summary)

| Operation | Owner |
|---|---|
| CREATE TABLE (all tables) | **Frontend** via `npm run db:migrate` |
| INSERT new user | **Frontend** |
| Generate / rotate API key | **Frontend** |
| Credit wallet on deposit (Postgres + Redis) | **Frontend** |
| Deduct wallet cost per call (Redis only) | **Backend** |
| Write `token_usages` rows | **Backend** (write-behind worker) |
| Read/write `user_preferences` | Both |
| Write `debug_logs` rows | **Backend** (when `DEBUG=true`) |
| Write `activity_logs` | **Frontend** only |

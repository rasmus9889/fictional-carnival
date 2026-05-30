# MCP Bypass & Billing Architecture Specification

This document details the architecture, data schemas, and division of responsibility between the **MCP Bypass Server** (this application) and the **API-Handling Webapp** (the control panel/dashboard application).

---

## 1. System Architecture Diagram

The diagram below shows the flow of requests, caching layers, and database synchronization:

```mermaid
graph TD
    Client[Claude Code / Client] -->|1. Chat Request with API Key| Bypass[MCP Bypass Server]
    Bypass -->|2. Check Balance| Redis[(Redis Cache)]
    
    subgraph "Bypass Server Actions (Real-time)"
        Bypass -->|3. Deduct Wallet Cost| Redis
        Bypass -->|4. Increment Savings & Stats| Redis
        Bypass -->|5. Push Call Log to History| Redis
        Bypass -->|6. Queue DB Sync Payload| Redis
    end
    
    Redis -.->|7. Write-Behind Batch Sync (30s)| PG[(PostgreSQL DB)]
    
    subgraph "API Webapp (Control Panel)"
        Dashboard[Frontend Dashboard] -->|Read Stats & Wallet| PG
        Billing[Payment Gateway] -->|Update Balance & Create Keys| PG
        Billing -->|Invalidate/Sync Cache| Redis
    end
```

---

## 2. Shared Data Schemas

### A. Redis Key Space Design
Redis acts as the high-speed caching and real-time transaction layer:

| Key Pattern | Type | Lifetime | Purpose |
| :--- | :--- | :--- | :--- |
| `thinking:${id}` | String | 10 minutes | Caches the raw reasoning/thinking trace of DeepSeek responses. |
| `wallet:balance:${apiKey}` | String | Persistent | Caches the active user wallet balance. Decremented on every chat completion. |
| `wallet:stats:${apiKey}` | Hash | Persistent | Stores running total analytics for the user: `prompt_tokens`, `completion_tokens`, `reasoning_tokens`, `total_tokens`, `cost`, `claude_cost`, `savings`, `opus_cost`, `opus_savings`, and `call_count`. |
| `wallet:calls:${apiKey}` | List | Capped (500) | Stores a history of recent calls as stringified JSON objects for fast frontend retrieval. |
| `wallet:sync_queue` | List | FIFO Queue | Queue for the write-behind caching worker. Holds transaction payloads to sync to PostgreSQL. |

### B. PostgreSQL Database Schema
PostgreSQL is the system of record for persistence and long-term analytics:

```sql
-- Represents users and their active billing wallets
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    balance NUMERIC(10, 6) DEFAULT 5.000000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs every individual API completion request and its savings metrics
CREATE TABLE IF NOT EXISTS token_usages (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    request_id VARCHAR(255) UNIQUE NOT NULL,
    model VARCHAR(255) NOT NULL,
    prompt_tokens INT NOT NULL,
    completion_tokens INT NOT NULL,
    reasoning_tokens INT DEFAULT 0,
    total_tokens INT NOT NULL,
    cost NUMERIC(12, 8) NOT NULL,
    claude_cost NUMERIC(12, 8) DEFAULT 0.00000000,
    savings NUMERIC(12, 8) DEFAULT 0.00000000,
    opus_cost NUMERIC(12, 8) DEFAULT 0.00000000,
    opus_savings NUMERIC(12, 8) DEFAULT 0.00000000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Division of Responsibility (Separation of Concerns)

To maintain a scalable, secure microservices architecture, operations are divided strictly between the **MCP Bypass Server** and the **API-Handling Webapp**.

| Capability / Concern | Owned by MCP Bypass Server (This App) | Owned by API-Handling Webapp (Other App) |
| :--- | :---: | :---: |
| **API completions & tool calls** (`/mcp`, `/chat`, `extra_think`) | **Yes** | No |
| **Outsourcing reasoning & summaries** (Qwen, DeepSeek) | **Yes** | No |
| **Wallet balance checks & limit enforcement** | **Yes** (Rejects $\le 0$ requests) | No |
| **Deducting token costs in real-time** | **Yes** (Subtracts from Redis cache) | No |
| **Token cost & savings calculation** | **Yes** (Calculates Sonnet/Opus equivalent rates) | No |
| **Queueing logs & writing behind to Postgres** | **Yes** (Runs periodic sync worker) | No |
| **Creating users & assigning credentials** | No | **Yes** (Inserts into Postgres `users` table) |
| **Generating, rotating, & deleting API keys** | No | **Yes** (Writes to Postgres `users` table) |
| **Adding funds to wallet (deposits & adjustments)** | No | **Yes** (Updates Postgres `users.balance` table) |
| **Invalidating/Updating Redis cache on deposit** | No | **Yes** (Writes/Updates `wallet:balance:${apiKey}`) |
| **Frontend User Dashboard & charts** | No | **Yes** (Reads Postgres schemas & Redis lists) |

---

## 4. Best Practices for Integration

When integrating the **API-Handling Webapp** (the control panel) with this server:

1. **User Sign-up & Key Creation**:
   - The Webapp inserts a new row into PostgreSQL `users` with a randomly generated `api_key` and initial `balance`.
   - The Webapp does **not** need to touch Redis on user creation; the MCP Bypass Server will automatically load the balance into Redis from PostgreSQL upon the user's first request.

2. **Deposits / Wallet Topping**:
   - When a user adds funds, the Webapp must run a transaction updating the `balance` field in PostgreSQL.
   - The Webapp **MUST** update the cached Redis key `wallet:balance:${apiKey}` with the new balance immediately (e.g., using `SET wallet:balance:${apiKey} <new_balance>`) to ensure the user gets access to their funds without waiting for a database reload.

3. **Frontend Analytics Rendering**:
   - The Webapp can query the PostgreSQL `token_usages` table to render detailed historical charts (e.g., tokens consumed, money spent, money saved over weeks/months).
   - For real-time, low-latency elements (such as displaying "Total money saved so far" or "Recent calls list" on a dashboard), the Webapp can query the Redis Hash `wallet:stats:${apiKey}` and Redis List `wallet:calls:${apiKey}` directly, bypassing PostgreSQL database queries entirely.

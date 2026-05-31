'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Copy,
  RefreshCw,
  Wallet,
  TrendingDown,
  Activity,
  Check,
  Key,
} from 'lucide-react';
import { rotateApiKey } from '@/app/(login)/actions';
import { useActionState } from 'react';
import useSWR from 'swr';
import { User } from '@/lib/db/schema';
import type { WalletStats, CallLog } from '@/lib/db/redis';
import Link from 'next/link';

type ActionState = { error?: string; success?: string };
type WalletData = {
  stats: WalletStats | null;
  recentCalls: CallLog[];
  balanceEur: number;
  eurToUsd: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function toEur(usd: number, eurToUsd: number) {
  return (usd / eurToUsd).toFixed(4);
}

function WalletBalanceCard() {
  const { data } = useSWR<WalletData>('/api/wallet', fetcher);
  const balanceEur = data?.balanceEur ?? 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-orange-500" />
          Wallet Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold text-foreground">
          €{balanceEur.toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">Available balance</p>
        <Button
          asChild
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Link href="/pricing">Add Funds</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ApiKeyCard() {
  const { data: user, mutate } = useSWR<User>('/api/user', fetcher);
  const [copied, setCopied] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    rotateApiKey,
    {}
  );

  useEffect(() => {
    if (state.success) mutate();
  }, [state.success, mutate]);

  const handleCopy = async () => {
    if (!user?.apiKey) return;
    await navigator.clipboard.writeText(user.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-orange-500" />
          API Key
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono truncate">
            {user?.apiKey
              ? `${user.apiKey.substring(0, 16)}${'•'.repeat(16)}`
              : '...'}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Use this key as your Anthropic API key in Claude Code.
        </p>
        <form action={formAction}>
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rotating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Rotate Key
              </>
            )}
          </Button>
        </form>
        {state.error && (
          <p className="text-red-500 text-sm mt-2">{state.error}</p>
        )}
        {state.success && (
          <p className="text-green-500 text-sm mt-2">{state.success}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatsCards() {
  const { data } = useSWR<WalletData>('/api/wallet', fetcher);
  const stats = data?.stats;
  const eurToUsd = data?.eurToUsd ?? 1;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Spent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            €{toEur(parseFloat(stats?.cost ?? '0'), eurToUsd)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-green-500" />
            Total Saved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            €{toEur(parseFloat(stats?.savings ?? '0'), eurToUsd)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            API Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats?.call_count ?? '0'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {parseInt(stats?.total_tokens ?? '0').toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentCallsCard() {
  const { data } = useSWR<WalletData>('/api/wallet', fetcher);
  const calls = data?.recentCalls ?? [];
  const eurToUsd = data?.eurToUsd ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          Recent API Calls
        </CardTitle>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No API calls yet. Start using your API key to see usage here.
          </p>
        ) : (
          <ul className="space-y-3">
            {calls.map((call, i) => (
              <li
                key={call.request_id ?? i}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium">{call.model}</span>
                  <span className="text-muted-foreground ml-2">
                    {call.total_tokens.toLocaleString()} tokens
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-foreground">
                    €{toEur(call.cost, eurToUsd)}
                  </span>
                  <span className="text-green-600 ml-2">
                    −€{toEur(call.savings, eurToUsd)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function WalletPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">
        Wallet &amp; API Key
      </h1>
      <WalletBalanceCard />
      <ApiKeyCard />
      <StatsCards />
      <RecentCallsCard />
    </section>
  );
}

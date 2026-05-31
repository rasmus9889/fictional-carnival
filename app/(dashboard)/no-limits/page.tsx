import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'No More Claude Code Usage Limits',
  description:
    'Stop hitting Claude\'s daily cap. LoopLoot is a pay-as-you-go proxy — unlimited tokens, EUR wallet, no monthly commitment. One setting change.',
  alternates: { canonical: 'https://looploot.com/no-limits' },
  openGraph: {
    title: 'No More Claude Code Usage Limits – LoopLoot',
    description:
      'Unlimited tokens. Pay per use. EUR wallet. One setting change.',
    url: 'https://looploot.com/no-limits',
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LoopLoot – No Usage Limits',
  applicationCategory: 'DeveloperApplication',
  url: 'https://looploot.com/no-limits',
  description:
    'Pay-as-you-go Claude Code proxy. No daily or monthly token caps. EUR wallet. One setting change.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Free to sign up. Pay only for tokens used.',
  },
};

export default function NoLimitsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-20">
        {/* Hero */}
        <section className="space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-sm">
            <Zap className="h-3.5 w-3.5" />
            Works with Claude Code &amp; Claude.ai · No caps · No resets
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Claude Keeps Hitting Its Limit?{' '}
            <span className="text-orange-500">We Fixed That.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            LoopLoot is a separate tool that supercharges Claude across Claude Code and
            Claude.ai. Connect it once and the limits disappear — across every session,
            every interface, for as long as your wallet has a balance.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-full px-8"
          >
            <Link href="/sign-up">
              Get Unlimited Access — Free to Start
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* Pain points */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center">
            You know the feeling
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: '🛑',
                heading: 'Cut off mid-task',
                body: 'The cap hits right when you\'re in the zone — deep in a problem that\'s finally clicking. You lose the thread and the momentum.',
              },
              {
                emoji: '⏳',
                heading: 'Watching the clock',
                body: 'Knowing the reset is at midnight changes how you work. You ration tokens instead of thinking freely.',
              },
              {
                emoji: '💸',
                heading: 'Paying for a tier you outgrow',
                body: 'Higher subscription tiers cost more every month, even on weeks you barely use Claude. You\'re paying for headroom you may never need.',
              },
            ].map((item) => (
              <Card key={item.heading} className="bg-card border-border">
                <CardContent className="pt-6 space-y-3">
                  <div className="text-3xl">{item.emoji}</div>
                  <h3 className="font-semibold text-foreground">{item.heading}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Solution */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center">
            How LoopLoot removes the ceiling
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Truly unlimited tokens',
                body: 'No daily cap. No monthly cap. No throttling after heavy use. Your API key works as long as your wallet has a balance.',
              },
              {
                title: 'EUR wallet, top up when you want',
                body: 'Add exactly what you need — €5, €10, €25, or €50. Credits never expire. You\'re not locked into a recurring charge.',
              },
              {
                title: 'One setting change',
                body: 'Point Claude Code at LoopLoot\'s API endpoint. Takes 30 seconds. Everything else works exactly as before.',
              },
            ].map((item) => (
              <Card key={item.title} className="bg-card border-border hover:border-orange-500/40 transition-colors">
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold text-orange-400">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-5 py-8 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground">
            Stop managing limits. Start using Claude.
          </h2>
          <p className="text-muted-foreground">
            Sign up in under a minute. Top up your wallet. Change one setting.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-full px-8"
          >
            <Link href="/sign-up">
              Get Started — Free to Sign Up
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <div className="pt-2">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to LoopLoot
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

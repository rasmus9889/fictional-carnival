import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Rocket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Claude Code for Founders & Entrepreneurs',
  description:
    'Ship faster with unlimited Claude Code. No usage caps breaking your build-test-iterate loop. EUR wallet, personal memory, and web search for lean teams.',
  alternates: { canonical: 'https://looploot.com/for-founders' },
  openGraph: {
    title: 'Claude Code for Founders & Entrepreneurs – LoopLoot',
    description:
      'Unlimited Claude Code for building. No caps. EUR wallet. Memory + web search.',
    url: 'https://looploot.com/for-founders',
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'LoopLoot for Founders & Entrepreneurs',
  url: 'https://looploot.com/for-founders',
  description:
    'Unlimited Claude Code for startups and solo founders. Ship faster, iterate more. EUR wallet, personal memory, web search. No usage caps.',
  audience: {
    '@type': 'Audience',
    audienceType: 'Entrepreneurs and startup founders',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Free to sign up. Pay only for tokens used.',
  },
};

export default function ForFoundersPage() {
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
            <Rocket className="h-3.5 w-3.5" />
            For founders, builders &amp; entrepreneurs
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Ship Faster. Iterate More.{' '}
            <span className="text-orange-500">Never Wait for a Limit Reset.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            LoopLoot is a separate tool that supercharges Claude on Claude Code and
            Claude.ai. It removes usage limits, carries your stack and context across
            every session, and adds real-time web search — so the only thing slowing
            you down is the problem, not the tool.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-full px-8"
          >
            <Link href="/sign-up">
              Start Shipping Without Limits
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* Pain points */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center">
            The friction you don't have time for
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: '🚧',
                heading: 'Limits break the loop',
                body: 'Your build-test-iterate cycle depends on tight feedback. A usage cap mid-sprint means context lost, momentum gone, and time wasted waiting for a reset.',
              },
              {
                emoji: '🧠',
                heading: 'Re-briefing Claude every session',
                body: 'You\'ve got a specific stack, naming conventions, and product context. Explaining it again at the start of every session is overhead you can\'t afford.',
              },
              {
                emoji: '⏱️',
                heading: 'Every minute matters',
                body: 'You\'re not a large team. Each interruption costs more — there\'s no one to hand off to while you wait for access to come back.',
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

        {/* Features */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center">
            What LoopLoot gives founders
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Unlimited throughput',
                body: 'No daily or monthly token cap. Sprint sessions, late-night debugging, pre-launch pushes — your Claude Code keeps up with whatever you throw at it.',
              },
              {
                title: 'Memory for your stack',
                body: 'Claude remembers your architecture, your conventions, your goals, and what you were working on last time. Start every session at full speed.',
              },
              {
                title: 'Pay for what you use',
                body: 'EUR wallet. Top up when you need it. No monthly subscription that charges you through slow weeks. Your costs scale with your activity, not a plan tier.',
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
            One less thing slowing you down.
          </h2>
          <p className="text-muted-foreground">
            Sign up in under a minute. Change one setting. Ship without stopping.
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

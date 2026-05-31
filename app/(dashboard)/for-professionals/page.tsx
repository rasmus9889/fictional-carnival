import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Claude Code for Consultants & Professionals',
  description:
    'Billable hours without interruptions. Claude Code with personal memory that keeps client context across sessions. Pay only for what you use.',
  alternates: { canonical: 'https://looploot.com/for-professionals' },
  openGraph: {
    title: 'Claude Code for Consultants & Professionals – LoopLoot',
    description:
      'Uninterrupted Claude Code for billable work. Memory, web search, pay as you go.',
    url: 'https://looploot.com/for-professionals',
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'LoopLoot for Consultants & Professionals',
  serviceType: 'AI Assistant Proxy',
  url: 'https://looploot.com/for-professionals',
  description:
    'Unlimited Claude Code for professionals. Personal memory for client context. Pay only for what you use. No usage interruptions.',
  provider: {
    '@type': 'Organization',
    name: 'LoopLoot',
    url: 'https://looploot.com',
  },
};

export default function ForProfessionalsPage() {
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
            <Briefcase className="h-3.5 w-3.5" />
            For consultants, freelancers &amp; professionals
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Claude Code That Keeps Up With{' '}
            <span className="text-orange-500">Your Billable Hours.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            LoopLoot is a separate tool that supercharges Claude on Claude Code and
            Claude.ai. It sits between you and Claude, carrying your client context
            across every session and interface — so you arrive ready to work, not ready
            to re-brief.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-full px-8"
          >
            <Link href="/sign-up">
              Start Your Professional Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* Pain points */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center">
            What gets in the way
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: '⏸️',
                heading: 'Limits interrupt client work',
                body: 'Usage caps don\'t care that you\'re mid-deliverable. Explaining to a client why you\'re waiting for a reset is not a conversation anyone wants.',
              },
              {
                emoji: '🔁',
                heading: 'Re-explaining context every session',
                body: 'You spend the first minutes of every session catching Claude up on the client, the project, and your working style. That\'s billable time wasted.',
              },
              {
                emoji: '📋',
                heading: 'Unpredictable monthly costs',
                body: 'A flat monthly subscription charges you the same whether you use Claude heavily or barely at all. You end up paying for headroom you didn\'t need.',
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
            What LoopLoot adds to your workflow
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Never interrupted',
                body: 'No daily or monthly caps. Your key works as long as your wallet has a balance. Structure your work around client needs, not token resets.',
              },
              {
                title: 'Memory across sessions',
                body: 'Claude remembers each client\'s context, your working conventions, and your preferred output format. Show up ready to work, not ready to brief.',
              },
              {
                title: 'Pay only for what you use',
                body: 'Top up your wallet and spend it down. No recurring charge, no unused allocation. Your cost this month is exactly what you consumed.',
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
            Professional-grade Claude Code, without the friction.
          </h2>
          <p className="text-muted-foreground">
            Sign up in under a minute. One setting change. Back to work.
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

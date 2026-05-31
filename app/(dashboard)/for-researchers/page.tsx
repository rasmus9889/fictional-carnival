import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Claude Code for Researchers & Writers',
  description:
    'Deep research without interruptions. Built-in web search for real-time sources, personal memory that tracks your work across sessions, and no usage limits.',
  alternates: { canonical: 'https://looploot.com/for-researchers' },
  openGraph: {
    title: 'Claude Code for Researchers & Writers – LoopLoot',
    description:
      'Unlimited sessions. Real-time web search. Memory that tracks your research across weeks.',
    url: 'https://looploot.com/for-researchers',
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LoopLoot for Researchers & Writers',
  applicationCategory: 'EducationApplication',
  url: 'https://looploot.com/for-researchers',
  description:
    'Unlimited Claude Code for research and writing. Real-time web search, session memory, no usage caps.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Free to sign up. Pay only for tokens used.',
  },
};

export default function ForResearchersPage() {
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
            <BookOpen className="h-3.5 w-3.5" />
            For researchers, writers &amp; academics
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Research Without Interruption.{' '}
            <span className="text-orange-500">Write Without Limits.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            LoopLoot is a separate tool that supercharges Claude on Claude Code and
            Claude.ai. It follows you across sessions and interfaces, carrying your
            research context, enabling live web search, and removing the usage limits
            that cut deep work short.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-full px-8"
          >
            <Link href="/sign-up">
              Start Researching Without Limits
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* Pain points */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-foreground text-center">
            What breaks deep work
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: '✂️',
                heading: 'Sessions cut short',
                body: 'Usage limits hit during long research sessions — right when you\'re synthesising, structuring, or finding the thread that ties everything together.',
              },
              {
                emoji: '🔍',
                heading: 'No access to current information',
                body: 'Claude\'s knowledge has a cutoff. For live topics — news, recent papers, current events — you have to look things up yourself and paste them in.',
              },
              {
                emoji: '🔄',
                heading: 'Starting cold every session',
                body: 'Each new session means re-briefing your topic, sources, and approach. Deep research builds across days. Your tools should too.',
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
            What LoopLoot gives you
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Sessions as long as you need',
                body: 'No usage cap means no interruption. Whether a session lasts 20 minutes or 4 hours, you decide when you\'re done — not a token counter.',
              },
              {
                title: 'Real-time web search',
                body: 'Claude can search the web mid-conversation. Get current sources, check recent publications, verify facts — without leaving your flow.',
              },
              {
                title: 'Memory that spans weeks',
                body: 'Your research context, sources, working hypotheses, and preferences persist across every session. Come back after a week and pick up exactly where you were.',
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
            Your research deserves uninterrupted focus.
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

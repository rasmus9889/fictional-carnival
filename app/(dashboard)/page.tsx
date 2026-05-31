import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Terminal } from './terminal';
import { ArrowRight, Zap, Globe, Brain, CreditCard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LoopLoot – Unlimited Claude Code',
  description:
    'Stop hitting Claude Code usage limits. Pay-as-you-go EUR wallet, built-in web search, and personal memory. One setting change to get started.',
  alternates: { canonical: 'https://looploot.com' },
  openGraph: {
    title: 'LoopLoot – Claude Code, Without the Ceiling',
    description:
      'No more usage caps. EUR wallet. Web search + memory. One setting change.',
    url: 'https://looploot.com',
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LoopLoot',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  url: 'https://looploot.com',
  description:
    'Pay-as-you-go Claude Code proxy with EUR wallet, web search, and personal memory. No usage limits.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Free to sign up. Pay only for tokens used.',
  },
};

const features = [
  {
    icon: Zap,
    title: 'No Usage Limits',
    description:
      'Pay per token, not per month. Use Claude Code and Claude.ai as much as you want — no daily caps, no throttling, no waiting for the reset.',
  },
  {
    icon: CreditCard,
    title: 'EUR Wallet',
    description:
      'Top up like a prepaid card. Credits never expire, and you only pay for what you use. No USD conversion, no surprises.',
  },
  {
    icon: Globe,
    title: 'Web Search Built In',
    description:
      'Claude can look things up on the web mid-conversation, across both Claude Code and Claude.ai. No plugins, no pasting links.',
  },
  {
    icon: Brain,
    title: 'Cross-Session Memory',
    description:
      'Your background, projects, and preferences follow you across sessions and interfaces. Claude picks up exactly where you left off — every time.',
  },
];

const personas = [
  {
    href: '/no-limits',
    label: 'Hit the wall recently?',
    desc: 'For anyone who keeps hitting Claude\'s daily usage cap right when they\'re in the zone.',
    cta: 'Go unlimited',
  },
  {
    href: '/for-professionals',
    label: 'Consultants & professionals',
    desc: 'Billable hours with no interruptions. Memory that keeps client context across sessions.',
    cta: 'For your workflow',
  },
  {
    href: '/for-researchers',
    label: 'Researchers & writers',
    desc: 'Long sessions, real-time web search, and memory that tracks your work across weeks.',
    cta: 'For deep work',
  },
  {
    href: '/for-founders',
    label: 'Founders & builders',
    desc: 'Ship faster. Claude Code that keeps up with your build-test-iterate loop without stopping.',
    cta: 'For shipping',
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main>
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-sm font-medium">
                  <Zap className="h-3.5 w-3.5" />
                  Works with Claude Code &amp; Claude.ai
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                  Supercharge Claude{' '}
                  <span className="text-orange-500">Across Every Session</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  LoopLoot is a separate tool that sits between you and Claude — on
                  Claude Code, on Claude.ai, across every session. No usage limits,
                  real-time web search, and a memory that follows you wherever you work.
                  Pay as you go in EUR.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-full px-8"
                  >
                    <Link href="/sign-up">
                      Get Your API Key
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-border text-foreground hover:bg-muted"
                  >
                    <Link href="/pricing">See Pricing</Link>
                  </Button>
                </div>
              </div>

              <div className="mt-12 lg:mt-0 lg:col-span-6">
                <Terminal />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">Up and running in minutes</h2>
              <p className="text-muted-foreground">
                LoopLoot connects to your existing Claude workflow. No new interface to learn.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  title: 'Sign up & top up',
                  desc: 'Create an account and add EUR to your wallet. Starts from €5 — credits never expire.',
                },
                {
                  step: '02',
                  title: 'Connect LoopLoot',
                  desc: 'Link LoopLoot to Claude Code and Claude.ai. One key, one endpoint, both interfaces covered.',
                },
                {
                  step: '03',
                  title: 'Work exactly as before',
                  desc: 'Same Claude, same interface — but now with no limits, web search, and memory that follows you.',
                },
              ].map((item) => (
                <Card key={item.step} className="bg-card border-border">
                  <CardContent className="pt-6 space-y-3">
                    <div className="text-4xl font-bold text-orange-500/30 font-mono">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">A layer that makes Claude more powerful</h2>
              <p className="text-muted-foreground">
                LoopLoot isn't a different AI — it's a supercharger that sits on top of Claude,
                active across Claude Code and Claude.ai.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feat) => (
                <Card key={feat.title} className="bg-card border-border hover:border-orange-500/40 transition-colors">
                  <CardContent className="pt-6 space-y-3">
                    <feat.icon className="h-6 w-6 text-orange-500" />
                    <h3 className="font-semibold text-foreground">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feat.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Persona links */}
        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">Built for how you actually work</h2>
              <p className="text-muted-foreground">
                Whether you push Claude hard every day or just want it to finally remember who you are.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {personas.map((p) => (
                <Link key={p.href} href={p.href} className="group">
                  <Card className="h-full bg-card border-border group-hover:border-orange-500/50 transition-colors">
                    <CardContent className="pt-6 pb-5 flex flex-col gap-3">
                      <h3 className="font-semibold text-foreground text-sm">{p.label}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                        {p.desc}
                      </p>
                      <span className="text-xs text-orange-500 group-hover:text-orange-400 flex items-center gap-1">
                        {p.cta} <ArrowRight className="h-3 w-3" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 border-t border-border text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Ready to go unlimited?
            </h2>
            <p className="text-muted-foreground text-lg">
              Stop managing limits. Start using Claude Code the way it was meant to be used.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-full px-10"
            >
              <Link href="/sign-up">
                Get started — free to sign up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}

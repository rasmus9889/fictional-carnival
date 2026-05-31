'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

const steps = [
  { text: '# 1. Sign up at looploot.com and top up your wallet', type: 'comment' },
  { text: '', type: 'blank' },
  { text: '# 2. Grab your API key from the dashboard', type: 'comment' },
  { text: '', type: 'blank' },
  { text: '# 3. One-time Claude Code setup:', type: 'comment' },
  { text: 'export ANTHROPIC_BASE_URL="https://api.looploot.com"', type: 'command' },
  { text: 'export ANTHROPIC_API_KEY="mcp_your_key_here"', type: 'command' },
  { text: '', type: 'blank' },
  { text: '# Done. Use Claude Code exactly as before:', type: 'comment' },
  { text: '$ claude', type: 'command' },
  { text: '> Connected via LoopLoot  ·  No limits  ·  Web search active', type: 'output' },
];

const copySnippet = `export ANTHROPIC_BASE_URL="https://api.looploot.com"
export ANTHROPIC_API_KEY="mcp_your_key_here"`;

export function Terminal() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visibleCount >= steps.length) return;
    const delay = steps[visibleCount].type === 'blank' ? 80 : 420;
    const t = setTimeout(() => setVisibleCount((n) => n + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount]);

  const handleCopy = () => {
    navigator.clipboard.writeText(copySnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-lg overflow-hidden border border-green-900/50 bg-black/70 shadow-2xl shadow-green-950/30 font-mono text-sm">
      {/* title bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-green-900/30">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-green-700/80 tracking-widest">looploot — setup</span>
        <button
          onClick={handleCopy}
          className="text-green-700/60 hover:text-green-400 transition-colors"
          aria-label="Copy setup commands"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* content */}
      <div className="p-5 space-y-0.5 leading-relaxed min-h-[220px]">
        {steps.slice(0, visibleCount).map((step, i) => {
          if (step.type === 'blank') return <div key={i} className="h-2" />;
          return (
            <div key={i} className="animate-fade-in">
              {step.type === 'comment' && (
                <span className="text-green-700/70">{step.text}</span>
              )}
              {step.type === 'command' && (
                <span className="text-green-300">{step.text}</span>
              )}
              {step.type === 'output' && (
                <span className="text-orange-400">{step.text}</span>
              )}
            </div>
          );
        })}
        {visibleCount < steps.length && (
          <span className="inline-block w-2 h-4 bg-green-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}

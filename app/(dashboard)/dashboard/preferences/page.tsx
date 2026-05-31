'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, Save, RotateCcw, Info } from 'lucide-react';

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function PreferencesPage() {
  const [raw, setRaw] = useState('');
  const [saved, setSaved] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/preferences');
      if (!res.ok) throw new Error('Failed to load preferences');
      const data = await res.json();
      const formatted = formatJson(data.preferences);
      setRaw(formatted);
      setSaved(formatted);
    } catch {
      setError('Could not load preferences. Try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setError('Invalid JSON — fix the syntax before saving.');
      return;
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setError('Preferences must be a JSON object { }, not an array or primitive.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: raw,
      });
      if (!res.ok) throw new Error('Save failed');
      const formatted = formatJson(parsed);
      setRaw(formatted);
      setSaved(formatted);
      setLastUpdated(new Date().toLocaleTimeString());
      setSuccess('Preferences saved.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = raw !== saved;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-2">
        Personal Context
      </h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        These preferences are injected into Claude's system prompt on every request via
        LoopLoot. The backend also updates them automatically as it learns from your
        conversations. You can edit them here to correct or expand what Claude knows
        about you.
      </p>

      <Card className="mb-4 border-orange-500/20 bg-orange-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-2 text-sm text-orange-400">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              The backend digests your prompts in the background and may update these
              preferences automatically between sessions. Refresh to see the latest version.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Brain className="h-5 w-5 text-orange-500" />
            Preferences JSON
            {lastUpdated && (
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                Saved at {lastUpdated}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading preferences…
            </div>
          ) : (
            <>
              <textarea
                className="w-full min-h-[320px] font-mono text-sm bg-black/40 border border-border rounded-md p-4 text-green-300 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-y"
                value={raw}
                onChange={(e) => {
                  setRaw(e.target.value);
                  setError('');
                  setSuccess('');
                }}
                spellCheck={false}
                aria-label="Preferences JSON editor"
              />

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              {success && (
                <p className="text-green-400 text-sm">{success}</p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  className="bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={load}
                  disabled={isLoading || isSaving}
                  className="border-border text-foreground hover:bg-muted"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

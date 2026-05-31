'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Brain,
  Loader2,
  Save,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';

// Fixed fields always shown to the user.
const FIXED_FIELDS = [
  {
    key: 'about',
    label: 'About me',
    placeholder: 'Your role, background, expertise — who you are and what you do.',
    rows: 3,
  },
  {
    key: 'style',
    label: 'Preferred style',
    placeholder: 'How you like Claude to communicate — tone, format, level of detail.',
    rows: 2,
  },
  {
    key: 'projects',
    label: 'Current projects',
    placeholder: 'What you are working on right now.',
    rows: 3,
  },
  {
    key: 'context',
    label: 'Additional context',
    placeholder: 'Anything else Claude should always know about you.',
    rows: 2,
  },
] as const;

type FixedKey = (typeof FIXED_FIELDS)[number]['key'];
type FixedFields = Record<FixedKey, string>;
type CustomField = { key: string; value: string };

const FIXED_KEY_SET = new Set<string>(FIXED_FIELDS.map((f) => f.key));

function extractFixed(prefs: Record<string, unknown>): FixedFields {
  const out: FixedFields = { about: '', style: '', projects: '', context: '' };
  for (const f of FIXED_FIELDS) {
    const v = prefs[f.key];
    if (typeof v === 'string') out[f.key] = v;
  }
  return out;
}

function extractCustom(prefs: Record<string, unknown>): CustomField[] {
  return Object.entries(prefs)
    .filter(([k]) => !FIXED_KEY_SET.has(k))
    .map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }));
}

function buildFullPrefs(
  fixed: FixedFields,
  custom: CustomField[]
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const f of FIXED_FIELDS) {
    if (fixed[f.key].trim()) obj[f.key] = fixed[f.key];
  }
  for (const c of custom) {
    if (c.key.trim()) obj[c.key] = c.value;
  }
  return obj;
}

function formatJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

export default function PreferencesPage() {
  const [fixed, setFixed] = useState<FixedFields>({
    about: '', style: '', projects: '', context: '',
  });
  const [custom, setCustom] = useState<CustomField[]>([]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rawJson, setRawJson] = useState('{}');
  const [jsonError, setJsonError] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const applyPrefs = useCallback((prefs: Record<string, unknown>) => {
    const f = extractFixed(prefs);
    const c = extractCustom(prefs);
    setFixed(f);
    setCustom(c);
    setRawJson(formatJson(buildFullPrefs(f, c)));
    setJsonError(false);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/preferences');
      if (!res.ok) throw new Error();
      const data = await res.json();
      applyPrefs(data.preferences as Record<string, unknown>);
    } catch {
      setError('Could not load preferences. Try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, [applyPrefs]);

  useEffect(() => { load(); }, [load]);

  // Keep raw JSON in sync when the structured form changes (not while advanced is open)
  useEffect(() => {
    if (!showAdvanced) {
      setRawJson(formatJson(buildFullPrefs(fixed, custom)));
      setJsonError(false);
    }
  }, [fixed, custom, showAdvanced]);

  const handleRawChange = (value: string) => {
    setRawJson(value);
    try {
      JSON.parse(value);
      setJsonError(false);
    } catch {
      setJsonError(true);
    }
  };

  const resetToStructured = () => {
    setRawJson(formatJson(buildFullPrefs(fixed, custom)));
    setJsonError(false);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    let payload: Record<string, unknown>;

    if (showAdvanced) {
      if (jsonError) {
        setError('Fix the JSON syntax before saving, or reset to the structured version.');
        return;
      }
      try {
        payload = JSON.parse(rawJson) as Record<string, unknown>;
      } catch {
        setError('Invalid JSON — cannot save.');
        return;
      }
    } else {
      // Validate no duplicate custom keys
      const keys = custom.map((c) => c.key.trim()).filter(Boolean);
      const uniqueKeys = new Set(keys);
      if (keys.length !== uniqueKeys.size) {
        setError('Each custom field must have a unique name.');
        return;
      }
      payload = buildFullPrefs(fixed, custom);
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      applyPrefs(payload);
      setSuccess('Preferences saved.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addCustomField = () =>
    setCustom((c) => [...c, { key: '', value: '' }]);

  const updateCustomKey = (i: number, key: string) =>
    setCustom((c) => c.map((f, idx) => (idx === i ? { ...f, key } : f)));

  const updateCustomValue = (i: number, value: string) =>
    setCustom((c) => c.map((f, idx) => (idx === i ? { ...f, value } : f)));

  const removeCustomField = (i: number) =>
    setCustom((c) => c.filter((_, idx) => idx !== i));

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-2">
        My Context
      </h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        This is what LoopLoot tells Claude about you on every request. Fill in
        whatever helps Claude understand who you are and how you like to work.
        LoopLoot also updates this automatically as it learns from your conversations.
      </p>

      <Card className="mb-4 border-orange-500/20 bg-orange-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-2 text-sm text-orange-400">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              LoopLoot enriches your context automatically in the background.
              Refresh this page after a few sessions to see what it has learned.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Brain className="h-5 w-5 text-orange-500" />
            Your Claude Context
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <>
              {/* Fixed fields */}
              {FIXED_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={field.key} className="text-foreground font-medium">
                    {field.label}
                  </Label>
                  <textarea
                    id={field.key}
                    rows={field.rows}
                    placeholder={field.placeholder}
                    value={fixed[field.key]}
                    onChange={(e) =>
                      setFixed((f) => ({ ...f, [field.key]: e.target.value }))
                    }
                    className="w-full bg-black/30 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                  />
                </div>
              ))}

              {/* Custom fields */}
              {custom.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Custom fields
                  </p>
                  {custom.map((field, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="w-36 shrink-0">
                        <Input
                          placeholder="Field name"
                          value={field.key}
                          onChange={(e) => updateCustomKey(i, e.target.value)}
                          className="bg-black/30 border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:ring-orange-500"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) => updateCustomValue(i, e.target.value)}
                        className="flex-1 bg-black/30 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomField(i)}
                        className="text-muted-foreground hover:text-red-400 mt-0.5 px-2"
                        aria-label="Remove field"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add field button */}
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomField}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add field
              </Button>

              {/* Feedback */}
              {error && !showAdvanced && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              {success && (
                <p className="text-green-400 text-sm">{success}</p>
              )}

              {/* Save button */}
              {!showAdvanced && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
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
                      Save
                    </>
                  )}
                </Button>
              )}

              {/* Advanced toggle */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAdvanced ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  Advanced — edit raw JSON
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Direct JSON editor. Editing here overrides the fields above.
                      A syntax error will block saving — you can always reset back.
                    </p>

                    {jsonError && (
                      <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-400 animate-fade-in">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          Invalid JSON syntax.{' '}
                          <button
                            onClick={resetToStructured}
                            className="underline underline-offset-2 hover:text-red-300 transition-colors font-medium"
                          >
                            Reset to structured version
                          </button>
                        </div>
                      </div>
                    )}

                    <textarea
                      rows={14}
                      className={`w-full font-mono text-sm bg-black/40 border rounded-md p-4 text-green-300 focus:outline-none focus:ring-1 resize-y transition-colors ${
                        jsonError
                          ? 'border-red-500/60 focus:ring-red-500'
                          : 'border-border focus:ring-orange-500'
                      }`}
                      value={rawJson}
                      onChange={(e) => handleRawChange(e.target.value)}
                      spellCheck={false}
                      aria-label="Raw JSON preferences editor"
                    />

                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {success && <p className="text-green-400 text-sm">{success}</p>}

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving || jsonError}
                        className="bg-orange-500 hover:bg-orange-600 text-black font-semibold disabled:opacity-40"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save JSON
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
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

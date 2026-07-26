'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ArrowRight, Variable, Hash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { extractVariableIndices } from '@/lib/whatsapp/template-validators';

const categoryColors: Record<string, string> = {
  Marketing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Utility: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Authentication: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const categoryIcons: Record<string, string> = {
  Marketing: '📢',
  Utility: '🔔',
  Authentication: '🔐',
};

interface Step1Props {
  selectedTemplate: MessageTemplate | null;
  onSelect: (template: MessageTemplate) => void;
  onNext: () => void;
  onBack: () => void;
}

function highlightVariables(text: string): { segments: { type: 'text' | 'variable'; value: string }[]; count: number } {
  const parts = text.split(/(\{\{\d+\}\})/g);
  let count = 0;
  const segments = parts.map((part) => {
    if (/\{\{\d+\}\}/.test(part)) {
      count++;
      return { type: 'variable' as const, value: part };
    }
    return { type: 'text' as const, value: part };
  });
  const uniqueCount = new Set(segments.filter(s => s.type === 'variable').map(s => s.value)).size;
  return { segments, count: uniqueCount };
}

export function Step1ChooseTemplate({ selectedTemplate, onSelect, onNext, onBack }: Step1Props) {
  const t = useTranslations('Broadcasts.wizard');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForPreview, setSelectedForPreview] = useState<MessageTemplate | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('message_templates')
          .select('*')
          .eq('status', 'APPROVED')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setTemplates(data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('chooseTemplate.errorLoad'));
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  const variableCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const tpl of templates) {
      const bodyVars = extractVariableIndices(tpl.body_text).length;
      const headerVars = tpl.header_type === 'text' && tpl.header_content
        ? extractVariableIndices(tpl.header_content).length
        : 0;
      const urlVars = (tpl.buttons ?? []).reduce((sum, btn) => {
        if (btn.type === 'URL' && 'url' in btn && btn.url) {
          return sum + extractVariableIndices(btn.url).length;
        }
        return sum;
      }, 0);
      map.set(tpl.id, bodyVars + headerVars + urlVars);
    }
    return map;
  }, [templates]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('chooseTemplate.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('chooseTemplate.subtitle')}
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-border bg-card/50">
            <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('chooseTemplate.noTemplates')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('chooseTemplate.createFirst')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id;
              const catColor = categoryColors[template.category] ?? categoryColors.Utility;
              const { segments, count: varCount } = highlightVariables(template.body_text);
              const totalVars = variableCounts.get(template.id) ?? 0;

              return (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelect(template);
                    setSelectedForPreview(template);
                  }}
                  className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border bg-card/50 hover:border-border hover:bg-card'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {categoryIcons[template.category] ?? '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-foreground">{template.name}</h3>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${catColor}`}>
                        {template.category}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {segments.map((seg, i) =>
                        seg.type === 'variable' ? (
                          <span key={i} className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 py-0.5 font-mono text-[10px] font-medium text-primary mx-0.5">
                            {seg.value}
                          </span>
                        ) : (
                          <span key={i}>{seg.value}</span>
                        )
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Variable className="size-3" />
                        {totalVars} variable{totalVars !== 1 ? 's' : ''}
                      </span>
                      <span>{template.language ?? 'en_US'}</span>
                      {template.header_type && (
                        <span className="capitalize">{template.header_type}</span>
                      )}
                      {(template.buttons?.length ?? 0) > 0 && (
                        <span>{template.buttons!.length} button{(template.buttons?.length ?? 0) > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-2" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button variant="outline" onClick={onBack} className="border-border text-muted-foreground">
            {t('back')}
          </Button>
          <Button
            onClick={onNext}
            disabled={!selectedTemplate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {t('next')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedForPreview && (
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Template Preview</p>
            <div className="rounded-xl border border-border bg-card/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{selectedForPreview.name}</span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryColors[selectedForPreview.category] ?? categoryColors.Utility}`}>
                  {selectedForPreview.category}
                </span>
              </div>

              {selectedForPreview.header_type === 'text' && selectedForPreview.header_content && (
                <div className="text-sm font-semibold text-foreground border-b border-border pb-1.5">
                  {selectedForPreview.header_content}
                </div>
              )}

              <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {(function() {
                  const { segments } = highlightVariables(selectedForPreview.body_text);
                  return segments.map((seg, i) =>
                    seg.type === 'variable' ? (
                      <span key={i} className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1 font-mono text-xs font-medium text-primary mx-0.5">
                        {seg.value}
                      </span>
                    ) : (
                      <span key={i}>{seg.value}</span>
                    )
                  );
                })()}
              </div>

              {selectedForPreview.footer_text && (
                <div className="text-[11px] text-muted-foreground italic border-t border-border pt-1.5">
                  {selectedForPreview.footer_text}
                </div>
              )}

              {(selectedForPreview.buttons?.length ?? 0) > 0 && (
                <div className="border-t border-border pt-1.5 space-y-1">
                  {selectedForPreview.buttons!.map((btn, i) => (
                    <div key={i} className="text-xs text-[#00a884] font-medium text-center py-1.5 rounded-lg border border-border bg-muted/30">
                      {btn.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

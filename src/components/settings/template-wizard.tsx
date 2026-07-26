'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  X,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { TemplatePreview } from './template-preview';
import { TemplateImagePicker } from './template-image-picker';
import {
  extractVariableIndices,
  TEMPLATE_LIMITS,
} from '@/lib/whatsapp/template-validators';
import type {
  MessageTemplate,
  TemplateButton,
  TemplateSampleValues,
} from '@/types';

const CATEGORIES = ['Marketing', 'Utility', 'Authentication'] as const;
type HeaderFormat = 'none' | 'text' | 'image' | 'video' | 'document';
const HEADER_FORMATS: HeaderFormat[] = ['none', 'text', 'image', 'video', 'document'];

const COMMON_LANGUAGE_CODES = [
  'en_US', 'en_GB', 'en', 'es', 'es_ES', 'es_MX',
  'fr', 'fr_FR', 'de', 'it', 'pt_BR', 'pt_PT',
  'nl', 'pl', 'ru', 'tr', 'lt',
];

export interface WizardFormData {
  name: string;
  category: MessageTemplate['category'];
  language: string;
  header_format: HeaderFormat;
  header_content: string;
  header_media_url: string;
  header_sample: string;
  body_text: string;
  body_samples: string[];
  footer_text: string;
  buttons: TemplateButton[];
}

const emptyForm: WizardFormData = {
  name: '',
  category: 'Marketing',
  language: 'en_US',
  header_format: 'none',
  header_content: '',
  header_media_url: '',
  header_sample: '',
  body_text: '',
  body_samples: [],
  footer_text: '',
  buttons: [],
};

const STEPS = [
  { id: 'basics', title: 'Basic Info' },
  { id: 'header', title: 'Header' },
  { id: 'body', title: 'Body & Footer' },
  { id: 'buttons', title: 'Interactive Actions' },
  { id: 'review', title: 'Review & Submit' },
] as const;

function emptyButton(type: TemplateButton['type']): TemplateButton {
  switch (type) {
    case 'QUICK_REPLY':
      return { type: 'QUICK_REPLY', text: '' };
    case 'URL':
      return { type: 'URL', text: '', url: '' };
    case 'PHONE_NUMBER':
      return { type: 'PHONE_NUMBER', text: '', phone_number: '' };
    case 'COPY_CODE':
      return { type: 'COPY_CODE', text: '', example: '' };
  }
}

interface TemplateWizardProps {
  initialData?: Partial<WizardFormData>;
  editingId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TemplateWizard({
  initialData,
  editingId,
  onClose,
  onSuccess,
}: TemplateWizardProps) {
  const t = useTranslations('Settings.templates');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardFormData>({ ...emptyForm, ...initialData });
  const [submitting, setSubmitting] = useState(false);

  const bodyVarCount = useMemo(
    () => extractVariableIndices(form.body_text).length,
    [form.body_text],
  );

  const headerVarCount = useMemo(
    () =>
      form.header_format === 'text'
        ? extractVariableIndices(form.header_content).length
        : 0,
    [form.header_format, form.header_content],
  );

  useEffect(() => {
    setForm((prev) => {
      if (prev.body_samples.length === bodyVarCount) return prev;
      const next = prev.body_samples.slice(0, bodyVarCount);
      while (next.length < bodyVarCount) next.push('');
      return { ...prev, body_samples: next };
    });
  }, [bodyVarCount]);

  const sampleValueMap = useMemo(() => {
    const map: Record<string, string> = {};
    form.body_samples.forEach((val, i) => {
      if (val.trim()) map[String(i + 1)] = val.trim();
    });
    return map;
  }, [form.body_samples]);

  const previewSampleValues = useMemo(() => {
    const map: Record<string, string> = { ...sampleValueMap };
    if (form.header_sample.trim()) map['1'] = form.header_sample.trim();
    return Object.keys(map).length > 0 ? map : undefined;
  }, [sampleValueMap, form.header_sample]);

  const headerNeedsMedia =
    form.header_format !== 'none' && form.header_format !== 'text';

  function updateForm(partial: Partial<WizardFormData>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function updateButton(index: number, patch: Partial<TemplateButton>) {
    setForm((prev) => {
      const current = prev.buttons[index];
      if (!current) return prev;
      const next = [...prev.buttons];
      switch (current.type) {
        case 'QUICK_REPLY':
          next[index] = { ...current, ...patch } as TemplateButton;
          break;
        case 'URL':
          next[index] = { ...current, ...patch } as TemplateButton;
          break;
        case 'PHONE_NUMBER':
          next[index] = { ...current, ...patch } as TemplateButton;
          break;
        case 'COPY_CODE':
          next[index] = { ...current, ...patch } as TemplateButton;
          break;
      }
      return { ...prev, buttons: next };
    });
  }

  function changeButtonType(index: number, type: TemplateButton['type']) {
    setForm((prev) => {
      const next = [...prev.buttons];
      next[index] = emptyButton(type);
      return { ...prev, buttons: next };
    });
  }

  function removeButton(index: number) {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }));
  }

  function addButton() {
    if (form.buttons.length >= TEMPLATE_LIMITS.maxButtonsTotal) return;
    setForm((prev) => ({
      ...prev,
      buttons: [...prev.buttons, emptyButton('QUICK_REPLY')],
    }));
  }

  function buildSubmitPayload() {
    const sample_values: TemplateSampleValues = {};
    if (form.body_samples.some((v) => v.trim())) {
      sample_values.body = form.body_samples.map((v) => v.trim());
    }
    if (form.header_format === 'text' && form.header_sample.trim()) {
      sample_values.header = [form.header_sample.trim()];
    }
    return {
      name: form.name.trim(),
      category: form.category,
      language: form.language.trim() || 'en_US',
      header_type: form.header_format === 'none' ? undefined : form.header_format,
      header_content:
        form.header_format === 'text' ? form.header_content.trim() : undefined,
      header_media_url:
        form.header_format !== 'none' && form.header_format !== 'text'
          ? form.header_media_url.trim() || undefined
          : undefined,
      body_text: form.body_text.trim(),
      footer_text: form.footer_text.trim() || undefined,
      buttons: form.buttons.length > 0 ? form.buttons : undefined,
      sample_values:
        Object.keys(sample_values).length > 0 ? sample_values : undefined,
    };
  }

  async function handleSubmit() {
    if (form.category === 'Authentication') return;
    try {
      setSubmitting(true);
      const isEdit = editingId !== null;
      const url = isEdit
        ? `/api/whatsapp/templates/${editingId}`
        : '/api/whatsapp/templates/submit';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSubmitPayload()),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error || `${isEdit ? 'Edit' : 'Submit'} failed (HTTP ${res.status})`,
        );
      }
      toast.success(data.dry_run
        ? isEdit ? t('toastSaveEditDry') : t('toastSaveNewDry')
        : isEdit ? t('toastSubmitEditSuccess') : t('toastSubmitNewSuccess'));
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err instanceof Error ? err.message : t('toastSubmitFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return form.name.trim().length > 0 && form.language.trim().length > 0;
      case 1:
        return true;
      case 2:
        return form.body_text.trim().length > 0;
      case 3:
        return true;
      case 4:
        return form.name.trim().length > 0 && form.body_text.trim().length > 0;
      default:
        return true;
    }
  }

  function renderStepIndicator() {
    return (
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 flex-1">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all
                ${i === step
                  ? 'bg-primary text-primary-foreground'
                  : i < step
                    ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                    : 'bg-muted text-muted-foreground'
                }
              `}
            >
              {i < step ? (
                <Check className="size-3" />
              ) : (
                <span className="size-3 flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline">{s.title}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px ${
                  i < step ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderBasicsStep() {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Template Name</h3>
          <p className="text-xs text-muted-foreground">
            Lowercase letters, digits, and underscores only. Max 512 characters.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground">Name</Label>
          <Input
            placeholder="e.g. order_confirmation, welcome_message"
            value={form.name}
            onChange={(e) => updateForm({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
            disabled={editingId !== null}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground disabled:opacity-60"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Category</Label>
            <Select
              value={form.category}
              onValueChange={(val) =>
                updateForm({ category: val as MessageTemplate['category'] })
              }
            >
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}
                    className="text-popover-foreground focus:bg-muted"
                  >
                    <div className="flex flex-col">
                      <span>{cat}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {cat === 'Marketing'
                          ? 'Promotions & offers'
                          : cat === 'Utility'
                            ? 'Transactional messages'
                            : 'OTP & verification'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Language</Label>
            <Input
              list="wizard-language-codes"
              placeholder="en_US"
              value={form.language}
              onChange={(e) => updateForm({ language: e.target.value })}
              disabled={editingId !== null}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground disabled:opacity-60"
            />
            <datalist id="wizard-language-codes">
              {COMMON_LANGUAGE_CODES.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>
          </div>
        </div>

        {form.category === 'Authentication' && (
          <div className="flex items-start gap-2 rounded border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <p>
              <strong>Note:</strong> Authentication templates have a fixed
              structure. Create them in Meta WhatsApp Manager and use
              <strong> Sync from Meta</strong> to import them here.
            </p>
          </div>
        )}
      </div>
    );
  }

  function renderHeaderStep() {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Header</h3>
          <p className="text-xs text-muted-foreground">
            Add an optional header to your template. Text headers can include
            one variable {'{{1}}'}. Media headers need a sample file.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Header Type</Label>
          <Select
            value={form.header_format}
            onValueChange={(val) =>
              updateForm({ header_format: (val || 'none') as HeaderFormat })
            }
          >
            <SelectTrigger className="bg-muted border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {HEADER_FORMATS.map((type) => (
                <SelectItem key={type} value={type}
                  className="text-popover-foreground focus:bg-muted"
                >
                  {type === 'none'
                    ? 'No Header'
                    : type === 'text'
                      ? 'Text'
                      : type === 'image'
                        ? 'Image'
                        : type === 'video'
                          ? 'Video'
                          : 'Document'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {form.header_format === 'text' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Header Text</Label>
              <Input
                placeholder="e.g. Order Confirmed! 🎉"
                value={form.header_content}
                onChange={(e) => updateForm({ header_content: e.target.value })}
                maxLength={TEMPLATE_LIMITS.headerTextMaxLength}
                className="bg-muted border-border text-foreground"
              />
            </div>
            {headerVarCount > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Header Sample Value</Label>
                <Input
                  placeholder="e.g. John Doe"
                  value={form.header_sample}
                  onChange={(e) => updateForm({ header_sample: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            )}
          </div>
        )}

        {headerNeedsMedia && (
          <div className="space-y-3">
            {form.header_format === 'image' && (
              <TemplateImagePicker
                value={form.header_media_url}
                onChange={(url) => updateForm({ header_media_url: url })}
              />
            )}
            {form.header_format !== 'image' && (
              <>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Media URL</Label>
                  <Input
                    placeholder={`https://example.com/sample.${form.header_format === 'video' ? 'mp4' : 'pdf'}`}
                    value={form.header_media_url}
                    onChange={(e) => updateForm({ header_media_url: e.target.value })}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                {form.header_media_url && (
                  form.header_format === 'video' ? (
                    <div className="rounded-lg bg-muted flex items-center gap-2 p-3 text-sm text-muted-foreground border border-border">
                      <span>🎬</span>
                      <span className="truncate text-xs">Sample video</span>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted flex items-center gap-2 p-3 text-sm text-muted-foreground border border-border">
                      <span>📄</span>
                      <span className="truncate text-xs">Sample document</span>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderBodyStep() {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Body & Footer</h3>
          <p className="text-xs text-muted-foreground">
            Use {'{{1}}'}, {'{{2}}'}, etc. for dynamic values. Variables must be
            contiguous starting from {'{{1}}'}.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Body Text</Label>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {form.body_text.length}/{TEMPLATE_LIMITS.bodyMaxLength}
            </span>
          </div>
          <Textarea
            placeholder={`Hi {{1}},\n\nYour order #{{2}} has been confirmed!\n\nThank you for shopping with us.`}
            value={form.body_text}
            onChange={(e) => updateForm({ body_text: e.target.value })}
            rows={5}
            maxLength={TEMPLATE_LIMITS.bodyMaxLength}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none font-mono text-sm"
          />
        </div>

        {bodyVarCount > 0 && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <Label className="text-xs font-medium text-muted-foreground">
              Sample Values ({bodyVarCount} variable{bodyVarCount > 1 ? 's' : ''})
            </Label>
            <p className="text-[10px] text-muted-foreground">
              These are used for Meta&apos;s review process. Provide realistic examples.
            </p>
            <div className="space-y-2">
              {form.body_samples.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-8 shrink-0">
                    {'{{'}{i + 1}{'}}'}
                  </span>
                  <Input
                    placeholder={`Sample value for {{${i + 1}}}`}
                    value={val}
                    onChange={(e) => {
                      const next = [...form.body_samples];
                      next[i] = e.target.value;
                      updateForm({ body_samples: next });
                    }}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-muted-foreground">Footer (optional)</Label>
          <Input
            placeholder="e.g. Reply HELP for assistance"
            value={form.footer_text}
            onChange={(e) => updateForm({ footer_text: e.target.value })}
            maxLength={TEMPLATE_LIMITS.footerMaxLength}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
          <p className="text-[10px] text-muted-foreground">
            Footer text cannot contain variables. Max {TEMPLATE_LIMITS.footerMaxLength} characters.
          </p>
        </div>
      </div>
    );
  }

  function renderButtonsStep() {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Interactive Actions</h3>
          <p className="text-xs text-muted-foreground">
            Add buttons to make your template more actionable. You can use
            Quick Replies, URL buttons, Phone Number buttons, or Copy Code buttons.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Buttons</p>
            <p className="text-xs text-muted-foreground">
              Quick Replies must come before CTA buttons. Max {TEMPLATE_LIMITS.maxButtonsTotal} buttons.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addButton}
            disabled={form.buttons.length >= TEMPLATE_LIMITS.maxButtonsTotal}
          >
            <Plus className="size-3" />
            Add Button
          </Button>
        </div>

        {form.buttons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No buttons added yet</p>
            <p className="text-xs mt-1">
              Click &quot;Add Button&quot; to add interactive elements
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {form.buttons.map((btn, i) => (
              <Card key={i} className="border-border bg-muted/20">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-6">
                      #{i + 1}
                    </span>
                    <Select
                      value={btn.type}
                      onValueChange={(val) => {
                        if (!val) return;
                        changeButtonType(i, val as TemplateButton['type']);
                      }}
                    >
                      <SelectTrigger className="w-36 bg-muted border-border text-foreground h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="QUICK_REPLY" className="text-popover-foreground focus:bg-muted">
                          Quick Reply
                        </SelectItem>
                        <SelectItem value="URL" className="text-popover-foreground focus:bg-muted">
                          Call to Action (URL)
                        </SelectItem>
                        <SelectItem value="PHONE_NUMBER" className="text-popover-foreground focus:bg-muted">
                          Call to Action (Phone)
                        </SelectItem>
                        <SelectItem value="COPY_CODE" className="text-popover-foreground focus:bg-muted">
                          Copy Code
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Button text"
                      value={btn.text}
                      maxLength={TEMPLATE_LIMITS.buttonTextMaxLength}
                      onChange={(e) => updateButton(i, { text: e.target.value } as TemplateButton)}
                      className="flex-1 bg-muted border-border text-foreground h-8 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeButton(i)}
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-950/30 size-7"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>

                  {btn.type === 'URL' && (
                    <div className="pl-8 space-y-2">
                      <Input
                        placeholder="https://example.com/{{1}}"
                        value={(btn as Extract<TemplateButton, { type: 'URL' }>).url}
                        onChange={(e) => updateButton(i, { url: e.target.value } as TemplateButton)}
                        className="bg-muted border-border text-foreground h-8 text-xs"
                      />
                      {extractVariableIndices((btn as Extract<TemplateButton, { type: 'URL' }>).url || '').length > 0 && (
                        <Input
                          placeholder="Sample value for URL variable"
                          value={(btn as Extract<TemplateButton, { type: 'URL' }>).example || ''}
                          onChange={(e) => updateButton(i, { example: e.target.value } as TemplateButton)}
                          className="bg-muted border-border text-foreground h-8 text-xs"
                        />
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Use {'{{1}}'} for dynamic URLs. Provide a sample value for Meta review.
                      </p>
                    </div>
                  )}

                  {btn.type === 'PHONE_NUMBER' && (
                    <div className="pl-8">
                      <Input
                        placeholder="15551234567 (country code + number, no + sign)"
                        value={(btn as Extract<TemplateButton, { type: 'PHONE_NUMBER' }>).phone_number}
                        onChange={(e) => updateButton(i, { phone_number: e.target.value } as TemplateButton)}
                        className="bg-muted border-border text-foreground h-8 text-xs"
                      />
                    </div>
                  )}

                  {btn.type === 'COPY_CODE' && (
                    <div className="pl-8 space-y-2">
                      <Input
                        placeholder="e.g. SAVE20 — the code users will copy"
                        value={(btn as Extract<TemplateButton, { type: 'COPY_CODE' }>).example}
                        onChange={(e) => updateButton(i, { example: e.target.value } as TemplateButton)}
                        className="bg-muted border-border text-foreground h-8 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        This is the code that will be copied to the user&apos;s clipboard.
                      </p>
                    </div>
                  )}

                  {btn.type !== 'QUICK_REPLY' && (
                    <p className="text-[10px] text-muted-foreground pl-8">
                      CTA buttons appear below the message body.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderReviewStep() {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Review & Submit</h3>
          <p className="text-xs text-muted-foreground">
            Review your template before submitting to Meta for approval.
          </p>
        </div>

        <Card className="border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-20">Name:</span>
              <span className="text-sm font-mono text-foreground">{form.name || <span className="italic text-muted-foreground">Not set</span>}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-20">Category:</span>
              <span className="text-sm text-foreground">{form.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-20">Language:</span>
              <span className="text-sm text-foreground">{form.language || 'en_US'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-20">Header:</span>
              <span className="text-sm text-foreground">
                {form.header_format === 'none'
                  ? 'None'
                  : form.header_format === 'text'
                    ? form.header_content || '(empty)'
                    : `${form.header_format}${form.header_media_url ? ' ✓' : ''}`}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Body:</span>
              <span className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
                {form.body_text || <span className="italic text-muted-foreground">Not set</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-20">Variables:</span>
              <span className="text-sm text-foreground">{bodyVarCount} in body{headerVarCount > 0 ? `, ${headerVarCount} in header` : ''}</span>
            </div>
            {form.footer_text && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-20">Footer:</span>
                <span className="text-sm text-foreground">{form.footer_text}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-20">Buttons:</span>
              <span className="text-sm text-foreground">{form.buttons.length > 0 ? `${form.buttons.length} button${form.buttons.length > 1 ? 's' : ''}` : 'None'}</span>
            </div>
          </CardContent>
        </Card>

        {form.buttons.length > 0 && (
          <Card className="border-border">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Button Details:</p>
              {form.buttons.map((btn, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">#{i + 1}</span>
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {btn.type}
                  </span>
                  <span className="text-foreground">{btn.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderStepContent() {
    switch (step) {
      case 0:
        return renderBasicsStep();
      case 1:
        return renderHeaderStep();
      case 2:
        return renderBodyStep();
      case 3:
        return renderButtonsStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {renderStepIndicator()}

        {form.category === 'Authentication' && (
          <div className="flex items-start gap-2 rounded border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-300 mb-4">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <p>
              <strong>Note:</strong> Authentication templates have a fixed
              structure. Create them in Meta WhatsApp Manager and use
              <strong> Sync from Meta</strong> to import them here.
            </p>
          </div>
        )}

        <div className="min-h-[300px]">{renderStepContent()}</div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div>
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
              >
                Continue
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting || form.category === 'Authentication'}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting...
                  </>
                ) : editingId ? (
                  'Save & Resubmit'
                ) : (
                  'Submit for Approval'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-80 shrink-0 sticky top-4 self-start">
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <TemplatePreview
              headerFormat={form.header_format}
              headerContent={form.header_content}
              bodyText={form.body_text}
              footerText={form.footer_text}
              buttons={form.buttons}
              sampleValues={previewSampleValues}
              headerMediaUrl={form.header_media_url}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

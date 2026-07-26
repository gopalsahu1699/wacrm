'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Contact, CustomField, MessageTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  ImageIcon,
  Loader2,
  User,
  Hash,
  CheckCircle2,
  AlertCircle,
  Variable,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { extractVariableIndices } from '@/lib/whatsapp/template-validators';

type VariableType = 'static' | 'field' | 'custom_field';

interface VariableMapping {
  type: VariableType;
  value: string;
}

interface Step3Props {
  template: MessageTemplate;
  variables: Record<string, VariableMapping>;
  onUpdate: (variables: Record<string, VariableMapping>) => void;
  headerMediaUrl: string;
  onHeaderMediaUrlChange: (url: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const MEDIA_HEADER_TYPES = ['image', 'video', 'document'] as const;
type MediaHeaderType = (typeof MEDIA_HEADER_TYPES)[number];

function isMediaHeaderType(value: unknown): value is MediaHeaderType {
  return MEDIA_HEADER_TYPES.includes(value as MediaHeaderType);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const contactFields = [
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'email', label: 'Email Address' },
  { value: 'company', label: 'Company' },
];

const CONTACT_FIELD_ICONS: Record<string, string> = {
  name: '👤',
  phone: '📞',
  email: '✉️',
  company: '🏢',
};

const SAMPLE_CONTACT: Contact = {
  id: 'sample',
  user_id: '',
  account_id: '',
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john@example.com',
  company: 'Acme Corp',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function getVariableHint(varIndex: number): string {
  const hints = [
    'Recipient name or title',
    'Order ID, reference number, or amount',
    'Date, item name, or status',
    'Location, URL, or additional detail',
    'Extra information or instructions',
  ];
  return hints[varIndex - 1] ?? `Value for variable ${varIndex}`;
}

const COMMON_FIELD_SUGGESTIONS: Record<number, string> = {
  1: 'name',
  2: 'phone',
};

export function Step3Personalize({
  template,
  variables,
  onUpdate,
  headerMediaUrl,
  onHeaderMediaUrlChange,
  onNext,
  onBack,
}: Step3Props) {
  const t = useTranslations('Broadcasts.wizard');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [firstContact, setFirstContact] = useState<Contact | null>(null);
  const [firstContactCustomValues, setFirstContactCustomValues] = useState<
    Map<string, string>
  >(new Map());
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewContactId, setPreviewContactId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [fieldsRes, contactsRes] = await Promise.all([
        supabase.from('custom_fields').select('*').order('field_name'),
        supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      if (cancelled) return;

      const allContacts = contactsRes.data ?? [];
      setContacts(allContacts);
      setCustomFields(fieldsRes.data ?? []);
      setLoadingFields(false);

      const contact = allContacts[0] ?? null;
      setFirstContact(contact);

      if (contact) {
        const { data: customVals } = await supabase
          .from('contact_custom_values')
          .select('custom_field_id, value')
          .eq('contact_id', contact.id);
        if (!cancelled) {
          const map = new Map<string, string>();
          for (const row of customVals ?? []) {
            map.set(row.custom_field_id, row.value ?? '');
          }
          setFirstContactCustomValues(map);
        }
      }
      setLoadingPreview(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const placeholders = useMemo(() => {
    const matches = template.body_text.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches)].sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ''));
      const nb = parseInt(b.replace(/\D/g, ''));
      return na - nb;
    });
  }, [template.body_text]);

  const mediaHeaderType = isMediaHeaderType(template.header_type)
    ? template.header_type
    : null;

  useEffect(() => {
    if (mediaHeaderType && !headerMediaUrl && template.header_media_url) {
      onHeaderMediaUrlChange(template.header_media_url);
    }
  }, [mediaHeaderType, template.header_media_url]);

  useEffect(() => {
    const autoSuggestions: Record<string, VariableMapping> = {};
    for (const placeholder of placeholders) {
      const key = placeholder.replace(/^\{\{|\}\}$/g, '');
      if (variables[key]) continue;
      const idx = parseInt(key);
      const suggestedField = COMMON_FIELD_SUGGESTIONS[idx];
      if (suggestedField) {
        autoSuggestions[key] = { type: 'field', value: suggestedField };
      }
    }
    if (Object.keys(autoSuggestions).length > 0) {
      onUpdate({ ...variables, ...autoSuggestions });
    }
  }, []);

  const headerMediaError = useMemo<'missing' | 'invalid' | null>(() => {
    if (!mediaHeaderType) return null;
    const value = headerMediaUrl.trim();
    if (!value) return 'missing';
    if (!isValidHttpUrl(value)) return 'invalid';
    return null;
  }, [mediaHeaderType, headerMediaUrl]);

  const unmappedKeys = useMemo(() => {
    const missing: string[] = [];
    for (const placeholder of placeholders) {
      const key = placeholder.replace(/^\{\{|\}\}$/g, '');
      const mapping = variables[key];
      if (!mapping || !mapping.value?.trim()) {
        missing.push(placeholder);
      }
    }
    return missing;
  }, [placeholders, variables]);

  function updateVariable(key: string, patch: Partial<VariableMapping>) {
    const current = variables[key] ?? { type: 'static' as VariableType, value: '' };
    onUpdate({
      ...variables,
      [key]: { ...current, ...patch },
    });
  }

  const previewText = useMemo(() => {
    const contact = firstContact ?? SAMPLE_CONTACT;
    const customValues = firstContact
      ? firstContactCustomValues
      : new Map<string, string>();

    let text = template.body_text;
    for (const placeholder of placeholders) {
      const key = placeholder.replace(/^\{\{|\}\}$/g, '');
      const mapping = variables[key];
      let replacement = placeholder;

      if (mapping) {
        if (mapping.type === 'static' && mapping.value) {
          replacement = mapping.value;
        } else if (mapping.type === 'field' && mapping.value) {
          const fieldMap: Record<string, string | undefined> = {
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            company: contact.company,
          };
          replacement = fieldMap[mapping.value] ?? placeholder;
        } else if (mapping.type === 'custom_field' && mapping.value) {
          replacement = customValues.get(mapping.value) || placeholder;
        }
      }
      text = text.replaceAll(placeholder, replacement);
    }
    return text;
  }, [
    template.body_text,
    variables,
    placeholders,
    firstContact,
    firstContactCustomValues,
  ]);

  const previewLabel = firstContact
    ? firstContact.name || firstContact.phone
    : 'Sample Contact';

  const mappedCount = placeholders.length - unmappedKeys.length;

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('personalize.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('personalize.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Template:</span>
            <span className="font-medium text-foreground">{template.name}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <Variable className="size-4 text-primary" />
            <span className="text-muted-foreground">Variables:</span>
            <span className="font-medium text-foreground">{mappedCount}/{placeholders.length} mapped</span>
            {unmappedKeys.length === 0 && placeholders.length > 0 && (
              <CheckCircle2 className="size-4 text-emerald-400" />
            )}
          </div>
        </div>

        {mediaHeaderType && (
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Header Image</p>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase text-primary">
                {mediaHeaderType}
              </span>
            </div>
            <Input
              type="url"
              value={headerMediaUrl}
              onChange={(e) => onHeaderMediaUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
            />
            {mediaHeaderType === 'image' &&
              headerMediaError === null &&
              headerMediaUrl.trim() && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headerMediaUrl.trim()}
                  alt="Header preview"
                  className="mt-3 max-h-32 rounded-lg border border-border object-contain"
                />
              )}
            {headerMediaError && (
              <p className="mt-1.5 text-xs text-amber-300">
                {headerMediaError === 'missing'
                  ? 'A media URL is required to send this template.'
                  : 'Enter a valid http(s) URL.'}
              </p>
            )}
          </div>
        )}

        {placeholders.length === 0 && !mediaHeaderType ? (
          <div className="rounded-xl border border-border bg-card/50 p-6 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            <p className="text-sm text-foreground font-medium">No variables to personalize</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This template has no placeholders. It will be sent as-is to all recipients.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {placeholders.map((placeholder) => {
              const key = placeholder.replace(/^\{\{|\}\}$/g, '');
              const mapping = variables[key] ?? { type: 'static', value: '' };
              const isMapped = !!(mapping && mapping.value?.trim());
              const idx = parseInt(key);
              const hint = getVariableHint(idx);

              return (
                <div
                  key={placeholder}
                  className={`rounded-xl border p-4 transition-all ${
                    isMapped
                      ? 'border-border/60 bg-card/30'
                      : 'border-amber-500/30 bg-amber-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-mono font-bold ${
                      isMapped ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-300'
                    }`}>
                      {idx}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono font-medium text-foreground">
                          {placeholder}
                        </span>
                        {isMapped && (
                          <CheckCircle2 className="size-3.5 text-emerald-400" />
                        )}
                        {!isMapped && (
                          <span className="text-[10px] text-amber-300 font-medium">Required</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{hint}</p>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr]">
                        <div>
                          <Select
                            value={mapping.type}
                            onValueChange={(val) =>
                              updateVariable(key, {
                                type: val as VariableType,
                                value: '',
                              })
                            }
                          >
                            <SelectTrigger className="w-full border-border bg-muted text-foreground h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-popover">
                              <SelectItem value="static">
                                <span className="flex items-center gap-2">
                                  <Hash className="size-3.5" />
                                  Static Value
                                </span>
                              </SelectItem>
                              <SelectItem value="field">
                                <span className="flex items-center gap-2">
                                  <User className="size-3.5" />
                                  Contact Field
                                </span>
                              </SelectItem>
                              <SelectItem value="custom_field">
                                <span className="flex items-center gap-2">
                                  <Variable className="size-3.5" />
                                  Custom Field
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          {mapping.type === 'static' ? (
                            <Input
                              value={mapping.value}
                              onChange={(e) =>
                                updateVariable(key, { value: e.target.value })
                              }
                              placeholder={`Enter a value for ${placeholder}...`}
                              className="border-border bg-muted text-foreground placeholder:text-muted-foreground h-9 text-xs"
                            />
                          ) : mapping.type === 'field' ? (
                            <Select
                              value={mapping.value || undefined}
                              onValueChange={(val) =>
                                updateVariable(key, { value: val || '' })
                              }
                            >
                              <SelectTrigger className="w-full border-border bg-muted text-foreground h-9 text-xs">
                                <SelectValue placeholder="Choose a contact field..." />
                              </SelectTrigger>
                              <SelectContent className="border-border bg-popover">
                                {contactFields.map((field) => (
                                  <SelectItem key={field.value} value={field.value}>
                                    <span className="flex items-center gap-2">
                                      <span>{CONTACT_FIELD_ICONS[field.value]}</span>
                                      {field.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Select
                              value={mapping.value || undefined}
                              onValueChange={(val) =>
                                updateVariable(key, { value: val || '' })
                              }
                            >
                              <SelectTrigger className="w-full border-border bg-muted text-foreground h-9 text-xs">
                                <SelectValue
                                  placeholder={
                                    loadingFields
                                      ? 'Loading...'
                                      : customFields.length === 0
                                        ? 'No custom fields'
                                        : 'Choose a custom field...'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="border-border bg-popover">
                                {customFields.map((f) => (
                                  <SelectItem key={f.id} value={f.id}>
                                    {f.field_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {unmappedKeys.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <p>
              Map all variables before continuing. Still missing:{' '}
              <span className="font-mono font-semibold">
                {unmappedKeys.join(', ')}
              </span>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-border text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
          <Button
            onClick={onNext}
            disabled={unmappedKeys.length > 0 || headerMediaError !== null}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {t('next')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-4 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Live Preview</span>
            {loadingPreview && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            )}
          </div>

          <div className="space-y-2">
            {contacts.length > 1 && (
              <Select
                value={previewContactId ?? firstContact?.id ?? ''}
                onValueChange={(val) => {
                  setPreviewContactId(val);
                  const c = contacts.find((ct) => ct.id === val);
                  if (c) {
                    setFirstContact(c);
                    (async () => {
                      const supabase = createClient();
                      const { data } = await supabase
                        .from('contact_custom_values')
                        .select('custom_field_id, value')
                        .eq('contact_id', c.id);
                      const map = new Map<string, string>();
                      for (const row of data ?? []) {
                        map.set(row.custom_field_id, row.value ?? '');
                      }
                      setFirstContactCustomValues(map);
                    })();
                  }
                }}
              >
                <SelectTrigger className="w-full border-border bg-muted text-foreground h-8 text-xs">
                  <SelectValue placeholder={previewLabel} />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name || c.phone || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
              <div className="bg-[#e5ddd5] dark:bg-[#1f2c33] p-3">
                <div className="rounded-lg bg-white dark:bg-[#111b21] p-3 shadow-sm">
                  {template.header_type === 'text' && template.header_content && (
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      {template.header_content.replace(/\{\{\d+\}\}/g, (m) => {
                        const key = m.replace(/\D/g, '');
                        const v = variables[key];
                        if (v?.type === 'static' && v.value) return v.value;
                        if (v?.type === 'field') {
                          const contact = firstContact ?? SAMPLE_CONTACT;
                          if (v.value === 'name') return contact.name || 'John';
                          if (v.value === 'phone') return contact.phone || '+1234567890';
                          if (v.value === 'email') return contact.email || 'john@example.com';
                          if (v.value === 'company') return contact.company || 'Acme Corp';
                        }
                        return m;
                      })}
                    </div>
                  )}

                  <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {previewText}
                  </div>

                  {template.footer_text && (
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      {template.footer_text.replace(/\{\{\d+\}\}/g, (m) => {
                        const key = m.replace(/\D/g, '');
                        const v = variables[key];
                        if (v?.type === 'static' && v.value) return v.value;
                        return m;
                      })}
                    </div>
                  )}
                </div>

                {(template.buttons?.length ?? 0) > 0 && (
                  <div className="mt-1 space-y-1">
                    {template.buttons!.map((btn, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-white dark:bg-[#111b21] text-center py-2.5 text-sm font-medium text-[#00a884] border-t border-gray-200 dark:border-gray-700"
                      >
                        {btn.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

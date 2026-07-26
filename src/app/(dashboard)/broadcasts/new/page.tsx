'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { MessageTemplate } from '@/types';
import { Step1ChooseTemplate } from '@/components/broadcasts/step1-choose-template';
import { Step2SelectAudience } from '@/components/broadcasts/step2-select-audience';
import { Step3Personalize } from '@/components/broadcasts/step3-personalize';
import { Step4ScheduleSend } from '@/components/broadcasts/step4-schedule-send';
import { useBroadcastSending } from '@/hooks/use-broadcast-sending';
import { Check, FileText, Users, MessageSquare, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';

const steps = [
  { label: 'template', key: 'template', icon: FileText, description: 'Choose a template' },
  { label: 'audience', key: 'audience', icon: Users, description: 'Select recipients' },
  { label: 'personalize', key: 'personalize', icon: MessageSquare, description: 'Map variables' },
  { label: 'send', key: 'send', icon: Send, description: 'Review & send' },
] as const;

export default function NewBroadcastPage() {
  const router = useRouter();
  const t = useTranslations('Broadcasts.new');
  const { accountId } = useAuth();
  const { createAndSendBroadcast, isProcessing, progress } = useBroadcastSending();

  const [currentStep, setCurrentStep] = useState(0);
  const [template, setTemplate] = useState<MessageTemplate | null>(null);
  const [audience, setAudience] = useState<{
    type: 'all' | 'tags' | 'custom_field' | 'csv';
    tagIds?: string[];
    customField?: {
      fieldId: string;
      operator: 'is' | 'is_not' | 'contains';
      value: string;
    };
    csvContacts?: { phone: string; name?: string }[];
    excludeTagIds?: string[];
  }>({ type: 'all' });
  const [variables, setVariables] = useState<
    Record<string, { type: 'static' | 'field' | 'custom_field'; value: string }>
  >({});
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [name, setName] = useState('');

  async function handleSend() {
    if (!template) return;

    try {
      const broadcastId = await createAndSendBroadcast({
        name,
        template,
        audience: {
          type: audience.type,
          tagIds: audience.tagIds,
          customField: audience.customField,
          csvContacts: audience.csvContacts,
          excludeTagIds: audience.excludeTagIds,
        },
        variables,
        headerMediaUrl,
      });
      router.push(`/broadcasts/${broadcastId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Broadcast failed';
      console.error('Broadcast failed:', err);
      toast.error(message);
    }
  }

  async function handleSaveDraft() {
    if (!template || !name.trim()) {
      toast.error(t('toastGiveName'));
      return;
    }
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      toast.error(t('toastNotSignedIn'));
      return;
    }
    if (!accountId) {
      toast.error(t('toastNotLinked'));
      return;
    }

    const { error } = await supabase.from('broadcasts').insert({
      user_id: user.id,
      account_id: accountId,
      name: name.trim(),
      template_name: template.name,
      template_language: template.language ?? 'en_US',
      template_variables: variables,
      audience_filter: {
        type: audience.type,
        tagIds: audience.tagIds,
      },
      status: 'draft',
      total_recipients: 0,
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      replied_count: 0,
      failed_count: 0,
    });

    if (error) {
      toast.error(t('toastFailedDraft', { error: error.message }));
      return;
    }
    toast.success(t('toastDraftSaved'));
    router.push('/broadcasts');
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center gap-0">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-all ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : isActive
                            ? 'border-2 border-primary bg-primary/10 text-primary'
                            : 'border border-border bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium text-center leading-tight max-w-16 ${
                        isActive ? 'text-foreground' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {t(`steps.${step.label}`)}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-2 mt-[-1.5rem] ${
                        index < currentStep ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="relative min-h-[400px]">
            <div
              className="transition-all duration-300 ease-in-out"
              style={{
                opacity: isProcessing ? 0.6 : 1,
                pointerEvents: isProcessing ? 'none' : 'auto',
              }}
            >
              {currentStep === 0 && (
                <Step1ChooseTemplate
                  selectedTemplate={template}
                  onSelect={setTemplate}
                  onNext={() => setCurrentStep(1)}
                  onBack={() => router.push('/broadcasts')}
                />
              )}
              {currentStep === 1 && (
                <Step2SelectAudience
                  audience={audience}
                  onUpdate={setAudience}
                  onNext={() => setCurrentStep(2)}
                  onBack={() => setCurrentStep(0)}
                />
              )}
              {currentStep === 2 && template && (
                <Step3Personalize
                  template={template}
                  variables={variables}
                  onUpdate={setVariables}
                  headerMediaUrl={headerMediaUrl}
                  onHeaderMediaUrlChange={setHeaderMediaUrl}
                  onNext={() => setCurrentStep(3)}
                  onBack={() => setCurrentStep(1)}
                />
              )}
              {currentStep === 3 && template && (
                <Step4ScheduleSend
                  name={name}
                  onNameChange={setName}
                  template={template}
                  audience={audience}
                  onSend={handleSend}
                  onSaveDraft={handleSaveDraft}
                  onBack={() => setCurrentStep(2)}
                  isProcessing={isProcessing}
                  progress={progress}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

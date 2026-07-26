'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageTemplate } from '@/types';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Send,
  Loader2,
  Users,
  Save,
  DollarSign,
  Info,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  estimateCost,
  formatCost,
  getRegionLabel,
  REGIONS,
  type PricingRegion,
} from '@/lib/whatsapp/template-pricing';

interface AudienceConfig {
  type: string;
  tagIds?: string[];
  csvContacts?: { phone: string; name?: string }[];
}

interface Step4Props {
  name: string;
  onNameChange: (name: string) => void;
  template: MessageTemplate;
  audience: AudienceConfig;
  onSend: () => void;
  onSaveDraft?: () => void;
  onBack: () => void;
  isProcessing: boolean;
  progress: number;
}

export function Step4ScheduleSend({
  name,
  onNameChange,
  template,
  audience,
  onSend,
  onSaveDraft,
  onBack,
  isProcessing,
  progress,
}: Step4Props) {
  const t = useTranslations('Broadcasts.wizard');
  const [showConfirm, setShowConfirm] = useState(false);
  const [estimatedReach, setEstimatedReach] = useState<number>(0);
  const [loadingReach, setLoadingReach] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<PricingRegion>('us');

  useEffect(() => {
    async function calculateReach() {
      setLoadingReach(true);
      try {
        const supabase = createClient();

        if (audience.type === 'all') {
          const { count } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true });
          setEstimatedReach(count ?? 0);
        } else if (audience.type === 'tags' && audience.tagIds && audience.tagIds.length > 0) {
          const { data: contactTags } = await supabase
            .from('contact_tags')
            .select('contact_id')
            .in('tag_id', audience.tagIds);

          const uniqueIds = new Set((contactTags ?? []).map((ct) => ct.contact_id));
          setEstimatedReach(uniqueIds.size);
        } else if (audience.type === 'csv' && audience.csvContacts) {
          setEstimatedReach(audience.csvContacts.length);
        } else {
          setEstimatedReach(0);
        }
      } finally {
        setLoadingReach(false);
      }
    }

    calculateReach();
  }, [audience]);

  const costEstimate = estimateCost(
    template.category,
    estimatedReach,
    selectedRegion,
  );

  const audienceLabel =
    audience.type === 'all'
      ? t('scheduleSend.audienceAll')
      : audience.type === 'tags'
        ? t('scheduleSend.audienceTags')
        : audience.type === 'csv'
          ? t('scheduleSend.audienceCsv')
          : t('scheduleSend.audienceField');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('scheduleSend.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('scheduleSend.subtitle')}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{t('scheduleSend.broadcastName')}</label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('scheduleSend.broadcastNamePlaceholder')}
          className="border-border bg-muted text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">{t('scheduleSend.summary')}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('scheduleSend.template')}</p>
              <p className="text-foreground font-medium">{template.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('scheduleSend.audience')}</p>
              <p className="text-foreground font-medium">{audienceLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-foreground font-medium">{template.category}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Language</p>
              <p className="text-foreground font-medium">{template.language ?? 'en_US'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estimated Reach</p>
              <div className="flex items-center gap-1.5">
                {loadingReach ? (
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                ) : (
                  <>
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <p className="font-medium text-foreground">{estimatedReach.toLocaleString()}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <DollarSign className="size-4 text-emerald-400" />
              Estimated Meta Cost
            </p>
            <span className="text-[10px] text-muted-foreground">per message</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Recipient region</span>
              <Select
                value={selectedRegion}
                onValueChange={(val) => setSelectedRegion(val as PricingRegion)}
              >
                <SelectTrigger className="w-44 h-7 text-xs bg-muted border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {REGIONS.map((r) => (
                    <SelectItem key={r.key} value={r.key} className="text-popover-foreground focus:bg-muted text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rate ({template.category})</span>
              <span className="font-mono text-foreground">
                {formatCost(costEstimate.perMessage, costEstimate.currency, costEstimate.symbol)}
                <span className="text-[10px] text-muted-foreground ml-1">/msg</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-sm border-t border-border pt-2">
              <span className="text-foreground font-medium">Total estimated cost</span>
              <span className="font-mono text-lg font-bold text-emerald-400">
                {formatCost(costEstimate.total, costEstimate.currency, costEstimate.symbol)}
              </span>
            </div>

            <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-muted/30 rounded p-2">
              <Info className="size-3 mt-0.5 shrink-0" />
              <p>
                Based on Meta&apos;s {getRegionLabel(selectedRegion)} per-message rate for {template.category.toLowerCase()} templates.
                Actual cost may vary. Does not include BSP or platform fees.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">{t('scheduleSend.sending')}</p>
            </div>
            <span className="text-xs font-medium text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="border-border text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </Button>

        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <Button
              variant="outline"
              onClick={onSaveDraft}
              disabled={!name.trim() || isProcessing}
              className="border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {t('scheduleSend.saveDraft')}
            </Button>
          )}

          <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogTrigger
            render={
              <Button
                disabled={!name.trim() || isProcessing}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              />
            }
          >
            <Send className="h-4 w-4" />
            {t('scheduleSend.sendNow')}
          </DialogTrigger>
          <DialogContent className="border-border bg-popover sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-popover-foreground">Confirm Broadcast</DialogTitle>
              <DialogDescription className="text-muted-foreground space-y-2">
                <p>
                  You are about to send this broadcast to{' '}
                  <span className="font-medium text-popover-foreground">{estimatedReach.toLocaleString()}</span>{' '}
                  contacts using the{' '}
                  <span className="font-medium text-popover-foreground">{template.name}</span> template.
                </p>
                <p className="text-xs text-muted-foreground">
                  Estimated Meta cost:{' '}
                  <span className="font-medium text-emerald-400">
                    {formatCost(costEstimate.total, costEstimate.currency, costEstimate.symbol)}
                  </span>
                  {' '}({formatCost(costEstimate.perMessage, costEstimate.currency, costEstimate.symbol)} per {template.category.toLowerCase()} message)
                </p>
                <p className="text-xs text-amber-300">This action cannot be undone.</p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="border-border text-muted-foreground"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => {
                  setShowConfirm(false);
                  onSend();
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
                {t('scheduleSend.sendNow')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
}

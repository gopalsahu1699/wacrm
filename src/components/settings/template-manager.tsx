'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Pencil,
  RotateCcw,
  Library,
  FileText,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsPanelHead } from './settings-panel-head';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type {
  MessageTemplate,
} from '@/types';
import { templateStatusConfig } from '@/lib/template-status';
import { TemplateWizard, type WizardFormData } from './template-wizard';
import { TemplateLibrary } from './template-library';
import { TemplateMiniPreview } from './template-preview';
import type { LibraryTemplate } from '@/lib/whatsapp/template-library-data';

type HeaderFormat = 'none' | 'text' | 'image' | 'video' | 'document';

const categoryColors: Record<string, string> = {
  Marketing: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  Utility: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  Authentication: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
};

export function TemplateManager() {
  const t = useTranslations('Settings.templates');
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<Partial<WizardFormData> | undefined>();
  const [wizardEditingId, setWizardEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('templates');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchTemplates(user.id);
  }, [authLoading, user?.id]);

  async function fetchTemplates(userId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      toast.error(t('toastLoadFailed'));
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setWizardEditingId(null);
    setWizardInitialData(undefined);
    setWizardOpen(true);
  }

  function openEdit(template: MessageTemplate) {
    setWizardEditingId(template.id);
    setWizardInitialData({
      name: template.name,
      category: template.category,
      language: template.language || 'en_US',
      header_format: (template.header_type ?? 'none') as HeaderFormat,
      header_content: template.header_content ?? '',
      header_media_url: template.header_media_url ?? '',
      header_sample: template.sample_values?.header?.[0] ?? '',
      body_text: template.body_text,
      body_samples: template.sample_values?.body ?? [],
      footer_text: template.footer_text ?? '',
      buttons: template.buttons ?? [],
    });
    setWizardOpen(true);
  }

  function handleUseLibraryTemplate(libTemplate: LibraryTemplate) {
    setWizardEditingId(null);
    setWizardInitialData({
      name: libTemplate.name,
      category: libTemplate.category,
      language: libTemplate.language,
      header_format: (libTemplate.header_type ?? 'none') as HeaderFormat,
      header_content: libTemplate.header_content ?? '',
      body_text: libTemplate.body_text,
      footer_text: libTemplate.footer_text ?? '',
      body_samples: libTemplate.sample_values?.body.map((v) => '') ?? [],
      buttons: libTemplate.buttons?.map((b) => {
        if (b.type === 'QUICK_REPLY') return { type: 'QUICK_REPLY' as const, text: b.text };
        if (b.type === 'URL') return { type: 'URL' as const, text: b.text, url: b.url || '', example: '' };
        if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER' as const, text: b.text, phone_number: b.phone_number || '' };
        return { type: 'QUICK_REPLY' as const, text: b.text };
      }) ?? [],
    });
    setWizardOpen(true);
    setActiveTab('templates');
  }

  function handleWizardSuccess() {
    if (user) fetchTemplates(user.id);
  }

  async function handleSyncFromMeta() {
    if (!user) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/whatsapp/templates/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Sync failed (HTTP ${res.status})`);
      }
      toast.success(
        t('toastSyncCount', { total: data.total }) +
          (data.inserted || data.updated
            ? t('toastSyncDetails', { inserted: data.inserted, updated: data.updated })
            : ''),
      );
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const preview = data.errors.slice(0, 3).map(
          (e: { name: string; language: string; message: string }) =>
            `${e.name} (${e.language})`,
        );
        const suffix =
          data.errors.length > 3 ? `, +${data.errors.length - 3} more` : '';
        toast.error(t('toastSyncFailed', { preview: preview.join(', ') + suffix }));
      }
      if (data.truncated) {
        toast.error(
          t('toastSyncTruncated'),
          { duration: 10000 },
        );
      }
      await fetchTemplates(user.id);
    } catch (err) {
      console.error('Template sync error:', err);
      toast.error(err instanceof Error ? err.message : t('toastSyncError'));
    } finally {
      setSyncing(false);
    }
  }

  async function confirmDelete() {
    const target = templateToDelete;
    if (!target || deletingId) return;
    setDeletingId(target.id);
    try {
      const res = await fetch(`/api/whatsapp/templates/${target.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Delete failed (HTTP ${res.status})`);
      }
      toast.success(t('toastDeleteSuccess'));
      setTemplates((prev) => prev.filter((t) => t.id !== target.id));
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err instanceof Error ? err.message : t('toastDeleteError'));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section className="animate-in fade-in-50 space-y-4 duration-200">
      <SettingsPanelHead
        title={t('title')}
        description={t('description')}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSyncFromMeta}
              disabled={syncing}
              title={t('syncTitle')}
            >
              <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? t('syncing') : t('syncFromMeta')}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t('newTemplate')}
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <FileText className="size-4" />
            Your Templates
          </TabsTrigger>
          <TabsTrigger
            value="library"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <Library className="size-4" />
            Template Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-0">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground text-sm">{t('noTemplates')}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {t('createFirst')}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Create Template
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('library')}>
                    <Sparkles className="size-4" />
                    Browse Library
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2">
              {templates.map((template) => {
                const statusKey = template.status || 'DRAFT';
                const status = templateStatusConfig[statusKey];
                return (
                  <Card key={template.id}>
                    <CardContent className="flex items-start justify-between pt-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">{template.name}</h3>
                          <Badge
                            className={`text-xs border ${categoryColors[template.category] || ''}`}
                          >
                            {template.category}
                          </Badge>
                          <Badge className={`text-xs border ${status.classes}`}>
                            {status.label}
                          </Badge>
                          {template.language && (
                            <span className="text-xs text-muted-foreground uppercase">
                              {template.language}
                            </span>
                          )}
                          {template.quality_score && (
                            <span
                              className={`text-[10px] uppercase font-medium ${
                                template.quality_score === 'GREEN'
                                  ? 'text-emerald-400'
                                  : template.quality_score === 'YELLOW'
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }`}
                              title="Meta quality score"
                            >
                              {template.quality_score}
                            </span>
                          )}
                        </div>
                        <TemplateMiniPreview
                          headerType={template.header_type}
                          headerContent={template.header_content}
                          bodyText={template.body_text}
                          footerText={template.footer_text}
                        />
                        {(template.rejection_reason || template.submission_error) && (
                          <div className="flex items-start gap-1.5 text-xs text-red-400 bg-red-950/20 border border-red-900/40 rounded px-2 py-1.5">
                            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                            <span>
                              {template.rejection_reason || template.submission_error}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {statusKey === 'APPROVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(template)}
                            title={t('editTitle')}
                            aria-label={t('editLabel')}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-2"
                          >
                            <Pencil className="size-3.5" />
                            {t('edit')}
                          </Button>
                        )}
                        {(statusKey === 'REJECTED' || statusKey === 'PAUSED') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(template)}
                            title={t('resubmitTitle')}
                            aria-label={t('resubmitLabel')}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-2"
                          >
                            <RotateCcw className="size-3.5" />
                            {t('resubmit')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTemplateToDelete(template)}
                          disabled={deletingId === template.id}
                          aria-label={
                            template.meta_template_id
                              ? t('deleteMetaLocallyAria')
                              : t('deleteLocallyAria')
                          }
                          title={
                            template.meta_template_id
                              ? t('deleteMetaLocallyTitle')
                              : t('deleteLocallyTitle')
                          }
                          className="text-muted-foreground hover:text-red-400 hover:bg-red-950/30 h-8 w-8"
                        >
                          {deletingId === template.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4 mt-0">
          <TemplateLibrary onUseTemplate={handleUseLibraryTemplate} />
        </TabsContent>
      </Tabs>

      <Dialog
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) {
            setWizardEditingId(null);
            setWizardInitialData(undefined);
          }
        }}
      >
        <DialogContent className="bg-popover border-border sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-popover-foreground">
              {wizardEditingId ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {wizardEditingId
                ? 'Edit your template and resubmit to Meta for approval.'
                : 'Create a WhatsApp message template and submit it to Meta for approval.'}
            </DialogDescription>
          </DialogHeader>

          <TemplateWizard
            initialData={wizardInitialData}
            editingId={wizardEditingId}
            onClose={() => setWizardOpen(false)}
            onSuccess={handleWizardSuccess}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={templateToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTemplateToDelete(null);
        }}
      >
        <DialogContent className="bg-popover border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-popover-foreground">{t('deleteDialogTitle')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {templateToDelete?.meta_template_id
                ? t('deleteMetaDesc', { name: templateToDelete.name })
                : t('deleteLocalDesc', { name: templateToDelete?.name || '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-popover border-border">
            <Button
              variant="outline"
              onClick={() => setTemplateToDelete(null)}
              disabled={deletingId !== null}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deletingId !== null}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                t('delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

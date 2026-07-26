'use client';

import type { TemplateButton } from '@/types';
import { Smartphone, MessageCircle } from 'lucide-react';
import { extractVariableIndices } from '@/lib/whatsapp/template-validators';

interface TemplatePreviewProps {
  headerFormat?: 'none' | 'text' | 'image' | 'video' | 'document';
  headerContent?: string;
  bodyText?: string;
  footerText?: string;
  buttons?: TemplateButton[];
  sampleValues?: Record<string, string>;
  headerMediaUrl?: string;
}

function fillVariables(text: string, samples?: Record<string, string>): string {
  if (!samples) return text;
  return text.replace(/\{\{(\d+)\}\}/g, (_, num) => {
    return samples[num] || `{{${num}}}`;
  });
}

export function TemplatePreview({
  headerFormat,
  headerContent,
  bodyText,
  footerText,
  buttons,
  sampleValues,
  headerMediaUrl,
}: TemplatePreviewProps) {
  if (!bodyText && !headerContent && !footerText) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[32rem] text-muted-foreground">
        <Smartphone className="size-12 mb-3 opacity-30" />
        <p className="text-sm">Preview will appear here</p>
        <p className="text-xs mt-1">Fill out the template fields to see a live preview</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[32rem] bg-gradient-to-b from-muted/50 to-muted/20 rounded-lg p-4">
      <div className="w-full max-w-xs mx-auto">
        <div className="flex items-center gap-2 mb-3 px-1">
          <MessageCircle className="size-4 text-primary" />
          <span className="text-xs font-medium text-foreground">WhatsApp Preview</span>
        </div>

        <div className="w-full rounded-2xl bg-[#e5ddd5] dark:bg-[#1f2c33] p-3 shadow-lg relative">
          <div className="rounded-lg bg-white dark:bg-[#111b21] p-3 shadow-sm">
            {headerFormat === 'text' && headerContent && (
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                {fillVariables(headerContent, sampleValues)}
              </div>
            )}

            {headerFormat === 'image' && headerMediaUrl && (
              <div className="mb-2 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={headerMediaUrl}
                  alt="Header media"
                  className="w-full h-32 object-cover"
                />
              </div>
            )}

            {(headerFormat === 'video' || headerFormat === 'document') && headerMediaUrl && (
              <div className="mb-2 rounded-lg bg-muted flex items-center gap-2 p-3 text-sm text-muted-foreground border border-border">
                {headerFormat === 'video' ? '🎬' : '📄'}
                <span className="truncate text-xs">
                  {headerFormat === 'video' ? 'Sample video' : 'Sample document'}
                </span>
              </div>
            )}

            {bodyText && (
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {fillVariables(bodyText, sampleValues)}
              </div>
            )}

            {footerText && (
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {fillVariables(footerText, sampleValues)}
              </div>
            )}
          </div>

          {buttons && buttons.length > 0 && (
            <div className="mt-1 space-y-1">
              {buttons.map((btn, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-white dark:bg-[#111b21] text-center py-2.5 text-sm font-medium text-[#00a884] border-t border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {btn.type === 'URL' && '🔗 '}
                  {btn.type === 'PHONE_NUMBER' && '📞 '}
                  {btn.type === 'COPY_CODE' && '📋 '}
                  {btn.text}
                </div>
              ))}
              <div className="text-[10px] text-center text-gray-400 mt-1">Powered by WACRM</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TemplateMiniPreview({
  headerType,
  headerContent,
  bodyText,
  footerText,
  category,
}: {
  headerType?: string | null;
  headerContent?: string | null;
  bodyText: string;
  footerText?: string | null;
  category?: string;
}) {
  const previewText = bodyText
    .replace(/\{\{\d+\}\}/g, '___')
    .substring(0, 120);

  return (
    <div className="space-y-1.5">
      {headerType && headerType !== 'none' && headerContent && (
        <div className="text-xs font-medium text-muted-foreground truncate">
          {headerContent.replace(/\{\{\d+\}\}/g, '___')}
        </div>
      )}
      <div className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
        {previewText}
      </div>
      {footerText && (
        <div className="text-[10px] text-muted-foreground italic truncate">
          {footerText.replace(/\{\{\d+\}\}/g, '___')}
        </div>
      )}
      {category && (
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
          {category}
        </div>
      )}
    </div>
  );
}

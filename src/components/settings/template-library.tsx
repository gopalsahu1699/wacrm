'use client';

import { useState } from 'react';
import {
  ShoppingBag,
  GraduationCap,
  HeartPulse,
  Building2,
  Banknote,
  Monitor,
  CalendarCheck,
  Car,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  INDUSTRIES,
  LIBRARY_TEMPLATES,
  type TemplateIndustry,
  type LibraryTemplate,
} from '@/lib/whatsapp/template-library-data';
import { TemplateMiniPreview } from './template-preview';

const INDUSTRY_ICONS: Record<TemplateIndustry, LucideIcon> = {
  ecommerce: ShoppingBag,
  education: GraduationCap,
  healthcare: HeartPulse,
  'real-estate': Building2,
  finance: Banknote,
  'it-services': Monitor,
  events: CalendarCheck,
  automotive: Car,
};

const CATEGORY_COLORS: Record<string, string> = {
  Marketing: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  Utility: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  Authentication: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
};

interface TemplateLibraryProps {
  onUseTemplate: (template: LibraryTemplate) => void;
}

export function TemplateLibrary({ onUseTemplate }: TemplateLibraryProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<TemplateIndustry | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = LIBRARY_TEMPLATES.filter((t) => {
    const matchesIndustry = selectedIndustry === 'all' || t.industry === selectedIndustry;
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.body_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.industry.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Template Library</h3>
          <p className="text-xs text-muted-foreground">
            Pre-built templates by industry. Pick one and customize it.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedIndustry('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedIndustry === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All Industries
        </button>
        {INDUSTRIES.map((industry) => {
          const Icon = INDUSTRY_ICONS[industry.id];
          const isActive = selectedIndustry === industry.id;
          return (
            <button
              key={industry.id}
              type="button"
              onClick={() => setSelectedIndustry(industry.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Icon className="size-3.5" />
              {industry.label}
            </button>
          );
        })}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No templates found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different industry or search term
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filteredTemplates.map((template) => {
            const Icon = INDUSTRY_ICONS[template.industry];
            return (
              <Card
                key={template.id}
                className="border-border hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer group"
                onClick={() => onUseTemplate(template)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="hidden sm:flex items-center justify-center size-9 rounded-lg bg-muted shrink-0">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground font-mono">
                          {template.name}
                        </span>
                        <Badge
                          className={`text-[10px] border ${CATEGORY_COLORS[template.category] || ''}`}
                        >
                          {template.category}
                        </Badge>
                      </div>
                      <TemplateMiniPreview
                        headerType={template.header_type}
                        headerContent={template.header_content}
                        bodyText={template.body_text}
                        footerText={template.footer_text}
                        category={template.industry}
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUseTemplate(template);
                      }}
                    >
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

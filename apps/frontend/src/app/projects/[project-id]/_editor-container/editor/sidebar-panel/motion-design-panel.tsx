'use client';

import { PlayerRef } from '@remotion/player';
import { Plus, Search, Sparkles } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motionDesignCategories, motionDesignTemplateAgentDescriptions, motionDesignTemplates } from 'api-types';
import type { MotionDesignCategory, MotionDesignTemplate, MotionDesignTemplateId } from 'api-types';
import { Button } from '@/components/buttons/button';
import { cn } from '@/lib/utils';
import { scrollbarStyle } from '../constants';
import { MotionDesignInspector } from '../inspector/motion-design-inspector';
import { createMotionDesignItem } from '../items/motion-design/create-motion-design-item';
import type { MotionDesignItem } from '../items/motion-design/motion-design-item-type';
import { addItem } from '../state/actions/add-item';
import { useDimensions, useFps, useSelectedItems, useAllItems, useWriteContext } from '../utils/use-context';
import { MotionTemplatePreview } from './motion-template-preview';

type MotionDesignPanelProps = {
  playerRef: React.RefObject<PlayerRef | null>;
};

const categoryLabels: Record<MotionDesignCategory | 'all', string> = {
  all: 'All',
  text: 'Text FX',
  typewriter: 'Type',
  code: 'Code',
  gradient: 'Gradient',
  particles: 'Particles',
  motion: 'Motion',
  data: 'Data',
  '3d': '3D',
  showcase: 'Showcase',
  chat: 'Chat',
  social: 'Social',
  frames: 'Frames',
  gaia: 'Gaia',
};

type MotionTemplateCardProps = {
  template: MotionDesignTemplate;
  onAdd: (template: MotionDesignTemplate) => void;
};

const MotionTemplateCardComponent: React.FC<MotionTemplateCardProps> = ({ template, onAdd }) => (
  <button
    type="button"
    onClick={() => onAdd(template)}
    aria-label={`Add ${template.label} motion design`}
    className="group flex w-full gap-3 rounded-md border border-white/10 bg-white/3 p-2 text-left transition-colors hover:border-white/20 hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
  >
    <MotionTemplatePreview template={template} />
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-neutral-200">{template.label}</span>
        <Plus className="size-3.5 shrink-0 text-neutral-400" />
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-neutral-500">{template.description}</p>
      <span className="mt-2 inline-flex rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-neutral-400">
        {categoryLabels[template.category]} · {template.source === 'motion-studio' ? 'Motion Studio' : 'Framedeck'}
      </span>
    </div>
  </button>
);

const MotionTemplateCard = React.memo(MotionTemplateCardComponent);

MotionTemplateCard.displayName = 'MotionTemplateCard';

const TEMPLATE_ROW_HEIGHT = 96;
const TEMPLATE_OVERSCAN = 6;

export const MotionDesignPanel: React.FC<MotionDesignPanelProps> = ({ playerRef }) => {
  const { setState } = useWriteContext();
  const { fps } = useFps();
  const { compositionWidth, compositionHeight } = useDimensions();
  const { selectedItems } = useSelectedItems();
  const { items } = useAllItems();
  const listParentRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState<string>('');
  const [category, setCategory] = useState<MotionDesignCategory | 'all'>('all');
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [listHeight, setListHeight] = useState<number>(620);

  const selectedMotionItem = useMemo(() => {
    if (selectedItems.length !== 1) return null;
    const item = items[selectedItems[0]];
    return item?.type === 'motion-design' ? (item as MotionDesignItem) : null;
  }, [items, selectedItems]);

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return motionDesignTemplates.filter((template) => {
      const matchesCategory = category === 'all' || template.category === category;
      const searchable = [
        template.label,
        template.description,
        motionDesignTemplateAgentDescriptions[template.id],
        template.tags.join(' '),
        template.sourceBit,
      ]
        .join(' ')
        .toLowerCase();
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, query]);

  const visibleRows = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / TEMPLATE_ROW_HEIGHT) - TEMPLATE_OVERSCAN);
    const endIndex = Math.min(
      filteredTemplates.length,
      Math.ceil((scrollTop + listHeight) / TEMPLATE_ROW_HEIGHT) + TEMPLATE_OVERSCAN,
    );
    return filteredTemplates.slice(startIndex, endIndex).map((template, offset) => ({
      template,
      index: startIndex + offset,
    }));
  }, [filteredTemplates, listHeight, scrollTop]);

  const totalListHeight = filteredTemplates.length * TEMPLATE_ROW_HEIGHT;

  const featuredTemplate = motionDesignTemplates[0];

  const handleAddTemplate = useCallback(
    (template: MotionDesignTemplate) => {
      const item = createMotionDesignItem({
        templateId: template.id as MotionDesignTemplateId,
        from: playerRef.current?.getCurrentFrame() ?? 0,
        fps,
        compositionWidth,
        compositionHeight,
      });

      setState({
        update: (state) =>
          addItem({
            state,
            item,
            select: true,
            position: { type: 'front' },
          }),
        commitToUndoStack: true,
      });
    },
    [compositionHeight, compositionWidth, fps, playerRef, setState],
  );

  return (
    <div className="border-r-editor-starter-border bg-editor-starter-panel flex h-full w-[300px] flex-col overflow-hidden border-r text-white">
      <div className="shrink-0 border-b border-white/10 p-3">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-300">Motion</span>
          <span className="ml-auto text-xs text-neutral-500">{motionDesignTemplates.length}</span>
        </div>
        <label className="editor-starter-field flex items-center gap-2 px-2 py-2">
          <Search className="size-3.5 text-neutral-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="Search presets"
            className="min-w-0 flex-1 bg-transparent text-xs text-neutral-300 outline-none placeholder:text-neutral-600"
          />
        </label>
        <div className="mt-3 flex gap-1 overflow-x-auto pb-1" style={scrollbarStyle}>
          {(['all', ...motionDesignCategories] as const).map((categoryOption) => (
            <button
              key={categoryOption}
              type="button"
              onClick={() => setCategory(categoryOption)}
              className={cn(
                'shrink-0 rounded-md px-2 py-1 text-xs text-neutral-400 hover:bg-white/10 hover:text-white',
                category === categoryOption && 'bg-white/10 text-white',
              )}
            >
              {categoryLabels[categoryOption]}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={listParentRef}
        className="flex-1 overflow-y-auto p-3"
        style={scrollbarStyle}
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop);
          setListHeight(event.currentTarget.clientHeight);
        }}
      >
        <div
          className="relative"
          style={{
            height: totalListHeight,
          }}
        >
          {visibleRows.map(({ template, index }) => {
            return (
              <div
                key={template.id}
                className="absolute left-0 w-full"
                style={{
                  transform: `translateY(${index * TEMPLATE_ROW_HEIGHT}px)`,
                }}
              >
                <MotionTemplateCard template={template} onAdd={handleAddTemplate} />
              </div>
            );
          })}
        </div>
      </div>

      {selectedMotionItem ? (
        <div className="max-h-[48%] shrink-0 overflow-y-auto border-t border-white/10" style={scrollbarStyle}>
          <MotionDesignInspector item={selectedMotionItem} />
        </div>
      ) : (
        <div className="shrink-0 border-t border-white/10 p-3">
          {featuredTemplate ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => handleAddTemplate(featuredTemplate)}
            >
              <Plus className="size-4" />
              Add featured preset
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};

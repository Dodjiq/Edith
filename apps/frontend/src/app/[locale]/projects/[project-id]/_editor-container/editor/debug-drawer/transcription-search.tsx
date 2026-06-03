'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import type { Caption } from '@remotion/captions';
import type { VideoItem } from '../items/video/video-item-type';
import type { AudioItem } from '../items/audio/audio-item-type';
import type { EditorStarterItem } from '../items/item-type';

type ItemWithTranscription = (VideoItem | AudioItem) & {
  transcription: Caption[];
};

export type SearchResult = {
  itemId: string;
  itemType: 'video' | 'audio';
  captionIndex: number;
  caption: Caption;
  jsonPath: string;
};

type TranscriptionSearchProps = {
  items: Record<string, EditorStarterItem>;
  onResultClick: (result: SearchResult) => void;
};

function hasTranscription(item: EditorStarterItem): item is ItemWithTranscription {
  return (
    (item.type === 'video' || item.type === 'audio') &&
    Array.isArray((item as VideoItem | AudioItem).transcription) &&
    (item as VideoItem | AudioItem).transcription!.length > 0
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-500/40 text-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export const TranscriptionSearch: React.FC<TranscriptionSearchProps> = ({
  items,
  onResultClick,
}) => {
  const [query, setQuery] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    Object.entries(items).forEach(([itemId, item]) => {
      if (!hasTranscription(item)) return;

      item.transcription.forEach((caption, captionIndex) => {
        if (caption.text.toLowerCase().includes(lowerQuery)) {
          results.push({
            itemId,
            itemType: item.type,
            captionIndex,
            caption,
            jsonPath: `items["${itemId}"].transcription[${captionIndex}]`,
          });
        }
      });
    });

    return results;
  }, [items, query]);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    onResultClick(result);
  }, [onResultClick]);

  useEffect(() => {
    if (searchResults.length > 0 && query.trim()) {
      setIsExpanded(true);
    }
  }, [searchResults.length, query]);

  const itemsWithTranscription = useMemo(() =>
    Object.values(items).filter(hasTranscription).length,
    [items]
  );

  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search transcriptions (${itemsWithTranscription} items with transcription)`}
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-8 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query.trim() && query.length >= 2 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </button>
        </div>
      )}

      {isExpanded && searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className="max-h-48 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-800/50"
        >
          {searchResults.map((result) => (
            <button
              key={`${result.itemId}-${result.captionIndex}`}
              onClick={() => handleResultClick(result)}
              className="flex w-full flex-col gap-1 border-b border-zinc-700/50 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-zinc-700/50"
            >
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                  result.itemType === 'video'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-green-500/20 text-green-300'
                }`}>
                  {result.itemType}
                </span>
                <span className="truncate font-mono text-[10px] text-zinc-500">
                  {result.jsonPath}
                </span>
              </div>
              <p className="text-sm text-zinc-200">
                {highlightMatch(result.caption.text, query)}
              </p>
            </button>
          ))}
        </div>
      )}

      {query.trim() && query.length >= 2 && searchResults.length === 0 && (
        <p className="text-xs text-zinc-500">
          No matches found for &quot;{query}&quot;
        </p>
      )}
    </div>
  );
};

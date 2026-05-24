'use client';

import React, { useRef, useState } from 'react';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';

const levelButtons = [1, 2, 3, 4, 5, 6];

type JsonViewerProps = {
  data: unknown;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  initialCollapseDepth?: number | boolean;
};

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, containerRef, initialCollapseDepth = 2 }) => {
  const [collapseDepth, setCollapseDepth] = useState<number | boolean>(initialCollapseDepth);
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = containerRef ?? internalRef;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-400">Depth:</span>
        {levelButtons.map((level) => (
          <button
            key={level}
            onClick={() => setCollapseDepth(level)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              collapseDepth === level ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
            }`}
          >
            {level}
          </button>
        ))}
        <button
          onClick={() => setCollapseDepth(false)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            collapseDepth === false ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
          }`}
        >
          All
        </button>
      </div>
      <div
        ref={scrollRef}
        className="json-viewer-high-contrast min-h-0 flex-1 overflow-y-auto rounded-md bg-zinc-950 p-4"
      >
        <JsonView
          src={data}
          theme="default"
          dark
          collapseStringsAfterLength={100}
          collapsed={collapseDepth}
          enableClipboard
          style={{
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            backgroundColor: 'transparent',
            lineHeight: '1.7',
          }}
        />
      </div>
      <style>{`
        .json-viewer-high-contrast .json-view-key {
          color: #93c5fd !important;
        }
        .json-viewer-high-contrast .json-view-string {
          color: #86efac !important;
        }
        .json-viewer-high-contrast .json-view-number {
          color: #fdba74 !important;
        }
        .json-viewer-high-contrast .json-view-boolean {
          color: #f0abfc !important;
        }
        .json-viewer-high-contrast .json-view-null {
          color: #fca5a5 !important;
        }
        .json-viewer-high-contrast .json-view {
          color: #e4e4e7 !important;
        }
        .json-viewer-high-contrast .jv-chevron {
          color: #a1a1aa !important;
        }
        .json-viewer-high-contrast .json-view-collapseIcon {
          color: #a1a1aa !important;
        }
      `}</style>
    </div>
  );
};

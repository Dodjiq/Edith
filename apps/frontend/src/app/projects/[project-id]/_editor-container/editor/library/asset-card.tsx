'use client';

import React, { useMemo, useRef, useCallback, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { EditorStarterAsset, AssetState } from '../assets/assets';
import { useLocalUrls } from '../caching/load-to-blob-url';
import { cn } from '@/lib/utils';
import { useIsDevMode } from '../context/DevModeContext';
import { PlayIcon } from '../icons/play';

type AssetCardProps = {
  asset: EditorStarterAsset;
  status: AssetState | undefined;
  onDragStart: (e: React.DragEvent, asset: EditorStarterAsset) => void;
  isOnTimeline: boolean;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `0:${secs.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const getAssetTypeIcon = (type: EditorStarterAsset['type']) => {
  switch (type) {
    case 'video':
      // Film strip icon (not a play button to avoid confusion)
      return (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
        </svg>
      );
    case 'audio':
      return (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      );
    case 'image':
    case 'gif':
      return (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    default:
      return null;
  }
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset, status, onDragStart, isOnTimeline }) => {
  const localUrls = useLocalUrls();
  const localUrl = localUrls[asset.id];
  const isDevMode = useIsDevMode();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const isUploading = status?.type === 'in-progress' || status?.type === 'pending-upload';
  const isTranscribing = status?.type === 'transcribing';
  const transcribingLabel = 'Processing...';
  const hasError = status?.type === 'error';
  const uploadProgress = status?.type === 'in-progress' ? status.progress.progress * 100 : 0;

  const duration = useMemo(() => {
    if (asset.type === 'video' || asset.type === 'audio' || asset.type === 'gif') {
      return asset.durationInSeconds;
    }
    return null;
  }, [asset]);

  const thumbnailSrc = useMemo(() => {
    if (asset.type === 'image' || asset.type === 'gif') {
      return localUrl || asset.remoteUrl;
    }
    if (asset.type === 'video') {
      return localUrl || asset.remoteUrl;
    }
    return null;
  }, [asset, localUrl]);
  const canPreviewVideo = asset.type === 'video' && Boolean(thumbnailSrc);

  const handleVideoMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current || asset.type !== 'video' || !duration) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      videoRef.current.currentTime = percentage * duration;
    },
    [asset.type, duration],
  );

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, []);

  const handlePreviewOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsPreviewOpen(true);
  }, []);

  return (
    <>
      <div
        draggable={!isUploading && !isTranscribing && !hasError}
        onDragStart={(e) => onDragStart(e, asset)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={asset.type === 'video' ? handleVideoMouseMove : undefined}
        className={cn(
          'group relative aspect-video cursor-grab overflow-hidden rounded-md bg-white/5 transition-all',
          'hover:bg-white/10 hover:ring-1 hover:ring-white/20',
          isOnTimeline && 'ring-1 ring-blue-500/50',
          (isUploading || isTranscribing || hasError) && 'cursor-not-allowed',
        )}
      >
        {/* Thumbnail */}
        {thumbnailSrc && (asset.type === 'image' || asset.type === 'gif') ? (
          <Image
            src={thumbnailSrc}
            alt={asset.filename}
            fill
            className="object-cover"
            unoptimized
          />
        ) : asset.type === 'video' && thumbnailSrc ? (
          <video
            ref={videoRef}
            src={thumbnailSrc}
            className="h-full w-full object-cover"
            muted
            preload="metadata"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-neutral-500">{getAssetTypeIcon(asset.type)}</div>
          </div>
        )}

        {/* Overlay gradient - always visible for better text contrast */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Play button - only shown on hover for video assets */}
        {canPreviewVideo && !isUploading && !isTranscribing && !hasError && (
          <button
            type="button"
            aria-label={`Preview ${asset.filename}`}
            draggable={false}
            onClick={handlePreviewOpen}
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            className={cn(
              'absolute inset-0 z-10 flex cursor-pointer items-center justify-center opacity-0 transition-opacity',
              'pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100',
              'focus-visible:pointer-events-auto focus-visible:opacity-100',
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm">
              <PlayIcon className="h-3 w-3 translate-x-[1px] text-white/60" />
            </span>
          </button>
        )}

        {/* Duration and size badge (bottom left) - hidden on hover */}
        {(duration !== null || isDevMode) && (
          <div className="absolute bottom-1 left-1 flex items-center gap-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm transition-opacity group-hover:opacity-0">
            {duration !== null && <span>{formatDuration(duration)}</span>}
            {isDevMode && duration !== null && <span className="text-white/40">·</span>}
            {isDevMode && <span className="text-white/70">{formatFileSize(asset.size)}</span>}
          </div>
        )}

        {/* Filename (bottom) - shown on hover, replaces duration/size */}
        <div className="absolute bottom-1 left-1 right-1 truncate rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          {asset.filename}
        </div>

        {/* Type icon (top right) - shown on hover, hidden in dev mode */}
        {!isDevMode && (
          <div className="absolute right-1 top-1 rounded bg-black/50 p-1 text-white/70 opacity-0 transition-opacity group-hover:opacity-100">
            {getAssetTypeIcon(asset.type)}
          </div>
        )}

        {/* Asset ID debug (top right) - always visible in dev mode */}
        {isDevMode && (
          <div className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-white/50 backdrop-blur-sm">
            {asset.id}
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/40">
                <div
                  className="h-full bg-blue-400 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-white/90">
                {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : 'Uploading...'}
              </span>
            </div>
          </div>
        )}

        {/* Video analysis overlay */}
        {isTranscribing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-[10px] text-white/70">{transcribingLabel}</span>
          </div>
        )}

        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
            <span className="text-[10px] text-red-300">Error</span>
          </div>
        )}
      </div>

      {canPreviewVideo && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent
            size="xl"
            className="overflow-hidden border-white/10 bg-neutral-950 p-0 text-white"
          >
            <DialogTitle className="sr-only">{asset.filename}</DialogTitle>
            <div className="border-b border-white/10 px-4 py-3 text-sm font-medium text-white/85">
              {asset.filename}
            </div>
            <div className="bg-black p-2">
              <video
                key={thumbnailSrc}
                src={thumbnailSrc ?? undefined}
                className="max-h-[80vh] w-full rounded-md bg-black"
                controls
                autoPlay
                playsInline
                preload="metadata"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

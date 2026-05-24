'use client';

import { useInView, useReducedMotion } from 'motion/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MotionDesignTemplate, MotionDesignTemplateId } from 'api-types';
import { renderMotionDesign } from '../items/motion-design/motion-design-visual-renderers';
import type { MotionDesignItem } from '../items/motion-design/motion-design-item-type';

const previewFps = 30;
const previewRefreshRate = 20;
const previewDisplayWidth = 112;
const previewWidth = 640;
const previewHeight = 360;
const previewScale = previewDisplayWidth / previewWidth;
const lateFrameTemplateIds = new Set<string>([
  'basic-typewriter',
  'cli-simulation',
  'multitext-typewriter',
  'variable-speed-typewriter',
  'typing-code-block',
  'terminal-3d',
]);

type MotionTemplatePreviewProps = {
  template: MotionDesignTemplate;
};

const getPosterFrame = (template: MotionDesignTemplate): number => {
  const duration = template.defaultDurationInFrames;

  if (lateFrameTemplateIds.has(template.id)) return Math.round(duration * 0.72);
  if (template.id === 'lower-third-slide') return Math.round(duration * 0.32);
  if (template.id === 'confetti-hit' || template.id === 'counter-confetti') return Math.round(duration * 0.42);
  if (template.category === 'gradient') return Math.round(duration * 0.48);

  return Math.round(duration * 0.58);
};

const getInitialFrameOffset = (template: MotionDesignTemplate): number => {
  const posterFrame = getPosterFrame(template);
  const templateSeed = Array.from(template.id).reduce((total, character) => total + character.charCodeAt(0), 0);
  return (posterFrame + templateSeed) % template.defaultDurationInFrames;
};

const getFallbackBackground = (template: MotionDesignTemplate): string => {
  const { accentColor, backgroundColor, primaryColor } = template.defaultProps;
  const firstColor = primaryColor ?? '#334155';
  const secondColor = accentColor ?? '#38bdf8';
  const baseColor = backgroundColor ?? '#020617';

  if (template.category === 'gradient') {
    return `linear-gradient(135deg, ${baseColor}, ${firstColor}, ${secondColor})`;
  }

  return baseColor;
};

const MotionTemplatePreviewComponent: React.FC<MotionTemplatePreviewProps> = ({ template }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: '180px' });
  const shouldReduceMotion = useReducedMotion();
  const item = useMemo<MotionDesignItem>(
    () => ({
      id: `preview-${template.id}`,
      type: 'motion-design',
      templateId: template.id as MotionDesignTemplateId,
      props: template.defaultProps,
      durationInFrames: template.defaultDurationInFrames,
      from: 0,
      top: 0,
      left: 0,
      width: previewWidth,
      height: previewHeight,
      opacity: 1,
      isDraggingInTimeline: false,
      rotation: 0,
      fadeInDurationInSeconds: 0,
      fadeOutDurationInSeconds: 0,
    }),
    [template],
  );
  const posterFrame = useMemo(() => getPosterFrame(template), [template]);
  const initialFrameOffset = useMemo(() => getInitialFrameOffset(template), [template]);
  const [animatedFrame, setAnimatedFrame] = useState<number | null>(null);
  const canAnimate = isInView && !shouldReduceMotion;
  const previewFrame = canAnimate && animatedFrame !== null ? animatedFrame : posterFrame;
  const previewStyle = useMemo<React.CSSProperties>(
    () => ({ background: getFallbackBackground(template), contain: 'layout paint style' }),
    [template],
  );
  const previewCanvasStyle = useMemo<React.CSSProperties>(
    () => ({
      width: previewWidth,
      height: previewHeight,
      transform: `scale(${previewScale})`,
      transformOrigin: 'top left',
    }),
    [],
  );

  useEffect(() => {
    if (!canAnimate) return;

    let animationFrameId = 0;
    let lastFrameTime = 0;
    const animationStartedAt = performance.now() - (initialFrameOffset / previewFps) * 1000;
    const frameDuration = 1000 / previewRefreshRate;

    const tick = (time: number) => {
      if (time - lastFrameTime >= frameDuration) {
        const elapsedFrames = Math.floor(((time - animationStartedAt) / 1000) * previewFps);
        setAnimatedFrame(elapsedFrames % template.defaultDurationInFrames);
        lastFrameTime = time;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameId);
  }, [canAnimate, initialFrameOffset, template.defaultDurationInFrames]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-950"
      style={previewStyle}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 overflow-hidden" style={previewCanvasStyle}>
          {renderMotionDesign({
            item,
            frame: previewFrame,
            fps: previewFps,
            durationInFrames: item.durationInFrames,
          })}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
      <div className="pointer-events-none absolute inset-x-2 bottom-1 flex h-1 overflow-hidden rounded-full bg-black/25">
        <span className="h-full w-1/3 bg-white/30" />
        <span className="h-full w-1/3 bg-white/50" />
        <span className="h-full w-1/3 bg-white/70" />
      </div>
    </div>
  );
};

export const MotionTemplatePreview = React.memo(MotionTemplatePreviewComponent);

MotionTemplatePreview.displayName = 'MotionTemplatePreview';

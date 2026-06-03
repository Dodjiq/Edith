import React from 'react';
import { getMotionDesignTimingCheck } from 'api-types';
import { interpolate, random } from 'remotion';
import { getMotionItems, progress, type MotionDesignRenderProps } from './motion-design-renderer-utils';
import { CodeMotion, LowerThirdMotion, MotionText, TypewriterMotion } from './motion-design-text-renderers';
import { MotionStudioRenderer } from './motion-studio-renderer';

const ParticleField: React.FC<{ item: MotionDesignRenderProps['item']; frame: number; variant?: string }> = ({
  item,
  frame,
  variant,
}) => {
  const count = Math.round(36 * (item.props.density ?? 1));
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, index) => {
        const seed = `${item.id}-${variant ?? item.templateId}-${index}`;
        const startX = random(`${seed}-x`) * 100;
        const drift = (random(`${seed}-d`) - 0.5) * 28 * (item.props.intensity ?? 1);
        const fall = item.templateId.includes('snow') || variant !== 'confetti';
        const y = fall
          ? ((frame * (0.25 + random(`${seed}-s`) * 0.7) + random(`${seed}-y`) * 100) % 120) - 10
          : 75 - progress(frame, 48) * 90 + random(`${seed}-y`) * 20;
        const size = 5 + random(`${seed}-size`) * 16;
        return (
          <span
            key={seed}
            className="absolute rounded-full"
            style={{
              position: 'absolute',
              borderRadius: 9999,
              left: `${startX + Math.sin(frame / 20 + index) * drift}%`,
              top: `${y}%`,
              width: size,
              height: size,
              background: index % 2 ? item.props.primaryColor : item.props.accentColor,
              opacity: 0.25 + random(`${seed}-o`) * 0.65,
              transform: `rotate(${frame * 3 + index * 17}deg)`,
              boxShadow:
                item.templateId.includes('fireflies') || item.templateId.includes('accent')
                  ? `0 0 ${size * 2}px ${item.props.accentColor}`
                  : undefined,
            }}
          />
        );
      })}
    </div>
  );
};

const CounterMotion: React.FC<MotionDesignRenderProps> = ({ item, frame, durationInFrames }) => {
  const count = Math.round(
    interpolate(progress(frame, durationInFrames * 0.65), [0, 1], [item.props.value ?? 0, item.props.endValue ?? 1000]),
  );
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden text-center font-bold"
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        textAlign: 'center',
        fontWeight: 700,
        color: item.props.primaryColor,
      }}
    >
      {item.templateId.includes('confetti') && <ParticleField item={item} frame={frame} variant="confetti" />}
      <div style={{ transform: `scale(${0.85 + progress(frame, 24) * 0.15})` }}>
        <div style={{ fontSize: item.props.fontSize ?? 96, lineHeight: 1 }}>
          {item.props.prefix}
          {count.toLocaleString()}
          {item.props.suffix}
        </div>
        {item.props.label && (
          <div className="mt-3 text-[0.28em] tracking-normal uppercase" style={{ color: item.props.accentColor }}>
            {item.props.label}
          </div>
        )}
      </div>
    </div>
  );
};

const GradientMotion: React.FC<MotionDesignRenderProps> = ({ item, frame, durationInFrames }) => {
  const rotate = interpolate(frame, [0, durationInFrames], [0, item.templateId === 'conic-gradient' ? 180 : 35]);
  const first = item.props.primaryColor ?? '#38bdf8';
  const second = item.props.accentColor ?? '#f97316';
  const bg = item.props.backgroundColor ?? '#111827';
  const gradient =
    item.templateId === 'radial-gradient'
      ? `radial-gradient(circle at ${50 + Math.sin(frame / 18) * 18}% 50%, ${first}, ${second}, ${bg})`
      : item.templateId === 'conic-gradient'
        ? `conic-gradient(from ${rotate}deg, ${first}, ${second}, ${bg}, ${first})`
        : `linear-gradient(${120 + rotate}deg, ${bg}, ${first}, ${second})`;
  return <div className="h-full w-full" style={{ width: '100%', height: '100%', background: gradient }} />;
};

const ParticleMotion: React.FC<MotionDesignRenderProps> = (props) => {
  if (props.item.templateId === 'flying-through-words') {
    return <CardsMotion {...props} />;
  }
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: props.item.props.backgroundColor ?? 'transparent',
      }}
    >
      <ParticleField item={props.item} frame={props.frame} />
    </div>
  );
};

const CardsMotion: React.FC<MotionDesignRenderProps> = ({ item, frame, durationInFrames }) => {
  const items = getMotionItems(item);
  const p = progress(frame, durationInFrames * 0.6);
  const isCarousel = item.templateId.includes('carousel') || item.templateId.includes('cube');
  const timingCheck = getMotionDesignTimingCheck({
    templateId: item.templateId,
    props: item.props,
    durationInFrames,
  });
  const staggerFrames = Math.max(0, timingCheck.effectiveFramesPerUnit || item.props.staggerFrames || 8);
  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden rounded-md"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 6,
        background: item.props.backgroundColor ?? 'transparent',
        perspective: 1000,
      }}
    >
      {items.map((label, index) => {
        const local = progress(frame - index * staggerFrames, 24);
        const angle = isCarousel
          ? (360 / Math.max(1, items.length)) * index + frame * 0.55
          : (index - (items.length - 1) / 2) * 12 * local * p;
        const x = isCarousel
          ? Math.sin((angle * Math.PI) / 180) * 190
          : (index - (items.length - 1) / 2) * 130 * local * p;
        const z = isCarousel ? Math.cos((angle * Math.PI) / 180) * 160 : index * -28 * local * p;
        return (
          <div
            key={`${label}-${index}`}
            className="absolute flex h-32 w-48 items-center justify-center rounded-md border border-white/15 px-4 text-center text-2xl font-semibold shadow-xl"
            style={{
              position: 'absolute',
              display: 'flex',
              width: 192,
              height: 128,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              padding: '0 16px',
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 600,
              background: index % 2 ? item.props.primaryColor : item.props.accentColor,
              color: item.props.backgroundColor ?? '#111827',
              transform: `translateX(${x}px) translateZ(${z}px) rotateY(${angle}deg) scale(${0.88 + local * 0.12})`,
              opacity: local,
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

const ListMotion: React.FC<MotionDesignRenderProps> = ({ item, frame, durationInFrames }) => {
  const timingCheck = getMotionDesignTimingCheck({
    templateId: item.templateId,
    props: item.props,
    durationInFrames,
  });
  const staggerFrames = Math.max(0, timingCheck.effectiveFramesPerUnit || item.props.staggerFrames || 8);

  return (
    <div
      className="flex h-full w-full flex-col justify-center gap-4 overflow-hidden rounded-md p-8"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 16,
        overflow: 'hidden',
        borderRadius: 6,
        padding: 32,
        background: item.props.backgroundColor ?? 'transparent',
      }}
    >
      {getMotionItems(item).map((label, index) => {
        const local = progress(frame - index * staggerFrames, 26);
        return (
          <div
            key={`${label}-${index}`}
            className="rounded-md border border-white/10 px-5 py-3 text-2xl font-semibold"
            style={{
              background: item.props.primaryColor,
              color: item.props.backgroundColor ?? '#111827',
              opacity: local,
              transform: `translateX(${(1 - local) * -60}px) scale(${0.96 + local * 0.04})`,
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

const GridMotion: React.FC<MotionDesignRenderProps> = ({ item, frame, durationInFrames }) => {
  const timingCheck = getMotionDesignTimingCheck({
    templateId: item.templateId,
    props: item.props,
    durationInFrames,
  });
  const staggerFrames = Math.max(0, timingCheck.effectiveFramesPerUnit || item.props.staggerFrames || 2);

  return (
    <div
      className="grid h-full w-full grid-cols-4 gap-3 overflow-hidden p-8"
      style={{
        display: 'grid',
        width: '100%',
        height: '100%',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 12,
        overflow: 'hidden',
        padding: 32,
        background: item.props.backgroundColor ?? 'transparent',
      }}
    >
      {Array.from({ length: 16 }).map((_, index) => {
        const local = progress(frame - Math.abs(index - 7.5) * staggerFrames, 30);
        return (
          <div
            key={index}
            className="rounded-md"
            style={{
              background: index % 3 === 0 ? item.props.accentColor : item.props.primaryColor,
              opacity: local,
              transform: `scale(${0.4 + local * 0.6}) rotate(${(1 - local) * 18}deg)`,
            }}
          />
        );
      })}
    </div>
  );
};

export const renderMotionDesign = (props: MotionDesignRenderProps) => {
  const { item } = props;
  if (item.templateId.startsWith('ms-')) return <MotionStudioRenderer item={item} durationInFrames={props.durationInFrames} />;
  if (item.templateId === 'lower-third-slide') return <LowerThirdMotion {...props} />;
  if (
    ['basic-typewriter', 'cli-simulation', 'multitext-typewriter', 'variable-speed-typewriter', 'terminal-3d'].includes(
      item.templateId,
    )
  )
    return <TypewriterMotion {...props} />;
  if (item.templateId.includes('code')) return <CodeMotion {...props} />;
  if (item.templateId.includes('counter')) return <CounterMotion {...props} />;
  if (item.templateId.includes('gradient')) return <GradientMotion {...props} />;
  if (
    item.templateId.includes('particles') ||
    [
      'fireflies',
      'confetti-hit',
      'particle-accent',
      'matrix-rain',
      'flying-through-words',
      'scrolling-columns',
    ].includes(item.templateId)
  )
    return <ParticleMotion {...props} />;
  if (
    item.templateId.includes('grid') ||
    item.templateId.includes('mosaic') ||
    item.templateId.includes('fracture') ||
    item.templateId.includes('easings')
  )
    return <GridMotion {...props} />;
  if (item.templateId.includes('list') || item.templateId.includes('staggered-fade')) return <ListMotion {...props} />;
  if (
    item.templateId.includes('3d') ||
    item.templateId.includes('carousel') ||
    item.templateId.includes('ken-burns') ||
    item.templateId.includes('transform')
  )
    return <CardsMotion {...props} />;
  return <MotionText {...props} />;
};

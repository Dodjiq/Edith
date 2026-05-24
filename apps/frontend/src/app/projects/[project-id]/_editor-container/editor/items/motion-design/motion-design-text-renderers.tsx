import React from 'react';
import { getMotionDesignTimingCheck } from 'api-types';
import { interpolate, random } from 'remotion';
import { clamp, getMotionText, progress, type MotionDesignRenderProps } from './motion-design-renderer-utils';

export const LowerThirdMotion: React.FC<MotionDesignRenderProps> = ({ item, frame }) => {
  const local = progress(frame, 28);
  return (
    <div
      className="flex h-full w-full items-end overflow-hidden p-6"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'flex-end',
        overflow: 'hidden',
        padding: 24,
      }}
    >
      <div
        className="w-full rounded-md px-7 py-5"
        style={{
          width: '100%',
          borderRadius: 6,
          padding: '20px 28px',
          background: item.props.backgroundColor ?? '#0f172a',
          color: item.props.primaryColor ?? '#ffffff',
          opacity: local,
          transform: `translateX(${(1 - local) * -90}px)`,
        }}
      >
        <div className="font-bold" style={{ fontSize: item.props.fontSize ?? 52, lineHeight: 1.05 }}>
          {getMotionText(item)}
        </div>
        {item.props.secondaryText && (
          <div
            className="mt-2 text-2xl font-medium"
            style={{ color: item.props.accentColor ?? '#38bdf8', opacity: progress(frame - 10, 20) }}
          >
            {item.props.secondaryText}
          </div>
        )}
      </div>
    </div>
  );
};

export const MotionText: React.FC<MotionDesignRenderProps> = ({ item, frame, durationInFrames }) => {
  const text = getMotionText(item);
  const parts = item.templateId === 'character-by-character' ? text.split('') : text.split(/\s+/);
  const fontSize = item.props.fontSize ?? 82;
  const baseProgress = progress(frame, durationInFrames * 0.45);
  const timingCheck = getMotionDesignTimingCheck({
    templateId: item.templateId,
    props: item.props,
    durationInFrames,
  });
  const staggerFrames = Math.max(0, timingCheck.effectiveFramesPerUnit || item.props.staggerFrames || 3);

  if (item.templateId === 'glitch-in' || item.templateId === 'glitch-cycle') {
    const jitter = Math.round(random(`${item.id}-${frame}`) * 12 - 6) * (item.props.intensity ?? 1);
    const slice = Math.ceil(parts.length * clamp(baseProgress + 0.1, 0, 1));
    return (
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden text-center font-bold"
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          textAlign: 'center',
          fontWeight: 700,
          color: item.props.primaryColor,
          fontSize,
          letterSpacing: 0,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transform: `translate(${jitter}px, ${-jitter / 2}px) skewX(${jitter / 3}deg)`,
          }}
        >
          {parts.slice(0, slice).join(' ')}
        </span>
        <span
          className="absolute mix-blend-screen"
          style={{
            position: 'absolute',
            color: item.props.accentColor,
            mixBlendMode: 'screen',
            transform: `translate(${-jitter}px, ${jitter}px)`,
          }}
        >
          {text}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 overflow-hidden text-center font-bold"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 16,
        rowGap: 8,
        overflow: 'hidden',
        textAlign: 'center',
        fontWeight: 700,
        color: item.props.primaryColor,
        fontSize,
        letterSpacing: 0,
      }}
    >
      {parts.map((part, index) => {
        const local = progress(frame - index * staggerFrames, 24);
        const y = item.templateId === 'slide-from-left' ? 0 : interpolate(local, [0, 1], [32, 0]);
        const x = item.templateId === 'slide-from-left' ? interpolate(local, [0, 1], [-80, 0]) : 0;
        const blur = item.templateId === 'blur-word-title' ? interpolate(local, [0, 1], [12, 0]) : 0;
        return (
          <span
            key={`${part}-${index}`}
            style={{
              display: 'inline-block',
              color: index % 3 === 1 ? item.props.accentColor : undefined,
              filter: `blur(${blur}px)`,
              opacity: local,
              transform: `translate(${x}px, ${y}px) scale(${0.92 + local * 0.08})`,
            }}
          >
            {part === ' ' ? '\u00a0' : part}
          </span>
        );
      })}
    </div>
  );
};

export const TypewriterMotion: React.FC<MotionDesignRenderProps> = ({ item, frame, durationInFrames }) => {
  const text =
    (Array.isArray(item.props.commandLines) ? item.props.commandLines.join('\n') : item.props.commandLines) ??
    getMotionText(item).replace(/\|/g, '\n');
  const timingCheck = getMotionDesignTimingCheck({
    templateId: item.templateId,
    props: item.props,
    durationInFrames,
  });
  const framesPerCharacter = Math.max(0.01, timingCheck.effectiveFramesPerUnit || 3);
  const visible = text.slice(0, Math.min(text.length, Math.floor(frame / framesPerCharacter)));
  const cursor = Math.floor(frame / 15) % 2 === 0 ? '|' : ' ';
  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden rounded-md p-8 font-mono"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 6,
        padding: 32,
        fontFamily: 'monospace',
        background: item.props.backgroundColor ?? '#111827',
        color: item.props.primaryColor ?? '#e5e7eb',
        fontSize: item.props.fontSize ?? 48,
      }}
    >
      <pre className="m-0 leading-tight whitespace-pre-wrap">
        {visible}
        <span style={{ color: item.props.accentColor }}>{cursor}</span>
      </pre>
    </div>
  );
};

export const CodeMotion: React.FC<MotionDesignRenderProps> = ({ item, frame, durationInFrames }) => {
  const code = item.props.code ?? 'const motion = true;';
  const timingCheck = getMotionDesignTimingCheck({
    templateId: item.templateId,
    props: item.props,
    durationInFrames,
  });
  const framesPerUnit = Math.max(0.01, timingCheck.effectiveFramesPerUnit || 2);
  const codeLines = code.split('\n');
  const shown =
    item.templateId === 'typing-code-block'
      ? code.slice(0, Math.min(code.length, Math.floor(frame / framesPerUnit)))
      : codeLines.slice(0, Math.min(codeLines.length, Math.floor(frame / framesPerUnit) + 1)).join('\n');
  return (
    <div
      className="h-full w-full overflow-hidden rounded-md p-8 font-mono shadow-2xl"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 6,
        padding: 32,
        fontFamily: 'monospace',
        background: item.props.backgroundColor ?? '#111827',
        color: item.props.primaryColor ?? '#e5e7eb',
        fontSize: item.props.fontSize ?? 34,
      }}
    >
      <pre className="m-0 leading-relaxed whitespace-pre-wrap">
        <span style={{ color: item.props.accentColor }}>// Framedeck</span>
        {'\n'}
        {shown}
      </pre>
    </div>
  );
};

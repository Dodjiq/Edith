import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { calculateFadeInOpacity, calculateFadeOutOpacity } from '../video/calculate-fade';
import type { MotionDesignItem } from './motion-design-item-type';
import { renderMotionDesign } from './motion-design-visual-renderers';

export const MotionDesignLayer: React.FC<{ item: MotionDesignItem }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = useMemo(() => {
    const fadeIn = calculateFadeInOpacity({
      currentFrame: frame,
      fadeInDurationInSeconds: item.fadeInDurationInSeconds,
      framesPerSecond: fps,
    });
    const fadeOut = calculateFadeOutOpacity({
      currentFrame: frame,
      fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
      framesPerSecond: fps,
      totalDurationInFrames: item.durationInFrames,
    });
    return fadeIn * fadeOut * item.opacity;
  }, [fps, frame, item.durationInFrames, item.fadeInDurationInSeconds, item.fadeOutDurationInSeconds, item.opacity]);

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        position: 'absolute',
        overflow: 'hidden',
        left: item.left,
        top: item.top,
        width: item.width,
        height: item.height,
        opacity,
        transform: `rotate(${item.rotation}deg)`,
      }}
    >
      {renderMotionDesign({ item, frame, fps, durationInFrames: item.durationInFrames })}
    </div>
  );
};

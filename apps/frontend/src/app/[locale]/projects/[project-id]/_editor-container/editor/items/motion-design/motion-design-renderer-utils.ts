import { Easing, interpolate } from 'remotion';
import { getMotionDesignTemplate } from 'api-types';
import type { MotionDesignItem } from './motion-design-item-type';

export type MotionDesignRenderProps = {
  item: MotionDesignItem;
  frame: number;
  fps: number;
  durationInFrames: number;
};

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ease = Easing.out(Easing.cubic);

export const progress = (frame: number, duration: number) =>
  interpolate(frame, [0, Math.max(1, duration)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

export const getMotionText = (item: MotionDesignItem) =>
  item.props.text ?? getMotionDesignTemplate(item.templateId)?.label ?? 'Motion';

export const getMotionItems = (item: MotionDesignItem) => {
  if (Array.isArray(item.props.items) && item.props.items.length) return item.props.items;
  if (typeof item.props.items === 'string' && item.props.items.trim()) {
    return item.props.items
      .split(/[,\n|]/u)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  const text = item.props.text ?? 'Plan|Edit|Render';
  return text
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
};

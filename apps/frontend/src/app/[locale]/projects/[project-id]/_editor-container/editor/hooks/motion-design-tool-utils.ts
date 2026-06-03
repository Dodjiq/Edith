import {
  getMotionDesignTemplate,
  getMotionDesignTimingCheck,
  getUnsupportedMotionDesignPropKeys,
  sanitizeMotionDesignProps,
} from 'api-types';
import type { MotionDesignItemPatchInput, MotionDesignTemplateProps } from 'api-types';
import type { EditorStarterItem } from '../items/item-type';
import type { MotionDesignItem } from '../items/motion-design/motion-design-item-type';

export const isMotionDesignItem = (item: EditorStarterItem | undefined): item is MotionDesignItem =>
  item?.type === 'motion-design';

export const resolveMotionFrame = ({
  frame,
  seconds,
  fps,
  fallback,
  label,
  min = 0,
}: {
  frame?: number;
  seconds?: number;
  fps: number;
  fallback: number;
  label: string;
  min?: number;
}): number => {
  if (frame !== undefined && seconds !== undefined) {
    const secondsFrame = Math.round(seconds * fps);
    if (Math.round(frame) !== secondsFrame) {
      throw new Error(`${label} frame and seconds values do not match`);
    }
  }

  if (frame !== undefined) return Math.max(min, Math.round(frame));
  if (seconds !== undefined) return Math.max(min, Math.round(seconds * fps));
  return Math.max(min, fallback);
};

export const hasMotionDesignPatchValue = (patch: MotionDesignItemPatchInput): boolean =>
  Object.values(patch).some((value) => value !== undefined);

const clampOpacity = (value: number) => Math.min(1, Math.max(0, value));

const getPatchedProps = (item: MotionDesignItem, patch: MotionDesignItemPatchInput): MotionDesignTemplateProps => {
  const template = patch.templateId ? getMotionDesignTemplate(patch.templateId) : undefined;
  const templateId = patch.templateId ?? item.templateId;
  const rejectedProps = getUnsupportedMotionDesignPropKeys(templateId, patch.props);
  if (rejectedProps.length > 0) {
    throw new Error(`Unsupported prop(s) for ${templateId}: ${rejectedProps.join(', ')}`);
  }
  if (!template && !patch.props) return sanitizeMotionDesignProps(templateId, item.props);

  return sanitizeMotionDesignProps(templateId, {
    ...(template?.defaultProps ?? item.props),
    ...item.props,
    ...patch.props,
  });
};

export const applyMotionDesignPatch = ({
  item,
  patch,
  fps,
}: {
  item: MotionDesignItem;
  patch: MotionDesignItemPatchInput;
  fps: number;
}): MotionDesignItem => {
  const template = patch.templateId ? getMotionDesignTemplate(patch.templateId) : undefined;
  if (patch.templateId && !template) {
    throw new Error(`Unknown motion design template: ${patch.templateId}`);
  }

  const width = patch.width ?? item.width;
  const height = patch.height ?? item.height;
  const left = patch.xOnCanvas === undefined ? patch.left : Math.round(patch.xOnCanvas - width / 2);
  const top = patch.yOnCanvas === undefined ? patch.top : Math.round(patch.yOnCanvas - height / 2);

  return {
    ...item,
    ...(patch.templateId ? { templateId: patch.templateId } : {}),
    ...(patch.from !== undefined || patch.startTimeInSeconds !== undefined
      ? {
        from: resolveMotionFrame({
          frame: patch.from,
          seconds: patch.startTimeInSeconds,
          fps,
          fallback: item.from,
          label: 'Start',
        }),
      }
      : {}),
    ...(patch.durationInFrames !== undefined || patch.durationInSeconds !== undefined
      ? {
        durationInFrames: resolveMotionFrame({
          frame: patch.durationInFrames,
          seconds: patch.durationInSeconds,
          fps,
          fallback: item.durationInFrames,
          label: 'Duration',
          min: 1,
        }),
      }
      : {}),
    ...(left !== undefined ? { left } : {}),
    ...(top !== undefined ? { top } : {}),
    ...(patch.width !== undefined ? { width } : {}),
    ...(patch.height !== undefined ? { height } : {}),
    ...(patch.opacity !== undefined ? { opacity: clampOpacity(patch.opacity) } : {}),
    ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
    ...(patch.fadeInDurationInSeconds !== undefined ? { fadeInDurationInSeconds: patch.fadeInDurationInSeconds } : {}),
    ...(patch.fadeOutDurationInSeconds !== undefined
      ? { fadeOutDurationInSeconds: patch.fadeOutDurationInSeconds }
      : {}),
    ...(patch.effects !== undefined ? { effects: patch.effects } : {}),
    props: getPatchedProps(item, patch),
  };
};

export const summarizeMotionDesignItem = (item: MotionDesignItem, fps: number) => ({
  itemId: item.id,
  templateId: item.templateId,
  startFrame: item.from,
  endFrame: item.from + item.durationInFrames,
  startTimeInSeconds: Number((item.from / fps).toFixed(3)),
  endTimeInSeconds: Number(((item.from + item.durationInFrames) / fps).toFixed(3)),
  left: item.left,
  top: item.top,
  width: item.width,
  height: item.height,
  opacity: item.opacity,
  rotation: item.rotation,
  effects: item.effects,
  fadeInDurationInSeconds: item.fadeInDurationInSeconds,
  fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
  animationCheck: getMotionDesignTimingCheck({
    templateId: item.templateId,
    props: item.props,
    durationInFrames: item.durationInFrames,
  }),
});

export const getMotionDesignChangedFields = (patch: MotionDesignItemPatchInput): string[] =>
  Object.entries(patch).flatMap(([key, value]) => {
    if (value === undefined) return [];
    if (key !== 'props' || !value || typeof value !== 'object') return [key];
    return Object.keys(value).map((propKey) => `props.${propKey}`);
  });

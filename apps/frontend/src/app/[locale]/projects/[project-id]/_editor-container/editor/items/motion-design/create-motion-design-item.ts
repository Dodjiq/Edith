import { getMotionDesignTemplate, getUnsupportedMotionDesignPropKeys, sanitizeMotionDesignProps } from 'api-types';
import type { MotionDesignItemInput, MotionDesignTemplateId, MotionDesignTemplateProps } from 'api-types';
import { generateRandomId } from '../../utils/generate-random-id';
import type { MotionDesignItem } from './motion-design-item-type';

type CreateMotionDesignItemOptions = {
  templateId: MotionDesignTemplateId;
  from: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  request?: Omit<MotionDesignItemInput, 'templateId'>;
};

const DEFAULT_WIDTH_RATIO = 0.78;
const DEFAULT_HEIGHT_RATIO = 0.34;

const clampOpacity = (value: number | undefined) => Math.min(1, Math.max(0, value ?? 1));

const resolveFrame = ({
  frame,
  seconds,
  fps,
  fallback,
  min,
}: {
  frame?: number;
  seconds?: number;
  fps: number;
  fallback: number;
  min?: number;
}) => {
  if (frame !== undefined && seconds !== undefined && frame !== Math.round(seconds * fps)) {
    throw new Error('Conflicting frame and seconds timing fields');
  }
  const minimum = min ?? 0;
  if (frame !== undefined) return Math.max(minimum, Math.round(frame));
  if (seconds !== undefined) return Math.max(minimum, Math.round(seconds * fps));
  return Math.max(minimum, fallback);
};

const getDefaultBox = ({
  compositionWidth,
  compositionHeight,
  templateId,
  defaultBox,
}: {
  compositionWidth: number;
  compositionHeight: number;
  templateId: string;
  defaultBox?: 'center' | 'full-frame';
}) => {
  const isFullFrame =
    defaultBox === 'full-frame' ||
    templateId.includes('gradient') ||
    templateId.includes('particles') ||
    templateId.includes('matrix') ||
    templateId.includes('mosaic') ||
    templateId.includes('fracture') ||
    templateId.includes('snow') ||
    templateId.includes('fireflies');

  if (isFullFrame) {
    return { left: 0, top: 0, width: compositionWidth, height: compositionHeight };
  }

  const width = Math.round(compositionWidth * DEFAULT_WIDTH_RATIO);
  const height = Math.round(compositionHeight * DEFAULT_HEIGHT_RATIO);
  return {
    left: Math.round((compositionWidth - width) / 2),
    top: Math.round((compositionHeight - height) / 2),
    width,
    height,
  };
};

export const createMotionDesignItem = ({
  templateId,
  from,
  fps,
  compositionWidth,
  compositionHeight,
  request,
}: CreateMotionDesignItemOptions): MotionDesignItem => {
  const template = getMotionDesignTemplate(templateId);
  if (!template) {
    throw new Error(`Unknown motion design template: ${templateId}`);
  }

  const defaultBox = getDefaultBox({ compositionWidth, compositionHeight, templateId, defaultBox: template.defaultBox });
  const style = request?.style;
  const width = style?.width ?? defaultBox.width;
  const height = style?.height ?? defaultBox.height;
  const xOnCanvas = request?.xOnCanvas;
  const yOnCanvas = request?.yOnCanvas;
  const props: MotionDesignTemplateProps = {
    ...template.defaultProps,
    ...request?.props,
  };
  const rejectedProps = getUnsupportedMotionDesignPropKeys(templateId, request?.props);
  if (rejectedProps.length > 0) {
    throw new Error(`Unsupported prop(s) for ${templateId}: ${rejectedProps.join(', ')}`);
  }

  return {
    id: generateRandomId(),
    type: 'motion-design',
    templateId,
    props: sanitizeMotionDesignProps(templateId, props),
    effects: request?.effects,
    from: resolveFrame({
      frame: request?.startFrame,
      seconds: request?.startTimeInSeconds,
      fps,
      fallback: from,
    }),
    durationInFrames: resolveFrame({
      frame: request?.durationInFrames,
      seconds: request?.durationInSeconds,
      fps,
      fallback: template.defaultDurationInFrames,
      min: 1,
    }),
    left: xOnCanvas === undefined ? (style?.left ?? defaultBox.left) : Math.round(xOnCanvas - width / 2),
    top: yOnCanvas === undefined ? (style?.top ?? defaultBox.top) : Math.round(yOnCanvas - height / 2),
    width,
    height,
    opacity: clampOpacity(style?.opacity),
    rotation: style?.rotation ?? 0,
    isDraggingInTimeline: false,
    fadeInDurationInSeconds: style?.fadeInDurationInSeconds ?? 0,
    fadeOutDurationInSeconds: style?.fadeOutDurationInSeconds ?? 0,
  };
};

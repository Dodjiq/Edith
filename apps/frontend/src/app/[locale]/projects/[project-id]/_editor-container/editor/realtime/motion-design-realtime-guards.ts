import {
  editorToolNames,
  getUnsupportedMotionDesignPropKeys,
  motionDesignKnownPropKeys,
  motionDesignTemplateIds,
} from 'api-types';
import type {
  EditorAddMotionDesignItemsPayload,
  EditorRealtimePayload,
  EditorUpdateMotionDesignItemsPayload,
  MotionDesignTemplateProps,
} from 'api-types';

const templateIds = new Set<string>(motionDesignTemplateIds);
const selectionBehaviors = new Set(['select_updated', 'keep_current', 'none']);

const isNumberOrUndefined = (value: unknown) => typeof value === 'number' || value === undefined;
const isPositiveNumberOrUndefined = (value: unknown) => value === undefined || (typeof value === 'number' && value > 0);
const isNonNegativeNumberOrUndefined = (value: unknown) =>
  value === undefined || (typeof value === 'number' && value >= 0);

const knownPropKeys = new Set<string>(motionDesignKnownPropKeys);

const isMotionExtraProp = (value: unknown) =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean' ||
  Array.isArray(value) ||
  (typeof value === 'object' && value !== null);

const getKnownMotionProps = (props: Record<string, unknown>): MotionDesignTemplateProps =>
  Object.fromEntries(Object.entries(props).filter(([key]) => knownPropKeys.has(key))) as MotionDesignTemplateProps;

const isMotionProps = (props: unknown, templateId?: string) => {
  if (props === undefined) return true;
  if (!props || typeof props !== 'object') return false;
  const value = props as Record<string, unknown>;
  const rejectedProps = templateId ? getUnsupportedMotionDesignPropKeys(templateId, getKnownMotionProps(value)) : [];

  return (
    rejectedProps.length === 0 &&
    Object.entries(value).every(([key, propValue]) => knownPropKeys.has(key) || isMotionExtraProp(propValue))
  );
};

const isMotionEffects = (effects: unknown) =>
  effects === undefined ||
  (Array.isArray(effects) &&
    effects.every(
      (effect) =>
        effect &&
        typeof effect === 'object' &&
        typeof (effect as Record<string, unknown>).id === 'string' &&
        typeof (effect as Record<string, unknown>).effectId === 'string' &&
        ((effect as Record<string, unknown>).props === undefined ||
          typeof (effect as Record<string, unknown>).props === 'object'),
    ));

const isMotionStyle = (style: unknown) => {
  if (style === undefined) return true;
  if (!style || typeof style !== 'object') return false;
  const value = style as Record<string, unknown>;
  return (
    isNumberOrUndefined(value.left) &&
    isNumberOrUndefined(value.top) &&
    isPositiveNumberOrUndefined(value.width) &&
    isPositiveNumberOrUndefined(value.height) &&
    isNumberOrUndefined(value.opacity) &&
    isNumberOrUndefined(value.rotation) &&
    isNonNegativeNumberOrUndefined(value.fadeInDurationInSeconds) &&
    isNonNegativeNumberOrUndefined(value.fadeOutDurationInSeconds)
  );
};

const isMotionItem = (item: unknown) => {
  if (!item || typeof item !== 'object') return false;
  const value = item as Record<string, unknown>;
  return (
    typeof value.templateId === 'string' &&
    templateIds.has(value.templateId) &&
    isNonNegativeNumberOrUndefined(value.startFrame) &&
    isNonNegativeNumberOrUndefined(value.startTimeInSeconds) &&
    isPositiveNumberOrUndefined(value.durationInFrames) &&
    isPositiveNumberOrUndefined(value.durationInSeconds) &&
    isNumberOrUndefined(value.xOnCanvas) &&
    isNumberOrUndefined(value.yOnCanvas) &&
    isMotionProps(value.props, value.templateId as string) &&
    isMotionEffects(value.effects) &&
    isMotionStyle(value.style)
  );
};

const isMotionPatch = (patch: unknown) => {
  if (!patch || typeof patch !== 'object') return false;
  const value = patch as Record<string, unknown>;
  const patchFields = [
    'templateId',
    'props',
    'from',
    'durationInFrames',
    'startTimeInSeconds',
    'durationInSeconds',
    'left',
    'top',
    'width',
    'height',
    'xOnCanvas',
    'yOnCanvas',
    'opacity',
    'rotation',
    'fadeInDurationInSeconds',
    'fadeOutDurationInSeconds',
    'effects',
  ];

  return (
    patchFields.some((field) => value[field] !== undefined) &&
    (value.templateId === undefined || (typeof value.templateId === 'string' && templateIds.has(value.templateId))) &&
    isMotionProps(value.props, typeof value.templateId === 'string' ? value.templateId : undefined) &&
    isMotionEffects(value.effects) &&
    isMotionStyle(value) &&
    isNonNegativeNumberOrUndefined(value.from) &&
    isPositiveNumberOrUndefined(value.durationInFrames) &&
    isNonNegativeNumberOrUndefined(value.startTimeInSeconds) &&
    isPositiveNumberOrUndefined(value.durationInSeconds) &&
    isNumberOrUndefined(value.xOnCanvas) &&
    isNumberOrUndefined(value.yOnCanvas)
  );
};

export const isAddMotionDesignItemsPayload = (payload: unknown): payload is EditorAddMotionDesignItemsPayload => {
  if (!payload || typeof payload !== 'object') return false;
  const casted = payload as Partial<EditorRealtimePayload>;
  if (casted.tool_name !== editorToolNames.addMotionDesignItems) return false;
  const params = (casted as Partial<EditorAddMotionDesignItemsPayload>).params as Record<string, unknown> | undefined;
  return Boolean(params && Array.isArray(params.items) && params.items.length > 0 && params.items.every(isMotionItem));
};

export const isUpdateMotionDesignItemsPayload = (payload: unknown): payload is EditorUpdateMotionDesignItemsPayload => {
  if (!payload || typeof payload !== 'object') return false;
  const casted = payload as Partial<EditorRealtimePayload>;
  if (casted.tool_name !== editorToolNames.updateMotionDesignItems) return false;
  const params = (casted as Partial<EditorUpdateMotionDesignItemsPayload>).params as
    | Record<string, unknown>
    | undefined;
  return Boolean(
    params &&
    Array.isArray(params.itemIds) &&
    params.itemIds.length > 0 &&
    params.itemIds.every((id) => typeof id === 'string') &&
    isMotionPatch(params.patch) &&
    (params.selectionBehavior === undefined ||
      (typeof params.selectionBehavior === 'string' && selectionBehaviors.has(params.selectionBehavior))),
  );
};

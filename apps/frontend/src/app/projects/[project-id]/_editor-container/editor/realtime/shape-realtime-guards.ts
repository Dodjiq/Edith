import { editorToolNames } from 'api-types';
import type { EditorAddShapeItemsPayload, EditorRealtimePayload, EditorUpdateShapeItemsPayload } from 'api-types';

const shapeKinds = new Set(['solid', 'rectangle', 'rounded_rectangle', 'square', 'circle', 'ellipse']);
const selectionBehaviors = new Set(['select_updated', 'keep_current', 'none']);

const isNumberOrUndefined = (value: unknown) => typeof value === 'number' || value === undefined;
const isPositiveNumberOrUndefined = (value: unknown) => value === undefined || (typeof value === 'number' && value > 0);
const isNonNegativeNumberOrUndefined = (value: unknown) =>
  value === undefined || (typeof value === 'number' && value >= 0);
const isBooleanOrUndefined = (value: unknown) => typeof value === 'boolean' || value === undefined;
const isStringOrUndefined = (value: unknown) => typeof value === 'string' || value === undefined;

const isShapeStyle = (style: unknown) => {
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
    isStringOrUndefined(value.fillColor) &&
    isNonNegativeNumberOrUndefined(value.borderRadius) &&
    isBooleanOrUndefined(value.keepAspectRatio) &&
    isNonNegativeNumberOrUndefined(value.fadeInDurationInSeconds) &&
    isNonNegativeNumberOrUndefined(value.fadeOutDurationInSeconds)
  );
};

const isShapePatch = (patch: unknown) => {
  if (!patch || typeof patch !== 'object') return false;
  const value = patch as Record<string, unknown>;
  const patchFields = [
    'shapeKind',
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
    'fillColor',
    'borderRadius',
    'keepAspectRatio',
    'fadeInDurationInSeconds',
    'fadeOutDurationInSeconds',
  ];

  return (
    patchFields.some((field) => value[field] !== undefined) &&
    isShapeStyle(value) &&
    (value.shapeKind === undefined || (typeof value.shapeKind === 'string' && shapeKinds.has(value.shapeKind))) &&
    isNonNegativeNumberOrUndefined(value.from) &&
    isPositiveNumberOrUndefined(value.durationInFrames) &&
    isNonNegativeNumberOrUndefined(value.startTimeInSeconds) &&
    isPositiveNumberOrUndefined(value.durationInSeconds) &&
    isNumberOrUndefined(value.xOnCanvas) &&
    isNumberOrUndefined(value.yOnCanvas)
  );
};

const isShapeItem = (item: unknown) => {
  if (!item || typeof item !== 'object') return false;
  const value = item as Record<string, unknown>;
  return (
    typeof value.shapeKind === 'string' &&
    shapeKinds.has(value.shapeKind) &&
    isNonNegativeNumberOrUndefined(value.startFrame) &&
    isNonNegativeNumberOrUndefined(value.startTimeInSeconds) &&
    isPositiveNumberOrUndefined(value.durationInFrames) &&
    isPositiveNumberOrUndefined(value.durationInSeconds) &&
    isNumberOrUndefined(value.xOnCanvas) &&
    isNumberOrUndefined(value.yOnCanvas) &&
    isShapeStyle(value.style)
  );
};

export const isAddShapeItemsPayload = (payload: unknown): payload is EditorAddShapeItemsPayload => {
  if (!payload || typeof payload !== 'object') return false;
  const casted = payload as Partial<EditorRealtimePayload>;
  if (casted.tool_name !== editorToolNames.addShapeItems) return false;
  const params = (casted as Partial<EditorAddShapeItemsPayload>).params as Record<string, unknown> | undefined;
  return Boolean(params && Array.isArray(params.items) && params.items.length > 0 && params.items.every(isShapeItem));
};

export const isUpdateShapeItemsPayload = (payload: unknown): payload is EditorUpdateShapeItemsPayload => {
  if (!payload || typeof payload !== 'object') return false;
  const casted = payload as Partial<EditorRealtimePayload>;
  if (casted.tool_name !== editorToolNames.updateShapeItems) return false;
  const params = (casted as Partial<EditorUpdateShapeItemsPayload>).params as Record<string, unknown> | undefined;
  return Boolean(
    params &&
    Array.isArray(params.itemIds) &&
    params.itemIds.length > 0 &&
    params.itemIds.every((id) => typeof id === 'string') &&
    isShapePatch(params.patch) &&
    (params.selectionBehavior === undefined ||
      (typeof params.selectionBehavior === 'string' && selectionBehaviors.has(params.selectionBehavior))),
  );
};

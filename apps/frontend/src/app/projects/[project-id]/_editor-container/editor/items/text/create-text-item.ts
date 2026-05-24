import { generateRandomId } from '../../utils/generate-random-id';
import { loadFontFromTextItem } from '../../utils/text/load-font-from-text-item';
import { getTextDimensions } from '../../utils/text/measure-text';
import { stringSeemsRightToLeft } from '../../utils/text/right-to-left';
import type { FontStyle, TextAlign, TextDirection, TextItem } from './text-item-type';

const TEXT_DURATION_IN_FRAMES = 100;
export const DEFAULT_FONT_SIZE = 80;

type TextStyleOverrides = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  fontFamily?: string;
  fontStyle?: Partial<FontStyle>;
  lineHeight?: number;
  letterSpacing?: number;
  fontSize?: number;
  color?: string;
  direction?: TextDirection;
  strokeWidth?: number;
  strokeColor?: string;
  fadeInDurationInSeconds?: number;
  fadeOutDurationInSeconds?: number;
};

export const createTextItem = async ({
  xOnCanvas,
  yOnCanvas,
  from,
  durationInFrames,
  text,
  align,
  style,
}: {
  xOnCanvas: number;
  yOnCanvas: number;
  from: number;
  durationInFrames?: number;
  text: string;
  align: TextAlign;
  style?: TextStyleOverrides;
}): Promise<TextItem> => {
  const id = generateRandomId();
  const defaultFontFamily = style?.fontFamily ?? 'Roboto';
  const defaultFontStyle: FontStyle = {
    variant: style?.fontStyle?.variant ?? 'normal',
    weight: style?.fontStyle?.weight ?? '400',
  };

  await loadFontFromTextItem({
    fontFamily: defaultFontFamily,
    fontVariant: defaultFontStyle.variant,
    fontWeight: defaultFontStyle.weight,
    fontInfosDuringRendering: null,
  });

  const defaultLineHeight = style?.lineHeight ?? 1.2;
  const defaultLetterSpacing = style?.letterSpacing ?? 0;
  const fontSize = style?.fontSize ?? DEFAULT_FONT_SIZE;

  const textDimensions = getTextDimensions({
    text,
    fontFamily: defaultFontFamily,
    fontSize,
    lineHeight: defaultLineHeight,
    letterSpacing: defaultLetterSpacing,
    fontStyle: defaultFontStyle,
  });

  const top = style?.top ?? Math.round(yOnCanvas - textDimensions.height / 2);
  const left =
    align === 'center'
      ? Math.round(xOnCanvas - textDimensions.width / 2)
      : align === 'right'
        ? Math.round(xOnCanvas - textDimensions.width)
        : Math.round(xOnCanvas);

  return {
    id,
    durationInFrames: durationInFrames ?? TEXT_DURATION_IN_FRAMES,
    from,
    type: 'text',
    text,
    color: style?.color ?? '#ffffff',
    top,
    left: style?.left ?? left,
    width: style?.width ?? textDimensions.width,
    height: style?.height ?? textDimensions.height,
    align: align,
    opacity: style?.opacity ?? 1,
    rotation: style?.rotation ?? 0,
    fontFamily: defaultFontFamily,
    fontSize,
    lineHeight: defaultLineHeight,
    letterSpacing: defaultLetterSpacing,
    resizeOnEdit: true,
    direction: style?.direction ?? (stringSeemsRightToLeft(text) ? 'rtl' : 'ltr'),
    fontStyle: defaultFontStyle,
    isDraggingInTimeline: false,
    strokeWidth: style?.strokeWidth ?? 0,
    strokeColor: style?.strokeColor ?? '#000000',
    fadeInDurationInSeconds: style?.fadeInDurationInSeconds ?? 0,
    fadeOutDurationInSeconds: style?.fadeOutDurationInSeconds ?? 0,
  };
};

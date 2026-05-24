// CSS font-weight keyword to numeric value mapping
const FONT_WEIGHT_KEYWORDS: Record<string, string> = {
  thin: '100',
  hairline: '100',
  extralight: '200',
  'extra-light': '200',
  ultralight: '200',
  'ultra-light': '200',
  light: '300',
  normal: '400',
  regular: '400',
  medium: '500',
  semibold: '600',
  'semi-bold': '600',
  demibold: '600',
  'demi-bold': '600',
  bold: '700',
  extrabold: '800',
  'extra-bold': '800',
  ultrabold: '800',
  'ultra-bold': '800',
  black: '900',
  heavy: '900',
};

// Standard font weights in order
const STANDARD_WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

/**
 * Normalize a font weight value to numeric format.
 * Handles both numeric values and CSS keywords (bold, normal, etc.).
 */
export const normalizeFontWeight = (weight: string | undefined): string => {
  if (!weight) return '400';

  const trimmed = weight.trim().toLowerCase();

  // Check if it's a keyword
  const mapped = FONT_WEIGHT_KEYWORDS[trimmed];
  if (mapped) return mapped;

  // Check if it's already a valid numeric weight
  if (STANDARD_WEIGHTS.includes(trimmed)) return trimmed;

  // Try to parse as number and find closest standard weight
  const numeric = parseInt(trimmed, 10);
  if (!isNaN(numeric)) {
    const closest = STANDARD_WEIGHTS.reduce((prev, curr) => {
      return Math.abs(parseInt(curr, 10) - numeric) < Math.abs(parseInt(prev, 10) - numeric) ? curr : prev;
    });
    return closest;
  }

  // Default to normal weight
  return '400';
};

/**
 * Validate both font variant and weight together.
 * Normalizes CSS keywords to numeric values.
 * Note: This is a synchronous validation that normalizes values.
 * The actual font availability is validated by Remotion at load time.
 */
export const validateFontStyle = (
  _fontFamily: string,
  fontWeight: string | undefined,
  fontVariant: string | undefined,
): { weight: string; variant: string } => {
  const normalizedVariant = fontVariant?.toLowerCase() === 'italic' ? 'italic' : 'normal';
  const normalizedWeight = normalizeFontWeight(fontWeight);

  return {
    weight: normalizedWeight,
    variant: normalizedVariant,
  };
};

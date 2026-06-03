import { useCallback, useMemo, useState } from 'react';
import { GOOGLE_FONTS_LIST } from '../../data/google-fonts-list';
import { FEATURE_FONT_FAMILY_DROPDOWN_RENDER_IN_FONT } from '../../flags';
import { loadFontPreview } from './load-font-preview';

// Global font loading state
const globalLoadedFonts = new Set<string>();

// Common system fonts that don't need to be loaded
const SYSTEM_FONTS = new Set([
  'Arial',
  'Arial Black',
  'Comic Sans MS',
  'Courier New',
  'Georgia',
  'Impact',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Helvetica',
  'Helvetica Neue',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Tahoma',
  'Palatino Linotype',
  'Book Antiqua',
  'Monaco',
  'Menlo',
  'Consolas',
  'Segoe UI',
  'San Francisco',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
]);

export const useFontPreviewLoader = () => {
  const [loadedFonts, setLoadedFonts] = useState(() => new Set(globalLoadedFonts));

  const loadFontForPreview = useCallback(async (fontFamily: string): Promise<boolean> => {
    if (!FEATURE_FONT_FAMILY_DROPDOWN_RENDER_IN_FONT) {
      return true;
    }

    // Return immediately if font is already loaded
    if (globalLoadedFonts.has(fontFamily)) {
      return true;
    }

    // System fonts don't need to be loaded - they're already available
    if (SYSTEM_FONTS.has(fontFamily)) {
      globalLoadedFonts.add(fontFamily);
      setLoadedFonts((prev) => new Set([...prev, fontFamily]));
      return true;
    }

    const availableFonts = GOOGLE_FONTS_LIST;
    const fontInfo = availableFonts.find((font) => font.fontFamily === fontFamily);

    // If font is not in Google Fonts, assume it's a system/custom font
    // and mark it as loaded (it should render with whatever is available)
    if (!fontInfo) {
      globalLoadedFonts.add(fontFamily);
      setLoadedFonts((prev) => new Set([...prev, fontFamily]));
      return true;
    }

    await loadFontPreview(fontInfo.previewUrl, fontInfo.fontFamily);

    // Update global and local state
    globalLoadedFonts.add(fontFamily);
    setLoadedFonts((prev) => new Set([...prev, fontFamily]));

    return true;
  }, []);

  const memoized = useMemo(
    () => ({
      loadFontForPreview,
      loadedFonts,
    }),
    [loadFontForPreview, loadedFonts],
  );

  return memoized;
};

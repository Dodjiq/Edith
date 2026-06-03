import type { Preset } from '../chatbot-components/PresetPanel';

const PRESETS_STORAGE_KEY = 'chatbot-presets';

const isPreset = (value: unknown): value is Preset => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const preset = value as Partial<Preset>;

  return typeof preset.id === 'string' && typeof preset.title === 'string' && typeof preset.prompt === 'string';
};

export const loadPresetsFromStorage = (): Preset[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedPresets = window.localStorage.getItem(PRESETS_STORAGE_KEY);

    if (!storedPresets) {
      return [];
    }

    const parsedPresets = JSON.parse(storedPresets) as unknown;

    if (!Array.isArray(parsedPresets)) {
      return [];
    }

    return parsedPresets.filter(isPreset);
  } catch {
    return [];
  }
};

export const savePresetsToStorage = (presets: Preset[]): void => {
  if (typeof window === 'undefined') {
    throw new Error('Presets are only available in the browser.');
  }

  window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
};

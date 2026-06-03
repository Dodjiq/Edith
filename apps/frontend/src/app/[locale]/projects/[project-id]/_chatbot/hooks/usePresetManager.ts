'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { Preset } from '../chatbot-components/PresetPanel';
import { loadPresetsFromStorage, savePresetsToStorage } from '../utils/preset-storage';

type SavePresetResult = boolean;

export const usePresetManager = () => {
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    setPresets(loadPresetsFromStorage());
  }, []);

  const persistPresets = useCallback((nextPresets: Preset[]) => {
    savePresetsToStorage(nextPresets);
    setPresets(nextPresets);
  }, []);

  const addPreset = useCallback(
    (title: string, prompt: string): SavePresetResult => {
      const newPreset: Preset = {
        id: uuidv4(),
        title: title.trim(),
        prompt: prompt.trim(),
      };

      try {
        persistPresets([...presets, newPreset]);
        toast.success('Preset saved', {
          description: `"${newPreset.title}" is now available in all of your projects on this browser.`,
        });
        return true;
      } catch (error) {
        toast.error('Failed to save preset', {
          description: error instanceof Error ? error.message : 'Please try again.',
        });
        return false;
      }
    },
    [persistPresets, presets],
  );

  const updatePreset = useCallback(
    (presetId: string, title: string, prompt: string): SavePresetResult => {
      const presetToUpdate = presets.find((preset) => preset.id === presetId);

      if (!presetToUpdate) {
        toast.error('Failed to update preset', {
          description: 'This preset could not be found.',
        });
        return false;
      }

      const nextPresets = presets.map((preset) =>
        preset.id === presetId
          ? {
              ...preset,
              title: title.trim(),
              prompt: prompt.trim(),
            }
          : preset,
      );

      try {
        persistPresets(nextPresets);
        toast.success('Preset updated', {
          description: `"${title.trim()}" was updated successfully.`,
        });
        return true;
      } catch (error) {
        toast.error('Failed to update preset', {
          description: error instanceof Error ? error.message : 'Please try again.',
        });
        return false;
      }
    },
    [persistPresets, presets],
  );

  const deletePreset = useCallback(
    (presetId: string) => {
      const presetToDelete = presets.find((preset) => preset.id === presetId);

      if (!presetToDelete) {
        toast.error('Failed to delete preset', {
          description: 'This preset could not be found.',
        });
        return;
      }

      const nextPresets = presets.filter((preset) => preset.id !== presetId);

      try {
        persistPresets(nextPresets);
        toast.success('Preset deleted', {
          description: `"${presetToDelete.title}" was removed from your saved presets.`,
        });
      } catch (error) {
        toast.error('Failed to delete preset', {
          description: error instanceof Error ? error.message : 'Please try again.',
        });
      }
    },
    [persistPresets, presets],
  );

  return {
    presets,
    addPreset,
    updatePreset,
    deletePreset,
  };
};

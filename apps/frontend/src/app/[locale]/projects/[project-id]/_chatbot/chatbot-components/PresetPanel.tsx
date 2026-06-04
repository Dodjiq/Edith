'use client';

import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { IconButton } from '@/components/buttons/IconButton';
import { Button } from '@/components/buttons/button';
import { Input } from '@/components/inputs/input';
import { Tooltip, TooltipPanel, TooltipTrigger } from '@/components/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/inputs/textarea';

export type Preset = {
  id: string;
  title: string;
  prompt: string;
};

type PresetPanelProps = {
  presets: Preset[];
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  onAddPreset: (title: string, prompt: string) => boolean;
  onUpdatePreset: (presetId: string, title: string, prompt: string) => boolean;
  onDeletePreset: (presetId: string) => void;
};

export const PresetPanel: React.FC<PresetPanelProps> = ({
  presets,
  isDialogOpen,
  onDialogOpenChange,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
}) => {
  const t = useTranslations('projects_editor.chatbot');
  const [newPresetTitle, setNewPresetTitle] = useState<string>('');
  const [newPresetPrompt, setNewPresetPrompt] = useState<string>('');
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  useEffect(() => {
    if (!isDialogOpen) {
      setEditingPreset(null);
      setNewPresetTitle('');
      setNewPresetPrompt('');
    }
  }, [isDialogOpen]);

  const openCreateDialog = () => {
    setEditingPreset(null);
    setNewPresetTitle('');
    setNewPresetPrompt('');
    onDialogOpenChange(true);
  };

  const openEditDialog = (preset: Preset) => {
    setEditingPreset(preset);
    setNewPresetTitle(preset.title);
    setNewPresetPrompt(preset.prompt);
    onDialogOpenChange(true);
  };

  const handleSavePreset = () => {
    if (!newPresetTitle.trim() || !newPresetPrompt.trim()) {
      return;
    }

    const isPresetSaved = editingPreset
      ? onUpdatePreset(editingPreset.id, newPresetTitle, newPresetPrompt)
      : onAddPreset(newPresetTitle, newPresetPrompt);

    if (!isPresetSaved) {
      return;
    }

    onDialogOpenChange(false);
  };

  const isEditingPreset = Boolean(editingPreset);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-1">
        {presets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t('preset_empty_title')}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('preset_empty_description')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="group flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{preset.title}</h3>
                    <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{preset.prompt}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <IconButton
                        type="button"
                        size="xs"
                        variant="ghost"
                        className="text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 hover:text-zinc-100"
                        aria-label={t('preset_edit_aria', { title: preset.title })}
                        onClick={() => openEditDialog(preset)}
                      >
                        <PencilIcon className="size-4" />
                      </IconButton>
                    </TooltipTrigger>
                    <TooltipPanel>{t('preset_edit')}</TooltipPanel>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <IconButton
                        type="button"
                        size="xs"
                        variant="ghost"
                        className="text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 hover:text-red-500"
                        aria-label={t('preset_delete_aria', { title: preset.title })}
                        onClick={() => onDeletePreset(preset.id)}
                      >
                        <Trash2Icon className="size-4" />
                      </IconButton>
                    </TooltipTrigger>
                    <TooltipPanel>{t('preset_delete')}</TooltipPanel>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <Button className="w-full gap-2" onClick={openCreateDialog}>
          <PlusIcon className="size-4" />
          {t('preset_add')}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingPreset ? t('preset_dialog_update_title') : t('preset_dialog_create_title')}
            </DialogTitle>
            <DialogDescription>
              {isEditingPreset ? t('preset_dialog_update_description') : t('preset_dialog_create_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t('preset_field_title')}
              </label>
              <Input
                id="title"
                placeholder={t('preset_field_title_placeholder')}
                value={newPresetTitle}
                onChange={(e) => setNewPresetTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="prompt" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t('preset_field_prompt')}
              </label>
              <Textarea
                id="prompt"
                placeholder={t('preset_field_prompt_placeholder')}
                className="min-h-[100px] resize-none"
                value={newPresetPrompt}
                onChange={(e) => setNewPresetPrompt(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onDialogOpenChange(false)}>
              {t('preset_dialog_cancel')}
            </Button>
            <Button onClick={handleSavePreset} disabled={!newPresetTitle.trim() || !newPresetPrompt.trim()}>
              {isEditingPreset ? t('preset_rename') : t('preset_save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

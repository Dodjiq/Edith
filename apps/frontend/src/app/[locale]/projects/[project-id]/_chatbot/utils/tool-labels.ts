'use client';

import { editorToolNames } from 'api-types';
import type { ToolState } from '../types/chatbot';

type ToolLabelDefinition = {
  title: string;
  activity: string;
};

const ACTIVE_TOOL_STATES = new Set<ToolState>([
  'input-streaming',
  'input-available',
  'approval-requested',
  'approval-responded',
]);

const TOOL_LABELS: Record<string, ToolLabelDefinition> = {
  [editorToolNames.delegateTextOverlayTask]: {
    title: 'Text specialist',
    activity: 'Editing text overlays',
  },
  [editorToolNames.delegateImagePictureTask]: {
    title: 'Image specialist',
    activity: 'Editing images',
  },
  [editorToolNames.selectTimelineItems]: {
    title: 'Select timeline items',
    activity: 'Selecting timeline items',
  },
  [editorToolNames.placeLibraryAssetsOnTimeline]: {
    title: 'Place library assets on timeline',
    activity: 'Placing library assets',
  },
  [editorToolNames.placeTimelineItems]: {
    title: 'Place timeline items',
    activity: 'Placing timeline items',
  },
  [editorToolNames.removeSilences]: {
    title: 'Remove silences',
    activity: 'Removing silences',
  },
  [editorToolNames.setCaptions]: {
    title: 'Set captions',
    activity: 'Setting captions',
  },
  [editorToolNames.addTextItems]: {
    title: 'Add text items',
    activity: 'Adding text overlays',
  },
  [editorToolNames.updateTextItems]: {
    title: 'Update text items',
    activity: 'Updating text overlays',
  },
  [editorToolNames.addImageItems]: {
    title: 'Add image items',
    activity: 'Adding images',
  },
  [editorToolNames.updateImageItems]: {
    title: 'Update image items',
    activity: 'Updating images',
  },
  [editorToolNames.delegateShapeOverlayTask]: {
    title: 'Shape specialist',
    activity: 'Editing shape overlays',
  },
  [editorToolNames.delegateMotionDesignTask]: {
    title: 'Motion design specialist',
    activity: 'Editing motion design',
  },
  [editorToolNames.addShapeItems]: {
    title: 'Add shape items',
    activity: 'Adding shape overlays',
  },
  [editorToolNames.updateShapeItems]: {
    title: 'Update shape items',
    activity: 'Updating shape overlays',
  },
  [editorToolNames.getMotionDesignTemplates]: {
    title: 'Get motion design templates',
    activity: 'Reviewing motion design options',
  },
  [editorToolNames.getMotionDesignPresetDetails]: {
    title: 'Get motion design preset details',
    activity: 'Reading motion design details',
  },
  [editorToolNames.addMotionDesignItems]: {
    title: 'Add motion design items',
    activity: 'Adding motion design',
  },
  [editorToolNames.updateMotionDesignItems]: {
    title: 'Update motion design items',
    activity: 'Updating motion design',
  },
  [editorToolNames.getProjectState]: {
    title: 'Get project state',
    activity: 'Inspecting project state',
  },
  [editorToolNames.getItemsData]: {
    title: 'Get items data',
    activity: 'Collecting item data',
  },
  [editorToolNames.getLibraryAssetsData]: {
    title: 'Get library assets data',
    activity: 'Collecting library assets',
  },
  [editorToolNames.deleteItems]: {
    title: 'Delete items',
    activity: 'Deleting timeline items',
  },
  [editorToolNames.trimTimelineItems]: {
    title: 'Trim timeline items',
    activity: 'Trimming timeline items',
  },
  [editorToolNames.cutFrameRange]: {
    title: 'Cut frame range',
    activity: 'Cutting frame range',
  },
  [editorToolNames.getTranscription]: {
    title: 'Get transcription',
    activity: 'Reading transcription',
  },
  [editorToolNames.getDetailedTranscription]: {
    title: 'Get detailed transcription',
    activity: 'Reading detailed transcription',
  },
  [editorToolNames.createPlan]: {
    title: 'Create plan',
    activity: 'Creating plan',
  },
  [editorToolNames.updatePlan]: {
    title: 'Update plan',
    activity: 'Updating plan',
  },
  cut_time_ranges: {
    title: 'Cut time ranges',
    activity: 'Cutting time ranges',
  },
  investigate_transcription: {
    title: 'Investigate transcription',
    activity: 'Investigating transcription',
  },
};

const humanizeToolName = (toolName: string) => {
  const normalizedToolName = toolName.trim().replace(/[_-]+/g, ' ');

  if (!normalizedToolName) {
    return 'Tool';
  }

  return normalizedToolName.charAt(0).toUpperCase() + normalizedToolName.slice(1);
};

export const getToolTitle = (toolName: string, title?: string) => {
  const normalizedTitle = title?.trim();

  if (normalizedTitle) {
    return normalizedTitle;
  }

  return TOOL_LABELS[toolName]?.title ?? humanizeToolName(toolName);
};

export const getToolActivityLabel = (toolName: string, title?: string) => {
  const normalizedTitle = title?.trim();

  return TOOL_LABELS[toolName]?.activity ?? normalizedTitle ?? humanizeToolName(toolName);
};

export const isActiveToolState = (state: ToolState) => ACTIVE_TOOL_STATES.has(state);

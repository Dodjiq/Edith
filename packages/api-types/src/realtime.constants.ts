import type { MotionDesignEffectInput, MotionDesignTemplateId, MotionDesignTemplateProps } from './motion-design';

export const realtimeMessageTypes = {
  chat: 'chatbot:message',
  editor: 'editor:update',
  system: 'system:notification',
  uploadProgress: 'upload:progress',
  transcriptionComplete: 'upload:transcriptionComplete',
  videoAnalysisComplete: 'upload:videoAnalysisComplete',
  edithRenderProgress: 'edith:renderProgress',
  edithVariantComplete: 'edith:variantComplete',
  edithJobComplete: 'edith:jobComplete',
  edithJobFailed: 'edith:jobFailed',
} as const satisfies Record<string, string>;

export type KnownRealtimeMessageType = (typeof realtimeMessageTypes)[keyof typeof realtimeMessageTypes];

export type RealtimeMessageType = KnownRealtimeMessageType | string;

export interface RealtimeMessage<TPayload = unknown> {
  type: RealtimeMessageType;
  payload?: TPayload;
  timestamp: string;
}

export const editorToolNames = {
  delegateTextOverlayTask: 'delegate_text_overlay_task',
  delegateImagePictureTask: 'delegate_image_picture_task',
  delegateShapeOverlayTask: 'delegate_shape_overlay_task',
  delegateMotionDesignTask: 'delegate_motion_design_task',
  selectTimelineItems: 'select_timeline_items',
  placeLibraryAssetsOnTimeline: 'place_library_assets_on_timeline',
  placeTimelineItems: 'place_timeline_items',
  removeSilences: 'remove_silences',
  setCaptions: 'set_captions',
  addTextItems: 'add_text_items',
  updateTextItems: 'update_text_items',
  addImageItems: 'add_image_items',
  updateImageItems: 'update_image_items',
  addShapeItems: 'add_shape_items',
  updateShapeItems: 'update_shape_items',
  getMotionDesignTemplates: 'get_motion_design_templates',
  getMotionDesignPresetDetails: 'get_motion_design_preset_details',
  addMotionDesignItems: 'add_motion_design_items',
  updateMotionDesignItems: 'update_motion_design_items',
  getProjectState: 'get_project_state',
  getItemsData: 'get_items_data',
  getLibraryAssetsData: 'get_library_assets_data',
  deleteItems: 'delete_items',
  trimTimelineItems: 'trim_timeline_items',
  cutFrameRange: 'cut_frame_range',
  getTranscription: 'get_transcription',
  getDetailedTranscription: 'get_detailed_transcription',
  createPlan: 'create_plan',
  updatePlan: 'update_plan',
} as const satisfies Record<string, string>;

export type EditorToolName = (typeof editorToolNames)[keyof typeof editorToolNames];

export type ImageObjectFit = 'contain' | 'cover' | 'fill';

export type ImageItemStyleInput = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  borderRadius?: number;
  keepAspectRatio?: boolean;
  fadeInDurationInSeconds?: number;
  fadeOutDurationInSeconds?: number;
  objectFit?: ImageObjectFit;
};

export type ImageItemInput = {
  assetId: string;
  startFrame?: number;
  startTimeInSeconds?: number;
  durationInFrames?: number;
  durationInSeconds?: number;
  xOnCanvas?: number;
  yOnCanvas?: number;
  style?: ImageItemStyleInput;
};

export type ImageItemPatchInput = ImageItemStyleInput & {
  assetId?: string;
  from?: number;
  durationInFrames?: number;
  startTimeInSeconds?: number;
  durationInSeconds?: number;
  xOnCanvas?: number;
  yOnCanvas?: number;
};

export type ShapeKind = 'solid' | 'rectangle' | 'rounded_rectangle' | 'square' | 'circle' | 'ellipse';

export type ShapeItemStyleInput = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  fillColor?: string;
  borderRadius?: number;
  keepAspectRatio?: boolean;
  fadeInDurationInSeconds?: number;
  fadeOutDurationInSeconds?: number;
};

export type ShapeItemInput = {
  shapeKind: ShapeKind;
  startFrame?: number;
  startTimeInSeconds?: number;
  durationInFrames?: number;
  durationInSeconds?: number;
  xOnCanvas?: number;
  yOnCanvas?: number;
  style?: ShapeItemStyleInput;
};

export type ShapeItemPatchInput = ShapeItemStyleInput & {
  shapeKind?: ShapeKind;
  from?: number;
  durationInFrames?: number;
  startTimeInSeconds?: number;
  durationInSeconds?: number;
  xOnCanvas?: number;
  yOnCanvas?: number;
};

export type ShapeSelectionBehavior = 'select_updated' | 'keep_current' | 'none';

export type MotionDesignItemStyleInput = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  fadeInDurationInSeconds?: number;
  fadeOutDurationInSeconds?: number;
};

export type MotionDesignItemInput = {
  templateId: MotionDesignTemplateId;
  startFrame?: number;
  startTimeInSeconds?: number;
  durationInFrames?: number;
  durationInSeconds?: number;
  xOnCanvas?: number;
  yOnCanvas?: number;
  props?: MotionDesignTemplateProps;
  effects?: MotionDesignEffectInput[];
  style?: MotionDesignItemStyleInput;
};

export type MotionDesignItemPatchInput = MotionDesignItemStyleInput & {
  templateId?: MotionDesignTemplateId;
  from?: number;
  durationInFrames?: number;
  startTimeInSeconds?: number;
  durationInSeconds?: number;
  xOnCanvas?: number;
  yOnCanvas?: number;
  props?: MotionDesignTemplateProps;
  effects?: MotionDesignEffectInput[];
};

export type MotionDesignSelectionBehavior = 'select_updated' | 'keep_current' | 'none';

export type SilenceDetectionSummary = {
  silentParts: { startInSeconds: number; endInSeconds: number }[];
  audibleParts: { startInSeconds: number; endInSeconds: number }[];
  durationInSeconds: number;
};

export type RemoveSilencesDetections = Record<string, SilenceDetectionSummary>;
export const removeSilencesDetectionModes = ['auto', 'transcription', 'audio'] as const;
export type RemoveSilencesDetectionMode = (typeof removeSilencesDetectionModes)[number];

export type EditorSelectTimelineItemsPayload = {
  tool_name: typeof editorToolNames.selectTimelineItems;
  params: {
    itemIds: string[];
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorPlaceLibraryAssetsOnTimelinePayload = {
  tool_name: typeof editorToolNames.placeLibraryAssetsOnTimeline;
  params: {
    /** Asset IDs from libraryAssets */
    libraryAssetIds: string[];
    /** Optional target track ID. If omitted, editor chooses a track. */
    trackId?: string;
    /** Optional absolute start frame (0-based). */
    startFrame?: number;
    /** Optional absolute start time in seconds. */
    startTimeInSeconds?: number;
    /** Optional item ID to place after (start becomes item end). */
    afterItemId?: string;
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorPlaceTimelineItemsPayload = {
  tool_name: typeof editorToolNames.placeTimelineItems;
  params: {
    /** Existing timeline item IDs */
    itemIds: string[];
    /** Optional target track ID. If omitted, uses the track of the first item. */
    trackId?: string;
    /** Optional absolute start frame (0-based). */
    startFrame?: number;
    /** Optional absolute start time in seconds. */
    startTimeInSeconds?: number;
    /** Optional item ID to place after (start becomes item end). */
    afterItemId?: string;
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorRemoveSilencesPayload = {
  tool_name: typeof editorToolNames.removeSilences;
  params: {
    targetItemId?: string;
    itemIds?: string[];
    noiseThresholdInDecibels?: number;
    minDurationInSeconds?: number;
    paddingInSeconds?: number;
    detectionMode?: RemoveSilencesDetectionMode;
    detectionsByItemId?: RemoveSilencesDetections;
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type CaptionStyleInput = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  fontFamily?: string;
  fontStyle?: {
    variant?: string;
    weight?: string;
  };
  lineHeight?: number;
  letterSpacing?: number;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  color?: string;
  highlightColor?: string | null;
  direction?: 'ltr' | 'rtl';
  pageDurationInMilliseconds?: number;
  captionStartInSeconds?: number;
  strokeWidth?: number;
  strokeColor?: string;
  maxLines?: number;
  fadeInDurationInSeconds?: number;
  fadeOutDurationInSeconds?: number;
};

export type CaptionEdit = {
  index: number;
  text?: string;
  startMs?: number;
  endMs?: number;
};

export type TextItemStyleInput = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  fontFamily?: string;
  fontStyle?: {
    variant?: string;
    weight?: string;
  };
  lineHeight?: number;
  letterSpacing?: number;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  color?: string;
  direction?: 'ltr' | 'rtl';
  strokeWidth?: number;
  strokeColor?: string;
  fadeInDurationInSeconds?: number;
  fadeOutDurationInSeconds?: number;
};

export type TextItemInput = {
  text: string;
  startFrame?: number;
  startTimeInSeconds?: number;
  durationInFrames?: number;
  durationInSeconds?: number;
  xOnCanvas?: number;
  yOnCanvas?: number;
  style?: TextItemStyleInput;
};

export type TextItemPatchInput = TextItemStyleInput & {
  text?: string;
  from?: number;
  durationInFrames?: number;
  startTimeInSeconds?: number;
  durationInSeconds?: number;
  xOnCanvas?: number;
  yOnCanvas?: number;
};

export type TextSelectionBehavior = 'select_updated' | 'keep_current' | 'none';

export type EditorSetCaptionsPayload = {
  tool_name: typeof editorToolNames.setCaptions;
  params: {
    /** @deprecated Use targetItemIds instead */
    targetItemId?: string;
    /** Array of item IDs to generate captions from (sorted by timeline position) */
    targetItemIds?: string[];
    replaceExisting?: boolean;
    style?: CaptionStyleInput;
    captionEdits?: CaptionEdit[];
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorAddTextItemsPayload = {
  tool_name: typeof editorToolNames.addTextItems;
  params: {
    items: TextItemInput[];
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorUpdateTextItemsPayload = {
  tool_name: typeof editorToolNames.updateTextItems;
  params: {
    itemIds: string[];
    patch: TextItemPatchInput;
    selectionBehavior?: TextSelectionBehavior;
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorAddImageItemsPayload = {
  tool_name: typeof editorToolNames.addImageItems;
  params: {
    items: ImageItemInput[];
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorUpdateImageItemsPayload = {
  tool_name: typeof editorToolNames.updateImageItems;
  params: {
    itemIds: string[];
    patch: ImageItemPatchInput;
    selectionBehavior?: 'select_updated' | 'keep_current' | 'none';
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorAddShapeItemsPayload = {
  tool_name: typeof editorToolNames.addShapeItems;
  params: {
    items: ShapeItemInput[];
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorUpdateShapeItemsPayload = {
  tool_name: typeof editorToolNames.updateShapeItems;
  params: {
    itemIds: string[];
    patch: ShapeItemPatchInput;
    selectionBehavior?: ShapeSelectionBehavior;
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorGetMotionDesignTemplatesPayload = {
  tool_name: typeof editorToolNames.getMotionDesignTemplates;
  params: Record<string, never>;
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorAddMotionDesignItemsPayload = {
  tool_name: typeof editorToolNames.addMotionDesignItems;
  params: {
    items: MotionDesignItemInput[];
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorUpdateMotionDesignItemsPayload = {
  tool_name: typeof editorToolNames.updateMotionDesignItems;
  params: {
    itemIds: string[];
    patch: MotionDesignItemPatchInput;
    selectionBehavior?: MotionDesignSelectionBehavior;
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorGetProjectStatePayload = {
  tool_name: typeof editorToolNames.getProjectState;
  params: Record<string, never>;
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorGetItemsDataPayload = {
  tool_name: typeof editorToolNames.getItemsData;
  params: {
    itemIds: string[];
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorGetLibraryAssetsDataPayload = {
  tool_name: typeof editorToolNames.getLibraryAssetsData;
  params: Record<string, never>;
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorDeleteItemsPayload = {
  tool_name: typeof editorToolNames.deleteItems;
  params: {
    itemIds: string[];
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type TimelineTrimMode = 'first_half' | 'duration';

export type EditorTrimTimelineItemsPayload = {
  tool_name: typeof editorToolNames.trimTimelineItems;
  params: {
    itemIds: string[];
    mode?: TimelineTrimMode;
    durationInFrames?: number;
    durationInSeconds?: number;
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

/** A single frame range for cut operations */
export type FrameRange = {
  startFrame: number;
  endFrame: number;
};

export type EditorCutFrameRangePayload = {
  tool_name: typeof editorToolNames.cutFrameRange;
  params: {
    trackId: string;
    ranges: FrameRange[];
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorGetTranscriptionPayload = {
  tool_name: typeof editorToolNames.getTranscription;
  params: {
    /** Optional array of item IDs to transcribe. If omitted, transcribes all audio items on timeline. */
    itemIds?: string[];
    /** Optional start frame to filter transcription (inclusive). Use with endFrame for partial transcription. */
    startFrame?: number;
    /** Optional end frame to filter transcription (exclusive). Use with startFrame for partial transcription. */
    endFrame?: number;
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorGetDetailedTranscriptionPayload = {
  tool_name: typeof editorToolNames.getDetailedTranscription;
  params: {
    /** Required array of minute numbers to get detailed transcription for (0-indexed). Maximum 10 minutes per request. */
    minutes: number[];
    /** Optional array of item IDs to transcribe. If omitted, transcribes all audio items on timeline. */
    itemIds?: string[];
  };
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type PlanStep = {
  id: string;
  title: string;
};

export type CreatePlanParams = {
  title: string;
  steps: PlanStep[];
};

export type UpdatePlanParams = {
  stepId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description?: string;
};

export type EditorCreatePlanPayload = {
  tool_name: typeof editorToolNames.createPlan;
  params: CreatePlanParams;
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

export type EditorUpdatePlanPayload = {
  tool_name: typeof editorToolNames.updatePlan;
  params: UpdatePlanParams;
  toolCallId?: string;
  messageId?: string;
  requestedAt: string;
};

/** Word-level transcription result with timing and track attribution */
export type TranscriptionWord = {
  text: string;
  startFrame: number;
  endFrame: number;
  trackId: string;
  confidence?: number | null;
};

export type EditorRealtimePayload =
  | EditorSelectTimelineItemsPayload
  | EditorPlaceLibraryAssetsOnTimelinePayload
  | EditorPlaceTimelineItemsPayload
  | EditorRemoveSilencesPayload
  | EditorSetCaptionsPayload
  | EditorAddTextItemsPayload
  | EditorUpdateTextItemsPayload
  | EditorAddImageItemsPayload
  | EditorUpdateImageItemsPayload
  | EditorAddShapeItemsPayload
  | EditorUpdateShapeItemsPayload
  | EditorGetMotionDesignTemplatesPayload
  | EditorAddMotionDesignItemsPayload
  | EditorUpdateMotionDesignItemsPayload
  | EditorGetProjectStatePayload
  | EditorGetItemsDataPayload
  | EditorGetLibraryAssetsDataPayload
  | EditorDeleteItemsPayload
  | EditorTrimTimelineItemsPayload
  | EditorCutFrameRangePayload
  | EditorGetTranscriptionPayload
  | EditorGetDetailedTranscriptionPayload
  | EditorCreatePlanPayload
  | EditorUpdatePlanPayload;

/** Payload for upload progress WebSocket messages */
export type UploadProgressPayload = {
  assetId: string;
  progress: number;
  phase: 'receiving' | 'uploading' | 'transcribing' | 'complete' | 'error';
  error?: string;
};

/** Payload for transcription complete WebSocket messages */
export type TranscriptionMetadata = {
  provider: 'elevenlabs';
  modelId: 'scribe_v2';
  generatedAt: string;
  wordCount: number;
  fullText?: string;
  languageCode?: string;
  languageProbability?: number;
  audioDurationSeconds?: number;
  transcriptionId?: string;
  averageConfidence?: number | null;
  speakerIds?: string[];
  audioEventCount?: number;
  generalization?: string;
};

export type TranscriptionCompletePayload = {
  assetId: string;
  transcription: {
    text: string;
    startMs: number;
    endMs: number;
    timestampMs: number | null;
    confidence: number | null;
  }[];
  metadata?: TranscriptionMetadata;
  /**
   * True when the asset was successfully processed but contains no speech to transcribe.
   * Different from error - the asset simply has no spoken content (e.g., music-only video).
   */
  hasNoTranscription?: boolean;
};

export type VideoAnalysisSummary = {
  macroView: string;
  causalLogic: string;
  sequentialSummary: string;
  socket: string;
  plug: string;
};

export type TwelveLabsVideoReference = {
  indexId: string;
  videoId: string;
};

export type VideoAnalysisCompletePayload = {
  assetId: string;
  twelveLabs?: TwelveLabsVideoReference;
  summary?: VideoAnalysisSummary;
  error?: string;
};

export type EdithRenderProgressPayload = {
  jobId: string;
  variantId: string;
  variantIndex: number;
  progress: number;
};

export type EdithVariantCompletePayload = {
  jobId: string;
  variantId: string;
  exportPath: string;
};

export type EdithJobCompletePayload = {
  jobId: string;
  projectId: string;
  completedVariants: number;
};

export type EdithJobFailedPayload = {
  jobId: string;
  projectId: string;
  error: string;
};

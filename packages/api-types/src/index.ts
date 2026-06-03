import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { editorToolNames } from './realtime.constants';
import { motionDesignTemplateIds } from './motion-design';
export * from './realtime.constants';
export * from './chat.constants';
export * from './motion-design';
export * from './motion-design-timing';

const c = initContract();

const messageResponseSchema = z.object({
  messageId: z.string(),
  status: z.literal('accepted'),
});

const stopMessageRequestSchema = z.object({
  messageId: z.string().trim().min(1, 'Message ID is required'),
});

const stopMessageResponseSchema = z.object({
  messageId: z.string(),
  status: z.enum(['stopped', 'not-found']),
});

const silenceDetectionRequestSchema = z.object({
  assetUrl: z.string().url(),
  noiseThresholdInDecibels: z.number().optional(),
  minDurationInSeconds: z.number().optional(),
});

const timeRangeSchema = z.object({
  startInSeconds: z.number(),
  endInSeconds: z.number(),
});

const silenceDetectionResponseSchema = z.object({
  silentParts: z.array(timeRangeSchema),
  audibleParts: z.array(timeRangeSchema),
  durationInSeconds: z.number(),
});

const toolResultReportSchema = z.object({
  toolCallId: z.string().trim().min(1, 'Tool call ID is required'),
  toolName: z.enum([...Object.values(editorToolNames)] as [string, ...string[]]),
  status: z.enum(['success', 'skipped', 'error']),
  output: z.record(z.any()).optional(),
  error: z.string().optional(),
});

const toolResultReportResponseSchema = z.object({
  status: z.literal('received'),
});

// Captions schemas - matches Remotion's Caption type from @remotion/captions
const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
});

const generateCaptionsRequestSchema = z.object({
  fileKey: z.string().trim().min(1, 'File key is required'),
});

// Response returns a key to fetch captions via backend proxy (avoids CORS issues)
const generateCaptionsResponseSchema = z.object({
  captionsKey: z.string(),
  captionsCount: z.number(),
});

const getCaptionsRequestSchema = z.object({
  captionsKey: z.string().trim().min(1, 'Captions key is required'),
});

const getCaptionsResponseSchema = z.object({
  captions: z.array(captionSchema),
});

// Upload schemas
const uploadRequestSchema = z.object({
  contentType: z.string(),
  size: z.number(),
  assetId: z.string().optional(),
});

const uploadResponseSchema = z.object({
  fileKey: z.string(),
  readUrl: z.string(),
  transcription: z.array(captionSchema).optional(),
});

const uploadProgressPhaseSchema = z.enum(['receiving', 'uploading', 'transcribing', 'complete', 'error']);

// Multipart upload schemas
const initMultipartRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.number().positive(),
});

const initMultipartResponseSchema = z.object({
  uploadId: z.string(),
  key: z.string(),
  partSize: z.number(),
  maxConcurrency: z.number(),
});

const signPartsRequestSchema = z.object({
  partNumbers: z.array(z.number().positive()),
});

const signPartsResponseSchema = z.object({
  presignedUrls: z.array(
    z.object({
      partNumber: z.number(),
      url: z.string(),
    }),
  ),
});

const completedPartSchema = z.object({
  partNumber: z.number(),
  etag: z.string(),
});

const completeUploadRequestSchema = z.object({
  parts: z.array(completedPartSchema),
  assetId: z.string(),
  needsTranscription: z.boolean(),
  needsVideoAnalysis: z.boolean(),
  projectId: z.string().optional(),
});

const completeUploadResponseSchema = z.object({
  fileKey: z.string(),
  readUrl: z.string(),
});

const twelveLabsVideoReferenceSchema = z.object({
  indexId: z.string().trim().min(1, 'Index ID is required'),
  videoId: z.string().trim().min(1, 'Video ID is required'),
});

const deleteAssetRequestSchema = z.object({
  fileKey: z.string().trim().min(1, 'File key is required').nullable().optional(),
  twelveLabs: twelveLabsVideoReferenceSchema.optional(),
});

const deleteAssetResponseSchema = z.object({
  success: z.literal(true),
  warnings: z.array(z.string()),
});

const uploadProgressPayloadSchema = z.object({
  assetId: z.string(),
  progress: z.number(),
  phase: uploadProgressPhaseSchema,
  error: z.string().optional(),
});

const renderAssetSchema = z
  .object({
    remoteFileKey: z.string().nullable().optional(),
    remoteUrl: z.string().nullable().optional(),
  })
  .passthrough();

const renderVideoRequestSchema = z.object({
  compositionHeight: z.number().finite(),
  compositionWidth: z.number().finite(),
  tracks: z.array(z.unknown()),
  items: z.record(z.unknown()),
  assets: z.record(renderAssetSchema),
  codec: z.enum(['h264', 'vp8']),
  fontInfos: z.record(z.unknown()),
});

const renderVideoSuccessResponseSchema = z.object({
  type: z.literal('success'),
  bucketName: z.string(),
  renderId: z.string(),
});

const renderVideoErrorResponseSchema = z.object({
  type: z.literal('error'),
  error: z.string(),
});

const renderVideoResponseSchema = z.union([renderVideoSuccessResponseSchema, renderVideoErrorResponseSchema]);

// Edith project-render shared fields. The full request schema is built in the
// frontend route by extending editPlanInputSchema; this exports the common
// quota-aware fields so the route handler and any caller stay aligned.
const startRenderRequestSchema = z.object({
  projectName: z.string().trim().min(1).max(120).default('Campagne produit Edith'),
  assetId: z.string().optional(),
  storagePath: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().optional(),
  // Caller-provided asset duration so the server can enforce plan.maxDurationSeconds
  // without an extra round trip. When omitted, the server falls back to
  // project_assets.duration_seconds (see route handler).
  durationSeconds: z.number().int().positive().optional(),
  voiceoverRequested: z.boolean().optional().default(false),
  advancedModeRequested: z.boolean().optional().default(false),
});

const startRenderQuotaErrorSchema = z.object({
  error: z.enum([
    'export_quota_exceeded',
    'duration_exceeds_plan_limit',
    'too_many_variants',
    'voiceover_not_in_plan',
    'advanced_mode_requires_upgrade',
    'plan_resolution_failed',
  ]),
  plan: z.string().optional(),
  monthlyExports: z.number().int().optional(),
  maxDurationSeconds: z.number().int().optional(),
  maxVariantsPerProject: z.number().int().optional(),
});

const removedSegmentFromSourceSchema = z.object({
  sourceStartInSeconds: z.number(),
  sourceEndInSeconds: z.number(),
  durationInSeconds: z.number(),
});

const originalAssetInfoSchema = z.object({
  assetId: z.string(),
  remoteUrl: z.string(),
  fileName: z.string(),
  originalDurationInSeconds: z.number(),
  removedSegments: z.array(removedSegmentFromSourceSchema),
  lastModifiedAt: z.number(),
});

/** Status of an asset in the project - tells AI agent what state each asset is in */
const assetStatusInfoSchema = z.object({
  assetId: z.string(),
  fileName: z.string(),
  fileType: z.enum(['video', 'audio', 'image', 'gif', 'caption']),
  /** Current status of the asset */
  status: z.enum(['pending-upload', 'uploading', 'transcribing', 'ready', 'error']),
  /** Upload progress percentage (0-100), only present when status is 'uploading' */
  uploadProgressPercent: z.number().optional(),
  /** Error message, only present when status is 'error' */
  errorMessage: z.string().optional(),
  /** Whether the asset can be retried after an error */
  canRetry: z.boolean().optional(),
  /** Whether the asset is currently on the timeline */
  isOnTimeline: z.boolean(),
  /** True when the asset is ready for immediate timeline placement */
  isReadyForPlacement: z.boolean().optional(),
  /** Pixel dimensions for visual assets when known */
  width: z.number().optional(),
  height: z.number().optional(),
  /** Duration in seconds for video/audio/gif assets */
  durationInSeconds: z.number().optional(),
});

const motionDesignTemplateIdSchema = z.enum(motionDesignTemplateIds as [string, ...string[]]);

const motionDesignTimingCheckSchema = z.object({
  templateId: z.string(),
  unit: z.enum(['characters', 'lines', 'items', 'none']),
  contentUnits: z.number(),
  requestedFramesPerUnit: z.number(),
  effectiveFramesPerUnit: z.number(),
  completionFrame: z.number(),
  availableFrames: z.number(),
  completesBeforeEnd: z.boolean(),
  autoFitApplied: z.boolean(),
  note: z.string(),
});

const visualItemSummarySchema = z.object({
  itemId: z.string(),
  type: z.enum(['video', 'audio', 'image', 'gif', 'text', 'captions', 'solid', 'motion-design']),
  templateId: motionDesignTemplateIdSchema.optional(),
  templateLabel: z.string().optional(),
  props: z.record(z.unknown()).optional(),
  animationCheck: motionDesignTimingCheckSchema.optional(),
  shapeKind: z.enum(['solid', 'rectangle', 'rounded_rectangle', 'square', 'circle', 'ellipse']).optional(),
  assetId: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  text: z.string().optional(),
  fillColor: z.string().optional(),
  color: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  direction: z.enum(['ltr', 'rtl']).optional(),
  strokeWidth: z.number().optional(),
  strokeColor: z.string().optional(),
  from: z.number(),
  durationInFrames: z.number(),
  startTimeInSeconds: z.number(),
  endTimeInSeconds: z.number(),
  left: z.number(),
  top: z.number(),
  width: z.number(),
  height: z.number(),
  opacity: z.number(),
  rotation: z.number().optional(),
  borderRadius: z.number().optional(),
  keepAspectRatio: z.boolean().optional(),
  fadeInDurationInSeconds: z.number().optional(),
  fadeOutDurationInSeconds: z.number().optional(),
  objectFit: z.enum(['contain', 'cover', 'fill']).optional(),
});

const imageAssetSummarySchema = z.object({
  assetId: z.string(),
  fileName: z.string(),
  fileType: z.literal('image'),
  mimeType: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  status: z.enum(['pending-upload', 'uploading', 'transcribing', 'ready', 'error']),
  isReadyForPlacement: z.boolean(),
  isOnTimeline: z.boolean(),
});

const digestProjectStateSchema = z.object({
  projectId: z.string().optional(),
  tracksInfo: z.object({
    numberOfTracks: z.number(),
    tracks: z.array(
      z.object({
        trackId: z.string(),
        isVisibleOnTimeline: z.boolean(),
        isMutedOnTimeline: z.boolean(),
        numberTracksItems: z.number(),
        itemsTracksIds: z.array(z.string()),
      }),
    ),
  }),
  dimensionsInfo: z.object({
    width: z.number(),
    height: z.number(),
  }),
  currentPlayheadFrame: z.number().optional(),
  currentPlayheadTimeInSeconds: z.number().optional(),
  durationInFrames: z.number().optional(),
  durationInSeconds: z.number().optional(),
  projectItemsInfo: z.array(
    z.object({
      fileName: z.string(),
      fileType: z.string(),
      itemId: z.string(),
      mimeType: z.string(),
      durationInSeconds: z.number().optional(),
      hasAudioTrack: z.boolean(),
      startFromInSeconds: z.number().optional(),
      endAtInSeconds: z.number().optional(),
      remoteUrl: z.string().url().nullable().optional(),
      /** Reference to the original asset ID (if this item comes from a modified source) */
      originalAssetId: z.string().optional(),
      /** True when the asset was processed but contains no speech to transcribe */
      hasNoTranscription: z.boolean().optional(),
      left: z.number().optional(),
      top: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      opacity: z.number().optional(),
      rotation: z.number().optional(),
      borderRadius: z.number().optional(),
      keepAspectRatio: z.boolean().optional(),
      fadeInDurationInSeconds: z.number().optional(),
      fadeOutDurationInSeconds: z.number().optional(),
      objectFit: z.enum(['contain', 'cover', 'fill']).optional(),
    }),
  ),
  selectedItemsInfo: z.array(z.string()),
  fpsInfo: z.number(),
  /** Original assets with their modification history (removed segments like silences) */
  originalAssetsInfo: z.array(originalAssetInfoSchema).optional(),
  /** Status of all assets in the project library (includes uploading, ready, error states) */
  assetsStatusInfo: z.array(assetStatusInfoSchema).optional(),
  /** Image overlays currently visible to the agent */
  visibleImageItemsInfo: z.array(visualItemSummarySchema).optional(),
  /** Text overlays currently visible to the agent */
  visibleTextItemIds: z.array(z.string()).optional(),
  textItemsInfo: z.array(visualItemSummarySchema).optional(),
  /** Caption/subtitle overlays to avoid covering or confusing with static text */
  captionItemsInfo: z.array(visualItemSummarySchema).optional(),
  /** Motion design overlays currently visible to the agent */
  visibleMotionDesignItemsInfo: z.array(visualItemSummarySchema).optional(),
  /** Solid-backed visual shape overlays currently visible to the agent */
  visibleShapeItemsInfo: z.array(visualItemSummarySchema).optional(),
  /** Background media and solids visible behind overlays */
  backgroundItemsInfo: z.array(visualItemSummarySchema).optional(),
  /** Ready and non-ready image assets available in the project library */
  imageAssetsInfo: z.array(imageAssetSummarySchema).optional(),
  /** Nearby text/caption overlays to avoid covering important content */
  nearbyOverlayItemsInfo: z.array(visualItemSummarySchema).optional(),
});

const chatModeSchema = z.enum(['fast', 'normal', 'smart', 'pro']);

export type ChatMode = z.infer<typeof chatModeSchema>;

const messageMetadataSchema = z.object({
  messageIndex: z.number(),
  projectStateWhenSendingMessage: digestProjectStateSchema.optional(),
  mode: chatModeSchema.optional(),
  modelId: z.string().trim().min(1).optional(),
  modelSequence: z.array(z.string().trim().min(1)).optional(),
});

const messageTextPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  state: z.enum(['streaming', 'done']).optional(),
});

const messageReasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
  state: z.enum(['streaming', 'done']).optional(),
});

const messageStepStartPartSchema = z.object({
  type: z.literal('step-start'),
});

const messageToolPartSchema = z.object({
  type: z.string().startsWith('tool-'),
  toolCallId: z.string().trim().min(1, 'Tool call ID is required'),
  state: z.enum([
    'input-streaming',
    'input-available',
    'approval-requested',
    'approval-responded',
    'output-available',
    'output-error',
    'output-denied',
  ]),
  input: z.union([z.string(), z.record(z.unknown())]).optional(),
  output: z.unknown().optional(),
  errorText: z.string().optional(),
  title: z.string().optional(),
  providerExecuted: z.boolean().optional(),
  preliminary: z.boolean().optional(),
});

const messagePartSchema = z.union([
  messageTextPartSchema,
  messageReasoningPartSchema,
  messageStepStartPartSchema,
  messageToolPartSchema,
]);

const messageRequestSchema = z.object({
  id: z.string().trim().min(1, 'Message ID is required'),
  role: z.enum(['user', 'assistant']),
  parts: z.array(messagePartSchema),
  metadata: messageMetadataSchema.optional(),
});

export const apiContracts = c.router(
  {
    root: {
      getHello: {
        method: 'GET',
        path: 'hello',
        responses: { 200: z.object({ message: z.string() }) },
      },
    },
    messages: c.router({
      sendMessage: {
        method: 'POST',
        path: 'messages',
        body: z.array(messageRequestSchema).min(1, 'At least one message is required'),
        responses: {
          200: messageResponseSchema,
        },
      },
      stopMessage: {
        method: 'POST',
        path: 'messages/stop',
        body: stopMessageRequestSchema,
        responses: {
          200: stopMessageResponseSchema,
        },
      },
    }),
    audio: c.router({
      detectSilence: {
        method: 'POST',
        path: 'audio/detect-silence',
        body: silenceDetectionRequestSchema,
        responses: {
          200: silenceDetectionResponseSchema,
          400: z.object({ message: z.string() }),
        },
      },
    }),
    tools: c.router({
      reportToolResult: {
        method: 'POST',
        path: 'tools/report-result',
        body: toolResultReportSchema,
        responses: {
          200: toolResultReportResponseSchema,
        },
      },
    }),
    captions: c.router({
      generateCaptions: {
        method: 'POST',
        path: 'captions/generate',
        body: generateCaptionsRequestSchema,
        responses: {
          200: generateCaptionsResponseSchema,
          400: z.object({ message: z.string() }),
        },
      },
      getCaptions: {
        method: 'POST',
        path: 'captions/get',
        body: getCaptionsRequestSchema,
        responses: {
          200: getCaptionsResponseSchema,
          400: z.object({ message: z.string() }),
        },
      },
    }),
    upload: c.router({
      getPresignedUrl: {
        method: 'POST',
        path: 'upload/presign',
        body: uploadRequestSchema,
        responses: {
          200: z.object({
            presignedUrl: z.string(),
            readUrl: z.string(),
            fileKey: z.string(),
          }),
          400: z.object({ code: z.string(), message: z.string() }),
          413: z.object({ code: z.string(), message: z.string() }),
        },
      },
      initMultipart: {
        method: 'POST',
        path: 'uploads/init',
        body: initMultipartRequestSchema,
        responses: {
          200: initMultipartResponseSchema,
          400: z.object({ code: z.string(), message: z.string() }),
          413: z.object({ code: z.string(), message: z.string() }),
        },
      },
      signParts: {
        method: 'POST',
        path: 'uploads/:uploadId/sign-parts',
        pathParams: z.object({ uploadId: z.string() }),
        body: signPartsRequestSchema,
        responses: {
          200: signPartsResponseSchema,
          404: z.object({ code: z.string(), message: z.string() }),
        },
      },
      completeUpload: {
        method: 'POST',
        path: 'uploads/:uploadId/complete',
        pathParams: z.object({ uploadId: z.string() }),
        body: completeUploadRequestSchema,
        responses: {
          200: completeUploadResponseSchema,
          404: z.object({ code: z.string(), message: z.string() }),
        },
      },
      abortUpload: {
        method: 'POST',
        path: 'uploads/:uploadId/abort',
        pathParams: z.object({ uploadId: z.string() }),
        body: z.object({}),
        responses: {
          200: z.object({ success: z.boolean() }),
          404: z.object({ code: z.string(), message: z.string() }),
        },
      },
      deleteAsset: {
        method: 'DELETE',
        path: 'assets/:assetId',
        pathParams: z.object({ assetId: z.string().trim().min(1, 'Asset ID is required') }),
        body: deleteAssetRequestSchema,
        responses: {
          200: deleteAssetResponseSchema,
        },
      },
    }),
    render: c.router({
      startRender: {
        method: 'POST',
        path: 'render',
        body: renderVideoRequestSchema,
        responses: {
          200: renderVideoSuccessResponseSchema,
          400: renderVideoErrorResponseSchema,
        },
      },
    }),
  },
  { pathPrefix: '/', strictStatus: true },
);

export type HelloResponse = z.infer<(typeof apiContracts.root.getHello.responses)[200]>;
export type SendMessageRequest = z.infer<typeof messageRequestSchema>;
export type SendMessageRequestArray = z.infer<typeof messageRequestSchema>[];
export type SendMessageMetadata = z.infer<typeof messageMetadataSchema>;
export type SendMessagePart = z.infer<typeof messagePartSchema>;
export type SendMessageResponse = z.infer<typeof messageResponseSchema>;
export type StopMessageRequest = z.infer<typeof stopMessageRequestSchema>;
export type StopMessageResponse = z.infer<typeof stopMessageResponseSchema>;
export type DetectSilenceRequest = z.infer<typeof silenceDetectionRequestSchema>;
export type DetectSilenceResponse = z.infer<typeof silenceDetectionResponseSchema>;
export type DigestProjectStateRequest = z.infer<typeof digestProjectStateSchema>;
export type AssetStatusInfo = z.infer<typeof assetStatusInfoSchema>;
export type OriginalAssetInfo = z.infer<typeof originalAssetInfoSchema>;
export type RemovedSegmentFromSourceInfo = z.infer<typeof removedSegmentFromSourceSchema>;
export type ReportToolResultRequest = z.infer<typeof toolResultReportSchema>;
export type ReportToolResultResponse = z.infer<typeof toolResultReportResponseSchema>;
export type Caption = z.infer<typeof captionSchema>;
export type GenerateCaptionsRequest = z.infer<typeof generateCaptionsRequestSchema>;
export type GenerateCaptionsResponse = z.infer<typeof generateCaptionsResponseSchema>;
export type GetCaptionsRequest = z.infer<typeof getCaptionsRequestSchema>;
export type GetCaptionsResponse = z.infer<typeof getCaptionsResponseSchema>;
export type UploadRequest = z.infer<typeof uploadRequestSchema>;
export type UploadResponse = z.infer<typeof uploadResponseSchema>;
export type UploadProgressPhase = z.infer<typeof uploadProgressPhaseSchema>;
export type UploadProgressPayload = z.infer<typeof uploadProgressPayloadSchema>;
export type InitMultipartRequest = z.infer<typeof initMultipartRequestSchema>;
export type InitMultipartResponse = z.infer<typeof initMultipartResponseSchema>;
export type SignPartsRequest = z.infer<typeof signPartsRequestSchema>;
export type SignPartsResponse = z.infer<typeof signPartsResponseSchema>;
export type CompletedPart = z.infer<typeof completedPartSchema>;
export type CompleteUploadRequest = z.infer<typeof completeUploadRequestSchema>;
export type CompleteUploadResponse = z.infer<typeof completeUploadResponseSchema>;
export type DeleteAssetRequest = z.infer<typeof deleteAssetRequestSchema>;
export type DeleteAssetResponse = z.infer<typeof deleteAssetResponseSchema>;
export type RenderVideoPayload = z.infer<typeof renderVideoRequestSchema>;
export type RenderVideoSuccessResponse = z.infer<typeof renderVideoSuccessResponseSchema>;
export type RenderVideoErrorResponse = z.infer<typeof renderVideoErrorResponseSchema>;
export type RenderVideoResponse = z.infer<typeof renderVideoResponseSchema>;

export { startRenderRequestSchema, startRenderQuotaErrorSchema };
export type StartRenderRequestBase = z.infer<typeof startRenderRequestSchema>;
export type StartRenderQuotaError = z.infer<typeof startRenderQuotaErrorSchema>;

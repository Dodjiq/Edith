import { Caption } from '@remotion/captions';
import type { TwelveLabsVideoReference, VideoAnalysisSummary } from 'api-types';

export type AssetUploadProgress = {
  progress: number;
  loadedBytes: number;
  totalBytes: number;
};

export type AssetState =
  | {
      type: 'pending-upload';
    }
  | {
      type: 'in-progress';
      progress: AssetUploadProgress;
    }
  | {
      type: 'transcribing';
    }
  | {
      type: 'uploaded';
    }
  | {
      type: 'error';
      error: Error;
      canRetry: boolean;
    };

export type AssetUploadTask = {
  type: 'uploading';
  assetId: string;
  asset: EditorStarterAsset;
  status: AssetUploadProgress;
  startedAt: number;
  id: string;
};

export type AssetTranscribingTask = {
  type: 'transcribing';
  assetId: string;
  asset: EditorStarterAsset;
  startedAt: number;
  id: string;
};

type BaseAsset = {
  filename: string;
  id: string;
  size: number;
  remoteUrl: string | null;
  remoteFileKey: string | null;
  mimeType: string;
  /** Visual preview URL (thumbnail) - can be generated on the fly or stored */
  visualResume?: string | null;
  /**
   * ID of the parent asset if this asset was derived from another (e.g., AI splicing).
   * Assets without parentAssetId are "root" assets (original uploads).
   * Used to filter library view to show only original uploads.
   */
  parentAssetId?: string | null;
};

export type ImageAsset = BaseAsset & {
  type: 'image';
  width: number;
  height: number;
};

export type VideoAsset = BaseAsset & {
  type: 'video';
  durationInSeconds: number;
  hasAudioTrack: boolean;
  width: number;
  height: number;
  lowResAssetUrl?: string;
  /** Pre-computed transcription from upload (word-level captions) */
  transcription?: Caption[];
  /** TwelveLabs index reference for later interactions */
  twelveLabs?: TwelveLabsVideoReference;
  /** Multi-pass analysis summary generated after upload */
  summary?: VideoAnalysisSummary;
  summaryError?: string;
  /**
   * True when the asset was successfully processed but contains no speech to transcribe.
   * Different from missing transcription - the asset simply has no spoken content.
   */
  hasNoTranscription?: boolean;
};

export type GifAsset = BaseAsset & {
  type: 'gif';
  durationInSeconds: number;
  width: number;
  height: number;
};

export type AudioAsset = BaseAsset & {
  type: 'audio';
  durationInSeconds: number;
  /** Pre-computed transcription from upload (word-level captions) */
  transcription?: Caption[];
  /**
   * True when the asset was successfully processed but contains no speech to transcribe.
   * Different from missing transcription - the asset simply has no spoken content.
   */
  hasNoTranscription?: boolean;
};

export type CaptionAsset = BaseAsset & {
  type: 'caption';
  captions: Caption[];
};

export type EditorStarterAsset = ImageAsset | VideoAsset | GifAsset | AudioAsset | CaptionAsset;

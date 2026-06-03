import { DetectSilenceResponse, RemoveSilencesDetectionMode } from 'api-types';
import { AudioItem } from '../../items/audio/audio-item-type';
import { VideoItem } from '../../items/video/video-item-type';

export type AudioCapableItem = VideoItem | AudioItem;

export type AudiblePart = DetectSilenceResponse['audibleParts'][number];

export type TargetItem = {
  item: AudioCapableItem;
  assetUrl: string;
};

export type RemovedSegment = {
  timelineStartInSeconds: number;
  timelineEndInSeconds: number;
  durationInSeconds: number;
};

export type RemoveSilenceOptions = {
  targetItemId?: string;
  itemIds?: string[];
  noiseThresholdInDecibels?: number;
  minDurationInSeconds?: number;
  paddingInSeconds?: number;
  detectionMode?: RemoveSilencesDetectionMode;
  toolCallId?: string;
  detectionsByItemId?: Record<string, DetectSilenceResponse>;
};

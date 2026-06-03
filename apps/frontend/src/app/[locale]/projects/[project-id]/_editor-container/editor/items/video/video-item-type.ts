import type { Caption } from '@remotion/captions';
import {BaseItem, CanHaveBorderRadius, CanHaveRotation} from '../shared';

export type VideoItem = BaseItem &
	CanHaveBorderRadius &
	CanHaveRotation & {
		type: 'video';
		videoStartFromInSeconds: number;
		decibelAdjustment: number;
		playbackRate: number;
		audioFadeInDurationInSeconds: number;
		audioFadeOutDurationInSeconds: number;
		fadeInDurationInSeconds: number;
		fadeOutDurationInSeconds: number;
		assetId: string;
		keepAspectRatio: boolean;
		/**
		 * Word-level transcription for this item's portion of the source.
		 * Timestamps are relative to videoStartFromInSeconds (0 = start of this item's source portion).
		 * Set when the item is created from a splice operation.
		 */
		transcription?: Caption[];
		/**
		 * True when the source asset contains no speech to transcribe.
		 * Inherited from parent asset during splice operations.
		 */
		hasNoTranscription?: boolean;
	};

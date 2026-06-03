import type { Caption } from '@remotion/captions';
import {BaseItem} from '../shared';

export type AudioItem = BaseItem & {
	type: 'audio';
	audioStartFromInSeconds: number;
	decibelAdjustment: number;
	playbackRate: number;
	audioFadeInDurationInSeconds: number;
	audioFadeOutDurationInSeconds: number;
	assetId: string;
	/**
	 * Word-level transcription for this item's portion of the source.
	 * Timestamps are relative to audioStartFromInSeconds (0 = start of this item's source portion).
	 * Set when the item is created from a splice operation.
	 */
	transcription?: Caption[];
	/**
	 * True when the source asset contains no speech to transcribe.
	 * Inherited from parent asset during splice operations.
	 */
	hasNoTranscription?: boolean;
};

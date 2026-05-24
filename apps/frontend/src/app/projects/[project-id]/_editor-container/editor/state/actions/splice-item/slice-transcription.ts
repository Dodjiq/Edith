import type { Caption } from '@remotion/captions';

/**
 * Slices a transcription to only include words within a specific time range.
 *
 * Words that span the cut boundaries are clamped to fit within the range.
 * Output timestamps are shifted to start at 0 (relative to range start).
 *
 * @param parentTranscription - The source transcription to slice from
 * @param rangeStartMs - Start of the range in parent's coordinate space (ms)
 * @param rangeDurationMs - Duration of the range (ms)
 * @returns Sliced transcription with timestamps starting at 0
 */
export const sliceTranscription = (
  parentTranscription: Caption[],
  rangeStartMs: number,
  rangeDurationMs: number,
): Caption[] => {
  const rangeEndMs = rangeStartMs + rangeDurationMs;

  return parentTranscription
    .filter((word) => {
      // Keep words that overlap with the range
      return word.endMs > rangeStartMs && word.startMs < rangeEndMs;
    })
    .map((word) => {
      // Clamp start/end to range boundaries, then shift to 0-based
      const clampedStartMs = Math.max(word.startMs, rangeStartMs);
      const clampedEndMs = Math.min(word.endMs, rangeEndMs);

      // Shift to be relative to range start (0 = start of this slice)
      const newStartMs = clampedStartMs - rangeStartMs;
      const newEndMs = clampedEndMs - rangeStartMs;

      // Handle timestampMs (word-level timestamp, usually midpoint)
      let newTimestampMs: number | null = null;
      if (word.timestampMs !== null) {
        // Clamp and shift timestampMs
        const clampedTimestamp = Math.max(rangeStartMs, Math.min(rangeEndMs, word.timestampMs));
        newTimestampMs = clampedTimestamp - rangeStartMs;
      }

      return {
        text: word.text,
        startMs: newStartMs,
        endMs: newEndMs,
        timestampMs: newTimestampMs,
        confidence: word.confidence,
      };
    });
};

/**
 * Converts frames to milliseconds.
 */
export const framesToMs = (frames: number, fps: number): number => {
  return (frames / fps) * 1000;
};

/**
 * Converts milliseconds to frames.
 */
export const msToFrames = (ms: number, fps: number): number => {
  return Math.floor((ms / 1000) * fps);
};

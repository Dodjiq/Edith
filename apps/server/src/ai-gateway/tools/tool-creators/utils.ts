import type { ReportToolResultRequest, TranscriptionWord } from 'api-types';

/** Strip URLs and verbose fields from project state to reduce AI context token usage. */
export function stripUrlsFromProjectState<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data } as Record<string, unknown>;
  const maxRemovedSegments = 20;

  if (Array.isArray(result.projectItemsInfo)) {
    result.projectItemsInfo = result.projectItemsInfo.map((item: Record<string, unknown>) => {
      const {
        remoteUrl,
        durationInSeconds,
        endAtInSeconds,
        fileName,
        mimeType,
        startFromInSeconds,
        ...rest
      } = item;
      return rest;
    });
  }

  if (Array.isArray(result.items)) {
    result.items = result.items.map((item: Record<string, unknown>) => {
      const { remoteUrl, src, ...rest } = item;
      return rest;
    });
  }

  if (Array.isArray(result.originalAssetsInfo)) {
    result.originalAssetsInfo = result.originalAssetsInfo.map((asset: Record<string, unknown>) => {
      const removedSegments = Array.isArray(asset.removedSegments)
        ? (asset.removedSegments as Record<string, unknown>[])
        : [];
      const removedDurationSeconds = removedSegments.reduce((sum, segment) => {
        const duration = typeof segment.durationInSeconds === 'number' ? segment.durationInSeconds : 0;
        return sum + duration;
      }, 0);
      const { remoteUrl, ...rest } = asset;

      return {
        ...rest,
        removedSegments: removedSegments.slice(0, maxRemovedSegments),
        removedSegmentsCount: removedSegments.length,
        removedDurationSeconds: Number(removedDurationSeconds.toFixed(3)),
        removedSegmentsTruncated: removedSegments.length > maxRemovedSegments,
      };
    });
  }

  return result as T;
}

/** Format transcription words into a minute-grouped text summary. */
export function formatTranscriptionSummary(
  words: TranscriptionWord[],
  fps: number,
): { summary: string; totalMinutes: number } {
  if (!words || words.length === 0) return { summary: '', totalMinutes: 0 };

  const minuteGroups = new Map<number, string[]>();
  let maxMinute = 0;

  for (const word of words) {
    const minute = Math.floor(word.startFrame / fps / 60);
    maxMinute = Math.max(maxMinute, minute);
    if (!minuteGroups.has(minute)) minuteGroups.set(minute, []);
    minuteGroups.get(minute)!.push(word.text);
  }

  const lines: string[] = [];
  for (let minute = 0; minute <= maxMinute; minute++) {
    const wordsInMinute = minuteGroups.get(minute);
    if (wordsInMinute?.length) {
      lines.push(`Minute ${minute + 1}`, wordsInMinute.join(' '), '');
    }
  }

  return { summary: lines.join('\n').trim(), totalMinutes: maxMinute + 1 };
}

export function buildTranscriptionGeneralization({
  words,
  fps,
  maxCharacters = 3500,
}: {
  words: TranscriptionWord[];
  fps: number;
  maxCharacters?: number;
}): { generalization: string; totalMinutes: number } {
  const { summary, totalMinutes } = formatTranscriptionSummary(words, fps);

  if (words.length === 0) {
    return {
      generalization:
        'No transcript words are currently available. The audio may still be processing, silent, or missing from the selected timeline scope.',
      totalMinutes,
    };
  }

  const confidences = words
    .map((word) => word.confidence)
    .filter(
      (confidence): confidence is number => typeof confidence === 'number' && Number.isFinite(confidence),
    );
  const averageConfidence =
    confidences.length > 0
      ? `${Math.round((confidences.reduce((sum, confidence) => sum + confidence, 0) / confidences.length) * 100)}% average confidence`
      : 'confidence unavailable';
  const trackIds = Array.from(new Set(words.map((word) => word.trackId).filter(Boolean)));
  const compactTranscript =
    summary.length > maxCharacters
      ? `${summary.slice(0, maxCharacters).trimEnd()}\n[Transcript overview truncated.]`
      : summary;

  return {
    totalMinutes,
    generalization: [
      `Transcript generalization: ${words.length} word(s) across ${totalMinutes} minute(s), ${averageConfidence}, ${trackIds.length} track(s).`,
      'Use this as the orientation layer, then call get_detailed_transcription for exact timestamp evidence before making edit decisions.',
      '',
      compactTranscript,
    ].join('\n'),
  };
}

/** Map ReportToolResultRequest status to a simplified tool result status. */
export function mapToolResultStatus<T extends string>(
  status: ReportToolResultRequest['status'],
  statusMap: { success: T; skipped?: T; error: T },
): T {
  switch (status) {
    case 'success':
      return statusMap.success;
    case 'skipped':
      return statusMap.skipped ?? statusMap.error;
    case 'error':
      return statusMap.error;
    default:
      return statusMap.error;
  }
}

/** Extract error detail from a tool result response. */
export function extractErrorDetail(result: ReportToolResultRequest): string | undefined {
  if (typeof result.error === 'string' && result.error.trim().length > 0) return result.error.trim();
  if (typeof result.output?.error === 'string') return result.output.error;
  if (typeof result.output?.message === 'string') return result.output.message;
  return undefined;
}

import type { ReportToolResultRequest, TranscriptionWord } from 'api-types';

/** Strip URLs and verbose fields from project state to reduce AI context token usage. */
export function stripUrlsFromProjectState<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data } as Record<string, unknown>;

  if (Array.isArray(result.projectItemsInfo)) {
    result.projectItemsInfo = result.projectItemsInfo.map((item: Record<string, unknown>) => {
      const { remoteUrl, durationInSeconds, endAtInSeconds, fileName, mimeType, startFromInSeconds, ...rest } = item;
      return rest;
    });
  }

  if (Array.isArray(result.items)) {
    result.items = result.items.map((item: Record<string, unknown>) => {
      const { remoteUrl, src, ...rest } = item;
      return rest;
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

/** Map ReportToolResultRequest status to a simplified tool result status. */
export function mapToolResultStatus<T extends string>(
  status: ReportToolResultRequest['status'],
  statusMap: { success: T; skipped?: T; error: T },
): T {
  switch (status) {
    case 'success': return statusMap.success;
    case 'skipped': return statusMap.skipped ?? statusMap.error;
    case 'error': return statusMap.error;
    default: return statusMap.error;
  }
}

/** Extract error detail from a tool result response. */
export function extractErrorDetail(result: ReportToolResultRequest): string | undefined {
  if (typeof result.error === 'string' && result.error.trim().length > 0) return result.error.trim();
  if (typeof result.output?.error === 'string') return result.output.error;
  if (typeof result.output?.message === 'string') return result.output.message;
  return undefined;
}

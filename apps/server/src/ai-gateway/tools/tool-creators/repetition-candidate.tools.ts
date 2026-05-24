import { Tool } from 'ai';
import type { TranscriptionWord } from 'api-types';
import { z } from 'zod';
import { createGetDetailedTranscriptionTool } from './query.tools';
import type { GetDetailedTranscriptionResult, ToolDependencies, ToolsContext } from './types';

export const repetitionCandidateToolName = 'find_repetition_candidates';

type FindRepetitionCandidatesInput = {
  itemIds?: string[];
  minutes?: number[];
  reason?: string;
};

type RepetitionCandidate = {
  label: string;
  repeatedText: string;
  startTimeInSeconds: number;
  endTimeInSeconds: number;
  confidence: number;
  reason: string;
  trackId: string;
};

type FindRepetitionCandidatesResult = {
  status: 'completed' | 'skipped' | 'timeout' | 'error';
  candidates: RepetitionCandidate[];
  targetItemIds?: string[];
  minutes?: number[];
  wordCount?: number;
  note?: string;
  error?: string;
};

function normalizeWord(text: string) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'’-]+/gu, '')
    .trim();
}

function buildPhrase(words: TranscriptionWord[]) {
  return words.map((word) => normalizeWord(word.text)).filter(Boolean).join(' ');
}

function buildConfidence(size: number, gapFrames: number, fps: number) {
  const base = size >= 3 ? 0.96 : size === 2 ? 0.92 : 0.84;
  const gapPenalty = Math.min(0.12, gapFrames / Math.max(fps, 1) / 10);
  return Number(Math.max(0.55, Math.min(0.99, base - gapPenalty)).toFixed(2));
}

function detectImmediateRepeatedPhrases(words: TranscriptionWord[], fps: number) {
  const candidates: RepetitionCandidate[] = [];
  const maxGapFrames = Math.round(fps * 1.25);

  for (let index = 0; index < words.length; index += 1) {
    for (const phraseSize of [3, 2, 1]) {
      const secondStartIndex = index + phraseSize;
      const secondEndIndex = secondStartIndex + phraseSize;

      if (secondEndIndex > words.length) {
        continue;
      }

      const firstPhraseWords = words.slice(index, index + phraseSize);
      const secondPhraseWords = words.slice(secondStartIndex, secondEndIndex);

      if (
        firstPhraseWords.some((word) => word.trackId !== firstPhraseWords[0].trackId) ||
        secondPhraseWords.some((word) => word.trackId !== firstPhraseWords[0].trackId)
      ) {
        continue;
      }

      const firstPhrase = buildPhrase(firstPhraseWords);
      const secondPhrase = buildPhrase(secondPhraseWords);

      if (!firstPhrase || firstPhrase !== secondPhrase) {
        continue;
      }

      if (phraseSize === 1 && firstPhrase.length < 4) {
        continue;
      }

      const firstEndFrame = firstPhraseWords[firstPhraseWords.length - 1].endFrame;
      const secondStartFrame = secondPhraseWords[0].startFrame;
      const gapFrames = secondStartFrame - firstEndFrame;

      if (gapFrames < 0 || gapFrames > maxGapFrames) {
        continue;
      }

      candidates.push({
        label: phraseSize === 1 ? 'repeated word candidate' : 'repeated phrase candidate',
        repeatedText: firstPhrase,
        startTimeInSeconds: firstPhraseWords[0].startFrame / fps,
        endTimeInSeconds: secondStartFrame / fps,
        confidence: buildConfidence(phraseSize, gapFrames, fps),
        reason: `Immediate repeated ${phraseSize === 1 ? 'word' : 'phrase'} candidate. Heuristic only; verify with transcript context.`,
        trackId: firstPhraseWords[0].trackId,
      });
    }
  }

  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.trackId}:${candidate.startTimeInSeconds}:${candidate.endTimeInSeconds}:${candidate.repeatedText}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildModelOutput(result: FindRepetitionCandidatesResult) {
  if (result.status !== 'completed') {
    return {
      type: 'text' as const,
      value: result.note ?? result.error ?? 'No repetition candidates available.',
    };
  }

  return {
    type: 'text' as const,
    value: JSON.stringify({
      note: 'Heuristic-only repetition candidates. Verify them against the transcript before acting.',
      candidates: result.candidates,
    }),
  };
}

export function createFindRepetitionCandidatesTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<FindRepetitionCandidatesInput, FindRepetitionCandidatesResult> {
  return {
    description: [
      'Heuristic helper for likely repeated words, short repeated phrases, and local false starts in the transcript.',
      'It is not 100% accurate.',
      'Use it to surface advisory candidates, then verify them against the detailed transcription before acting.',
      'Do not rely on it as the sole source of truth.',
      'It mostly helps with repetitions and local restarts, and it can miss valid bad takes or flag normal emphasis.',
    ].join(' '),
    inputSchema: z.object({
      itemIds: z.array(z.string().trim().min(1)).optional(),
      minutes: z.array(z.number().int().min(1)).optional(),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async ({ itemIds, minutes, reason }: FindRepetitionCandidatesInput) => {
      const detailedTranscriptionTool = createGetDetailedTranscriptionTool(deps, context);

      if (!detailedTranscriptionTool.execute) {
        return {
          status: 'error',
          candidates: [],
          note: 'Detailed transcription helper is unavailable.',
          error: 'Detailed transcription helper is unavailable.',
        };
      }

      const executeDetailedTranscription = detailedTranscriptionTool.execute as (
        input: FindRepetitionCandidatesInput,
        options: { toolCallId?: string },
      ) => Promise<GetDetailedTranscriptionResult>;

      const detailedTranscription = await executeDetailedTranscription(
        {
          itemIds,
          minutes,
          reason: reason ?? 'Need heuristic repetition candidates to assist transcript investigation.',
        },
        {},
      );

      if (detailedTranscription.status !== 'completed') {
        return {
          status: detailedTranscription.status,
          candidates: [],
          targetItemIds: detailedTranscription.targetItemIds,
          minutes: detailedTranscription.minutes,
          note: detailedTranscription.note,
          error: detailedTranscription.error,
        };
      }

      const transcriptionWords = detailedTranscription.transcription ?? [];
      if (transcriptionWords.length === 0) {
        return {
          status: 'completed',
          candidates: [],
          targetItemIds: detailedTranscription.targetItemIds,
          minutes: detailedTranscription.minutes,
          wordCount: detailedTranscription.wordCount,
          note: 'No transcription words were available for repetition detection.',
        };
      }

      const fps = Number(context?.projectState?.fpsInfo) || 30;
      const candidates = detectImmediateRepeatedPhrases(transcriptionWords, fps);

      return {
        status: candidates.length > 0 ? 'completed' : 'skipped',
        candidates,
        targetItemIds: detailedTranscription.targetItemIds,
        minutes: detailedTranscription.minutes,
        wordCount: detailedTranscription.wordCount,
        note: candidates.length > 0
          ? 'Heuristic repetition candidates found. Advisory only.'
          : 'No obvious immediate repetition candidates were found.',
      };
    },
    toModelOutput: ({ output }: { output: FindRepetitionCandidatesResult }) => buildModelOutput(output),
  } as unknown as Tool<FindRepetitionCandidatesInput, FindRepetitionCandidatesResult>;
}

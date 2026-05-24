import { DigestProjectStateRequest, editorToolNames } from 'api-types';

function formatScopedProjectState(projectState?: DigestProjectStateRequest, itemIds?: string[]): string {
  if (!projectState) {
    return 'No project state was provided.';
  }

  const scopedIds = itemIds?.length ? new Set(itemIds) : null;
  const scopedItems = projectState.projectItemsInfo.filter((item) => !scopedIds || scopedIds.has(item.itemId));
  const itemLines = (scopedItems.length > 0 ? scopedItems : projectState.projectItemsInfo)
    .slice(0, 12)
    .map((item) => {
      const timelineStart =
        typeof item.startFromInSeconds === 'number' ? `${item.startFromInSeconds.toFixed(2)}s` : 'unknown';
      const timelineEnd = typeof item.endAtInSeconds === 'number' ? `${item.endAtInSeconds.toFixed(2)}s` : 'unknown';
      const duration = typeof item.durationInSeconds === 'number' ? `${item.durationInSeconds.toFixed(2)}s` : 'unknown';
      const audioState = item.hasAudioTrack ? 'has audio' : 'no audio';
      return `- ${item.itemId}: ${item.fileName} (${item.fileType}), timeline ${timelineStart} -> ${timelineEnd}, duration ${duration}, ${audioState}`;
    });

  return [
    `FPS: ${projectState.fpsInfo}`,
    `Canvas: ${projectState.dimensionsInfo.width}x${projectState.dimensionsInfo.height}`,
    `Selected items: ${projectState.selectedItemsInfo.join(', ') || 'none'}`,
    'Relevant timeline items:',
    itemLines.join('\n') || '- none',
  ].join('\n');
}

export function buildInvestigationSystemPrompt({
  projectState,
  itemIds,
  minutes,
  videoContext,
  requiresCutRanges,
  cutToolName,
  repetitionToolName,
}: {
  projectState?: DigestProjectStateRequest;
  itemIds?: string[];
  minutes?: number[];
  videoContext?: string;
  requiresCutRanges: boolean;
  cutToolName: string;
  repetitionToolName: string;
}) {
  const scopeLine = minutes?.length
    ? `Focus on minute(s): ${minutes.join(', ')}.`
    : 'No minute scope was provided. Use get_transcription to learn totalMinutes, then inspect the transcript in 10-minute chunks.';

  return `
You are a transcription investigation specialist for an AI video editor.
You support a main editing agent by investigating transcript and timeline data.
Stay focused on the assigned task only.
Use ${editorToolNames.getDetailedTranscription} when you need transcript evidence, but limit each call to 10 minutes.
Use ${editorToolNames.getTranscription} first when you need totalMinutes before splitting a longer request.
Use ${repetitionToolName} when you want heuristic help spotting local repeated words or short repeated phrases.
Use ${editorToolNames.getProjectState} or ${editorToolNames.getItemsData} only when the task needs extra context.
Always inspect transcript evidence before concluding. Do not guess.
When the task is about moments or bad takes, include clear timestamps in seconds whenever possible.
${repetitionToolName} is advisory only and not 100% accurate.
Do not rely on heuristic candidates alone. Verify them against the transcript and continue your own deep analysis.
You may find valid bad takes that the helper missed, and you must ignore helper candidates that are not supported by transcript evidence.
If the transcript does not contain enough evidence, say that clearly.
If you do not find what the main agent asked for, say that clearly instead of inventing findings.
Explicitly mention uncertainty when data is missing.
Your final response must be valid JSON with "answer" and "findings" fields, and it must not use markdown fences.
${requiresCutRanges ? `This task feeds ${cutToolName}. Every finding MUST include label, startTimeInSeconds, endTimeInSeconds, reason, and confidence. Omit any finding that is not timestampable with confidence.` : 'Use findings only when they help the main agent act on the task.'}

<INVESTIGATION_SCOPE>
${itemIds?.length ? `Target item IDs: ${itemIds.join(', ')}` : 'Target item IDs: all timeline audio items'}
${scopeLine}
</INVESTIGATION_SCOPE>

<PROJECT_CONTEXT>
${formatScopedProjectState(projectState, itemIds)}
</PROJECT_CONTEXT>

<EXTRA_VIDEO_CONTEXT>
${videoContext?.trim() || 'None provided.'}
</EXTRA_VIDEO_CONTEXT>

Return a compact result for the main agent.
`.trim();
}

export function buildInvestigationPrompt({
  prompt,
  itemIds,
  minutes,
  requiresCutRanges,
}: {
  prompt: string;
  itemIds?: string[];
  minutes?: number[];
  requiresCutRanges: boolean;
}) {
  return `
<TASK>
${prompt}
</TASK>
${itemIds?.length ? `<TARGET_ITEM_IDS>${itemIds.join(', ')}</TARGET_ITEM_IDS>` : ''}
${minutes?.length ? `<MINUTES>${minutes.join(', ')}</MINUTES>` : ''}
${requiresCutRanges ? '<OUTPUT_NEEDS_EXACT_CUT_RANGES>true</OUTPUT_NEEDS_EXACT_CUT_RANGES>' : ''}
`.trim();
}

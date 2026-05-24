# Text Overlay Subagent Requirements

## Purpose

The text overlay subagent is a one-time-use AI SDK specialist for static text in the video editor. It handles titles, lower thirds, labels, callouts, language tags, chapter cards, and decorative text overlays without exposing every text-specific tool to the main video editor agent.

The main agent stays an orchestrator. It should decide that the user request is text-specific, gather the current editor context, and call `delegate_text_overlay_task` with the exact user instruction and relevant project state. The text subagent then performs the work with a focused prompt and a small toolset.

This subagent must not be used for spoken captions or transcript-driven subtitles. Those should continue to use `set_captions`.

## Main Agent Contract

Add one high-level tool to the main agent:

`delegate_text_overlay_task`

Input requirements:

- `userRequest`: exact natural language request from the user.
- `projectId`: current project identifier.
- `conversationContext`: short summary from the main agent, only if needed.
- `targetItemIds`: optional text item IDs if the user selected or referenced existing text.
- `timeRange`: optional requested time range in seconds or frames.
- `placementHint`: optional placement such as `bottom`, `middle`, `top-right`, or `lower-third`.
- `styleHint`: optional style summary such as `bold white with black stroke`.
- `projectStateSnapshot`: compact current project state, including selected items, tracks, canvas size, fps, duration, and visible overlay items.

Execution requirements:

- Spawn a one-time AI SDK subagent using the existing AI Gateway/model configuration.
- Do not hardcode model names in the delegator.
- Pass `abortSignal` to the subagent run.
- Use `toModelOutput` to return only a compact result to the main agent.
- Keep detailed text tools out of the main agent tool list.

Output requirements:

- `status`: `success`, `partial_success`, `needs_clarification`, or `error`.
- `createdItemIds`: IDs of created text items.
- `updatedItemIds`: IDs of updated text items.
- `deletedItemIds`: IDs of deleted text items, if any.
- `selectedItemIds`: IDs selected after execution.
- `summary`: one or two sentences describing the edit.
- `unresolvedIssue`: short issue if the subagent could not complete the request.

## Specialist Tool Access

Total specialist tools: 7.

Read tools:

- `get_project_state`
- `get_items_data`

Timeline tools:

- `select_timeline_items`
- `place_timeline_items`
- `delete_items`

Text tools:

- `add_text_items`
- `update_text_items`

The subagent should not receive library upload tools, image tools, shape tools, caption tools, or video analysis tools unless a later requirement explicitly adds them.

## Text Tool Requirements

### `add_text_items`

Status: already started in the repo and should be preserved.

Purpose:

- Add one or more text overlay items to the timeline.
- Return the created item IDs and updated project state.

Required input fields:

- `items`: array of text item creation requests.
- `items[].text`: visible text content.
- `items[].startFrame` or `items[].startTimeInSeconds`.
- `items[].durationInFrames` or `items[].durationInSeconds`.
- `items[].xOnCanvas`: optional x position in canvas coordinates.
- `items[].yOnCanvas`: optional y position in canvas coordinates.
- `items[].style`: optional text style and layout object.

Required style fields:

- `left`
- `top`
- `width`
- `height`
- `opacity`
- `rotation`
- `fontFamily`
- `fontStyle`
- `fontSize`
- `lineHeight`
- `letterSpacing`
- `align`
- `direction`
- `color`
- `strokeWidth`
- `strokeColor`
- `fadeInDurationInSeconds`
- `fadeOutDurationInSeconds`

Validation requirements:

- Accept either frame-based timing or second-based timing.
- Reject conflicting start fields when both values disagree.
- Reject conflicting duration fields when both values disagree.
- Clamp opacity to the editor-supported range.
- Reject empty `text` after trimming unless the user explicitly asks for a placeholder.
- Use editor canvas dimensions to place default text safely.

Default behavior:

- If placement is not provided, place text bottom-center.
- If duration is not provided, use the active selection range if available, otherwise use a short default duration consistent with current editor behavior.
- Use readable defaults: centered alignment, high contrast color, safe bottom margin, and optional stroke over busy footage.

### `update_text_items`

Status: new required tool.

Purpose:

- Update existing text overlay items without recreating them.
- Support batch editing of many text items in one tool call.

Required input fields:

- `itemIds`: text item IDs to update.
- `patch`: partial update object.
- `selectionBehavior`: optional `select_updated`, `keep_current`, or `none`.

Patch fields:

- `text`
- `from`
- `durationInFrames`
- `startTimeInSeconds`
- `durationInSeconds`
- `left`
- `top`
- `width`
- `height`
- `xOnCanvas`
- `yOnCanvas`
- `opacity`
- `rotation`
- `fontFamily`
- `fontStyle`
- `fontSize`
- `lineHeight`
- `letterSpacing`
- `align`
- `direction`
- `color`
- `strokeWidth`
- `strokeColor`
- `fadeInDurationInSeconds`
- `fadeOutDurationInSeconds`

Validation requirements:

- Confirm every target item exists.
- Confirm every target item is a text item.
- Fetch item data before update if the subagent does not already have full item data.
- Apply only provided fields.
- Preserve all unspecified fields.
- Return clear per-item errors for missing or non-text IDs.

Client behavior:

- Use existing editor state actions, especially `changeItem`.
- Select updated items when `selectionBehavior` is `select_updated`.
- Report success or error through the existing tool-result channel using `toolCallId`.
- Return updated item data and a fresh project state digest.

## Client And Server Connections

Shared types:

- Add `delegateTextOverlayTask` and `updateTextItems` to `editorToolNames`.
- Add realtime payload types for `update_text_items`.
- Keep all payload schemas in `packages/api-types` as the shared source of truth.

Server:

- Add `createDelegateTextOverlayTaskTool`.
- Add or preserve `createAddTextItemsTool`.
- Add `createUpdateTextItemsTool`.
- Register `delegate_text_overlay_task` in the main agent tool map.
- Register `add_text_items` and `update_text_items` only in the text subagent tool map.
- Reuse the existing realtime dispatch and `registerToolResult` promise flow.

Frontend:

- Keep `useAddTextItems`.
- Add `useUpdateTextItems`.
- Add bridge type guards for `update_text_items`.
- Wire the realtime bridge to call the new hook.
- Use `api.tools.reportToolResult` exactly like existing editor tools.

Panel parity:

- The subagent must be able to control the same meaningful properties exposed in the Text sidebar and Text inspector: layout, alignment, position, typography, fill, stroke, opacity, rotation, and fades.
- Any inspector property that cannot be modified by the subagent must be listed as a known gap in this file before implementation is marked complete.

## Project State Requirements

The subagent needs a compact but complete state digest.

Required state fields:

- Project ID.
- Canvas width and height.
- FPS.
- Project duration.
- Current playhead frame/time.
- Selected item IDs.
- Track order and item order.
- All visible text item IDs.
- Text item summaries: text, start, duration, position, size, font, color, opacity, rotation, fade values.
- Nearby captions or subtitle tracks, so text does not cover subtitles.
- Relevant image/video background item summaries when available.

The current project state digest must be improved if it only reports asset-backed items. Text overlays must be visible to the subagent.

## Operating Rules

- Start by reading project state unless the delegator provided a fresh enough snapshot.
- Use `get_items_data` before editing existing text.
- Prefer `update_text_items` for existing text and `add_text_items` for new text.
- Use `set_captions` only for spoken subtitles.
- Do not delete user text unless the request explicitly asks for removal or replacement.
- Keep text inside canvas-safe margins.
- Keep lower thirds above captions when captions are visible.
- Use batch operations for multiple similar text edits.
- Return `needs_clarification` if the requested target text cannot be identified.
- Keep tool results short enough for the parent agent.

## Remotion And Rendering Notes

- Text rendering must remain deterministic in Remotion.
- Future renderer changes involving fonts should load fonts before measuring or rendering.
- Future fit-to-box behavior should use a real text measurement utility rather than guessing font sizes.
- Typewriter-style animation should reveal text by slicing visible characters or words, not by animating every character opacity independently.

## Acceptance Scenarios

- User says: "Add 'Bonjour Paris' at the bottom for the first 5 seconds." The main agent calls the text delegator. The subagent creates one bottom-centered text item with readable defaults.
- User says: "Move this title to the middle and make it bigger." The subagent reads selected item data, updates position and font size, and selects the item.
- User says: "Make all labels white with a black outline." The subagent updates the relevant text items in one batch.
- User says: "Add subtitles." The text subagent is not used; the main agent should use captions tooling instead.

## Test Requirements

- Unit test the delegator schema and compact result shape.
- Unit test that the main agent does not expose `add_text_items` or `update_text_items` directly.
- Unit test `update_text_items` validation for missing IDs, non-text IDs, and partial patches.
- Frontend test or manual verification that `useUpdateTextItems` changes text content, typography, layout, and timing.
- Run `pnpm --filter api-types build`.
- Run `pnpm --filter server exec tsc`.
- Run `pnpm --filter frontend exec tsc`.

# Shape Overlay Subagent Requirements

## Purpose

The shape overlay subagent is a one-time-use AI SDK specialist for visual emphasis shapes in the video editor. It handles solid blocks, highlight rectangles, lower-third backgrounds, frames, separators, simple masks, and callout backgrounds without exposing every shape-specific tool to the main video editor agent.

The main agent stays an orchestrator. It should decide that the user request is shape-specific, gather the current editor context, and call `delegate_shape_overlay_task` with the exact user instruction and relevant project state.

The first implementation should reuse the existing `solid` item model. Richer geometric shapes may be added later only if the item schema, inspector, and Remotion renderer are extended together.

## Main Agent Contract

Add one high-level tool to the main agent:

`delegate_shape_overlay_task`

Input requirements:

- `userRequest`: exact natural language request from the user.
- `projectId`: current project identifier.
- `conversationContext`: short summary from the main agent, only if needed.
- `targetItemIds`: optional shape or solid item IDs if the user selected or referenced existing shapes.
- `timeRange`: optional requested time range in seconds or frames.
- `placementHint`: optional placement such as `behind-title`, `bottom`, `full-screen`, `highlight-subject`, or `divider`.
- `styleHint`: optional style summary such as `semi-transparent black rounded rectangle`.
- `projectStateSnapshot`: compact current project state, including selected items, tracks, canvas size, fps, duration, and visible overlay items.

Execution requirements:

- Spawn a one-time AI SDK subagent using the existing AI Gateway/model configuration.
- Do not hardcode model names in the delegator.
- Pass `abortSignal` to the subagent run.
- Use `toModelOutput` to return only a compact result to the main agent.
- Keep detailed shape tools out of the main agent tool list.

Output requirements:

- `status`: `success`, `partial_success`, `needs_clarification`, or `error`.
- `createdItemIds`: IDs of created shape items.
- `updatedItemIds`: IDs of updated shape items.
- `deletedItemIds`: IDs of deleted shape items, if any.
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

Shape tools:

- `add_shape_items`
- `update_shape_items`

The subagent should not receive text tools, image tools, caption tools, upload tools, or video analysis tools unless a later requirement explicitly adds them.

## Shape Tool Requirements

### Supported Shape Model

Version 1 support:

- Back all shapes with the current `solid` item type.
- Treat `solid`, `rectangle`, and `rounded_rectangle` as direct rectangle variants.
- Treat `square` as a rectangle with equal width and height.
- Treat `circle` or `ellipse` as a solid item with large border radius, if the renderer supports that visual result.

Future extension support:

- `line`, `triangle`, `arrow`, and complex callout shapes require explicit item schema and renderer work.
- Do not expose unsupported future shapes as working tools.
- If future shapes use `@remotion/shapes`, the renderer must be updated and tested for Lambda rendering.

### `add_shape_items`

Status: new required tool.

Purpose:

- Add one or more shape overlay items to the timeline.
- Return created item IDs and updated project state.

Required input fields:

- `items`: array of shape item creation requests.
- `items[].shapeKind`: `solid`, `rectangle`, `rounded_rectangle`, `square`, `circle`, or `ellipse`.
- `items[].startFrame` or `items[].startTimeInSeconds`.
- `items[].durationInFrames` or `items[].durationInSeconds`.
- `items[].xOnCanvas`: optional x position in canvas coordinates.
- `items[].yOnCanvas`: optional y position in canvas coordinates.
- `items[].style`: optional shape style and layout object.

Required style fields:

- `left`
- `top`
- `width`
- `height`
- `opacity`
- `rotation`
- `fillColor`
- `borderRadius`
- `keepAspectRatio`
- `fadeInDurationInSeconds`
- `fadeOutDurationInSeconds`

Validation requirements:

- Accept either frame-based timing or second-based timing.
- Reject conflicting start fields when both values disagree.
- Reject conflicting duration fields when both values disagree.
- Clamp opacity to the editor-supported range.
- Require positive width and height.
- Map unsupported shape kinds to an error, not an approximation.

Default behavior:

- If placement is not provided, create the shape centered on the canvas.
- If duration is not provided, use the active selection range if available, otherwise use a short default duration consistent with current editor behavior.
- For highlights, use a translucent fill by default.
- For lower-third backgrounds, place behind the related text item when possible.

### `update_shape_items`

Status: new required tool.

Purpose:

- Update existing shape or solid items without recreating them.
- Support batch editing of many shape items in one tool call.

Required input fields:

- `itemIds`: shape or solid item IDs to update.
- `patch`: partial update object.
- `selectionBehavior`: optional `select_updated`, `keep_current`, or `none`.

Patch fields:

- `shapeKind`
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
- `fillColor`
- `borderRadius`
- `keepAspectRatio`
- `fadeInDurationInSeconds`
- `fadeOutDurationInSeconds`

Validation requirements:

- Confirm every target item exists.
- Confirm every target item is a shape-compatible item.
- Fetch item data before update if the subagent does not already have full item data.
- Apply only provided fields.
- Preserve all unspecified fields.
- Return clear per-item errors for missing or non-shape IDs.

Client behavior:

- Use existing editor state actions, especially `addItem` and `changeItem`.
- Select created or updated shapes when requested.
- Report success or error through the existing tool-result channel using `toolCallId`.
- Return updated item data and a fresh project state digest.

## Client And Server Connections

Shared types:

- Add `delegateShapeOverlayTask`, `addShapeItems`, and `updateShapeItems` to `editorToolNames`.
- Add realtime payload types for `add_shape_items` and `update_shape_items`.
- Keep all payload schemas in `packages/api-types` as the shared source of truth.

Server:

- Add `createDelegateShapeOverlayTaskTool`.
- Add `createAddShapeItemsTool`.
- Add `createUpdateShapeItemsTool`.
- Register `delegate_shape_overlay_task` in the main agent tool map.
- Register `add_shape_items` and `update_shape_items` only in the shape subagent tool map.
- Reuse the existing realtime dispatch and `registerToolResult` promise flow.

Frontend:

- Add `useAddShapeItems`.
- Add `useUpdateShapeItems`.
- Add bridge type guards for both shape tools.
- Wire the realtime bridge to call the new hooks.
- Use `api.tools.reportToolResult` exactly like existing editor tools.

Panel parity:

- The subagent must be able to control the same meaningful properties exposed in the Shapes sidebar and Solid inspector: layout, alignment, position, dimensions, fill, opacity, border radius, rotation, keep aspect ratio, and fades.
- Any inspector property that cannot be modified by the subagent must be listed as a known gap before implementation is marked complete.

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
- All visible solid or shape item IDs.
- Shape item summaries: kind, start, duration, position, size, fill color, opacity, border radius, rotation, fade values.
- Nearby text item summaries, so shapes can be placed behind related labels or lower thirds.
- Nearby captions or subtitle tracks, so shapes do not cover captions.

The current project state digest must be improved if it only reports asset-backed items. Solid and shape overlays must be visible to the subagent.

## Operating Rules

- Start by reading project state unless the delegator provided a fresh enough snapshot.
- Use `get_items_data` before editing existing shapes.
- Prefer `update_shape_items` for existing shapes and `add_shape_items` for new shapes.
- Use translucent shapes for highlights unless the user asks for an opaque block.
- Avoid covering captions, faces, and primary subject areas when state gives enough context.
- Place lower-third shapes behind text items when the text item is known.
- Do not delete user shapes unless the request explicitly asks for removal or replacement.
- Use batch operations for multiple similar shape edits.
- Return `needs_clarification` if the requested target shape cannot be identified.
- Keep tool results short enough for the parent agent.

## Remotion And Rendering Notes

- Solid-backed shapes should remain deterministic in Remotion.
- Future support for geometric shapes should use renderer-level primitives rather than CSS-only guesses when precision matters.
- If future shape rendering uses `@remotion/shapes`, verify local preview and Lambda rendering.
- Animated shape reveals should use simple opacity, scale, or progress-based animation that is stable across frame renders.

## Acceptance Scenarios

- User says: "Add a black translucent rounded rectangle behind this title." The main agent calls the shape delegator. The subagent reads the title item data and creates a lower-third shape behind it.
- User says: "Highlight the product in the center for 3 seconds." The subagent creates a translucent rectangle in the requested time range.
- User says: "Make this shape less opaque and round the corners." The subagent updates the selected shape item.
- User says: "Add an arrow pointing to the logo." The subagent returns `needs_clarification` or `partial_success` unless arrow support has been implemented in the item schema and renderer.

## Test Requirements

- Unit test the delegator schema and compact result shape.
- Unit test that the main agent does not expose `add_shape_items` or `update_shape_items` directly.
- Unit test `add_shape_items` validation for unsupported shape kinds, invalid dimensions, and conflicting timing fields.
- Unit test `update_shape_items` validation for missing IDs, non-shape IDs, and partial patches.
- Frontend test or manual verification that shape creation and updates affect layout, fill, opacity, border radius, timing, and selection.
- Run `pnpm --filter api-types build`.
- Run `pnpm --filter server exec tsc`.
- Run `pnpm --filter frontend exec tsc`.

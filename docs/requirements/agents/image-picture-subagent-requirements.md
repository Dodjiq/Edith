# Image And Picture Subagent Requirements

## Purpose

The image and picture subagent is a one-time-use AI SDK specialist for image overlays in the video editor. It handles existing uploaded image assets, logos, stickers, still images, product screenshots, decorative pictures, and picture-in-picture stills without exposing every image-specific tool to the main video editor agent.

The main agent stays an orchestrator. It should decide that the user request is image-specific, gather the current editor context, and call `delegate_image_picture_task` with the exact user instruction and relevant project state.

The first implementation works only with assets already present in the project library. It must not claim to upload, fetch, generate, or edit image files unless separate tools are added for those capabilities.

## Main Agent Contract

Add one high-level tool to the main agent:

`delegate_image_picture_task`

Input requirements:

- `userRequest`: exact natural language request from the user.
- `projectId`: current project identifier.
- `conversationContext`: short summary from the main agent, only if needed.
- `targetItemIds`: optional image item IDs if the user selected or referenced existing image overlays.
- `targetAssetIds`: optional library asset IDs if the user referenced known images.
- `timeRange`: optional requested time range in seconds or frames.
- `placementHint`: optional placement such as `top-right-logo`, `center`, `picture-in-picture`, `full-screen`, or `background`.
- `styleHint`: optional style summary such as `rounded corners at 70 percent opacity`.
- `projectStateSnapshot`: compact current project state, including selected items, tracks, canvas size, fps, duration, visible overlay items, and available image assets.

Execution requirements:

- Spawn a one-time AI SDK subagent using the existing AI Gateway/model configuration.
- Do not hardcode model names in the delegator.
- Pass `abortSignal` to the subagent run.
- Use `toModelOutput` to return only a compact result to the main agent.
- Keep detailed image tools out of the main agent tool list.

Output requirements:

- `status`: `success`, `partial_success`, `needs_clarification`, or `error`.
- `createdItemIds`: IDs of created image items.
- `updatedItemIds`: IDs of updated image items.
- `deletedItemIds`: IDs of deleted image items, if any.
- `selectedItemIds`: IDs selected after execution.
- `usedAssetIds`: library image asset IDs used by the edit.
- `summary`: one or two sentences describing the edit.
- `unresolvedIssue`: short issue if the subagent could not complete the request.

## Specialist Tool Access

Total specialist tools: 8.

Read tools:

- `get_project_state`
- `get_items_data`
- `get_library_assets_data`

Timeline tools:

- `place_library_assets_on_timeline`
- `select_timeline_items`
- `place_timeline_items`
- `delete_items`

Image tools:

- `update_image_items`

Optional image wrapper:

- `add_image_items`

The optional `add_image_items` wrapper is recommended if `place_library_assets_on_timeline` is too broad for the image subagent. The wrapper should accept only image asset IDs and internally use the existing placement logic.

The subagent should not receive upload tools, image generation tools, text tools, shape tools, caption tools, or video analysis tools unless a later requirement explicitly adds them.

## Image Tool Requirements

### `add_image_items`

Status: optional but recommended.

Purpose:

- Place one or more existing image assets on the timeline with image-specific validation.
- Prevent the subagent from accidentally placing audio, video, or unsupported assets.

Required input fields:

- `items`: array of image placement requests.
- `items[].assetId`: existing library asset ID.
- `items[].startFrame` or `items[].startTimeInSeconds`.
- `items[].durationInFrames` or `items[].durationInSeconds`.
- `items[].xOnCanvas`: optional x position in canvas coordinates.
- `items[].yOnCanvas`: optional y position in canvas coordinates.
- `items[].style`: optional image style and layout object.

Required style fields:

- `left`
- `top`
- `width`
- `height`
- `opacity`
- `rotation`
- `borderRadius`
- `keepAspectRatio`
- `fadeInDurationInSeconds`
- `fadeOutDurationInSeconds`
- `objectFit`

Validation requirements:

- Confirm the asset exists.
- Confirm the asset is uploaded and ready.
- Confirm the asset type is image-compatible.
- Reject audio and video assets.
- Treat animated GIFs as a separate path if the editor has a dedicated GIF item type.
- Accept either frame-based timing or second-based timing.
- Reject conflicting start fields when both values disagree.
- Reject conflicting duration fields when both values disagree.
- Require positive width and height when dimensions are provided.

Default behavior:

- If placement is not provided, place the image centered on the canvas.
- If the user asks for a logo, default to top-right with safe margins.
- If duration is not provided, use the active selection range if available, otherwise use a short default duration consistent with current editor behavior.
- Use `keepAspectRatio: true` by default.

### `update_image_items`

Status: new required tool.

Purpose:

- Update existing image overlay items without recreating them.
- Support batch editing of many image items in one tool call.

Required input fields:

- `itemIds`: image item IDs to update.
- `patch`: partial update object.
- `selectionBehavior`: optional `select_updated`, `keep_current`, or `none`.

Patch fields:

- `assetId`
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
- `borderRadius`
- `keepAspectRatio`
- `fadeInDurationInSeconds`
- `fadeOutDurationInSeconds`
- `objectFit`

Validation requirements:

- Confirm every target item exists.
- Confirm every target item is an image item.
- Fetch item data before update if the subagent does not already have full item data.
- Apply only provided fields.
- Preserve all unspecified fields.
- If `assetId` changes, validate the new asset before updating.
- Return clear per-item errors for missing or non-image IDs.

Client behavior:

- Use existing editor state actions, especially `changeItem`.
- Select created or updated images when requested.
- Report success or error through the existing tool-result channel using `toolCallId`.
- Return updated item data and a fresh project state digest.

## Client And Server Connections

Shared types:

- Add `delegateImagePictureTask`, `updateImageItems`, and optionally `addImageItems` to `editorToolNames`.
- Add realtime payload types for `update_image_items` and optionally `add_image_items`.
- Keep all payload schemas in `packages/api-types` as the shared source of truth.

Server:

- Add `createDelegateImagePictureTaskTool`.
- Add `createUpdateImageItemsTool`.
- Add optional `createAddImageItemsTool`.
- Register `delegate_image_picture_task` in the main agent tool map.
- Register `update_image_items` and optional `add_image_items` only in the image subagent tool map.
- Keep `place_library_assets_on_timeline` available to the image subagent only if it is constrained through prompt guidance or a wrapper.
- Reuse the existing realtime dispatch and `registerToolResult` promise flow.

Frontend:

- Add `useUpdateImageItems`.
- Add optional `useAddImageItems` if the wrapper is implemented.
- Add bridge type guards for image tools.
- Wire the realtime bridge to call the new hooks.
- Use `api.tools.reportToolResult` exactly like existing editor tools.

Panel parity:

- The subagent must be able to control the same meaningful properties exposed in the Images panel and Image inspector: placement, dimensions, timing, opacity, rotation, border radius, keep aspect ratio, and fades.
- If object fit is added, the Image item type, inspector, and Remotion renderer must all support it.
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
- All visible image item IDs.
- Image item summaries: asset ID, start, duration, position, size, opacity, rotation, border radius, keep aspect ratio, fade values.
- Available image asset summaries: asset ID, name, type, dimensions when known, status, and whether the asset is ready for placement.
- Nearby text and caption summaries, so images do not cover important overlays.

The current project state digest must be improved if it only reports asset-backed timeline items without enough style and layout detail. Existing image overlays and available image assets must be visible to the subagent.

## Operating Rules

- Start by reading project state unless the delegator provided a fresh enough snapshot.
- Use `get_library_assets_data` before placing images if asset details are not already present.
- Use `get_items_data` before editing existing images.
- Prefer `update_image_items` for existing images.
- Prefer `add_image_items` if implemented; otherwise use `place_library_assets_on_timeline` carefully with image asset IDs only.
- Do not claim to upload, download, generate, or edit image files.
- If the requested image is not in the library, return `needs_clarification` and explain that the asset must be uploaded first.
- Keep logos inside safe margins.
- Use `keepAspectRatio: true` unless the user asks for stretching.
- Avoid covering captions, faces, and primary subject areas when state gives enough context.
- Use batch operations for multiple similar image edits.
- Keep tool results short enough for the parent agent.

## Remotion And Rendering Notes

- Render still images with Remotion `<Img>`, not native `img`, Next `Image`, or CSS background images inside Remotion compositions.
- Keep `pauseWhenLoading` behavior for images that must be loaded before a frame renders.
- Keep `onError` handling so failed image loads can cancel the render with a useful error.
- Remote image URLs must be CORS-compatible for rendering.
- Animated GIFs should use the editor's GIF-specific rendering path, not plain `<Img>`, if animation is required.
- Future object-fit support must be reflected in the item type, inspector, and renderer together.

## Acceptance Scenarios

- User says: "Put my logo in the top right for the whole video." The main agent calls the image delegator. The subagent finds a ready logo asset, places it top-right with safe margins, and selects it.
- User says: "Make this picture smaller and round the corners." The subagent reads the selected image item and updates size and border radius.
- User says: "Use the product screenshot as a picture-in-picture in the middle." The subagent validates the image asset and places it centered with aspect ratio preserved.
- User says: "Generate an image and add it." The subagent returns `needs_clarification` or a clear unsupported-capability result unless image generation tools exist.

## Test Requirements

- Unit test the delegator schema and compact result shape.
- Unit test that the main agent does not expose `update_image_items` or optional `add_image_items` directly.
- Unit test `update_image_items` validation for missing IDs, non-image IDs, invalid asset replacement, and partial patches.
- If `add_image_items` is implemented, unit test image-only asset validation.
- Frontend test or manual verification that image updates affect layout, opacity, border radius, timing, and selection.
- Manual verification that GIFs are not accidentally treated as still images when animated rendering is expected.
- Run `pnpm --filter api-types build`.
- Run `pnpm --filter server exec tsc`.
- Run `pnpm --filter frontend exec tsc`.

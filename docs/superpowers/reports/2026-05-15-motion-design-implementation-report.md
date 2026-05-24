# Motion Design Implementation Report

Date: 2026-05-15
Status: implemented and verified locally
Original spec: `docs/superpowers/specs/2026-05-15-motion-design-agent-design.md`

## Summary

Framedeck now has a motion design system built around a shared template catalog, a manual Motion panel, a new `motion-design` timeline item type, Remotion-based rendering, and a GPT-5.5 specialist sub-agent.

The final architecture matches the spec:

- the main agent delegates motion work through `delegate_motion_design_task`;
- the motion specialist chooses from a whitelist of templates;
- low-level motion tools are only exposed to the specialist;
- the frontend owns real timeline mutations through realtime tool calls;
- the renderer uses deterministic Remotion frame-based animation logic.

This keeps motion design editable on the timeline while avoiding runtime TSX injection or arbitrary component generation.

## User-Facing Result

The editor sidebar now includes a `Motion` panel.

Users can:

- search and filter motion design presets;
- add a preset at the current playhead;
- select the resulting timeline item;
- edit template props, colors, text, numbers, position, size, opacity, rotation, and fades.

Motion design items behave like normal overlay items. They can be selected, moved, trimmed, deleted, duplicated through existing flows, and rendered in the final composition.

## AI Result

The main agent now exposes one public motion design tool:

```text
delegate_motion_design_task
```

The main agent should use it for animated titles, kinetic typography, lower thirds, counters, gradients, particles, typewriter/code animations, 3D-style scenes, intros, outros, transitions, and decorative motion overlays.

The motion specialist receives this bounded tool set:

```text
get_project_state
get_items_data
get_motion_design_templates
select_timeline_items
place_timeline_items
delete_items
add_motion_design_items
update_motion_design_items
```

The specialist can inspect the project, choose a template, configure props, create or update timeline items, and return a compact JSON result.

## Shared Catalog

The catalog lives in:

```text
packages/api-types/src/motion-design.ts
```

It exports the template model, template IDs, categories, default props, editable controls, UI descriptions, and agent-facing descriptions.

Important exports:

- `motionDesignTemplates`
- `motionDesignTemplateIds`
- `motionDesignTemplateAgentDescriptions`
- `motionDesignTemplatesForAgents`
- `getMotionDesignTemplate`
- `getMotionDesignTemplateForAgent`

The catalog is shared by frontend UI and backend AI tools, so manual editing and agent editing use the same list of presets.

## Agent Descriptions

Each template now has a richer `agentDescription` in addition to the compact UI `description`.

The UI description stays short for cards. The agent description explains when to choose the template. For example, "speaker names" can match `lower-third-slide`, and "milestone" can match `counter-confetti`.

The specialist prompt explicitly tells the sub-agent to use `agentDescription` as the main guide when choosing templates.

## Template Coverage

The first catalog includes 46 motion design presets across:

- `text`
- `typewriter`
- `code`
- `gradient`
- `particles`
- `motion`
- `data`
- `3d`
- `showcase`

Representative templates:

| Template | Best Use |
| --- | --- |
| `blur-word-title` | cinematic hero titles and chapter openers |
| `fade-in-text` | subtle readable text overlays |
| `word-by-word` | quotes, hooks, punchlines, spoken pacing |
| `lower-third-slide` | speaker names, roles, interview labels |
| `cli-simulation` | terminal commands and build logs |
| `basic-code-block` | readable code snippet reveal |
| `counter-pop` | metrics, KPIs, stats, percentages |
| `counter-confetti` | celebratory milestone metrics |
| `gradient-wash` | full-frame section transitions |
| `particles-snow` | calm ambience and gentle texture |
| `confetti-hit` | short celebration bursts |
| `list-reveal` | checklists, process steps, takeaways |
| `fracture-reassemble` | dramatic break-apart transitions |
| `card-stack-3d` | stacked concepts, features, chapters |
| `carousel-3d` | rotating feature or testimonial cards |
| `cursor-flyover` | product demos and UI walkthroughs |
| `terminal-3d` | developer demos with layered terminal depth |
| `remotion-bits-promo` | compact montage of motion primitives |

## Frontend Implementation

New motion item files:

```text
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/items/motion-design/motion-design-item-type.ts
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/items/motion-design/create-motion-design-item.ts
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/items/motion-design/motion-design-layer.tsx
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/items/motion-design/motion-design-renderer-utils.ts
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/items/motion-design/motion-design-text-renderers.tsx
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/items/motion-design/motion-design-visual-renderers.tsx
```

The item type stores `templateId`, `props`, layout fields, opacity, rotation, duration, and fades.

The renderer uses:

- `useCurrentFrame()`;
- `useVideoConfig()`;
- local sequence timing from frame 0;
- deterministic interpolation and seeded randomness;
- inline critical styles for reliable Remotion and Lambda rendering.

The editor was updated so `motion-design` participates in rendering, timeline previews, item colors, fade behavior, inspector routing, digest summaries, and item data retrieval.

## Motion Panel And Inspector

New panel:

```text
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/sidebar-panel/motion-design-panel.tsx
```

New inspector:

```text
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/inspector/motion-design-inspector.tsx
```

The panel includes categories, search, preset cards, and add-at-playhead behavior.

Search includes:

- label;
- short description;
- agent description;
- tags;
- source bit name.

The inspector renders editable controls from the shared catalog and adds standard layout, opacity, rotation, and fade controls.

## Realtime Bridge

The frontend now handles:

```text
add_motion_design_items
update_motion_design_items
```

New helper files:

```text
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/hooks/use-add-motion-design-items.ts
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/hooks/use-update-motion-design-items.ts
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/hooks/motion-design-tool-utils.ts
apps/frontend/src/app/projects/[project-id]/_editor-container/editor/realtime/motion-design-realtime-guards.ts
```

The bridge validates payloads, creates or updates real timeline items, selects updated items when requested, refreshes project state, and reports results back to the server.

## Backend Implementation

Shared realtime types were extended in:

```text
packages/api-types/src/realtime.constants.ts
```

New tool names:

```text
delegate_motion_design_task
get_motion_design_templates
add_motion_design_items
update_motion_design_items
```

New backend files:

```text
apps/server/src/ai-gateway/tools/tool-creators/motion-design.tools.ts
apps/server/src/ai-gateway/tools/tool-creators/motion-design-agent.ts
apps/server/src/ai-gateway/tools/tool-creators/motion-design-validation.ts
apps/server/src/ai-gateway/tools/tool-creators/motion-design.tools.spec.ts
```

The delegate tool creates a one-time `ToolLoopAgent` using:

```text
openai/gpt-5.5
```

The specialist prompt requires whitelisted template IDs, uses `agentDescription` for matching intent, prefers updates for existing motion items, keeps overlays inside the canvas, and returns JSON only.

## Project State Digest

The project state digest now includes visible motion design item summaries.

Summaries can include:

- item id;
- template id;
- template label;
- timing;
- layout;
- text or label props.

This helps the specialist update existing motion designs instead of recreating them blindly.

## Remotion Config

Updated:

```text
apps/frontend/remotion.config.ts
```

The config now aliases `@` to `apps/frontend/src`. This fixed a local Remotion bundling failure for imports like `@/components/ui/dialog`.

No files under `_editor-container/remotion/` were modified, so the project rule did not require `pnpm remotion:deploy`.

## Verification

Commands run successfully:

```bash
pnpm --filter api-types build
pnpm --filter frontend exec tsc
pnpm --filter server exec tsc
pnpm --filter server test -- motion-design.tools.spec.ts tools.service.spec.ts messages.service.spec.ts
pnpm --filter server test -- motion-design.tools.spec.ts
```

Local Remotion still render also succeeded:

```bash
pnpm --filter frontend exec remotion still Main /tmp/framedeck-motion-render.png --props=/tmp/framedeck-motion-render-props.json --frame=30
```

The rendered image was written to `/tmp/framedeck-motion-render.png`.

Known warnings:

- Remotion warned that local `zod` was `3.25.76` while it expected `4.3.6`, but rendering succeeded.
- Server Jest still prints the existing `ts-jest` warning about compiling `api-types/dist/*.js` while `allowJs` is false, but tests pass.

## Design Decisions

- Motion templates are whitelisted and shared through `api-types`.
- The frontend owns timeline mutations.
- The main agent delegates, while the specialist handles motion-specific details.
- Agent selection descriptions are separate from short UI descriptions.
- Rendering is frame-driven and deterministic for local preview and Lambda compatibility.

## Follow-Up Opportunities

- Generate actual animated thumbnails for template cards.
- Add template-specific placement presets.
- Improve collision avoidance with captions, faces, and subject regions.
- Add small evaluation prompts for common motion requests.
- Consider splitting the catalog by category if it grows much larger.
- Investigate the Remotion `zod` version warning before production render deployment.

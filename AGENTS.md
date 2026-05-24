# Framedeck - AI Video Editor

AI-powered video editing software - edit videos with natural language prompts (remove silences, add b-rolls, subtitles, motion designs).

## Stack

Turborepo monorepo with ts-rest type safety. PNPM package manager.

```
apps/
├── frontend/          # Next.js 16, React 19, Tailwind, Shadcn, Zustand
├── server/            # Nest.js 11, AI SDK, S3, WebSocket (Socket.IO)
└── media-processor/   # Rust/Axum (internal-only, Speechmatics transcription)
packages/
└── api-types/         # Shared ts-rest contracts + Zod schemas
```

## Commands

```bash
pnpm install                    # Install dependencies
pnpm dev                        # Run all apps
pnpm --filter frontend dev      # Frontend only
pnpm --filter server dev        # Server only
pnpm --filter frontend exec tsc # Typecheck frontend
pnpm --filter server exec tsc   # Typecheck server
pnpm --filter api-types build   # Build shared types
```

## Architecture

### ts-rest Pattern

Contract in `packages/api-types` is single source of truth. When adding routes:

1. Extend `apiContracts` in `packages/api-types` with Zod schemas
2. Server: bind with `@TsRestHandler(apiContracts.endpoint)`, delegate logic to service
3. Frontend: consume via `api.<router>.<endpoint>.useMutation()` or `.useQuery()`

Never hardcode URLs - use the `api` object which reads from env.

### Upload Pipeline

1. Client → `POST /uploads/init` (get uploadId + presigned URLs)
2. Client → `POST /uploads/:uploadId/sign-parts` (sign chunks)
3. Client → Direct S3 PUT via `directS3Upload()` (parallel, Transfer Acceleration)
4. Client → `POST /uploads/:uploadId/complete`
5. Server → Triggers Speechmatics transcription (async)
6. Server → Triggers TwelveLabs video analysis (async, video-only)
7. Results arrive via WebSocket (`transcriptionComplete`, `upload:videoAnalysisComplete`)

Asset status: `pending-upload` → `in-progress` → `transcribing` → `uploaded`

### Video Analysis (TwelveLabs)

- Triggered on `POST /uploads/:uploadId/complete` for video assets; runs in parallel with Speechmatics transcription (does not block upload completion).
- Pipeline: presigned S3 GET URL → TwelveLabs indexing → 5x prompt analysis in parallel → WebSocket `upload:videoAnalysisComplete`.
- Frontend stores results on `asset.summary` (`macroView`, `causalLogic`, `sequentialSummary`, `socket`, `plug`).

### Agent-Driven Editor

- **AI Gateway** (`ai-gateway.service.ts`): Streams text/reasoning via AI SDK, calls tools from `ToolsService.getTools()`. Tool calls emit WebSocket events (start/delta/end/result).
- **Tools** (`tools.service.ts`): Zod-validated tools named via `editorToolNames`. `selectTimelineItems` dispatches via `RealtimeService`. `removeSilences` waits for frontend result via `registerToolResult` (toolCallId-based promises).
- **WebSocket** (`WebSocketProvider.tsx`): Routes messages by `RealtimeMessageType` to registered handlers.
- **Editor Bridge** (`editor-realtime-bridge.tsx`): Handles `realtimeMessageTypes.editor`, delegates to hooks, reports results back to server.

## Key Rules (backend and frontend)

- **SIMPLE CODE**: Keep code SHORT and EASY. No overengineering. Use simple patterns.
- **Shadcn components**: Use from `apps/frontend/src/components`. Missing? Install via shadcn MCP.
- **Tooltip**: Always use `apps/frontend/src/components/tooltip.tsx`
- **IconButton**: Always use `apps/frontend/src/components/buttons/IconButton.tsx`
- **File size**: Keep under 300 lines - extract to subfolders with descriptive names.
- **Strings**: Single quotes.
- **Comments**: English only, add only when REALLY necessary to explain ambiguous things.
- **Logs**: `console.log` (or this.logger.log) for quick debug (remove after), `console.debug`(or this.logger.debug) for long-term dev logs. For the backend, when creating new important function, prefer to add debug at the beginning the important function and a log at the end to log the end of the process.

## Frontend Specifics

- Arrow function components: `const MyComponent: React.FC = () => { ... }`
- Strictly type state: `useState<string>('')` not `useState('')`
- Upload via `directS3Upload` from `upload.ts`
- Transcription results arrive via `useTranscriptionListener` hook
- Always use the Image tag for images for optimizations.

## Server Specifics

- Use AI SDK for AI calls - check Context7 MCP for current docs
- Controllers use `@TsRestHandler`, services contain business logic
- Temp files: `temporary-files/[input|output]/[fileName]-${crypto.randomUUID()}`
- Always add logs in the .catch to debug more easily.
- Before implementing Supabase changes, read the most relevant guide in `docs/supabase` (migrations, RLS, Edge Functions, schema style, realtime) and follow its instructions; if multiple guides apply, prioritize the most specific one.

## Naming Conventions

| Type       | Pattern             | Examples                                                  |
| ---------- | ------------------- | --------------------------------------------------------- |
| Variables  | Descriptive         | `projectData`, `audioPlayerCurrentTime` (not `data`, `t`) |
| Booleans   | `is/has/can` prefix | `isLoading`, `hasAccess`, `canEdit`                       |
| Functions  | Action verbs        | `calculateDuration()`, `validatePermissions()`            |
| Components | PascalCase + role   | `TranslationProgressIndicator.tsx`                        |

**Consistency**: Use same term everywhere (e.g., "project" not mixing with "job" or "task").

**Multiple params (3+)**: Use object parameter:

```typescript
function calculatePosition({ startTime, duration, pixelsPerSecond }: PositionParams): number;
```

## MCP Servers

Always use MCP for library documentation instead of web search.

| MCP          | Use For                                                               |
| ------------ | --------------------------------------------------------------------- |
| **Context7** | External library docs (AI SDK, Zustand, etc.) |
| **shadcn**   | Install/search UI components                  |

## Supported Media

Audio: MP3, WAV, AAC, FLAC, OGG
Video: MP4, MOV, MKV, AVI, WebM, ProRes (up to 50GB+ raw footage)

Uploads use S3 multipart with Transfer Acceleration for large files.

<p align="center">
  <img src="./public/icon.png" alt="Edith icon" width="88" />
</p>

# Edith Frontend

Next.js 16 app for the Edith editor: timeline editing, asset uploads, AI chat controls, realtime task progress, Remotion previews, and render orchestration.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)
![Remotion](https://img.shields.io/badge/Remotion-4.0-0b84f3?style=flat-square)

[Features](#features) - [Getting started](#getting-started) - [Development](#development) - [Project structure](#project-structure) - [Rendering](#rendering)

## Features

- Timeline editor with canvas, inspector, library, snapping, trimming, fades, captions, undo/redo, and drag interactions.
- AI chat panel that sends project state to the server and renders streaming text, reasoning, and tool calls.
- Multipart uploads directly to S3 through typed `ts-rest` API hooks.
- Realtime Socket.IO listeners for upload, transcription, video analysis, render progress, and editor tool results.
- Remotion compositions for previewing and rendering the current project.

## Getting started

From the monorepo root:

```bash
pnpm install
pnpm --filter frontend dev
```

With portless enabled, open:

```text
http://edith.localhost:1355
```

To run without portless:

```bash
PORTLESS=0 pnpm --filter frontend dev
```

## Environment

Create `apps/frontend/.env` from `.env.example`.

| Variable                             | Purpose                                            |
| ------------------------------------ | -------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL_BACKEND`       | Nest API base URL                                  |
| `NEXT_PUBLIC_BASE_URL_WEBSOCKET`     | Socket.IO server URL                               |
| `NEXT_PUBLIC_EDITOR_API_BASE`        | Optional prefix for editor route-handler calls     |
| `REMOTION_AWS_BUCKET_NAME`           | S3 bucket used by Remotion Lambda and media assets |
| `REMOTION_AWS_ACCESS_KEY_ID`         | AWS access key                                     |
| `REMOTION_AWS_SECRET_ACCESS_KEY`     | AWS secret key                                     |
| `REMOTION_AWS_REGION`                | AWS region                                         |
| `REMOTION_AWS_TRANSFER_ACCELERATION` | Enables S3 Transfer Acceleration when available    |
| `OPENAI_API_KEY`                     | Required for captioning flows that use OpenAI      |

> [!TIP]
> In normal portless development, `scripts/dev.sh` injects the backend and WebSocket URLs automatically.

## Development

| Command                                  | Description                     |
| ---------------------------------------- | ------------------------------- |
| `pnpm --filter frontend dev`             | Start the Next.js dev server    |
| `pnpm --filter frontend build`           | Build the production app        |
| `pnpm --filter frontend start`           | Start the production server     |
| `pnpm --filter frontend lint`            | Run ESLint                      |
| `pnpm --filter frontend exec tsc`        | Typecheck the app               |
| `pnpm --filter frontend remotion:studio` | Open Remotion Studio            |
| `pnpm --filter frontend remotion:deploy` | Deploy the Remotion Lambda site |

## Project structure

```text
src/
├── app/
│   ├── projects/[project-id]/_editor-container/   # Editor, timeline state, Remotion templates
│   ├── projects/[project-id]/_chatbot/            # AI chat UI, prompt state, conversation payloads
│   └── api/                                       # Next route handlers used by the frontend
├── components/                                    # shadcn/custom UI primitives
├── hooks/                                         # Shared React hooks
├── lib/                                           # Client utilities and integrations
├── styles/                                        # Global styles
└── utils/                                         # Cross-feature utilities
```

## Key files

| File                                                                                         | Purpose                               |
| -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `src/app/projects/[project-id]/_editor-container/editor/utils/api.ts`                        | Typed API client setup                |
| `src/app/projects/[project-id]/_editor-container/editor/utils/upload.ts`                     | Direct multipart S3 upload helper     |
| `src/app/projects/[project-id]/_editor-container/editor/realtime/editor-realtime-bridge.tsx` | Frontend bridge for server tool calls |
| `src/app/projects/[project-id]/_editor-container/remotion/Root.tsx`                          | Remotion composition root             |
| `src/app/projects/[project-id]/_chatbot/hooks/useChat.ts`                                    | Chat streaming and message state      |

## Rendering

Use Remotion Studio while developing templates:

```bash
pnpm --filter frontend remotion:studio
```

Deploy the Lambda site after changing files under:

```text
src/app/projects/[project-id]/_editor-container/remotion/
```

```bash
pnpm --filter frontend remotion:deploy
```

> [!IMPORTANT]
> UI-only changes outside the Remotion template folder do not require a Remotion redeploy.

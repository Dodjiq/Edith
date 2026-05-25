# Framedeck Server

NestJS 11 backend for Framedeck. It exposes the typed API, streams realtime editor events, orchestrates AI tools, manages S3 uploads, starts transcription/video analysis jobs, and triggers Remotion renders.

![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?style=flat-square&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-black?style=flat-square&logo=socketdotio)
![AI SDK](https://img.shields.io/badge/AI%20SDK-6-black?style=flat-square)

[Responsibilities](#responsibilities) - [Getting started](#getting-started) - [Environment](#environment) - [Modules](#modules) - [API workflow](#api-workflow)

## Responsibilities

- Serve `ts-rest` routes defined in `packages/api-types`.
- Stream chat responses and tool progress through the AI Gateway.
- Coordinate editor tools such as timeline selection and silence removal.
- Create, sign, complete, and abort S3 multipart uploads.
- Start ElevenLabs Scribe v2 transcription and TwelveLabs video analysis after upload completion.
- Push realtime status updates through Socket.IO.
- Trigger and track Remotion Lambda renders.

## Getting started

From the monorepo root:

```bash
pnpm install
pnpm --filter api-types build
pnpm --filter server dev
```

With portless enabled, the server is available at:

```text
http://api-ai-video-editor.localhost:1355
```

To run without portless:

```bash
PORTLESS=0 pnpm --filter server dev
```

## Environment

Create `apps/server/.env` from `.env.example`.

| Variable                    | Purpose                                                                    |
| --------------------------- | -------------------------------------------------------------------------- |
| `PORT`                      | Direct local server port, defaults to `4000`                               |
| `FRONTEND_URL`              | Allowed frontend origin                                                    |
| `WEBSOCKET_ALLOWED_ORIGINS` | Socket.IO allowed origins                                                  |
| `MEDIA_PROCESSOR_URL`       | Rust media processor URL                                                   |
| `AI_GATEWAY_API_KEY`        | AI Gateway key when using gateway-backed models                            |
| `AI_GATEWAY_LOCAL_LOGS`     | Set to `true` to write local AI usage and full conversation logs            |
| `OPENAI_API_KEY`            | OpenAI or compatible provider key                                          |
| `OPENAI_BASE_URL`           | Optional OpenAI-compatible base URL                                        |
| `ELEVENLABS_API_KEY`        | ElevenLabs API key for Scribe v2 transcription and voice generation         |
| `DEEPGRAM_API_KEY`          | Deepgram API key                                                           |
| `12LABS_API_KEY`            | TwelveLabs video analysis API key                                          |
| `TWELVELABS_INDEX_NAME`     | Base index name for project-scoped TwelveLabs indexes                      |
| `TWELVELABS_INDEX_ID`       | Optional existing TwelveLabs index ID                                      |
| `REMOTION_AWS_*`            | AWS credentials, bucket, region, and transfer acceleration for S3/Remotion |
| `REMOTION_LAMBDA_FUNCTION_NAME` | Optional explicit Remotion Lambda function name                         |

> [!NOTE]
> In portless mode, `scripts/dev.sh` injects `FRONTEND_URL`, `WEBSOCKET_ALLOWED_ORIGINS`, and `MEDIA_PROCESSOR_URL`.

## Development

| Command                           | Description              |
| --------------------------------- | ------------------------ |
| `pnpm --filter server dev`        | Start Nest in watch mode |
| `pnpm --filter server build`      | Build to `dist/`         |
| `pnpm --filter server configure:s3-cors` | Allow browser multipart uploads to S3 |
| `pnpm --filter server start:prod` | Run the production build |
| `pnpm --filter server lint`       | Run ESLint with fixes    |
| `pnpm --filter server test`       | Run unit tests           |
| `pnpm --filter server test:e2e`   | Run e2e tests            |
| `pnpm --filter server test:cov`   | Run coverage             |
| `pnpm --filter server exec tsc`   | Typecheck the app        |

## Modules

```text
src/
├── ai-gateway/       # Streaming AI responses, model config, tool execution
├── audio/            # Silence detection endpoint
├── aws/              # S3 presigning and multipart helpers
├── captions/         # Caption generation and retrieval
├── deepgram/         # Deepgram integration
├── elevenlabs/       # ElevenLabs Scribe v2 transcription and voice integration
├── messages/         # Chat message endpoints
├── realtime/         # Socket.IO gateway and event service
├── render/           # Remotion Lambda render endpoint
├── upload/           # Upload lifecycle routes and background processing
└── video-analysis/   # TwelveLabs indexing and prompt analysis
```

## API workflow

Routes start in the shared contract:

```text
packages/api-types/src/index.ts
```

Then the server binds handlers with `@TsRestHandler(apiContracts.<router>.<endpoint>)` and delegates business logic into services.

> [!IMPORTANT]
> Update `api-types` first when changing request or response shapes. The frontend and server both compile against that contract.

## Realtime flow

The server emits upload, transcription, video analysis, render, and editor-tool events through `RealtimeService`. The frontend receives them through `WebSocketProvider` and editor bridge handlers, then reports tool results back to `POST /tools/report-result` when needed.

## Upload flow

1. `POST /uploads/init`
2. `POST /uploads/:uploadId/sign-parts`
3. Browser uploads parts directly to S3.
4. `POST /uploads/:uploadId/complete`
5. Server starts transcription and video analysis background jobs.

For video transcription, the server calls the media processor to extract MP3 audio before sending it to ElevenLabs Scribe v2.

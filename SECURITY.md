# Security

Please do not report security issues in public GitHub issues.

Use GitHub private vulnerability reporting if it is enabled on the repository. If it is not enabled yet, contact the maintainer privately before sharing exploit details.

## Sensitive Data

Never commit real values from `.env` files. Edith uses external credentials for AWS, AI Gateway/OpenAI, ElevenLabs, TwelveLabs, and Deepgram.

Local AI conversation logging is disabled by default. Set `AI_GATEWAY_LOCAL_LOGS=true` only for local debugging, and do not publish files from `apps/server/data/`.

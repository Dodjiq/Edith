import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { URL } from 'node:url';

const port = Number(process.env.PORT ?? process.env.RUST_MEDIA_PROCESSOR_PORT ?? '4005');
const mode = process.env.MEDIA_PROCESSOR_DEV_MODE;
const healthUrl = `http://127.0.0.1:${port}/health`;
const publicUrl = process.env.PORTLESS_URL ?? `http://127.0.0.1:${port}`;

const shouldUseFallback = () => {
  if (mode === 'fallback') {
    return true;
  }

  if (mode === 'rust') {
    return false;
  }

  if (process.platform !== 'darwin') {
    return false;
  }

  const result = spawnSync('xcodebuild', ['-license', 'check'], {
    encoding: 'utf8',
  });

  return result.status === 69;
};

const isExistingServerHealthy = async () => {
  try {
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(1_000),
    });

    if (!response.ok) {
      return false;
    }

    const text = await response.text();
    return text.trim() === 'OK';
  } catch {
    return false;
  }
};

const waitForSignals = () => {
  const keepAlive = setInterval(() => {}, 60_000);

  return new Promise(() => {
    for (const event of ['SIGINT', 'SIGTERM']) {
      process.on(event, () => {
        clearInterval(keepAlive);
        process.exit(0);
      });
    }
  });
};

const reuseExistingServerIfAvailable = async () => {
  const isHealthy = await isExistingServerHealthy();

  if (!isHealthy) {
    return false;
  }

  console.log(`Media processor is already running on ${healthUrl}. Reusing existing dev server.`);
  await waitForSignals();
  return true;
};

const startRustWatcher = async () => {
  if (await reuseExistingServerIfAvailable()) {
    return;
  }

  const child = spawn('cargo', ['watch', '-x', 'run'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  for (const event of ['SIGINT', 'SIGTERM']) {
    process.on(event, () => {
      child.kill(event);
    });
  }
};

const createFfmpegArgs = (inputUrl) => {
  return [
    '-hide_banner',
    '-loglevel',
    'warning',
    '-probesize',
    '32768',
    '-analyzeduration',
    '500000',
    '-reconnect',
    '1',
    '-reconnect_streamed',
    '1',
    '-reconnect_delay_max',
    '5',
    '-threads',
    '0',
    '-i',
    inputUrl,
    '-vn',
    '-dn',
    '-sn',
    '-map',
    '0:a:0',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '128k',
    '-ar',
    '44100',
    '-ac',
    '1',
    '-f',
    'mp3',
    'pipe:1',
  ];
};

const extractAudio = (inputUrl) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', createFfmpegArgs(inputUrl), {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const stdoutChunks = [];
    const stderrChunks = [];

    ffmpeg.stdout.on('data', (chunk) => {
      stdoutChunks.push(chunk);
    });

    ffmpeg.stderr.on('data', (chunk) => {
      stderrChunks.push(chunk);
    });

    ffmpeg.on('error', (error) => {
      reject(error);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks));
        return;
      }

      reject(new Error(Buffer.concat(stderrChunks).toString('utf8') || `FFmpeg exited with code ${code}`));
    });
  });
};

const startFallbackServer = async () => {
  if (await reuseExistingServerIfAvailable()) {
    return;
  }

  const ffmpegCheck = spawnSync('ffmpeg', ['-version'], {
    encoding: 'utf8',
  });

  if (ffmpegCheck.status !== 0) {
    console.warn('FFmpeg is not available. /extract-audio will return 503 until ffmpeg is installed.');
  }

  const server = createServer(async (req, res) => {
    const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? `127.0.0.1:${port}`}`);

    if (req.method === 'GET' && requestUrl.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('OK');
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/extract-audio') {
      const inputUrl = requestUrl.searchParams.get('url');

      if (!inputUrl) {
        res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Missing url query parameter');
        return;
      }

      try {
        const audioBuffer = await extractAudio(inputUrl);
        res.writeHead(200, { 'content-type': 'audio/mpeg' });
        res.end(audioBuffer);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Audio extraction failed';
        const statusCode = message.includes('not found') ? 503 : 500;
        console.error(`FFmpeg extraction failed: ${message}`);
        res.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(`Audio extraction failed: ${message}`);
      }
      return;
    }

    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });

  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE' && (await reuseExistingServerIfAvailable())) {
      return;
    }

    throw error;
  });

  server.listen(port, '0.0.0.0', () => {
    console.log('Xcode license is not accepted, using Node fallback for media processor dev.');
    console.log(`Media processor fallback listening on ${publicUrl}`);
  });

  for (const event of ['SIGINT', 'SIGTERM']) {
    process.on(event, () => {
      server.close(() => {
        process.exit(0);
      });
    });
  }
};

const main = async () => {
  if (shouldUseFallback()) {
    await startFallbackServer();
    return;
  }

  await startRustWatcher();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

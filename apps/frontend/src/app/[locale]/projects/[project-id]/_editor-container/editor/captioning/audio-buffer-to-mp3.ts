import { AudioBufferSource, BufferTarget, Mp3OutputFormat, Output } from 'mediabunny';

type AudioPreset = {
  bitrate?: number;
  channels: number;
  sampleRate: number;
};

const MP3_PRESETS: AudioPreset[] = [
  { bitrate: 192_000, channels: 2, sampleRate: 48_000 },
  { bitrate: 160_000, channels: 2, sampleRate: 44_100 },
  { bitrate: 128_000, channels: 1, sampleRate: 44_100 },
];

const WAV_PRESET: AudioPreset = { channels: 1, sampleRate: 16_000 };
const PRIMARY_PRESET = MP3_PRESETS[0];

export const MP3_MIME_TYPE = 'audio/mpeg';
export const MP3_EXTENSION = '.mp3';
export const WAV_MIME_TYPE = 'audio/wav';
export const WAV_EXTENSION = '.wav';
export const CAPTION_SAMPLE_RATE = PRIMARY_PRESET.sampleRate;
export const CAPTION_CHANNELS = PRIMARY_PRESET.channels;
export const MAX_DURATION_ALLOWING_CAPTIONING_IN_SEC = 2 * 60 * 60;

const resampleBuffer = async (buffer: AudioBuffer, preset: AudioPreset): Promise<AudioBuffer> => {
  if (buffer.numberOfChannels === preset.channels && buffer.sampleRate === preset.sampleRate) {
    return buffer;
  }

  const offlineCtx = new OfflineAudioContext(
    preset.channels,
    Math.ceil(buffer.duration * preset.sampleRate),
    preset.sampleRate,
  );
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);
  source.start();

  return offlineCtx.startRendering();
};

const encodeAudioBufferToMp3 = async (
  audioBuffer: AudioBuffer,
): Promise<{ buffer: ArrayBuffer; mimeType: string; extension: string }> => {
  const errors: string[] = [];

  for (const preset of MP3_PRESETS) {
    const target = new BufferTarget();
    const output = new Output({
      format: new Mp3OutputFormat(),
      target,
    });

    const audioSource = new AudioBufferSource({
      codec: 'mp3',
      bitrate: preset.bitrate ?? 128_000,
      bitrateMode: 'constant',
    });

    output.addAudioTrack(audioSource);

    try {
      const resampled = await resampleBuffer(audioBuffer, preset);
      await output.start();
      await audioSource.add(resampled);
      await output.finalize();

      if (!target.buffer) {
        throw new Error('No MP3 data was produced.');
      }

      return { buffer: target.buffer, mimeType: MP3_MIME_TYPE, extension: MP3_EXTENSION };
    } catch (error) {
      errors.push(
        `${(preset.bitrate ?? 0) / 1000}kbps ${preset.channels}ch ${preset.sampleRate}Hz -> ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  throw new Error(errors.join(' | '));
};

const encodeAudioBufferToWav = async (
  audioBuffer: AudioBuffer,
): Promise<{ buffer: ArrayBuffer; mimeType: string; extension: string }> => {
  const resampled = await resampleBuffer(audioBuffer, WAV_PRESET);
  const bytesPerSample = 2;
  const blockAlign = WAV_PRESET.channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + resampled.length * bytesPerSample);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + resampled.length * bytesPerSample, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, WAV_PRESET.channels, true);
  view.setUint32(24, WAV_PRESET.sampleRate, true);
  view.setUint32(28, WAV_PRESET.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, resampled.length * bytesPerSample, true);

  const channelData = resampled.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return { buffer, mimeType: WAV_MIME_TYPE, extension: WAV_EXTENSION };
};

export const encodeCaptionsAudio = async (
  audioBuffer: AudioBuffer,
): Promise<{ buffer: ArrayBuffer; mimeType: string; extension: string }> => {
  try {
    const result = await encodeAudioBufferToMp3(audioBuffer);
    console.log('[encodeCaptionsAudio] MP3 encoding succeeded');
    return result;
  } catch (mp3Error) {
    console.warn('[encodeCaptionsAudio] MP3 encoding failed, falling back to WAV:', mp3Error);
    const wavResult = await encodeAudioBufferToWav(audioBuffer);
    console.log('[encodeCaptionsAudio] WAV fallback succeeded');
    return wavResult;
  }
};

export const extractAudio = async (
  src: string,
): Promise<{ buffer: ArrayBuffer; mimeType: string; extension: string }> => {
  const response = await fetch(src);
  const context = new AudioContext({ sampleRate: CAPTION_SAMPLE_RATE });
  const arrayBuffer = await response.arrayBuffer();
  const decodedBuffer = await context.decodeAudioData(arrayBuffer);
  context.close?.();

  const normalizedBuffer = await resampleBuffer(decodedBuffer, PRIMARY_PRESET);
  return encodeCaptionsAudio(normalizedBuffer);
};

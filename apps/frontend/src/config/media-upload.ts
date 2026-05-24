export const MEDIA_UPLOAD_CONFIG = {
  accept: 'image/*,video/*,audio/*',
  description: 'Video, Audio, Images',
  maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
  extensions: {
    video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v'],
    audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'],
  },
} as const;

export type MediaType = keyof typeof MEDIA_UPLOAD_CONFIG.extensions;

export const getMediaType = (filename: string): MediaType | null => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const { extensions } = MEDIA_UPLOAD_CONFIG;

  if ((extensions.video as readonly string[]).includes(extension)) return 'video';
  if ((extensions.audio as readonly string[]).includes(extension)) return 'audio';
  if ((extensions.image as readonly string[]).includes(extension)) return 'image';

  return null;
};

import { AssetUploadProgress } from '../assets/assets';
import { getBackendUrl } from '@/utils/services/backend-url';

const getUploadUrl = (path: string): string => `${getBackendUrl()}${path}`;

export interface RustUploadResponse {
  fileKey: string;
  readUrl: string;
  transcription?: Array<{
    text: string;
    startMs: number;
    endMs: number;
    timestampMs: number | null;
    confidence: number | null;
  }>;
}

export interface MultipartUploadResult {
  fileKey: string;
  readUrl: string;
}

export interface MultipartUploadOptions {
  file: Blob;
  filename: string;
  assetId: string;
  contentType: string;
  needsTranscription: boolean;
  needsVideoAnalysis: boolean;
  projectId?: string;
  onProgress?: (progress: AssetUploadProgress) => void;
}

interface InitMultipartResponse {
  uploadId: string;
  key: string;
  partSize: number;
  maxConcurrency: number;
}

interface SignPartsResponse {
  presignedUrls: Array<{ partNumber: number; url: string }>;
}

interface CompletedPart {
  partNumber: number;
  etag: string;
}

/**
 * Upload a file directly to S3 using multipart presigned URLs.
 * Progress is tracked locally (client-side) during chunk uploads.
 */
export const directS3Upload = async ({
  file,
  filename,
  assetId,
  contentType,
  needsTranscription,
  needsVideoAnalysis,
  projectId,
  onProgress,
}: MultipartUploadOptions): Promise<MultipartUploadResult> => {
  const initResponse = await fetch(getUploadUrl('/uploads/init'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType, fileSize: file.size }),
  });

  if (!initResponse.ok) {
    const error = await initResponse.json().catch(() => ({ message: 'Failed to initialize upload' }));
    throw new Error(error.message || 'Failed to initialize upload');
  }

  const { uploadId, partSize, maxConcurrency }: InitMultipartResponse = await initResponse.json();

  const totalParts = Math.ceil(file.size / partSize);
  const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

  const signResponse = await fetch(getUploadUrl(`/uploads/${uploadId}/sign-parts`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partNumbers }),
  });

  if (!signResponse.ok) {
    await abortUpload(uploadId);
    throw new Error('Failed to get presigned URLs');
  }

  const { presignedUrls }: SignPartsResponse = await signResponse.json();

  const completedParts: CompletedPart[] = [];
  let uploadedBytes = 0;

  const uploadPart = async (partInfo: { partNumber: number; url: string }): Promise<void> => {
    const start = (partInfo.partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    const chunk = file.slice(start, end);

    const response = await fetch(partInfo.url, {
      method: 'PUT',
      body: chunk,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload part ${partInfo.partNumber}: ${response.status}`);
    }

    const etag = response.headers.get('ETag') || '';
    completedParts.push({
      partNumber: partInfo.partNumber,
      etag: etag.replace(/"/g, ''),
    });

    uploadedBytes += chunk.size;
    onProgress?.({
      progress: uploadedBytes / file.size,
      loadedBytes: uploadedBytes,
      totalBytes: file.size,
    });
  };

  const queue = [...presignedUrls];
  const inFlight = new Set<Promise<void>>();
  let uploadError: Error | null = null;

  while (queue.length > 0 || inFlight.size > 0) {
    if (uploadError && inFlight.size === 0) {
      break;
    }

    while (queue.length > 0 && inFlight.size < maxConcurrency && !uploadError) {
      const partInfo = queue.shift()!;
      const uploadPromise = uploadPart(partInfo)
        .catch((error) => {
          uploadError = uploadError || (error instanceof Error ? error : new Error(String(error)));
        })
        .finally(() => {
          inFlight.delete(uploadPromise);
        });
      inFlight.add(uploadPromise);
    }

    if (inFlight.size > 0) {
      await Promise.race(inFlight);
    }

    if (uploadError && inFlight.size === 0) {
      break;
    }
  }

  if (uploadError) {
    await abortUpload(uploadId);
    throw uploadError;
  }

  const completeResponse = await fetch(getUploadUrl(`/uploads/${uploadId}/complete`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parts: completedParts.sort((a, b) => a.partNumber - b.partNumber),
      assetId,
      needsTranscription,
      needsVideoAnalysis,
      ...(projectId ? { projectId } : {}),
    }),
  });

  if (!completeResponse.ok) {
    const error = await completeResponse.json().catch(() => ({ message: 'Failed to complete upload' }));
    throw new Error(error.message || 'Failed to complete upload');
  }

  return completeResponse.json() as Promise<MultipartUploadResult>;
};

const abortUpload = async (uploadId: string): Promise<void> => {
  try {
    await fetch(getUploadUrl(`/uploads/${uploadId}/abort`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  } catch {
    // Ignore abort errors
  }
};

interface StreamingUploadOptions {
  file: Blob;
  url: string;
  formFields?: Record<string, string>;
}

/**
 * Stream upload a file to the server.
 * Progress is tracked via WebSocket events from the Rust server (receiving/uploading/transcribing phases).
 */
export const streamingUpload = async ({
  file,
  url,
  formFields = {},
}: StreamingUploadOptions): Promise<RustUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  for (const [key, value] of Object.entries(formFields)) {
    formData.append(key, value);
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<RustUploadResponse>;
};

type OnUploadProgress = (options: AssetUploadProgress) => void;

interface PresignedUploadOptions {
  file: Blob;
  url: string;
  onProgress: OnUploadProgress;
}

/**
 * Upload a file directly to S3 via presigned URL with XHR progress tracking.
 * Used for caption audio uploads that bypass the Rust media processor.
 */
export const uploadWithProgress = ({ file, url, onProgress }: PresignedUploadOptions): Promise<void> => {
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', url);

  xhr.upload.onprogress = function (event) {
    if (event.lengthComputable) {
      onProgress({
        progress: event.loaded / event.total,
        loadedBytes: event.loaded,
        totalBytes: event.total,
      });
    }
  };

  const { resolve, reject, promise } = Promise.withResolvers<void>();

  xhr.onload = function () {
    if (xhr.status === 200 || xhr.status === 201) {
      resolve();
    } else {
      reject(new Error(`Upload failed with status: ${xhr.status}`));
    }
  };

  xhr.onerror = function () {
    reject(new Error('Failed to upload'));
  };

  xhr.setRequestHeader('Content-Type', file.type);
  xhr.setRequestHeader('Cache-Control', 'public, max-age=31536000');
  xhr.send(file);

  return promise;
};

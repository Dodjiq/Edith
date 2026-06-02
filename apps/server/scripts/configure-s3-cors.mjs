import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const serverDir = resolve(scriptDir, '..');

const loadEnvFile = (path) => {
  try {
    const contents = readFileSync(path, 'utf8');

    for (const line of contents.split('\n')) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional when env vars are already exported.
  }
};

loadEnvFile(resolve(serverDir, '.env'));

const bucketName = process.env.REMOTION_AWS_BUCKET_NAME;
const region = process.env.REMOTION_AWS_REGION || 'us-east-1';

if (!bucketName) {
  throw new Error('REMOTION_AWS_BUCKET_NAME is required');
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY || '',
  },
});

const uploadCorsRule = {
  ID: 'EdithBrowserUploads',
  AllowedHeaders: ['*'],
  AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST'],
  AllowedOrigins: [
    'https://edith.localhost',
    'https://edith.localhost:*',
    'http://localhost:*',
    'http://127.0.0.1:*',
  ],
  ExposeHeaders: ['ETag'],
  MaxAgeSeconds: 3000,
};

const getExistingRules = async () => {
  try {
    const response = await s3Client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
    return response.CORSRules || [];
  } catch (error) {
    if (error?.name === 'NoSuchCORSConfiguration') {
      return [];
    }

    throw error;
  }
};

const existingRules = await getExistingRules();
const nextRules = [
  uploadCorsRule,
  ...existingRules.filter((rule) => rule.ID !== uploadCorsRule.ID),
];

await s3Client.send(
  new PutBucketCorsCommand({
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: nextRules,
    },
  }),
);

console.log(`Configured S3 CORS for ${bucketName}`);

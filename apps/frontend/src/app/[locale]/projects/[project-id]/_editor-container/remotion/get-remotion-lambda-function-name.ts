import { speculateFunctionName } from '@remotion/lambda/client';
import { VERSION } from 'remotion/version';
import { DISK_SIZE_IN_MB, MEM_SIZE_IN_MB, TIMEOUT_IN_SECONDS } from './constants';

const getVersionFromFunctionName = (functionName: string): string | null => {
  const match = functionName.match(/remotion-render-(\d+)-(\d+)-(\d+)-/);
  if (!match) {
    return null;
  }

  return `${match[1]}.${match[2]}.${match[3]}`;
};

export const getRemotionLambdaFunctionName = (functionNameOverride?: string): string => {
  const trimmedOverride = functionNameOverride?.trim();
  if (trimmedOverride) {
    const functionVersion = getVersionFromFunctionName(trimmedOverride);
    if (functionVersion && functionVersion !== VERSION) {
      throw new Error(
        `Version mismatch: REMOTION_LAMBDA_FUNCTION_NAME is set to "${trimmedOverride}" (version ${functionVersion}), but this app is using Remotion ${VERSION}. Deploy a matching Lambda function or remove REMOTION_LAMBDA_FUNCTION_NAME to use the default name.`,
      );
    }

    return trimmedOverride;
  }

  return speculateFunctionName({
    diskSizeInMb: DISK_SIZE_IN_MB,
    memorySizeInMb: MEM_SIZE_IN_MB,
    timeoutInSeconds: TIMEOUT_IN_SECONDS,
  });
};

import { getRenderProgress } from '@remotion/lambda/client';
import type {
  GetProgressPayload,
  GetProgressResponse,
} from '@/app/projects/[project-id]/_editor-container/editor/rendering/types';
import { requireServerEnv } from '@/app/projects/[project-id]/_editor-container/editor/utils/server-env';
import { getRemotionLambdaFunctionName } from '@/app/projects/[project-id]/_editor-container/remotion/get-remotion-lambda-function-name';

export const POST = async (request: Request) => {
  try {
    console.log('[Progress API] Received progress check request');
    const serverEnv = requireServerEnv();
    const body = (await request.json()) as GetProgressPayload;

    console.log('[Progress API] Request details:', {
      bucketName: body.bucketName,
      renderId: body.renderId,
    });

    if (typeof body.bucketName !== 'string') {
      console.error('[Progress API] Invalid bucketName:', body.bucketName);
      throw new Error('bucketName is not set');
    }

    if (typeof body.renderId !== 'string') {
      console.error('[Progress API] Invalid renderId:', body.renderId);
      throw new Error('renderId is not set');
    }

    const functionName = getRemotionLambdaFunctionName(serverEnv.REMOTION_LAMBDA_FUNCTION_NAME);

    console.log('[Progress API] Checking render progress...', {
      bucketName: body.bucketName,
      renderId: body.renderId,
      functionName,
      region: serverEnv.REMOTION_AWS_REGION,
    });

    const progress = await getRenderProgress({
      bucketName: body.bucketName,
      renderId: body.renderId,
      functionName,
      region: serverEnv.REMOTION_AWS_REGION,
      skipLambdaInvocation: false,
    });

    console.log('[Progress API] Progress status:', {
      done: progress.done,
      fatalErrorEncountered: progress.fatalErrorEncountered,
      overallProgress: progress.overallProgress,
    });

    if (progress.done) {
      const response: GetProgressResponse = {
        type: 'done',
        outputFile: progress.outputFile as string,
        outputSizeInBytes: progress.outputSizeInBytes as number,
        outputName:
          (progress.renderMetadata?.downloadBehavior.type === 'download'
            ? progress.renderMetadata.downloadBehavior.fileName
            : null) ?? (progress.outKey as string),
      };

      console.log('[Progress API] Render complete:', {
        outputFile: response.outputFile,
        outputSizeInBytes: response.outputSizeInBytes,
        outputName: response.outputName,
      });

      return Response.json(response);
    }

    if (progress.fatalErrorEncountered) {
      const response: GetProgressResponse = {
        type: 'error',
        error: progress.errors[0].message,
      };

      console.error('[Progress API] Render failed:', {
        error: response.error,
        allErrors: progress.errors,
      });

      return Response.json(response);
    }

    const response: GetProgressResponse = {
      type: 'in-progress',
      overallProgress: progress.overallProgress,
    };

    console.log('[Progress API] Render in progress:', {
      overallProgress: `${(progress.overallProgress * 100).toFixed(1)}%`,
    });

    return Response.json(response);
  } catch (error) {
    console.error('[Progress API] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json(
      {
        type: 'error',
        error: error instanceof Error ? error.message : 'Progress service unavailable',
      } as GetProgressResponse,
      { status: 500 },
    );
  }
};

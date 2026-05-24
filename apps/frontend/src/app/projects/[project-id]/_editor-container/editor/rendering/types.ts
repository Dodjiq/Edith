export type {RenderVideoPayload, RenderVideoResponse} from 'api-types';

export type GetProgressResponse =
	| {
			type: 'done';
			outputFile: string;
			outputSizeInBytes: number;
			outputName: string;
	  }
	| {
			type: 'in-progress';
			overallProgress: number;
	  }
	| {
			type: 'error';
			error: string;
	  };

export type GetProgressPayload = {
	bucketName: string;
	renderId: string;
};

import {ImageObjectFit} from 'api-types';
import {BaseItem, CanHaveBorderRadius, CanHaveRotation} from '../shared';

export type ImageItem = BaseItem &
	CanHaveBorderRadius &
	CanHaveRotation & {
		type: 'image';
		assetId: string;
		keepAspectRatio: boolean;
		fadeInDurationInSeconds: number;
		fadeOutDurationInSeconds: number;
		objectFit: ImageObjectFit;
	};

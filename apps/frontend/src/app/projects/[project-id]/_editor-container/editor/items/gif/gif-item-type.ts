import {BaseItem, CanHaveBorderRadius, CanHaveRotation} from '../shared';

export type GifItem = BaseItem &
	CanHaveBorderRadius &
	CanHaveRotation & {
		type: 'gif';
		gifStartFromInSeconds: number;
		playbackRate: number;
		assetId: string;
		keepAspectRatio: boolean;
		fadeInDurationInSeconds: number;
		fadeOutDurationInSeconds: number;
	};

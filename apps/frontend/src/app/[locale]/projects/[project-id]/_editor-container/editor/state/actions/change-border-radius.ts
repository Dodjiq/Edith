import {EditorStarterItem} from '../../items/item-type';
import {CanHaveBorderRadius} from '../../items/shared';

export const changeBorderRadius = ({
	item,
	borderRadius,
}: {
	item: EditorStarterItem;
	borderRadius: number;
}): EditorStarterItem => {
	return {
		...(item as CanHaveBorderRadius),
		borderRadius,
	} as EditorStarterItem;
};

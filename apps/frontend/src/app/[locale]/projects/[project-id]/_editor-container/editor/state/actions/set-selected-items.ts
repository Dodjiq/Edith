import {EditorState} from '../types';

const isSameItems = (items1: string[], items2: string[]): boolean => {
	if (items1.length !== items2.length) {
		return false;
	}

	for (const item of items1) {
		if (!items2.includes(item)) {
			return false;
		}
	}

	return true;
};

export const setSelectedItems = (
	state: EditorState,
	selectedItems: string[],
): EditorState => {
	const isSame = isSameItems(state.selectedItems, selectedItems);

	if (isSame) {
		return state;
	}

	return {
		...state,
		selectedItems,
	};
};

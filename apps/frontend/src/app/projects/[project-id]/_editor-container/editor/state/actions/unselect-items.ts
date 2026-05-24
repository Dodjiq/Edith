import {EditorState} from '../types';

export const unselectItems = (state: EditorState): EditorState => {
	if (state.selectedItems.length === 0) {
		return state;
	}

	return {
		...state,
		selectedItems: [],
	};
};

import { EditorState } from '../types';

export const setUploadError = ({
  assetId,
  error,
  canRetry = true,
  state,
}: {
  state: EditorState;
  assetId: string;
  error: Error;
  canRetry: boolean;
}): EditorState => {
  return {
    ...state,
    assetStatus: {
      ...state.assetStatus,
      [assetId]: {
        type: 'error',
        error,
        canRetry,
      },
    },
  };
};

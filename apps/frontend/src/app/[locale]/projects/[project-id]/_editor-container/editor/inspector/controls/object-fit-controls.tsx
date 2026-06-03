import type { ImageObjectFit } from 'api-types';
import React, { memo, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../select';
import { changeItem } from '../../state/actions/change-item';
import { useWriteContext } from '../../utils/use-context';
import { InspectorSubLabel } from '../components/inspector-label';

const OBJECT_FIT_OPTIONS: ImageObjectFit[] = ['fill', 'contain', 'cover'];

const ObjectFitControlsUnmemoized: React.FC<{
  itemId: string;
  objectFit: ImageObjectFit;
}> = ({ itemId, objectFit }) => {
  const { setState } = useWriteContext();

  const onObjectFitChange = useCallback(
    (value: string) => {
      const nextObjectFit = value as ImageObjectFit;
      setState({
        update: (state) =>
          changeItem(state, itemId, (item) => {
            if (item.type !== 'image') return item;
            return {
              ...item,
              objectFit: nextObjectFit,
            };
          }),
        commitToUndoStack: true,
      });
    },
    [itemId, setState],
  );

  return (
    <div>
      <InspectorSubLabel>Fit</InspectorSubLabel>
      <Select value={objectFit} onValueChange={onObjectFitChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OBJECT_FIT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export const ObjectFitControls = memo(ObjectFitControlsUnmemoized);

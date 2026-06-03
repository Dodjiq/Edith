import React, {memo} from 'react';
import {RoundnessIcon} from '../../icons/roundness';
import {changeBorderRadius} from '../../state/actions/change-border-radius';
import {changeItem} from '../../state/actions/change-item';
import {useWriteContext} from '../../utils/use-context';
import {InspectorSubLabel} from '../components/inspector-label';
import {NumberControl, NumberControlUpdateHandler} from './number-controls';

const BorderRadiusControlUnmemoized: React.FC<{
	borderRadius: number;
	itemId: string;
}> = ({borderRadius, itemId}) => {
	const {setState} = useWriteContext();

	const onRadius: NumberControlUpdateHandler = React.useCallback(
		({num, commitToUndoStack}) => {
			return setState({
				update: (state) => {
					return changeItem(state, itemId, (i) =>
						changeBorderRadius({item: i, borderRadius: num}),
					);
				},
				commitToUndoStack,
			});
		},
		[setState, itemId],
	);

	return (
		<div>
			<InspectorSubLabel>Corner Radius</InspectorSubLabel>
			<NumberControl
				label={
					<div className="flex items-center gap-1">
						<RoundnessIcon />
					</div>
				}
				setValue={onRadius}
				value={borderRadius}
				min={0}
				max={null}
				step={1}
				accessibilityLabel="Corner radius"
			/>
		</div>
	);
};

export const BorderRadiusControl = memo(BorderRadiusControlUnmemoized);

import React, {memo} from 'react';
import {changeItem} from '../../state/actions/change-item';
import {
	setPositionLeft,
	setPositionTop,
} from '../../state/actions/set-position';
import {useWriteContext} from '../../utils/use-context';
import {InspectorSubLabel} from '../components/inspector-label';
import {ControlsPadding} from './controls-padding';
import {NumberControl, NumberControlUpdateHandler} from './number-controls';

const PositionControlUnmemoized: React.FC<{
	left: number;
	top: number;
	itemId: string;
}> = ({left, top, itemId}) => {
	const {setState} = useWriteContext();

	const onLeft: NumberControlUpdateHandler = React.useCallback(
		({num, commitToUndoStack}) => {
			setState({
				update: (state) => {
					return changeItem(state, itemId, (i) =>
						setPositionLeft({item: i, left: num}),
					);
				},
				commitToUndoStack,
			});
		},
		[setState, itemId],
	);

	const onTop: NumberControlUpdateHandler = React.useCallback(
		({num, commitToUndoStack}) => {
			setState({
				update: (state) => {
					return changeItem(state, itemId, (i) =>
						setPositionTop({item: i, top: num}),
					);
				},
				commitToUndoStack,
			});
		},
		[setState, itemId],
	);

	return (
		<div>
			<InspectorSubLabel>Position</InspectorSubLabel>
			<div className="flex gap-2">
				<div className="flex-1">
					<NumberControl
						label="X"
						setValue={onLeft}
						value={left}
						min={null}
						max={null}
						step={1}
						accessibilityLabel="X"
					/>
				</div>
				<div className="flex-1">
					<NumberControl
						label="Y"
						setValue={onTop}
						value={top}
						min={null}
						max={null}
						step={1}
						accessibilityLabel="Y"
					/>
				</div>
				<ControlsPadding />
			</div>
		</div>
	);
};

export const PositionControl = memo(PositionControlUnmemoized);

import {memo, useCallback} from 'react';
import {CaptionsItem} from '../items/captions/captions-item-type';
import {SolidItem} from '../items/solid/solid-item-type';
import {TextItem} from '../items/text/text-item-type';
import {changeItem} from '../state/actions/change-item';
import {useWriteContext} from '../utils/use-context';
import {InspectorSubLabel} from './components/inspector-label';

const ColorInspectorUnmemoized: React.FC<{
	color: string;
	itemId: string;
	colorType: 'color' | 'highlightColor' | 'strokeColor';
	accessibilityLabel: string;
}> = ({color, itemId, colorType, accessibilityLabel}) => {
	const {setState} = useWriteContext();

	const onColorChange = useCallback(
		(evt: React.ChangeEvent<HTMLInputElement>) => {
			setState({
				update: (state) => {
					return changeItem(state, itemId, (i) => {
						if (colorType === 'highlightColor') {
							if (i.type !== 'captions') {
								throw new Error('Item is not a captions');
							}
							return {
								...(i as CaptionsItem),
								highlightColor: evt.target.value,
							};
						}

						if (colorType === 'strokeColor') {
							if (i.type !== 'text' && i.type !== 'captions') {
								throw new Error('Item is not a text or caption');
							}
							return {
								...(i as TextItem | CaptionsItem),
								strokeColor: evt.target.value,
							};
						}

						if (
							i.type === 'text' ||
							i.type === 'solid' ||
							i.type === 'captions'
						) {
							return {
								...(i as TextItem | SolidItem | CaptionsItem),
								color: evt.target.value,
							};
						}
						throw new Error('Invalid item type: ' + JSON.stringify(i));
					});
				},
				commitToUndoStack: true,
			});
		},
		[setState, itemId, colorType],
	);

	return (
		<div className="w-full">
			<InspectorSubLabel>
				{colorType === 'color' || colorType === 'strokeColor'
					? 'Color'
					: 'Highlight color'}
			</InspectorSubLabel>
			<input
				type="color"
				value={color}
				onChange={onColorChange}
				className="editor-starter-focus-ring"
				aria-label={accessibilityLabel}
			/>
		</div>
	);
};

export const ColorInspector = memo(ColorInspectorUnmemoized);

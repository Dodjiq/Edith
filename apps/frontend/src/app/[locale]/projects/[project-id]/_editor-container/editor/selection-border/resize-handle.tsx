import React, {memo, useCallback, useMemo} from 'react';
import {getAssetFromItem} from '../assets/utils';
import {FEATURE_SHIFT_KEY_TO_OVERRIDE_ASPECT_RATIO_LOCK} from '../flags';
import {EditorStarterItem} from '../items/item-type';
import {changeItem} from '../state/actions/change-item';
import {
	getKeepAspectRatio,
	getOriginalAspectRatio,
} from '../utils/aspect-ratio';
import {useCanvasTransformationScale} from '../utils/canvas-transformation-context';
import {isLeftClick} from '../utils/is-left-click';
import {useWriteContext} from '../utils/use-context';

const REAL_SIZE = 8;

const ResizeHandleUnmemoized: React.FC<{
	type:
		| 'top-left'
		| 'top-right'
		| 'bottom-left'
		| 'bottom-right'
		| 'top'
		| 'right'
		| 'bottom'
		| 'left';
	width: number;
	height: number;
	left: number;
	top: number;
	itemId: string;
}> = ({type, width, height, left, top, itemId}) => {
	const scale = useCanvasTransformationScale();
	const size = Math.round(REAL_SIZE / scale);

	const {setState} = useWriteContext();
	const sizeStyle: React.CSSProperties = useMemo(() => {
		if (type === 'top' || type === 'bottom') {
			return {
				height: size,
				width: width - size,
			};
		}
		if (type === 'left' || type === 'right') {
			return {
				height: height - size,
				width: size,
			};
		}
		return {
			height: size,
			width: size,
		};
	}, [size, type, width, height]);

	const margin = -size / 2 - 1 / scale;

	const styleWithoutBorder: React.CSSProperties = useMemo(() => {
		if (type === 'top-left') {
			return {
				...sizeStyle,
				marginLeft: margin,
				marginTop: margin,
				cursor: 'nwse-resize',
			};
		}
		if (type === 'top-right') {
			return {
				...sizeStyle,
				marginTop: margin,
				marginRight: margin,
				right: 0,
				cursor: 'nesw-resize',
			};
		}
		if (type === 'bottom-left') {
			return {
				...sizeStyle,
				marginBottom: margin,
				marginLeft: margin,
				bottom: 0,
				cursor: 'nesw-resize',
			};
		}
		if (type === 'bottom-right') {
			return {
				...sizeStyle,
				marginBottom: margin,
				marginRight: margin,
				right: 0,
				bottom: 0,
				cursor: 'nwse-resize',
			};
		}
		if (type === 'top') {
			return {
				...sizeStyle,
				marginTop: margin,
				left: size / 2,
				cursor: 'ns-resize',
			};
		}
		if (type === 'bottom') {
			return {
				...sizeStyle,
				marginBottom: margin,
				left: size / 2,
				bottom: 0,
				cursor: 'ns-resize',
			};
		}
		if (type === 'left') {
			return {
				...sizeStyle,
				marginLeft: margin,
				top: size / 2,
				cursor: 'ew-resize',
			};
		}
		if (type === 'right') {
			return {
				...sizeStyle,
				marginRight: margin,
				top: size / 2,
				right: 0,
				cursor: 'ew-resize',
			};
		}

		throw new Error('Unknown type: ' + JSON.stringify(type));
	}, [margin, sizeStyle, type, size]);

	const style: React.CSSProperties = useMemo(() => {
		const isEdgeHandle =
			type === 'top' ||
			type === 'bottom' ||
			type === 'left' ||
			type === 'right';

		return {
			...styleWithoutBorder,
			border: isEdgeHandle
				? 'none'
				: `${1 / scale}px solid var(--color-editor-starter-accent)`,
		};
	}, [scale, styleWithoutBorder, type]);

	const onPointerDown = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (!isLeftClick(e)) {
				return;
			}

			const initialX = e.clientX;
			const initialY = e.clientY;

			const onPointerMove = (pointerMoveEvent: PointerEvent) => {
				const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
				const naturalOffsetY = (pointerMoveEvent.clientY - initialY) / scale;

				setState({
					update: (state) => {
						return changeItem(state, itemId, (i) => {
							const keepAspectRatio = getKeepAspectRatio(i);
							const lockAspectRatio =
								(FEATURE_SHIFT_KEY_TO_OVERRIDE_ASPECT_RATIO_LOCK &&
									pointerMoveEvent.shiftKey) !== keepAspectRatio;
							const asset = getAssetFromItem({
								item: i,
								assets: state.undoableState.assets,
							});

							const aspectRatio = getOriginalAspectRatio({
								item: i,
								asset,
							});

							let newWidth: number;
							let newHeight: number;
							let newLeft: number;
							let newTop: number;

							if (type === 'top' || type === 'bottom') {
								const heightOffset =
									type === 'top' ? -naturalOffsetY : naturalOffsetY;
								newHeight = Math.round(height + heightOffset);

								if (lockAspectRatio) {
									newWidth = Math.round(newHeight * aspectRatio);
									newLeft = Math.round(left - (newWidth - width) / 2);
								} else {
									newWidth = width;
									newLeft = left;
								}

								newTop =
									type === 'top' ? Math.round(top - (newHeight - height)) : top;
							} else if (type === 'left' || type === 'right') {
								const widthOffset = type === 'left' ? -offsetX : offsetX;
								newWidth = Math.round(width + widthOffset);

								if (lockAspectRatio) {
									newHeight = Math.round(newWidth / aspectRatio);
									newTop = Math.round(top - (newHeight - height) / 2);
								} else {
									newHeight = height;
									newTop = top;
								}

								newLeft =
									type === 'left'
										? Math.round(left - (newWidth - width))
										: left;
							} else {
								const unadjustedOffsetY = lockAspectRatio
									? offsetX / aspectRatio
									: naturalOffsetY;
								const offsetY =
									lockAspectRatio &&
									(type === 'bottom-left' || type === 'top-right')
										? -unadjustedOffsetY
										: unadjustedOffsetY;

								newWidth = Math.round(
									width +
										(type === 'bottom-left' || type === 'top-left'
											? -offsetX
											: offsetX),
								);
								newHeight = Math.round(
									height +
										(type === 'top-left' || type === 'top-right'
											? -offsetY
											: offsetY),
								);
								newLeft = Math.round(
									left +
										(type === 'bottom-left' || type === 'top-left'
											? offsetX
											: 0),
								);
								newTop = Math.round(
									top +
										(type === 'top-left' || type === 'top-right' ? offsetY : 0),
								);
							}
							const updatedItem: EditorStarterItem = {
								...i,
								width: Math.max(1, newWidth),
								height: Math.max(1, newHeight),
								left: Math.min(i.left + i.width - 1, newLeft),
								top: Math.min(i.top + i.height - 1, newTop),
								...(i.type === 'text' ? {resizeOnEdit: false} : {}),
							};
							return updatedItem as EditorStarterItem;
						});
					},
					commitToUndoStack: false,
				});
			};

			const onPointerUp = () => {
				window.removeEventListener('pointermove', onPointerMove);
			};

			window.addEventListener('pointermove', onPointerMove, {passive: true});

			window.addEventListener('pointerup', onPointerUp, {
				once: true,
			});
		},
		[height, itemId, left, scale, setState, top, type, width],
	);

	const isEdgeHandle =
		type === 'top' || type === 'bottom' || type === 'left' || type === 'right';

	return (
		<div
			onPointerDown={onPointerDown}
			style={style}
			className={`absolute ${isEdgeHandle ? '' : 'bg-white'}`}
		></div>
	);
};

export const ResizeHandle = memo(ResizeHandleUnmemoized);

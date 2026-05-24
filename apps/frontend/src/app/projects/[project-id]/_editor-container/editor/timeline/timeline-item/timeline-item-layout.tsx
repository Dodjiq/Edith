import React, {useMemo, useRef} from 'react';
import {EditorStarterItem} from '../../items/item-type';
import {useTimelineAiEditStore} from '../../state/timeline-ai-edit-store';
import {clsx} from '../../utils/clsx';
import {useItemDrag} from '../utils/drag/use-timeline-item-drag';

export const TIMELINE_ITEM_BORDER_WIDTH = 1;

export function TimelineItemContainer({
	children,
	isSelected,
	item,
}: {
	children: React.ReactNode;
	isSelected: boolean;
	item: EditorStarterItem;
}) {
	const timelineItemRef = useRef<HTMLDivElement>(null);

	const {onPointerDown, onClick} = useItemDrag({
		draggedItem: item,
	});

	const isAiEditing = useTimelineAiEditStore((state) =>
		state.activeItemIds.has(item.id),
	);

	const style = useMemo(() => {
		return {
			borderWidth: TIMELINE_ITEM_BORDER_WIDTH,
		};
	}, []);

	return (
		<div
			ref={timelineItemRef}
			onPointerDown={onPointerDown}
			onClick={onClick}
			className={clsx(
				'absolute box-border h-full w-full cursor-pointer overflow-hidden rounded-sm border border-black select-none',
				isSelected && 'border-editor-starter-accent',
				isAiEditing && 'border-editor-starter-accent',
			)}
			style={style}
		>
			{children}
			{isAiEditing ? (
				<div className="timeline-ai-edit-shimmer pointer-events-none absolute inset-0 z-10" />
			) : null}
		</div>
	);
}

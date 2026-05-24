import {useCallback, useMemo, useRef, useState} from 'react';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
} from '../../context-menu';
import {Popover, PopoverAnchor, PopoverContent} from '@/components/ui/popover';
import {EditorStarterItem} from '../../items/item-type';
import {setSelectedItems} from '../../state/actions/set-selected-items';
import {useWriteContext} from '../../utils/use-context';
import {TimelineItemContextMenu} from './timeline-item-context-menu';
import {TimelineItemAiEditPopover} from './timeline-item-ai-edit-popover';

type Measurable = {
	getBoundingClientRect(): DOMRect;
};

export const ItemContextMenuTrigger = ({
	item,
	children,
}: {
	item: EditorStarterItem;
	children: React.ReactNode;
}) => {
	const {setState} = useWriteContext();

	const handleContextMenu = useCallback(() => {
		setState({
			update: (state) => {
				// if multiple items are selected, do not select anything
				if (state.selectedItems.length > 1) {
					return state;
				}

				// if only one item is selected, reset the selection
				return setSelectedItems(state, [item.id]);
			},
			commitToUndoStack: true,
		});
	}, [item.id, setState]);

	const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
	const [isAiEditOpen, setIsAiEditOpen] = useState(false);
	const [aiEditTargetItemIds, setAiEditTargetItemIds] = useState<string[]>([]);
	const aiEditAnchorRectRef = useRef<DOMRect | null>(null);

	const aiEditVirtualAnchorRef = useRef<Measurable>({
		getBoundingClientRect: () => {
			return aiEditAnchorRectRef.current ?? new DOMRect();
		},
	});

	const handleEditWithAi = useCallback(
		({targetItemIds, anchorRect}: {targetItemIds: string[]; anchorRect: DOMRect}) => {
			if (targetItemIds.length === 0) {
				return;
			}

			aiEditAnchorRectRef.current = anchorRect;
			setAiEditTargetItemIds(targetItemIds);
			setIsAiEditOpen(true);
		},
		[],
	);

	const style = useMemo(() => {
		return {
			display: 'contents',
		};
	}, []);

	const handleCloseAiEdit = useCallback(() => {
		setIsAiEditOpen(false);
		setAiEditTargetItemIds([]);
		aiEditAnchorRectRef.current = null;
	}, []);

	const handleAiEditOpenChange = useCallback(
		(open: boolean) => {
			if (open) {
				return;
			}

			handleCloseAiEdit();
		},
		[handleCloseAiEdit],
	);

	return (
		<Popover open={isAiEditOpen} onOpenChange={handleAiEditOpenChange}>
			<PopoverAnchor virtualRef={aiEditVirtualAnchorRef} className="hidden" aria-hidden="true" />
			<ContextMenu onOpenChange={setIsContextMenuOpen}>
				<ContextMenuTrigger asChild>
					<div onContextMenu={handleContextMenu} style={style}>
						{children}
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					{isContextMenuOpen && (
						<TimelineItemContextMenu item={item} onEditWithAi={handleEditWithAi} />
					)}
				</ContextMenuContent>
			</ContextMenu>
			{isAiEditOpen ? (
				<PopoverContent
					side="right"
					align="start"
					sideOffset={8}
					className="z-[10001] w-72 border-neutral-700 bg-neutral-900 p-3 text-white pointer-events-auto"
				>
					<TimelineItemAiEditPopover
						targetItemIds={aiEditTargetItemIds}
						onClose={handleCloseAiEdit}
					/>
				</PopoverContent>
			) : null}
		</Popover>
	);
};

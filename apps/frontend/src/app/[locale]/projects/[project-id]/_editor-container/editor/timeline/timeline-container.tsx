import {PlayerRef} from '@remotion/player';
import { EditorInteractionLockBoundary } from '../editor-interaction-lock-boundary';
import {DragOverlayProvider} from '../drag-overlay-provider';
import {timelineContainerRef} from '../utils/restore-scroll-after-zoom';
import {useElementSize} from '../utils/use-element-size';
import {TimelineSizeProvider} from './timeline-size-provider';

export const TimelineContainer = ({
	children,
	playerRef,
}: {
	children: React.ReactNode;
	playerRef: React.RefObject<PlayerRef | null>;
}) => {
	const timelineContainerSize = useElementSize(timelineContainerRef, {
		triggerOnWindowResize: true,
	});
	const timelineContainerWidth = timelineContainerSize?.width ?? null;

	return (
		<TimelineSizeProvider containerWidth={timelineContainerWidth}>
			<DragOverlayProvider playerRef={playerRef}>
				<EditorInteractionLockBoundary className="w-full shrink-0">
					<div
						ref={timelineContainerRef}
						className="border-t-editor-starter-border w-full shrink-0 overflow-hidden border-t shadow-lg"
					>
						{children}
					</div>
				</EditorInteractionLockBoundary>
			</DragOverlayProvider>
		</TimelineSizeProvider>
	);
};

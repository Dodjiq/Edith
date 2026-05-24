import {AssetTranscribingTask} from '../../assets/assets';
import {WaveformIcon} from '../../icons/waveform';
import {IconContainer} from './icon-container';
import {TaskContainer} from './task-container';
import {TaskDescription} from './task-description';
import {TaskSubtitle} from './task-subtitle';
import {TaskTitle} from './task-title';

export const AssetTranscribingProgress: React.FC<{
		assetTranscribingTask: AssetTranscribingTask;
	}> = ({assetTranscribingTask}) => {
		const label = 'Processing...';

		return (
			<TaskContainer>
			<IconContainer>
				<WaveformIcon />
			</IconContainer>
			<TaskDescription isError={false}>
					<TaskTitle>{assetTranscribingTask.asset.filename ?? 'File'}</TaskTitle>
					<TaskSubtitle>
						<div className="text-xs opacity-50">{label}</div>
					</TaskSubtitle>
				</TaskDescription>
			</TaskContainer>
		);
	};

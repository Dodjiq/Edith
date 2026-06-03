import React from 'react';
import { InputGroupButton } from '@/app/[locale]/projects/[project-id]/_chatbot/chatbot-components/ai-elements/prompt-input/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FEATURE_SWAP_COMPOSITION_DIMENSIONS_BUTTON } from '../../flags';
import { RotateRight } from '../../icons/rotate-right';
import { useDimensions, useWriteContext } from '../../utils/use-context';
import { NumberControl, type NumberControlUpdateHandler } from '../controls/number-controls';

type CanvasSizePreset = {
  id: string;
  label: string;
  width: number;
  height: number;
};

const CUSTOM_PRESET_ID = 'custom';

const CANVAS_SIZE_PRESETS: CanvasSizePreset[] = [
  { id: 'hd-16-9', label: '16:9 • 1920×1080', width: 1920, height: 1080 },
  { id: 'uhd-16-9', label: '4K • 3840×2160', width: 3840, height: 2160 },
  { id: 'square', label: 'Square • 1080×1080', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Vertical • 1080×1920', width: 1080, height: 1920 },
  { id: 'story', label: 'Story • 1080×1350', width: 1080, height: 1350 },
] as const;

export const useCanvasSizeControls = () => {
  const { compositionWidth, compositionHeight } = useDimensions();
  const { setState } = useWriteContext();

  const swapDimensions = React.useCallback(() => {
    setState({
      update: (state) => {
        if (state.undoableState.compositionWidth === state.undoableState.compositionHeight) {
          return state;
        }
        return {
          ...state,
          undoableState: {
            ...state.undoableState,
            compositionWidth: state.undoableState.compositionHeight,
            compositionHeight: state.undoableState.compositionWidth,
          },
        };
      },
      commitToUndoStack: true,
    });
  }, [setState]);

  const setCompositionHeight: NumberControlUpdateHandler = React.useCallback(
    ({ num, commitToUndoStack }) => {
      setState({
        update: (state) => {
          if (num === state.undoableState.compositionHeight) {
            return state;
          }
          return {
            ...state,
            undoableState: {
              ...state.undoableState,
              compositionHeight: num,
            },
          };
        },
        commitToUndoStack,
      });
    },
    [setState],
  );

  const setCompositionWidth: NumberControlUpdateHandler = React.useCallback(
    ({ num, commitToUndoStack }) => {
      setState({
        update: (state) => {
          if (num === state.undoableState.compositionWidth) {
            return state;
          }
          return {
            ...state,
            undoableState: {
              ...state.undoableState,
              compositionWidth: num,
            },
          };
        },
        commitToUndoStack,
      });
    },
    [setState],
  );

  const selectedPresetId = React.useMemo(() => {
    const presetMatch = CANVAS_SIZE_PRESETS.find(
      (preset) => preset.width === compositionWidth && preset.height === compositionHeight,
    );
    return presetMatch ? presetMatch.id : CUSTOM_PRESET_ID;
  }, [compositionHeight, compositionWidth]);

  const onPresetChange = React.useCallback(
    (value: string) => {
      if (value === CUSTOM_PRESET_ID) {
        return;
      }
      const preset = CANVAS_SIZE_PRESETS.find((item) => item.id === value);
      if (!preset) {
        return;
      }
      setState({
        update: (state) => {
          if (
            state.undoableState.compositionWidth === preset.width &&
            state.undoableState.compositionHeight === preset.height
          ) {
            return state;
          }
          return {
            ...state,
            undoableState: {
              ...state.undoableState,
              compositionWidth: preset.width,
              compositionHeight: preset.height,
            },
          };
        },
        commitToUndoStack: true,
      });
    },
    [setState],
  );

  return {
    compositionWidth,
    compositionHeight,
    swapDimensions,
    setCompositionWidth,
    setCompositionHeight,
    selectedPresetId,
    onPresetChange,
  };
};

export const CanvasSizeControls: React.FC = () => {
  const {
    compositionWidth,
    compositionHeight,
    swapDimensions,
    setCompositionWidth,
    setCompositionHeight,
    selectedPresetId,
    onPresetChange,
  } = useCanvasSizeControls();

  return (
    <>
      <div className="flex flex-row gap-2">
        <div className="flex flex-1">
          <NumberControl
            label="W"
            setValue={setCompositionWidth}
            value={compositionWidth}
            min={2}
            max={null}
            step={2}
            accessibilityLabel="Width"
          />
        </div>
        <div className="flex flex-1">
          <NumberControl
            label="H"
            setValue={setCompositionHeight}
            value={compositionHeight}
            min={2}
            max={null}
            step={2}
            accessibilityLabel="Height"
          />
        </div>
        {FEATURE_SWAP_COMPOSITION_DIMENSIONS_BUTTON && (
          <InputGroupButton
            size="icon-sm"
            className="h-9 w-9"
            onClick={swapDimensions}
            aria-label="Swap Dimensions"
          >
            <RotateRight height={12} width={12} />
          </InputGroupButton>
        )}
      </div>
      <div className="mt-2">
        <Select value={selectedPresetId} onValueChange={onPresetChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent position="popper">
            {CANVAS_SIZE_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_PRESET_ID}>Custom size</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

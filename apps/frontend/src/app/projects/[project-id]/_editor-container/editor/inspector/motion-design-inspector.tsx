import React, { memo, useCallback } from 'react';
import { getMotionDesignTemplate, motionDesignEffects, motionDesignTemplates, sanitizeMotionDesignProps } from 'api-types';
import type {
  MotionDesignControlDefinition,
  MotionDesignEffectInput,
  MotionDesignTemplateId,
  MotionDesignTemplateProps,
  MotionDesignPropValue,
} from 'api-types';
import type { MotionDesignItem } from '../items/motion-design/motion-design-item-type';
import { changeItem } from '../state/actions/change-item';
import { useWriteContext } from '../utils/use-context';
import { InspectorLabel, InspectorSubLabel } from './components/inspector-label';
import { InspectorDivider, InspectorSection } from './components/inspector-section';
import { DimensionsControls } from './controls/dimensions-controls';
import { FadeControls } from './controls/fade-controls';
import { NumberControl } from './controls/number-controls';
import { OpacityControls } from './controls/opacity-controls';
import { PositionControl } from './controls/position-control';
import { RotationControl } from './controls/rotation-controls';

const toLines = (value: unknown) => (Array.isArray(value) ? value.join('\n') : String(value ?? ''));

const parseJsonValue = (value: string, fallback: unknown) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseControlValue = (control: MotionDesignControlDefinition, value: string | number | boolean, currentValue: unknown) => {
  const controlType = control.type ?? control.kind;
  if (controlType === 'number') return Number(value);
  if (controlType === 'switch') return Boolean(value);
  if (control.key === 'items' || control.key === 'commandLines') {
    return String(value)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
  if (['chat', 'scenario', 'imageList', 'slots', 'innerProps'].includes(controlType ?? '')) {
    return parseJsonValue(String(value), currentValue);
  }
  return String(value);
};

const stringifyComplexValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? null, null, 2);
};

const MotionControl: React.FC<{
  control: MotionDesignControlDefinition;
  item: MotionDesignItem;
  onChange: (
    key: string,
    value: MotionDesignPropValue | undefined,
  ) => void;
}> = ({ control, item, onChange }) => {
  const value = item.props[control.key] ?? getMotionDesignTemplate(item.templateId)?.defaultProps[control.key];
  const controlType = control.type ?? control.kind;

  if (controlType === 'section') {
    return (
      <div className="space-y-2 rounded-md border border-white/10 p-2">
        <InspectorSubLabel>{control.label}</InspectorSubLabel>
        {control.fields?.map((field) => (
          <MotionControl key={field.key} control={field} item={item} onChange={onChange} />
        ))}
      </div>
    );
  }

  if (controlType === 'number') {
    return (
      <div>
        <InspectorSubLabel>{control.label}</InspectorSubLabel>
        <NumberControl
          value={Number(value ?? 0)}
          setValue={({ num }) => onChange(control.key, num)}
          label={control.label.slice(0, 1)}
          min={control.min ?? null}
          max={control.max ?? null}
          step={control.step ?? 1}
          accessibilityLabel={control.label}
        />
      </div>
    );
  }

  if (controlType === 'switch') {
    return (
      <label className="flex items-center justify-between gap-2 text-xs text-neutral-300">
        <span>{control.label}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(control.key, event.target.checked)}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={control.label}
        />
      </label>
    );
  }

  if (controlType === 'select') {
    return (
      <div>
        <InspectorSubLabel>{control.label}</InspectorSubLabel>
        <select
          value={String(value ?? '')}
          onChange={(event) => onChange(control.key, event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
          className="editor-starter-field w-full px-2 py-2 text-xs text-neutral-300"
          aria-label={control.label}
        >
          {control.options?.map((option) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  if (controlType === 'color') {
    return (
      <div>
        <InspectorSubLabel>{control.label}</InspectorSubLabel>
        <input
          type="color"
          value={String(value ?? '#ffffff')}
          onChange={(event) => onChange(control.key, event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
          className="editor-starter-focus-ring"
          aria-label={control.label}
        />
      </div>
    );
  }

  if (['textarea', 'chat', 'scenario', 'imageList', 'slots', 'innerProps', 'terminalLines'].includes(controlType ?? '')) {
    const isComplex = ['chat', 'scenario', 'imageList', 'slots', 'innerProps'].includes(controlType ?? '');
    return (
      <div>
        <InspectorSubLabel>{control.label}</InspectorSubLabel>
        <textarea
          value={isComplex ? stringifyComplexValue(value) : toLines(value)}
          onChange={(event) =>
            onChange(control.key, parseControlValue(control, event.target.value, value) as MotionDesignPropValue)
          }
          onKeyDown={(event) => event.stopPropagation()}
          className="editor-starter-field field-sizing-content min-h-20 w-full px-2 py-2 font-mono text-xs text-neutral-300"
          aria-label={control.label}
        />
      </div>
    );
  }

  return (
    <div>
      <InspectorSubLabel>{control.label}</InspectorSubLabel>
      <input
        value={String(value ?? '')}
        onChange={(event) =>
          onChange(control.key, parseControlValue(control, event.target.value, value) as MotionDesignPropValue)
        }
        onKeyDown={(event) => event.stopPropagation()}
        className="editor-starter-field w-full px-2 py-2 text-xs text-neutral-300"
        aria-label={control.label}
      />
    </div>
  );
};

const MotionEffectsControl: React.FC<{
  item: MotionDesignItem;
  onChange: (effects: MotionDesignEffectInput[] | undefined) => void;
}> = ({ item, onChange }) => (
  <div>
    <InspectorSubLabel>Effects JSON</InspectorSubLabel>
    <textarea
      value={JSON.stringify(item.effects ?? [], null, 2)}
      onChange={(event) => {
        const parsed = parseJsonValue(event.target.value, item.effects ?? []);
        onChange(Array.isArray(parsed) ? (parsed as MotionDesignEffectInput[]) : item.effects);
      }}
      onKeyDown={(event) => event.stopPropagation()}
      className="editor-starter-field field-sizing-content min-h-24 w-full px-2 py-2 font-mono text-xs text-neutral-300"
      aria-label="Motion effects JSON"
    />
    <p className="mt-1 text-[10px] leading-4 text-neutral-500">
      Available: {motionDesignEffects.map((effect) => effect.id).join(', ')}
    </p>
  </div>
);

const MotionDesignInspectorUnmemoized: React.FC<{ item: MotionDesignItem }> = ({ item }) => {
  const { setState } = useWriteContext();
  const template = getMotionDesignTemplate(item.templateId);

  const updateItem = useCallback(
    (updater: (previous: MotionDesignItem) => MotionDesignItem, commitToUndoStack = true) => {
      setState({
        update: (state) => changeItem(state, item.id, (previous) => updater(previous as MotionDesignItem)),
        commitToUndoStack,
      });
    },
    [item.id, setState],
  );

  const setTemplate = useCallback(
    (templateId: MotionDesignTemplateId) => {
      const nextTemplate = getMotionDesignTemplate(templateId);
      if (!nextTemplate) return;
      updateItem((previous) => ({
        ...previous,
        templateId,
        props: sanitizeMotionDesignProps(templateId, { ...nextTemplate.defaultProps, ...previous.props }),
        durationInFrames: nextTemplate.defaultDurationInFrames,
      }));
    },
    [updateItem],
  );

  const setProp = useCallback(
    (key: string, value: MotionDesignPropValue | undefined) => {
      updateItem((previous) => ({
        ...previous,
        props: {
          ...previous.props,
          [key]: value,
        },
      }));
    },
    [updateItem],
  );

  const setEffects = useCallback(
    (effects: MotionDesignEffectInput[] | undefined) => {
      updateItem((previous) => ({
        ...previous,
        effects,
      }));
    },
    [updateItem],
  );

  return (
    <div>
      <InspectorSection>
        <InspectorLabel>Motion</InspectorLabel>
        <div>
          <InspectorSubLabel>Template</InspectorSubLabel>
          <select
            value={item.templateId}
            onChange={(event) => setTemplate(event.target.value as MotionDesignTemplateId)}
            onKeyDown={(event) => event.stopPropagation()}
            className="editor-starter-field w-full px-2 py-2 text-xs text-neutral-300"
            aria-label="Motion template"
          >
            {motionDesignTemplates.map((templateItem) => (
              <option key={templateItem.id} value={templateItem.id}>
                {templateItem.label}
              </option>
            ))}
          </select>
        </div>
        {template?.controls.map((control) => (
          <MotionControl key={control.key} control={control} item={item} onChange={setProp} />
        ))}
        {template?.supportsEffects ? <MotionEffectsControl item={item} onChange={setEffects} /> : null}
      </InspectorSection>
      <InspectorDivider />
      <InspectorSection>
        <InspectorLabel>Layout</InspectorLabel>
        <PositionControl left={item.left} top={item.top} itemId={item.id} />
        <DimensionsControls itemId={item.id} height={item.height} width={item.width} />
        <RotationControl rotation={item.rotation} itemId={item.id} />
      </InspectorSection>
      <InspectorDivider />
      <InspectorSection>
        <InspectorLabel>Visibility</InspectorLabel>
        <OpacityControls opacity={item.opacity} itemId={item.id} />
      </InspectorSection>
      <InspectorDivider />
      <InspectorSection>
        <InspectorLabel>Fade</InspectorLabel>
        <FadeControls
          fadeInDuration={item.fadeInDurationInSeconds}
          fadeOutDuration={item.fadeOutDurationInSeconds}
          itemId={item.id}
          durationInFrames={item.durationInFrames}
        />
      </InspectorSection>
    </div>
  );
};

export const MotionDesignInspector = memo(MotionDesignInspectorUnmemoized);

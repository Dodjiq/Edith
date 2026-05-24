export * from './types';
export { legacyMotionDesignTemplates } from './legacy';
export { motionStudioEffects, motionStudioMotionDesignTemplates } from './motion-studio';

import { legacyMotionDesignTemplateAgentDescriptions, legacyMotionDesignTemplates } from './legacy';
import { motionStudioEffects, motionStudioMotionDesignTemplates } from './motion-studio';
import type {
  MotionDesignEffectDefinition,
  MotionDesignTemplate,
  MotionDesignTemplateProps,
  MotionDesignTemplateWithAgentDescription,
} from './types';

export const motionDesignTemplates = [
  ...legacyMotionDesignTemplates,
  ...motionStudioMotionDesignTemplates,
] as readonly MotionDesignTemplate[];

export type MotionDesignTemplateId = (typeof motionDesignTemplates)[number]['id'];

export const motionDesignTemplateIds = motionDesignTemplates.map((templateItem) => templateItem.id);

export const motionDesignEffects = motionStudioEffects as unknown as readonly MotionDesignEffectDefinition[];

export const motionDesignEffectIds = motionDesignEffects.map((effect) => effect.id);

export const motionDesignTemplateAgentDescriptions: Record<string, string> = Object.fromEntries(
  motionDesignTemplates.map((templateItem) => [
    templateItem.id,
    (legacyMotionDesignTemplateAgentDescriptions as Record<string, string>)[templateItem.id] ??
    templateItem.detail ??
    templateItem.description,
  ]),
);

export const motionDesignTemplatesForAgents: readonly MotionDesignTemplateWithAgentDescription[] =
  motionDesignTemplates.map((templateItem) => ({
    ...templateItem,
    agentDescription: motionDesignTemplateAgentDescriptions[templateItem.id],
  }));

export const getMotionDesignTemplate = (templateId: string): MotionDesignTemplate | undefined =>
  motionDesignTemplates.find((templateItem) => templateItem.id === templateId);

export const getMotionDesignTemplateForAgent = (
  templateId: string,
): MotionDesignTemplateWithAgentDescription | undefined =>
  motionDesignTemplatesForAgents.find((templateItem) => templateItem.id === templateId);

export const getMotionDesignEffect = (effectId: string): MotionDesignEffectDefinition | undefined =>
  motionDesignEffects.find((effect) => effect.id === effectId);

export const motionDesignKnownPropKeys = Array.from(
  new Set(
    motionDesignTemplates.flatMap((templateItem) => [
      ...Object.keys(templateItem.defaultProps),
      ...templateItem.controls.flatMap((control) => [
        control.key,
        ...(control.fields?.map((field) => field.key) ?? []),
      ]),
    ]),
  ),
);

export const getMotionDesignSupportedPropKeys = (templateId: string): readonly string[] => {
  const templateItem = getMotionDesignTemplate(templateId);
  if (!templateItem) return [];
  return Array.from(
    new Set([
      ...Object.keys(templateItem.defaultProps),
      ...templateItem.controls.flatMap((control) => [
        control.key,
        ...(control.fields?.map((field) => field.key) ?? []),
      ]),
    ]),
  );
};

export const getUnsupportedMotionDesignPropKeys = (
  templateId: string,
  props: MotionDesignTemplateProps | undefined,
): string[] => {
  if (!props) return [];
  const supportedKeys = new Set(getMotionDesignSupportedPropKeys(templateId));
  return Object.keys(props).filter((key) => !supportedKeys.has(key));
};

export const sanitizeMotionDesignProps = (
  templateId: string,
  props: MotionDesignTemplateProps,
): MotionDesignTemplateProps => {
  const supportedKeys = new Set(getMotionDesignSupportedPropKeys(templateId));
  return Object.fromEntries(Object.entries(props).filter(([key]) => supportedKeys.has(key))) as MotionDesignTemplateProps;
};

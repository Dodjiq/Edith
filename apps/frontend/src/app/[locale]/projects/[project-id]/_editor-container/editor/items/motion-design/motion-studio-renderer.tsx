import React from 'react';
import { getMotionDesignTemplate } from 'api-types';
import type { MotionDesignEffectInput } from 'api-types';
import { componentsById } from './motion-studio/components';
import { EffectsWrap } from './motion-studio/effects/EffectsWrap';
import type { MotionDesignItem } from './motion-design-item-type';

type MotionStudioRendererProps = {
  item: MotionDesignItem;
  durationInFrames: number;
};

const normalizeEffects = (effects: MotionDesignEffectInput[] | undefined) =>
  effects?.map((effect) => ({
    id: effect.id,
    effectId: effect.effectId,
    props: effect.props,
  }));

export const MotionStudioRenderer: React.FC<MotionStudioRendererProps> = ({ item, durationInFrames }) => {
  const template = getMotionDesignTemplate(item.templateId);
  const motionStudioId = template?.motionStudioId;
  const Component = motionStudioId ? componentsById[motionStudioId] : undefined;

  if (!template || !motionStudioId || !Component) {
    return null;
  }

  const nativeWidth = template.nativeSize?.width ?? item.width;
  const nativeHeight = template.nativeSize?.height ?? item.height;
  const scale = Math.min(item.width / nativeWidth, item.height / nativeHeight);
  const left = (item.width - nativeWidth * scale) / 2;
  const top = (item.height - nativeHeight * scale) / 2;
  const props = {
    ...template.defaultProps,
    ...item.props,
  };

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: nativeWidth,
          height: nativeHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <EffectsWrap effects={normalizeEffects(item.effects)} clipDurationInFrames={durationInFrames}>
          <Component {...props} />
        </EffectsWrap>
      </div>
    </div>
  );
};

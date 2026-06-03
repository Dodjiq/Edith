import type { MotionDesignEffectInput, MotionDesignTemplateId, MotionDesignTemplateProps } from 'api-types';
import type { BaseItem, CanHaveRotation } from '../shared';

export type MotionDesignItem = BaseItem &
  CanHaveRotation & {
    type: 'motion-design';
    templateId: MotionDesignTemplateId;
    props: MotionDesignTemplateProps;
    effects?: MotionDesignEffectInput[];
    fadeInDurationInSeconds: number;
    fadeOutDurationInSeconds: number;
  };

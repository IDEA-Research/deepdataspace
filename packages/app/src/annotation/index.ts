import BRenderer, { IBaseRendererProps } from './BaseRenderer';
import DetectionRenderer from './DetectionRenderer';
import SegmentationRenderer from './SegmentationRenderer';
import MattingRenderer from './MattingRenderer';
import KeyPointsRenderer from './KeyPointsRenderer';
import { AnnotationType } from '@/constants';

export type BaseRenderer = BRenderer;

export const createRenderer = (
  type: AnnotationType,
  props: IBaseRendererProps,
) => {
  switch (type) {
    case AnnotationType.Segmentation:
      return new SegmentationRenderer(props);
    case AnnotationType.Matting:
      return new MattingRenderer(props);
    case AnnotationType.KeyPoints:
      return new KeyPointsRenderer(props);
    default:
      // default AnnotationType.Detection
      return new DetectionRenderer(props);
  }
};

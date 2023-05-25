import BaseRenderer from './BaseRenderer';
import {
  getLabelCustomStyles,
  getSegmentationPoints,
} from '@/utils/annotation';
import { drawPolygonWithFill } from '@/utils/draw';
import { hexToRgba } from '@/utils/color';

class SegmentationRenderer extends BaseRenderer {
  public dataObjectsFilter() {
    if (!this.data) return;

    this.objects =
      this.data.objects.filter((item) => {
        return item.segmentation && this.baseObjectFilter(item);
      }) || [];
  }

  private defaultStrokeColor = '#000';

  public render() {
    // Common
    super.render();

    // draw segs
    this.objects.forEach((item) => {
      const { segmentation, categoryId } = item;
      if (segmentation) {
        const { showSegFilling, showSegContour, categoryColors } =
          this.globalDisplayOptions;
        const { diffMode, analysisMode } = this.modeDisplayOptions || {};
        let fillColor = categoryColors[categoryId || ''] || 'transparent';
        fillColor = showSegFilling ? hexToRgba(fillColor, 0.5) : 'transparent';
        let { strokeDash, lineWidth } = getLabelCustomStyles(
          item.labelId,
          diffMode?.displayLabelIds,
          diffMode?.isTiledDiff || Boolean(analysisMode),
        );
        lineWidth = showSegContour ? lineWidth : 0;
        const groups = getSegmentationPoints(
          segmentation,
          this.naturalSize,
          this.clientSize,
        );
        groups.forEach((points) => {
          drawPolygonWithFill(
            this.canvas,
            points,
            fillColor,
            this.defaultStrokeColor,
            lineWidth,
            strokeDash,
          );
        });
      }
    });
  }
}

export default SegmentationRenderer;

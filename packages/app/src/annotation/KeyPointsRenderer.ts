import { KEYPOINTS_VISIBLE_TYPE } from '@/constants';
import { getCanvasPoint, getLabelCustomStyles } from '@/utils/annotation';
import { createColorList } from '@/utils/color';
import { translateBoundingBoxToRect } from '@/utils/compute';
import { drawCircleWithFill, drawLine, drawRect } from '@/utils/draw';
import BaseRenderer from './BaseRenderer';

class KeyPointsRenderer extends BaseRenderer {
  public dataObjectsFilter() {
    if (!this.data) return;

    this.objects =
      this.data.objects.filter((item) => {
        return item.points && this.baseObjectFilter(item);
      }) || [];
  }

  public render() {
    super.render();

    const { showKeyPointsBox, showKeyPointsLine } = this.globalDisplayOptions;
    const { diffMode, analysisMode } = this.modeDisplayOptions || {};

    const lineColors = createColorList(this.objects.length);
    const pointThickness = this.clientSize.width > 400 ? 3 : 1.5;
    this.objects.forEach((item, index) => {
      const { colorAplha, strokeDash, lineWidth } = getLabelCustomStyles(
        item.labelId,
        diffMode?.displayLabelIds,
        diffMode?.isTiledDiff || Boolean(analysisMode),
      );
      // draw box
      if (showKeyPointsBox && item.boundingBox) {
        const rect = translateBoundingBoxToRect(
          item.boundingBox!,
          this.clientSize,
        );
        drawRect(this.canvas, rect, lineColors[index], lineWidth, strokeDash);
      }
      // draw lines
      if (showKeyPointsLine && item?.lines && item.points) {
        for (let i = 0; i * 2 < item.lines.length; i++) {
          const [index1, index2] = [item.lines[i * 2], item.lines[i * 2 + 1]];
          if (
            item.points[index1 * 6 + 4] ===
              KEYPOINTS_VISIBLE_TYPE.labeledVisible &&
            item.points[index2 * 6 + 4] ===
              KEYPOINTS_VISIBLE_TYPE.labeledVisible
          ) {
            drawLine(
              this.canvas,
              getCanvasPoint(
                [item.points[index1 * 6], item.points[index1 * 6 + 1]],
                this.naturalSize,
                this.clientSize,
              ),
              getCanvasPoint(
                [item.points[index2 * 6], item.points[index2 * 6 + 1]],
                this.naturalSize,
                this.clientSize,
              ),
              lineColors[index],
              lineWidth,
              strokeDash,
            );
          }
        }
      }
      // draw points
      if (item.points && item.pointColors) {
        for (let i = 0; i * 6 < item.points.length; i++) {
          if (
            item.points[i * 6 + 4] === KEYPOINTS_VISIBLE_TYPE.labeledVisible
          ) {
            const pointColor = `rgba(${item.pointColors[i * 3]}, ${
              item.pointColors[i * 3 + 1]
            }, ${item.pointColors[i * 3 + 2]}, ${colorAplha})`;
            drawCircleWithFill(
              this.canvas,
              getCanvasPoint(
                [item.points[i * 6], item.points[i * 6 + 1]],
                this.naturalSize,
                this.clientSize,
              ),
              pointThickness,
              pointColor,
              1,
            );
          }
        }
      }
    });
  }
}

export default KeyPointsRenderer;

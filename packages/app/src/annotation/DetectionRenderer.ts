import { COMPARE_RESULT, LABEL_SOURCE } from '@/constants';
import BaseRenderer from './BaseRenderer';
import { isNumber } from 'lodash';
import {
  getBoundingBoxRect,
  getBoxFillColor,
  getLabelCustomStyles,
} from '@/utils/annotation';
import { drawRect, drawText } from '@/utils/draw';

class DetectionRenderer extends BaseRenderer {
  public dataObjectsFilter() {
    if (!this.data) return;

    // Basic type filtering.
    let filterBoxs = this.data.objects.filter((item) => !!item.boundingBox);

    const { analysisMode } = this.modeDisplayOptions || {};
    // Analysis mode -> filter fn/fp to display
    if (analysisMode) {
      // filter score
      filterBoxs = filterBoxs.filter(
        (item) => (item.conf || 0) >= analysisMode.score,
      );
      const predBoxsCount = filterBoxs.filter(
        (item) => item.source !== LABEL_SOURCE.gt,
      ).length;
      // compute gt compare result
      filterBoxs = filterBoxs.map((box) => {
        const newBox = { ...box };
        if (box.source === LABEL_SOURCE.gt) {
          const result =
            isNumber(box.matchedDetIdx) &&
            box.matchedDetIdx >= 0 &&
            predBoxsCount > box.matchedDetIdx
              ? COMPARE_RESULT.ok
              : COMPARE_RESULT.fn;
          newBox.compareResult = result;
        }
        return newBox;
      });
      // filters to display
      filterBoxs = filterBoxs.filter((item) => {
        if (item.compareResult === COMPARE_RESULT.ok) {
          // ok && source in displays
          return item.source && analysisMode.displays.includes(item.source);
        }
        return (
          item.compareResult &&
          analysisMode.displays.includes(item.compareResult)
        );
      });
    }

    // defalut filter
    this.objects = filterBoxs.filter((item) => this.baseObjectFilter(item));
  }

  public render() {
    super.render();

    const { showBoxText, categoryColors } = this.globalDisplayOptions;
    const { diffMode, analysisMode } = this.modeDisplayOptions || {};

    this.objects.forEach((box) => {
      const color = categoryColors[box.categoryId || ''] || 'transparent';
      const { strokeDash, lineWidth } = getLabelCustomStyles(
        box.labelId,
        diffMode?.displayLabelIds,
        diffMode?.isTiledDiff || Boolean(analysisMode),
      );
      const rect = getBoundingBoxRect(box.boundingBox, this.clientSize);
      const fillColor = getBoxFillColor(
        box.compareResult,
        Boolean(analysisMode),
      );
      drawRect(this.canvas, rect, color, lineWidth, strokeDash, fillColor);

      // draw text
      if (showBoxText) {
        const label =
          box.source === LABEL_SOURCE.pred
            ? `${box.categoryName}(${(box?.conf || 0).toFixed(3)})`
            : box.categoryName;
        drawText(
          this.canvas,
          label || '',
          13,
          { x: rect.x + 2, y: rect.y },
          color,
          false,
          'left',
        );
      }
    });
  }
}

export default DetectionRenderer;

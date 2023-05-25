import { clearCanvas, drawImage, drawRectWithFill } from '@/utils/draw';
import BaseRenderer from './BaseRenderer';

class MattingRenderer extends BaseRenderer {
  private alphaUrl: string = '';
  private alphaImg: HTMLImageElement | null = null;

  public dataObjectsFilter() {
    if (!this.data) return;

    this.objects =
      this.data.objects.filter((item) => {
        return item.alpha && this.baseObjectFilter(item);
      }) || [];
  }

  public render() {
    super.render();

    if (this.objects.length > 0) {
      const { alpha } = this.objects[0];
      if (this.alphaImg && alpha === this.alphaUrl) {
        this.displayMattingImg();
      } else {
        this.alphaUrl = alpha as string;
        this.alphaImg = new Image();
        this.alphaImg.src = this.alphaUrl;
        this.alphaImg.crossOrigin = 'anonymous';
        this.alphaImg.onload = () => {
          this.displayMattingImg();
        };
      }
    }
  }

  private displayMattingImg() {
    if (!this.alphaImg) return;
    const { showMattingColorFill } = this.globalDisplayOptions;
    const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    const rect = {
      x: 0,
      y: 0,
      ...this.clientSize,
    };
    clearCanvas(this.canvas);
    drawImage(this.canvas, this.alphaImg, rect);
    if (showMattingColorFill) {
      // Background fill.
      ctx.globalCompositeOperation = 'source-out';
      drawRectWithFill(this.canvas, rect, '#000');
      // Core fill.
      ctx.globalCompositeOperation = 'destination-atop';
      drawRectWithFill(this.canvas, rect, '#fff');
    } else {
      // Original image fill.
      ctx.globalCompositeOperation = 'source-in';
      drawImage(this.canvas, this.sourceImg, rect);
      // Background blank.
      ctx.globalCompositeOperation = 'destination-over';
      drawRectWithFill(this.canvas, rect, '#fff');
    }
  }
}

export default MattingRenderer;

import { LABEL_SOURCE } from '@/constants';
import { Comparisons } from '@/models/dataset/type';
import { DATA } from '@/services/type';
import { clearCanvas, drawImage, resizeSmoothCanvas } from '@/utils/draw';

export type IAnnotationObject = Partial<DATA.AnnotationObject> &
  DATA.BaseObject;

export interface IAnnotationData {
  objects: IAnnotationObject[];
  /** Tiled diff, labelId for the current column */
  curLabelId?: string;
}

export interface IGlobalDisplayOptions {
  categoryId?: string;
  categoryColors: Record<string, string>;
  showAnnotations?: boolean;
  showAllCategory?: boolean;
  showImgDesc?: boolean;
  showBoxText?: boolean;
  showSegFilling?: boolean;
  showSegContour?: boolean;
  showMattingColorFill?: boolean;
  showKeyPointsLine?: boolean;
  showKeyPointsBox?: boolean;
}

export interface IModeDisplayOptions {
  diffMode?: {
    labels: DATA.Label[];
    displayLabelIds: string[];
    isTiledDiff: boolean;
  };
  analysisMode?: Comparisons;
}

export interface IBaseRendererProps {
  canvas: HTMLCanvasElement;
  baseCanvas: HTMLCanvasElement;
  naturalSize: ISize;
  clientSize: ISize;
  sourceImg: HTMLImageElement;
  data: IAnnotationData;
  globalDisplayOptions: IGlobalDisplayOptions;
  modeDisplayOptions?: IModeDisplayOptions;
}

const DEFAULT_GLOBAL_DISPLAY_OPTIONS: Partial<IGlobalDisplayOptions> = {
  showAnnotations: true,
  showAllCategory: true,
  showBoxText: true,
  showSegFilling: true,
  showSegContour: true,
  showMattingColorFill: true,
  showKeyPointsLine: true,
  showKeyPointsBox: true,
};

class BaseRenderer {
  public canvas!: HTMLCanvasElement;

  public baseCanvas!: HTMLCanvasElement;

  public naturalSize: ISize;

  public clientSize: ISize;

  public data: IAnnotationData;

  public objects: IAnnotationObject[] = [];

  public globalDisplayOptions: IGlobalDisplayOptions;

  public modeDisplayOptions?: IModeDisplayOptions;

  public sourceImg: HTMLImageElement;

  public isExporting: boolean = false;

  constructor(props: IBaseRendererProps) {
    this.canvas = props.canvas;
    this.baseCanvas = props.baseCanvas;
    this.naturalSize = props.naturalSize;
    this.clientSize = props.clientSize;
    this.data = props.data;
    this.globalDisplayOptions = {
      ...DEFAULT_GLOBAL_DISPLAY_OPTIONS,
      ...props.globalDisplayOptions,
    };
    this.modeDisplayOptions = props.modeDisplayOptions;
    this.sourceImg = props.sourceImg;

    // Data filtering.
    this.dataObjectsFilter();

    // Render base image.
    this.renderImage();

    // Render annotations.
    this.render();
  }

  // -------------------------------------- main member ------------------------------------

  /**
   * Basic object filter, shared by all annotation types.
   * @param item
   * @returns
   */
  public baseObjectFilter(item: IAnnotationObject) {
    const { showAnnotations, showAllCategory, categoryId } =
      this.globalDisplayOptions;
    const { diffMode, analysisMode } = this.modeDisplayOptions || {};
    if (
      !showAnnotations ||
      (!showAllCategory && item.categoryId !== categoryId) ||
      (diffMode &&
        item.labelId &&
        !diffMode.displayLabelIds.includes(item.labelId)) ||
      (diffMode &&
        diffMode.isTiledDiff &&
        item.labelId !== this.data.curLabelId)
    ) {
      return false;
    }
    if (!analysisMode && diffMode) {
      const label = diffMode.labels.find((label) => label.id === item.labelId);
      if (!label) return false;
      if (label.source === LABEL_SOURCE.gt) return true;
      return (
        item.conf !== undefined &&
        item.conf >= label?.confidenceRange[0] &&
        item.conf <= label?.confidenceRange[1]
      );
    }
    return true;
  }

  /**
   * Display data filtering (requires overloading).
   * @returns
   */
  public dataObjectsFilter() {
    if (!this.data) return;
  }

  /**
   * Anotation rendering (requires overloading).
   */
  public render() {
    // Reset canvas
    clearCanvas(this.canvas);

    // When exporting, render the base image on the main canvas.
    if (this.isExporting) {
      drawImage(this.canvas, this.sourceImg, {
        x: 0,
        y: 0,
        width: this.clientSize.width,
        height: this.clientSize.height,
      });
    }
  }

  /**
   * Base image render
   */
  public renderImage() {
    clearCanvas(this.baseCanvas);
    drawImage(this.baseCanvas, this.sourceImg, {
      x: 0,
      y: 0,
      width: this.clientSize.width,
      height: this.clientSize.height,
    });
  }

  // -------------------------------------- setters ------------------------------------

  public setClientSize(size: ISize) {
    this.clientSize = size;

    // Set canvas size and make the canvas smooth.
    resizeSmoothCanvas(this.baseCanvas, this.clientSize);
    resizeSmoothCanvas(this.canvas, this.clientSize);

    // update base image
    this.renderImage();

    // Trigger re-rendering.
    this.render();
  }

  public setDisplayOptions({
    globalDisplayOptions,
    modeDisplayOptions,
  }: {
    globalDisplayOptions: IGlobalDisplayOptions;
    modeDisplayOptions?: IModeDisplayOptions;
  }) {
    this.modeDisplayOptions = modeDisplayOptions;
    this.globalDisplayOptions = {
      ...DEFAULT_GLOBAL_DISPLAY_OPTIONS,
      ...globalDisplayOptions,
    };

    // Re-filter.
    this.dataObjectsFilter();

    // Re-rendering.
    this.render();
  }

  public setData(data: IAnnotationData) {
    this.data = data;

    // Re-filter
    this.dataObjectsFilter();

    // Re-rendering.
    this.render();
  }

  public setIsExporting(isExporting: boolean) {
    this.isExporting = isExporting;

    // Re-filter
    this.dataObjectsFilter();

    // Re-rendering.
    this.render();
  }
}

export default BaseRenderer;

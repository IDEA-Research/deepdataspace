import React, {
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import { zoomImgSize } from '@/utils/annotation';
import { BaseRenderer, createRenderer } from '@/annotation';
import styles from './index.less';
import { message } from 'antd';
import {
  IAnnotationObject,
  IGlobalDisplayOptions,
  IModeDisplayOptions,
} from '@/annotation/BaseRenderer';
import { AnnotationType } from '@/constants';
import { DATA } from '@/services/type';

export interface IProps {
  image: DATA.BaseImage;
  objects: IAnnotationObject[];
  curLabelId?: string;
  currentSize?: ISize;
  wrapWidth?: number;
  wrapHeight?: number;
  minHeight?: number;
  isPreview?: boolean;
  imgStyle?: React.CSSProperties;
  displayType?: AnnotationType;
  globalDisplayOptions: IGlobalDisplayOptions;
  modeDisplayOptions?: IModeDisplayOptions;
  onLoad?: (e: React.UIEvent<HTMLImageElement, UIEvent>) => void;
}

/** Methods exposed for parent component to call. */
export interface AnnotationImageHandle {
  refreshImgUrl: (url: string) => Promise<any>;
  exportCanvas: () => void;
}

const AnnotationImage: React.FC<IProps> = forwardRef<
  AnnotationImageHandle,
  IProps
>((props, ref) => {
  const {
    image,
    objects,
    curLabelId,
    isPreview,
    onLoad,
    currentSize,
    wrapWidth,
    wrapHeight,
    minHeight,
    displayType,
    globalDisplayOptions,
    modeDisplayOptions,
  } = props;

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BaseRenderer | null>(null);

  const [naturalSize, setNaturalSize] = useState<ISize>({
    width: 0,
    height: minHeight || 0,
  });
  const clientSize: ISize = useMemo(() => {
    // Exact size passed in from outside.
    if (currentSize) {
      return currentSize;
    }
    if (!naturalSize.width) {
      // Init default size
      return {
        width: wrapWidth || 0,
        height: wrapHeight || minHeight || 0,
      };
    }
    const [width, height] = zoomImgSize(
      naturalSize.width,
      naturalSize.height,
      wrapWidth,
      wrapHeight,
    );
    return { width, height };
  }, [wrapWidth, wrapHeight, minHeight, naturalSize, currentSize]);

  useImperativeHandle(ref, () => ({
    refreshImgUrl: (url: string) => {
      return new Promise((resolve, reject) => {
        if (imgRef.current) {
          imgRef.current.src = url;
          imgRef.current.onload = (e) => {
            resolve(e);
          };
          imgRef.current.onerror = (e) => {
            reject(e);
          };
        }
      });
    },
    exportCanvas: () => {
      if (!canvasRef.current || !rendererRef.current || !imgRef.current) return;

      const hide = message.loading('Creating image...', 60000);
      // Change URL address to ensure that the backend returns images with related cross-domain headers.
      imgRef.current.src = `${image.urlFullRes}?noredirect=1`;
      imgRef.current.crossOrigin = 'anonymous';
      imgRef.current.onload = () => {
        // Trigger re-rendering.
        rendererRef.current?.setIsExporting(true);
        // There is a delay in re-rendering.
        setTimeout(() => {
          hide();
          if (!canvasRef.current) {
            rendererRef.current?.setIsExporting(false);
            message.error('Create image fail, please retry');
            return;
          }
          const dataUrl = canvasRef.current.toDataURL();
          let a = document.createElement('a');
          a.setAttribute('download', `${image.id}.png`);
          a.setAttribute('href', dataUrl);
          a.click();
          rendererRef.current?.setIsExporting(false);
        }, 500);
      };
      imgRef.current.onerror = (e) => {
        hide();
        rendererRef.current?.setIsExporting(false);
        message.error('Create image fail, please retry');
        console.error(e);
      };
    },
  }));

  const initAnnotationRenderer = (nSize?: ISize, cSize?: ISize) => {
    if (!canvasRef.current || !baseCanvasRef.current || !displayType) return;
    rendererRef.current = createRenderer(displayType, {
      canvas: canvasRef.current,
      baseCanvas: baseCanvasRef.current,
      naturalSize: nSize || (naturalSize as ISize),
      clientSize: cSize || (clientSize as ISize),
      data: {
        objects,
        curLabelId,
      },
      globalDisplayOptions,
      modeDisplayOptions,
      sourceImg: imgRef.current as HTMLImageElement,
    });
  };

  const onLoadImg = (e: React.UIEvent<HTMLImageElement, UIEvent>) => {
    // Set natural size.
    const img = e.target as HTMLImageElement;
    const size = {
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
    setNaturalSize(size);

    // Init annotationRenderer
    const [width, height] = zoomImgSize(
      size.width,
      size.height,
      wrapWidth,
      wrapHeight,
    );
    initAnnotationRenderer(size, { width, height });

    // callback
    if (onLoad) onLoad(e);
  };

  // Data change
  useEffect(() => {
    rendererRef.current?.setData({
      objects,
      curLabelId,
    });
  }, [objects, curLabelId]);

  // Size change
  useEffect(() => {
    rendererRef.current?.setClientSize(clientSize);
  }, [clientSize]);

  // Filter change
  useEffect(() => {
    rendererRef.current?.setDisplayOptions({
      globalDisplayOptions,
      modeDisplayOptions,
    });
  }, [globalDisplayOptions, modeDisplayOptions]);

  // When the annotation display type is changed, trigger a re-creation.
  useEffect(() => {
    if (rendererRef.current && naturalSize.width && clientSize.width) {
      // Ensure that the relevant size of the image has been obtained.
      initAnnotationRenderer();
    }
  }, [displayType]);

  if (!image) return null;

  return (
    <div
      className={styles.container}
      style={{ backgroundColor: 'transparent' }}
    >
      <img
        style={{
          width: clientSize.width,
          height: clientSize.height,
        }}
        src={isPreview ? image.urlFullRes : image.url}
        alt="pic"
        ref={imgRef}
        onLoad={onLoadImg}
      />
      {/* TODO: The img tag cannot be removed, as it conflicts with updating the layout with Masonry. */}
      <canvas ref={baseCanvasRef} draggable={false} />
      <canvas ref={canvasRef} draggable={false} />
    </div>
  );
});

export default AnnotationImage;

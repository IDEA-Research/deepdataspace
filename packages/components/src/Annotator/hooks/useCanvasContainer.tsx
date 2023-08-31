import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useEventListener, useMouse, useSize } from 'ahooks';
import { useImmer } from 'use-immer';
import { isInCanvas, zoomImgSize } from '../utils/compute';
import {
  MIN_SCALE,
  MAX_SCALE,
  BUTTON_SCALE_STEP,
  WHEEL_SCALE_STEP,
} from '../constants';
import { fixedFloatNum } from 'dds-utils/digit';

interface IProps {
  isRequiring: boolean;
  visible: boolean;
  minPadding?: {
    top: number;
    left: number;
  };
  allowMove: boolean;
  isCustomCursorActive: boolean;
  cursorSize: number;
  showReferenceLine?: boolean;
  onClickMaskBg?: React.MouseEventHandler<HTMLDivElement>;
}

export default function useCanvasContainer({
  isRequiring,
  visible,
  minPadding = { top: 0, left: 0 },
  allowMove,
  showReferenceLine,
  isCustomCursorActive,
  cursorSize,
  onClickMaskBg,
}: IProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useSize(() => containerRef.current);
  const containerMouse = useMouse(() => containerRef.current); // delayed get size when move don't move

  /** The original size of image */
  const [naturalSize, setNaturalSize] = useState<ISize>({
    width: 0,
    height: 0,
  });

  /** The scaled size of image */
  const [clientSize, setClientSize] = useImmer<{
    width: number;
    height: number;
    scale: number;
  }>({
    width: naturalSize.width,
    height: naturalSize.height,
    scale: 1,
  });

  /** The top-left location on canvas container */
  const imagePos = useRef<IPoint>({ x: 0, y: 0 });

  // Scale info
  const lastScalePosRef = useRef<
    | {
        posRatioX: number;
        posRatioY: number;
        mouseX: number;
        mouseY: number;
      }
    | undefined
  >(undefined);

  const contentMouse = useMemo(() => {
    return {
      ...containerMouse,
      elementW: clientSize.width,
      elementH: clientSize.height,
      elementX: containerMouse.elementX - imagePos.current.x,
      elementY: containerMouse.elementY - imagePos.current.y,
    };
  }, [containerMouse, clientSize]);

  const [movingImgAnchor, setMovingImgAnchor] = useImmer<IPoint | null>(null);

  const initClientSizeToFit = (naturalSize: ISize) => {
    if (naturalSize && containerSize) {
      const containerWidth = containerSize.width;
      const containerHeight = containerSize.height;
      const [width, height, scale] = zoomImgSize(
        naturalSize.width,
        naturalSize.height,
        containerWidth - minPadding.left * 2,
        containerHeight - minPadding.top * 2,
      );
      imagePos.current = {
        x: (containerWidth - width) * 0.5,
        y: (containerHeight - height) * 0.5,
      };
      setClientSize({
        scale,
        width: naturalSize.width * scale,
        height: naturalSize.height * scale,
      });
      lastScalePosRef.current = undefined;
    }
  };

  /** Initial position to fit container */
  useEffect(() => {
    initClientSizeToFit(naturalSize);
  }, [naturalSize, containerSize]);

  const adaptImagePosWhileZoom = () => {
    if (!containerSize) return;

    const containerWidth = containerSize?.width;
    const containerHeight = containerSize?.height;

    // Default zoom center
    let posRatioX = 0.5;
    let posRatioY = 0.5;
    let mouseX = containerWidth / 2;
    let mouseY = containerHeight / 2;

    if (lastScalePosRef.current) {
      posRatioX = lastScalePosRef.current.posRatioX;
      posRatioY = lastScalePosRef.current.posRatioY;
      mouseX = lastScalePosRef.current.mouseX;
      mouseY = lastScalePosRef.current.mouseY;
    }
    const x = mouseX - clientSize.width * posRatioX;
    const y = mouseY - clientSize.height * posRatioY;

    imagePos.current = { x, y };
  };

  useEffect(() => {
    adaptImagePosWhileZoom();
  }, [clientSize]);

  const zoom = (isZoomIn: boolean, step: number, isZoomBtn?: boolean) => {
    if (!visible || isRequiring) return;
    setClientSize((s) => {
      let scale = isZoomIn
        ? Math.min(MAX_SCALE, fixedFloatNum(s.scale + step, 2))
        : Math.max(MIN_SCALE, fixedFloatNum(s.scale - step, 2));

      // update scale center
      if (
        !lastScalePosRef.current ||
        containerMouse.elementX !== lastScalePosRef.current.mouseX ||
        containerMouse.elementY !== lastScalePosRef.current.mouseY
      ) {
        if (
          !isZoomBtn &&
          !isNaN(contentMouse.elementX) &&
          !isNaN(containerMouse.elementX) &&
          clientSize.width
        ) {
          const scalePos = {
            posRatioX: contentMouse.elementX / clientSize.width,
            posRatioY: contentMouse.elementY / clientSize.height,
            mouseX: containerMouse.elementX,
            mouseY: containerMouse.elementY,
          };
          lastScalePosRef.current = scalePos;
        }
      }

      s.scale = scale;
      s.width = naturalSize.width * scale;
      s.height = naturalSize.height * scale;
    });
  };

  const onZoomIn = useCallback(() => {
    zoom(true, BUTTON_SCALE_STEP, true);
  }, [BUTTON_SCALE_STEP, zoom]);

  const onZoomOut = useCallback(() => {
    zoom(false, BUTTON_SCALE_STEP, true);
  }, [BUTTON_SCALE_STEP, zoom]);

  // Zoom gesture.
  const onWheelMove: React.WheelEventHandler<HTMLDivElement> = (event) => {
    if (!visible || isRequiring) return;
    const wheelDirection = event.deltaY;
    if (wheelDirection > 0) {
      zoom(false, WHEEL_SCALE_STEP);
    } else if (wheelDirection < 0) {
      zoom(true, WHEEL_SCALE_STEP);
    }
  };

  const onReset = useCallback(() => {
    lastScalePosRef.current = undefined;
    initClientSizeToFit(naturalSize);
  }, [naturalSize.width, naturalSize.height]);

  // Reset data when hidden.
  useEffect(() => {
    if (!visible) {
      setNaturalSize({ width: 0, height: 0 });
      setClientSize({
        scale: 1,
        width: 0,
        height: 0,
      });
      imagePos.current = { x: 0, y: 0 };
      lastScalePosRef.current = undefined;
    }
  }, [visible]);

  const [isMousePress, setMousePress] = useState(false);

  useEventListener('mousedown', () => {
    setMousePress(true);
    if (!visible || !containerRef.current) return;
    setMovingImgAnchor({
      x: contentMouse.elementX,
      y: contentMouse.elementY,
    });
  });

  useEventListener('mousemove', () => {
    if (!visible) return;
    if (movingImgAnchor && allowMove && isMousePress) {
      const offsetX = contentMouse.elementX - movingImgAnchor.x;
      const offsetY = contentMouse.elementY - movingImgAnchor.y;
      const { x, y } = imagePos.current;
      imagePos.current = {
        x: x + offsetX,
        y: y + offsetY,
      };
    }
  });

  useEventListener('mouseup', () => {
    setMousePress(false);
    if (!visible || !allowMove) return;
    // Stop moving the image.
    if (movingImgAnchor) {
      setMovingImgAnchor(null);
      return;
    }
  });

  useEffect(() => {
    if (!allowMove) {
      setMovingImgAnchor(null);
    } else {
      setMovingImgAnchor({
        x: contentMouse.elementX,
        y: contentMouse.elementY,
      });
    }
  }, [allowMove]);

  const onLoadImg = (e: React.UIEvent<HTMLImageElement, UIEvent>) => {
    const img = e.target as HTMLImageElement;
    const naturalSize = { width: img.naturalWidth, height: img.naturalHeight };
    setNaturalSize(naturalSize);
    initClientSizeToFit(naturalSize);
  };

  const onClickBg = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isInCanvas(contentMouse)) {
      onClickMaskBg?.(event);
    }
  };

  /** Container render function */
  const CanvasContainer = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => {
    if (!visible) return null;
    return (
      <div
        ref={containerRef}
        onWheel={onWheelMove}
        onClick={onClickBg}
        className={className}
      >
        {children}
        {showReferenceLine && !allowMove && isInCanvas(contentMouse) && (
          <>
            {/* leftLine */}
            <div
              style={{
                position: 'fixed',
                backgroundColor: '#fff',
                width: containerMouse.elementX - 18,
                height: 1,
                left: 0,
                bottom: 0,
                transformOrigin: 'bottom left',
                transform: `translate(${containerMouse.elementPosX}px, -${
                  window.innerHeight - containerMouse.clientY - 1
                }px)`,
              }}
            />
            {/* rightLine */}
            <div
              style={{
                position: 'fixed',
                backgroundColor: '#fff',
                height: 1,
                width: containerMouse.elementW - containerMouse.elementX - 18,
                left: 0,
                bottom: 0,
                transformOrigin: 'bottom left',
                transform: `translate(${containerMouse.clientX + 18}px, -${
                  window.innerHeight - containerMouse.clientY - 1
                }px)`,
              }}
            />
            {/* upLine */}
            <div
              style={{
                position: 'fixed',
                backgroundColor: '#fff',
                width: 1,
                height: containerMouse.elementY - 18,
                left: 0,
                bottom: 0,
                transformOrigin: 'bottom left',
                transform: `translate(${containerMouse.clientX - 1}px, 
                  -${window.innerHeight - containerMouse.clientY + 18}px)`,
              }}
            />
            {/* downLine */}
            <div
              style={{
                position: 'fixed',
                backgroundColor: '#fff',
                width: 1,
                height: containerMouse.elementH - containerMouse.elementY - 18,
                left: 0,
                bottom: 0,
                transform: `translate(${containerMouse.clientX - 1}px)`,
              }}
            />
          </>
        )}
        {isCustomCursorActive &&
          cursorSize > 0 &&
          isInCanvas(containerMouse) &&
          isInCanvas(contentMouse) &&
          !allowMove && (
            <div
              style={{
                position: 'fixed',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.7)',
                width: cursorSize * clientSize.scale,
                height: cursorSize * clientSize.scale,
                borderRadius: (cursorSize * clientSize.scale) / 2,
                left: 0,
                top: 0,
                transformOrigin: 'top left',
                transform: `translate(${
                  containerMouse.clientX - (cursorSize * clientSize.scale) / 2
                }px, ${
                  containerMouse.clientY - (cursorSize * clientSize.scale) / 2
                }px)`,
              }}
            />
          )}
      </div>
    );
  };

  return {
    CanvasContainer,
    scale: clientSize.scale,
    containerRef,
    naturalSize,
    clientSize: {
      width: clientSize.width,
      height: clientSize.height,
    },
    containerSize,
    containerMouse: {
      ...containerMouse,
      elementW: containerSize?.width || containerMouse.elementW,
      elementH: containerSize?.height || containerMouse.elementH,
    },
    contentMouse,
    imagePos,
    isMousePress,
    onLoadImg,
    onZoomIn,
    onZoomOut,
    onWheelMove,
    onReset,
  };
}

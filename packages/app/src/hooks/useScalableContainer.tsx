import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import { useEventListener, useMouse } from 'ahooks';
import { useImmer } from 'use-immer';
import { isInCanvas } from '@/utils/compute';
import { zoomImgSize } from '@/utils/annotation';
import {
  MIN_SCALE,
  MAX_SCALE,
  BUTTON_SCALE_STEP,
  WHEEL_SCALE_STEP,
} from '@/constants';
import { fixedFloatNum } from '@/utils/digit';

interface IProps {
  isRequiring: boolean;
  visible: boolean;
  minPadding?: {
    top: number;
    left: number;
  };
  allowMove: boolean;
  showMouseAim?: boolean;
  onClickMaskBg?: React.MouseEventHandler<HTMLDivElement>;
}

export default function useScalableContainer({
  isRequiring,
  visible,
  minPadding = { top: 0, left: 0 },
  allowMove,
  showMouseAim,
  onClickMaskBg,
}: IProps) {
  const {
    width: containerWidth = 0,
    height: containerHeight = 0,
    ref: containerRef,
  } = useResizeDetector();
  const contentRef = useRef<HTMLDivElement>(null);

  const containerMouse = useMouse(containerRef.current);
  const contentMouse = useMouse(contentRef.current);

  const [naturalSize, setNaturalSize] = useState<ISize>({
    width: 0,
    height: 0,
  });
  const [initialSize, setInitialSize] = useState<ISize>({
    width: 0,
    height: 0,
  });
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  const clientSize = useMemo(
    () => ({
      width: initialSize.width * scale,
      height: initialSize.height * scale,
    }),
    [initialSize, scale],
  );

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
  // Whether the mouse is moving
  const movedRef = useRef<boolean>(false);

  /** Position adaptation during zooming */
  const directMouseCenter = (scale: number) => {
    if (!contentRef.current) return;

    const [initialWidth, initialHeight] = [
      initialSize.width,
      initialSize.height,
    ];
    // Default zoom center
    let posRatioX = 0.5,
      posRatioY = 0.5;
    let mouseX = containerWidth / 2;
    let mouseY = containerHeight / 2;
    if (lastScalePosRef.current) {
      posRatioX = lastScalePosRef.current.posRatioX;
      posRatioY = lastScalePosRef.current.posRatioY;
      mouseX = lastScalePosRef.current.mouseX;
      mouseY = lastScalePosRef.current.mouseY;
    }
    const x = mouseX - initialWidth * scale * posRatioX;
    const y = mouseY - initialHeight * scale * posRatioY;
    contentRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`;
  };

  const zoom = (isZoomIn: boolean, step: number, isZoomBtn?: boolean) => {
    if (!visible || isRequiring) return;
    setScale((s) => {
      let scale = isZoomIn
        ? Math.min(MAX_SCALE, fixedFloatNum(s + step, 2))
        : Math.max(MIN_SCALE, fixedFloatNum(s - step, 2));

      // Record the starting zoom scale ratio.
      if (
        isZoomBtn ||
        !contentMouse.elementX ||
        !containerMouse.elementX ||
        !clientSize.width
      ) {
        // Center zoom.
        lastScalePosRef.current = undefined;
      } else if (
        !lastScalePosRef.current ||
        (movedRef.current &&
          (containerMouse.elementX !== lastScalePosRef.current.mouseX ||
            containerMouse.elementY !== lastScalePosRef.current.mouseY))
      ) {
        // Focus zoom && Mouse move
        lastScalePosRef.current = {
          posRatioX: contentMouse.elementX / clientSize.width,
          posRatioY: contentMouse.elementY / clientSize.height,
          mouseX: containerMouse.elementX,
          mouseY: containerMouse.elementY,
        };
        movedRef.current = false;
      }
      return scale;
    });
  };

  const onZoomIn = () => {
    zoom(true, BUTTON_SCALE_STEP, true);
  };

  const onZoomOut = () => {
    zoom(false, BUTTON_SCALE_STEP, true);
  };

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

  // Restrict triggering browser back and forward.
  const limitHistoryBackWheel: React.WheelEventHandler<HTMLDivElement> = (
    event,
  ) => {
    const deltaX = event.deltaX;
    if (deltaX && document.body.scrollLeft === 0) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    if (!visible) {
      containerRef.current?.removeEventListener('wheel', limitHistoryBackWheel);
    } else {
      containerRef.current?.addEventListener('wheel', limitHistoryBackWheel, {
        passive: false,
      });
    }
  }, [visible]);

  const onRotateRight = () => {
    setRotate((value) => value + 90);
  };

  const onRotateLeft = () => {
    setRotate((value) => value - 90);
  };

  const onReset = () => {
    lastScalePosRef.current = undefined;
    setScale(1);
    setRotate(0);
    directMouseCenter(1);
  };

  // Reset data when hidden.
  useEffect(() => {
    if (!visible) {
      setNaturalSize({ width: 0, height: 0 });
      setInitialSize({ width: 0, height: 0 });
      setScale(1);
      setRotate(0);
      lastScalePosRef.current = undefined;
    }
  }, [visible]);

  // Canvas size change -> Update position
  useEffect(() => {
    directMouseCenter(scale);
  }, [initialSize, scale, rotate]);

  // Image load completion || Window resize => Compute initial size
  useEffect(() => {
    if (
      containerWidth &&
      containerHeight &&
      naturalSize &&
      contentRef.current
    ) {
      const [width, height] = zoomImgSize(
        naturalSize.width,
        naturalSize.height,
        containerWidth - minPadding.left * 2,
        containerHeight - minPadding.top * 2,
      );
      setInitialSize({ width, height });
      setScale(1);
      setRotate(0);
      lastScalePosRef.current = undefined;
    }
  }, [containerWidth, containerHeight, naturalSize]);

  // Record starting point of movement.
  const [movingImgPoints, setMovingImgPoints] = useImmer<{
    startOffset: IPoint;
    mousePoint: IPoint;
  } | null>(null);

  useEffect(() => {
    if (!allowMove) {
      setMovingImgPoints(null);
    }
  }, [allowMove]);

  const moveImage = () => {
    if (
      !contentRef.current ||
      !movingImgPoints ||
      !containerWidth ||
      !containerHeight
    )
      return;
    const { startOffset, mousePoint } = movingImgPoints;
    const offsetX = contentMouse.clientX - mousePoint.x;
    const offsetY = contentMouse.clientY - mousePoint.y;
    const x = startOffset.x + offsetX;
    const y = startOffset.y + offsetY;
    contentRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`;
  };

  useEventListener(
    'mousedown',
    () => {
      if (!visible || !contentRef.current) return;
      // Moving image
      // updateMouseCursor(isCtrlPress ? 'grab' : 'grabbing');
      const translates = window.getComputedStyle(contentRef.current).transform;
      const matchArr = translates.match(/\s(-?[\d.]+),\s(-?[\d.]+)\)$/);
      if (matchArr && matchArr?.length >= 3) {
        setMovingImgPoints({
          startOffset: {
            x: Number(matchArr[1]),
            y: Number(matchArr[2]),
          },
          mousePoint: { x: contentMouse.clientX, y: contentMouse.clientY },
        });
      }
    },
    { target: () => containerRef.current },
  );

  useEventListener(
    'mousemove',
    () => {
      if (!visible) return;
      // Identify moving.
      movedRef.current = true;
      if (movingImgPoints && allowMove) {
        if (isInCanvas(containerMouse)) {
          moveImage();
        } else {
          // Stop move
          setMovingImgPoints(null);
        }
      }
    },
    { target: () => containerRef.current },
  );

  useEventListener(
    'mouseup',
    () => {
      if (!visible || !allowMove) return;
      // Stop moving the image.
      if (movingImgPoints) {
        setMovingImgPoints(null);
        return;
      }
    },
    { target: () => containerRef.current },
  );

  const onClickContent: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onClickBg: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (onClickMaskBg) onClickMaskBg(event);
  };

  /** Container render function */
  const ScalableContainer = ({
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
        <div
          ref={contentRef}
          style={{ position: 'absolute', cursor: 'grab' }}
          onClick={onClickContent}
          draggable={false}
        >
          {children}
        </div>
        {showMouseAim && !allowMove && isInCanvas(contentMouse) && (
          <>
            {/* leftLine */}
            <div
              style={{
                position: 'fixed',
                backgroundColor: '#fff',
                height: 1,
                left: containerMouse.elementPosX,
                bottom: window.innerHeight - containerMouse.clientY - 1,
                width: containerMouse.elementX - 18,
              }}
            />
            {/* rightLine */}
            <div
              style={{
                position: 'fixed',
                backgroundColor: '#fff',
                height: 1,
                left: containerMouse.clientX + 18,
                bottom: window.innerHeight - containerMouse.clientY - 1,
                width: containerMouse.elementW - containerMouse.elementX - 18,
              }}
            />
            {/* upLine */}
            <div
              style={{
                position: 'fixed',
                backgroundColor: '#fff',
                width: 1,
                bottom: window.innerHeight - containerMouse.clientY + 18,
                left: containerMouse.clientX - 1,
                height: containerMouse.elementY - 18,
              }}
            />
            {/* downLine */}
            <div
              style={{
                position: 'fixed',
                backgroundColor: '#fff',
                width: 1,
                bottom: 0,
                left: containerMouse.clientX - 1,
                height: containerMouse.elementH - containerMouse.elementY - 18,
              }}
            />
          </>
        )}
      </div>
    );
  };

  return {
    onZoomIn,
    onZoomOut,
    onRotateRight,
    onRotateLeft,
    onReset,
    setNaturalSize,
    ScalableContainer,
    naturalSize,
    clientSize,
    scale,
    contentRef,
    contentMouse,
    containerMouse,
    containerRef,
  };
}

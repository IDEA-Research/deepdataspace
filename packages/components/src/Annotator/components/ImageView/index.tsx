import { ReloadOutlined } from '@ant-design/icons';
import { Button, Spin } from 'antd';
import React, { useState } from 'react';

import ImgBroken from '../../assets/img-broken.svg';

import './index.less';

interface IProps {
  url: string;
  imgRef: React.RefObject<HTMLImageElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeCanvasRef: React.RefObject<HTMLCanvasElement>;
  clientSize: ISize;
  imagePos: React.MutableRefObject<IPoint>;
  onLoad: (e: React.UIEvent<HTMLImageElement, UIEvent>) => void;
}

export const ImageView: React.FC<IProps> = ({
  url = '',
  imgRef,
  canvasRef,
  activeCanvasRef,
  clientSize,
  imagePos,
  onLoad,
}) => {
  const [showReload, setShowReload] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const onLoadImg = (e: React.UIEvent<HTMLImageElement, UIEvent>) => {
    setIsLoading(false);
    // Callback
    onLoad(e);
  };

  const onReloadImg = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (imgRef?.current) {
      imgRef.current.src = url;
      setIsLoading(true);
      setShowReload(false);
    }
  };

  const onErrorImg = (e: React.UIEvent<HTMLImageElement, UIEvent>) => {
    const img = e.target as HTMLImageElement;
    img.src = ImgBroken;
    setIsLoading(false);
    setShowReload(true);
  };

  const crossOrigin =
    url.indexOf('aliyuncs.com') > -1 ? 'anonymous' : undefined;

  return (
    <>
      <img
        ref={imgRef}
        src={url}
        alt="pic"
        crossOrigin={crossOrigin}
        style={{
          width: clientSize.width,
          height: clientSize.height,
        }}
        onLoad={onLoadImg}
        onError={onErrorImg}
      />
      <canvas
        ref={canvasRef}
        draggable={false}
        onContextMenu={(event: React.MouseEvent<HTMLCanvasElement>) =>
          event.preventDefault()
        }
        className="dds-annotator-imageview-canvas"
      />
      <canvas
        ref={activeCanvasRef}
        draggable={false}
        onContextMenu={(event: React.MouseEvent<HTMLCanvasElement>) =>
          event.preventDefault()
        }
        className="dds-annotator-imageview-canvas"
      />
      {showReload && (
        <div
          className="dds-annotator-imageview-reload-cover"
          onClick={onReloadImg}
          onDoubleClick={onReloadImg}
          style={{
            left: imagePos.current.x,
            top: imagePos.current.y,
            width: clientSize.width,
            height: clientSize.height,
          }}
        >
          <img src={ImgBroken} alt="error-pic" />
          <div className="content-box">
            <Button
              ghost
              type="primary"
              className="reload-trigger"
              shape="circle"
              size="small"
              icon={<ReloadOutlined />}
            ></Button>
          </div>
        </div>
      )}
      {isLoading && (
        <div
          className="dds-annotator-imageview-reload-cover"
          style={{
            backgroundColor: '#f6f6f6',
            left: imagePos.current.x,
            top: imagePos.current.y,
            width: clientSize.width,
            height: clientSize.height,
          }}
        >
          <Spin className="reload-trigger" />
        </div>
      )}
    </>
  );
};

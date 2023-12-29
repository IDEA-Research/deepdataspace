import { useMemo, useRef } from 'react';
import VirtualList from 'rc-virtual-list';
import { Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { chunk } from 'lodash';
import { useSize } from 'ahooks';
import { UploadFile } from '../..';
import classNames from 'classnames';
import './index.less';

interface IProps {
  files: UploadFile[];
  fileType: 'image' | 'video';
  onRemoveFile: (index: number) => void;
}

const FilePreviewList: React.FC<IProps> = ({
  files,
  fileType,
  onRemoveFile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useSize(containerRef);
  const colume = containerSize?.width && containerSize.width > 800 ? 8 : 5;

  /** Group files by colume count */
  const imageGroups = useMemo(() => {
    return chunk(files, colume).map((item, index) => ({
      index,
      rowImages: item,
    }));
  }, [files, colume]);

  /** Calculate ItemSize & ImageSize */
  const itemSpace = 8;
  const rowPadding = 18;
  const imageAspectRatio = 0.75;
  const imageWidthRatio = 0.95;
  const imageNameHeight = 30;

  const itemWidth = useMemo(() => {
    return containerSize?.width
      ? (containerSize?.width - rowPadding * 2 - (colume - 1) * itemSpace) /
          colume
      : 0;
  }, [containerSize?.width, colume, itemSpace]);

  const imageWidth = useMemo(() => {
    return itemWidth * imageWidthRatio;
  }, [itemWidth, imageWidthRatio]);

  const imageHeight = useMemo(() => {
    return imageWidth * imageAspectRatio;
  }, [imageWidth, imageAspectRatio]);

  const itemHeight = useMemo(() => {
    return imageHeight + imageNameHeight + 16;
  }, [imageHeight, imageNameHeight]);

  return (
    <div ref={containerRef} className="dds-upload-list">
      <VirtualList
        className="virtual-list"
        data={imageGroups}
        height={containerSize?.height || 0}
        fullHeight={true}
        itemHeight={itemHeight}
        itemKey={'index'}
      >
        {(row, rowIdx) => {
          return (
            <div
              key={rowIdx}
              className="row-container"
              style={{
                gap: itemSpace,
                padding: `${itemSpace}px ${rowPadding}px`,
              }}
            >
              {row.rowImages.map((item, colIdx) => (
                <div
                  className={classNames('preview-container', {
                    'preview-container-success': item.status === 'success',
                    'preview-container-error': item.status === 'error',
                  })}
                  style={{
                    width: itemWidth,
                  }}
                  key={item.name}
                >
                  {fileType === 'video' ? (
                    <video
                      className="file-preview"
                      src={item.url}
                      style={{
                        width: imageWidth,
                        height: imageHeight,
                      }}
                    />
                  ) : (
                    <img
                      className="file-preview"
                      src={item.url}
                      style={{
                        width: imageWidth,
                        height: imageHeight,
                      }}
                    />
                  )}
                  <div className="remove-button">
                    <Button
                      icon={<DeleteOutlined />}
                      shape={'circle'}
                      danger
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveFile(rowIdx * colume + colIdx);
                      }}
                    />
                  </div>
                  <div className="file-name">{item.name}</div>
                </div>
              ))}
            </div>
          );
        }}
      </VirtualList>
    </div>
  );
};

export default FilePreviewList;

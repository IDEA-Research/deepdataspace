import { memo, useMemo } from 'react';
import VirtualList from 'rc-virtual-list';
import styles from './index.less';
import { Button, UploadFile } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { chunk } from 'lodash';

interface IProps {
  files: UploadFile[];
  colume: number;
  containerHeight: number;
  containerWidth: number;
  onRemoveFile: (index: number) => void;
}

export const UploadImageList: React.FC<IProps> = memo(
  ({ files, colume, containerWidth, containerHeight, onRemoveFile }) => {
    /** Group files by colume count */
    const imageGroups = useMemo(() => {
      return chunk(files, colume).map((item, index) => ({
        index,
        rowImages: item,
      }));
    }, [files, colume]);

    /** Calculate ItemSize & ImageSize */
    const itemSpace = 8;
    const imageAspectRatio = 0.75;
    const imageWidthRatio = 0.95;
    const imageNameHeight = 30;

    const itemWidth = useMemo(() => {
      return (containerWidth - (colume - 1) * itemSpace) / colume;
    }, [containerWidth, colume, itemSpace]);

    const imageWidth = useMemo(() => {
      return itemWidth * imageWidthRatio;
    }, [itemWidth, imageWidthRatio]);

    const imageHeight = useMemo(() => {
      return imageWidth * imageAspectRatio;
    }, [imageWidth, imageAspectRatio]);

    const itemHeight = useMemo(() => {
      return imageHeight + imageNameHeight + 10;
    }, [imageHeight, imageNameHeight]);

    return (
      <div
        id="file-preview-container"
        className={styles.container}
        style={{ height: containerHeight }}
      >
        <VirtualList
          className={styles['virtual-list']}
          data={imageGroups}
          height={containerHeight}
          fullHeight={true}
          itemHeight={itemHeight}
          itemKey={'index'}
        >
          {(row, rowIdx) => {
            return (
              <div
                key={rowIdx}
                className={styles['row-container']}
                style={{ gap: itemSpace }}
              >
                {row.rowImages.map((item, colIdx) => (
                  <div
                    className={`${styles['preview-container']}`}
                    style={{
                      width: itemWidth,
                      height: itemHeight,
                    }}
                    key={item.uid}
                  >
                    <div className={`${styles['remove-button']}`}>
                      <Button
                        className={styles.btn}
                        icon={<DeleteOutlined />}
                        shape={'circle'}
                        danger
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveFile(rowIdx * colume + colIdx);
                        }}
                      />
                    </div>
                    <img
                      className={`${styles['image-preview']}`}
                      src={item.thumbUrl || item.url}
                      style={{
                        width: imageWidth,
                        height: imageHeight,
                      }}
                    />
                    <div className={`${styles['image-name']}`}>{item.name}</div>
                  </div>
                ))}
              </div>
            );
          }}
        </VirtualList>
      </div>
    );
  },
);

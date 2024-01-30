import VirtualList from 'rc-virtual-list';
import { useCallback, useEffect, useState } from 'react';

import { QsAnnotatorFile } from '../../type';

import './index.less';

interface IProps {
  images: QsAnnotatorFile[];
  selected: number;
  onImageSelected: (index: number) => void;
}

export const ImageList: React.FC<IProps> = ({
  images,
  selected,
  onImageSelected,
}: IProps) => {
  const [containerHeight, setContainerHeight] = useState(0);
  const itemHeight = 120;

  const handleResize = useCallback(() => {
    const container = document.getElementById('image-options-container');
    if (container) {
      const height = container.offsetHeight || 0;
      setContainerHeight(height - 56);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  const handleImageSelect = (index: number) => {
    if (index < 0 || index >= images.length) return;
    onImageSelected(index);
  };

  return (
    <div id="image-options-container" className="dds-quicklabel-options-list">
      <VirtualList
        className="dds-quicklabel-options-list-virtual"
        data={images}
        height={containerHeight}
        fullHeight={true}
        itemHeight={itemHeight}
        itemKey="id"
      >
        {(item, index) => {
          const selectedClassName =
            index === selected
              ? 'dds-quicklabel-options-list-image-selected'
              : '';
          return (
            <div>
              <img
                className={`dds-quicklabel-options-list-image ${selectedClassName}`}
                src={item.url}
                key={item.id}
                onClick={() => handleImageSelect(index)}
              />
            </div>
          );
        }}
      </VirtualList>
    </div>
  );
};

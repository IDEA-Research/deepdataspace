import React from 'react';
import { Card, List, Tooltip } from 'antd';
import Icon from '@ant-design/icons';
import { ReactComponent as DownloadIcon } from '@/assets/svg/download.svg';
import { DATA } from '@/services/type';
import { useLocale } from '@/locales/helper';
import { ANNOTATION_TYPE_ICONS } from '@/constants';
import styles from './index.less';
import { includes } from 'lodash';

export interface IProps {
  data: DATA.DataSet;
  supportExport?: boolean;
  onClickItem: (item: DATA.DataSet) => void;
  onClickCopyLink: (
    event: React.UIEvent<HTMLElement, UIEvent>,
    item: DATA.DataSet,
  ) => void;
}

const DatasetItem: React.FC<IProps> = (props) => {
  const { localeText } = useLocale();
  const { data, supportExport, onClickItem } = props;

  const renderCover = () => {
    const _types = data?.objectTypes;
    let _img_index = 5;

    if (includes(_types, 'Classification')) {
      _img_index = 1;
    }
    if (includes(_types, 'Detection')) {
      _img_index = 2;
    }
    if (includes(_types, 'Segmentation')) {
      _img_index = 3;
    }
    if (includes(_types, 'Matting')) {
      _img_index = 4;
    }
    if (includes(_types, 'KeyPoints')) {
      _img_index = 5;
    }

    return (
      <div className={styles.imgWrap}>
        <img
          src={require(`@/assets/images/cards/card_cover_${_img_index}.png`)}
          alt="cover"
        />
      </div>
    );
  };

  return (
    <List.Item>
      <Card
        hoverable
        className={styles.card}
        onClick={() => onClickItem(data)}
        bodyStyle={{ padding: 0 }}
        bordered={false}
      >
        <div className={styles.imgBox}>
          {renderCover()}
          <div className={styles.types}>
            {data.objectTypes.map((type) => (
              <div key={type} className={styles.iconWrap}>
                <Tooltip title={type} placement="bottom">
                  <Icon
                    component={
                      ANNOTATION_TYPE_ICONS[
                        type as keyof typeof ANNOTATION_TYPE_ICONS
                      ]
                    }
                  />
                </Tooltip>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.infoWrap}>
          <div className={styles.titleWrap}>
            <div className={styles.title}>{data.name}</div>
            <div className={styles.linkWrap}>
              {supportExport && data.flagExportLink && (
                <Tooltip title="download" placement="bottom">
                  <a
                    href={data.flagExportLink}
                    download
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DownloadIcon className={styles.download} />
                  </a>
                </Tooltip>
              )}
            </div>
          </div>

          <div className={styles.group}>{data.groupName}</div>

          <div className={styles.extra}>
            <div className={styles.extra_item}>
              <span>{data.numImages}</span>
              <div className={styles.extra_info}>
                {localeText('dataset.images')}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </List.Item>
  );
};

export default DatasetItem;

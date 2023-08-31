import React from 'react';
import { Card, List, Tooltip } from 'antd';
import Icon from '@ant-design/icons';
import { ReactComponent as DownloadIcon } from '@/assets/svg/download.svg';
import { useLocale } from 'dds-utils/locale';
import { ANNOTATION_TYPE_ICONS } from '@/constants';
import { generateDefaultCover } from '@/utils/datasets';
import styles from './index.less';
import { NsDataSet } from '@/types/dataset';

export interface IProps {
  data: NsDataSet.DataSet;
  supportExport?: boolean;
  onClickItem: (item: NsDataSet.DataSet) => void;
  onClickCopyLink: (
    event: React.UIEvent<HTMLElement, UIEvent>,
    item: NsDataSet.DataSet,
  ) => void;
}

const DatasetItem: React.FC<IProps> = (props) => {
  const { localeText } = useLocale();
  const { data, supportExport, onClickItem } = props;

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
          <div className={styles.imgWrap}>
            <img
              src={data?.coverUrl ?? ''}
              alt="cover"
              onError={(e: any) => {
                e.target.src = generateDefaultCover(data?.objectTypes);
              }}
            />
          </div>
          {data.objectTypes.length && (
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
          )}
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
          <div className={styles.desc}>{data.description}</div>
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

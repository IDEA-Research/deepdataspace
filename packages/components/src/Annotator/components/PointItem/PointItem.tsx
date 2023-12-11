import { KEYPOINTS_VISIBLE_TYPE } from '../../constants';
import { useLocale } from 'dds-utils/locale';
import { Select } from 'antd';
import styles from './index.less';

interface IProps {
  point: IElement<IPoint>;
  index: number;
  active: boolean;
  onVisibleChange: (val: number) => void;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseOut?: React.MouseEventHandler<HTMLDivElement>;
  onMouseOver?: React.MouseEventHandler<HTMLDivElement>;
}

const PointItem: React.FC<IProps> = ({
  point,
  index,
  active,
  onMouseEnter,
  onMouseOut,
  onMouseOver,
  onVisibleChange,
}) => {
  const { localeText } = useLocale();

  return (
    <div
      key={index}
      className={styles.item}
      onMouseOut={onMouseOut}
      onMouseOver={onMouseOver}
      onMouseEnter={onMouseEnter}
    >
      {active && (
        <div
          className={styles.selected}
          style={{
            backgroundColor: point.color,
          }}
        />
      )}
      <div
        className={styles.info}
      >
        {point.name ? `#${index + 1} ${point.name}` : `${index + 1} `}
      </div>
      <div className={styles.action}>
        <Select
          bordered={false}
          showArrow={true}
          popupClassName={styles['selector-dropdown']}
          size="small"
          value={point.visible}
          onChange={onVisibleChange}
          style={{ width: '100%' }}
        >
          <Select.Option value={KEYPOINTS_VISIBLE_TYPE.noLabeled}>
            {localeText('DDSAnnotator.annotsList.point.notInImage')}
          </Select.Option>
          <Select.Option value={KEYPOINTS_VISIBLE_TYPE.labeledNotVisible}>
            {localeText('DDSAnnotator.annotsList.point.notVisible')}
          </Select.Option>
          <Select.Option value={KEYPOINTS_VISIBLE_TYPE.labeledVisible}>
            {localeText('DDSAnnotator.annotsList.point.visible')}
          </Select.Option>
        </Select>
      </div>
    </div>
  );
};

export default PointItem;

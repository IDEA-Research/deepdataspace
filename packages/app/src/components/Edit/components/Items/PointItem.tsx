import { KEYPOINTS_VISIBLE_TYPE } from '@/constants';
import { useLocale } from '@/locales/helper';
import { Select } from 'antd';
import styles from './index.less';

interface IProps {
  point: IElement<IPoint>;
  index: number;
  active: boolean;
  onMouseEnter: React.MouseEventHandler<HTMLDivElement>;
  onMouseOut: React.MouseEventHandler<HTMLDivElement>;
  onMouseOver: React.MouseEventHandler<HTMLDivElement>;
  onVisibleChange: (val: number) => void;
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
      style={{
        backgroundColor: active ? '#4b4f52' : '#262626',
      }}
      onMouseOut={onMouseOut}
      onMouseOver={onMouseOver}
      onMouseEnter={onMouseEnter}
    >
      {active && (
        <div
          className={styles.selectedLine}
          style={{
            backgroundColor: point.color,
          }}
        />
      )}
      <div
        className={styles.info}
        style={{
          fontSize: 12,
          color: '#fff',
        }}
      >
        {point.name ? `${index + 1} ${point.name}` : `${index + 1} `}
      </div>
      <div className={styles.action}>
        <Select
          showArrow={true}
          popupClassName={styles['selector-dropdown']}
          size="small"
          value={point.visible}
          onChange={onVisibleChange}
          dropdownMatchSelectWidth={false}
        >
          <Select.Option value={KEYPOINTS_VISIBLE_TYPE.noLabeled}>
            {localeText('editor.annotsList.point.notInImage')}
          </Select.Option>
          <Select.Option value={KEYPOINTS_VISIBLE_TYPE.labeledNotVisible}>
            {localeText('editor.annotsList.point.notVisible')}
          </Select.Option>
          <Select.Option value={KEYPOINTS_VISIBLE_TYPE.labeledVisible}>
            {localeText('editor.annotsList.point.visible')}
          </Select.Option>
        </Select>
      </div>
    </div>
  );
};

export default PointItem;

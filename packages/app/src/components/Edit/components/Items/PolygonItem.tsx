import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import styles from './index.less';

interface IProps {
  element: IElement<IPolygonGroup>;
  active: boolean;
  onMouseEnter: React.MouseEventHandler<HTMLDivElement>;
  onMouseOut: React.MouseEventHandler<HTMLDivElement>;
  onMouseOver: React.MouseEventHandler<HTMLDivElement>;
  onVisibleChange: (value: boolean) => void;
}

const PolygonItem: React.FC<IProps> = ({
  element,
  active,
  onMouseEnter,
  onMouseOut,
  onMouseOver,
  onVisibleChange,
}) => {
  const color = '#fff';

  return (
    <div
      key={'polygon'}
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
            backgroundColor: color,
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
        {'POLYGON'}
      </div>
      <div className={styles.action}>
        <Button
          ghost
          className={styles.btn}
          icon={element.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          shape={'circle'}
          onClick={() => onVisibleChange(!element.visible)}
        />
      </div>
    </div>
  );
};

export default PolygonItem;

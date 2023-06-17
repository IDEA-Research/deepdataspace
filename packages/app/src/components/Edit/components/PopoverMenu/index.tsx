import styles from './index.less';
import { FloatWrapper } from '@/components/FloatWrapper';

interface IPopoverMenu {
  index: number;
  targetElement: IElement<IPoint>;
  imagePos: IPoint;
}

const PopoverMenu: React.FC<IPopoverMenu> = ({
  index,
  targetElement,
  imagePos,
}) => {
  return (
    <FloatWrapper>
      <div
        className={styles.container}
        style={{
          left: targetElement.x + imagePos.x + 5,
          top: targetElement.y + imagePos.y + 5,
        }}
      >
        <div className={styles.content}>
          <span className={styles.text}>{`${index + 1} ${
            targetElement.name
          }`}</span>
        </div>
      </div>
    </FloatWrapper>
  );
};

export default PopoverMenu;

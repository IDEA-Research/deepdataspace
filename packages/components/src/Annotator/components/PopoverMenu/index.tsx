import { FloatWrapper } from '../FloatWrapper';
import './index.less';

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
        className="dds-annotator-popover-menu"
        style={{
          left: targetElement.x + imagePos.x + 5,
          top: targetElement.y + imagePos.y + 5,
        }}
      >
        <div className="dds-annotator-popover-menu-content">
          <span className="dds-annotator-popover-menu-text">{`${index + 1} ${
            targetElement.name
          }`}</span>
        </div>
      </div>
    </FloatWrapper>
  );
};

export default PopoverMenu;

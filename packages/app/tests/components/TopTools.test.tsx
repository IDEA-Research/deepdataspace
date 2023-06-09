import { umiRender } from '../test-utils';
import {
  CloseOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import TopTools from '@/components/TopTools';

test('render TopTools by snapshot', () => {
  const { container } = umiRender(
    <TopTools
      leftTools={[
        {
          icon: <ZoomInOutlined />,
          onClick: () => {},
        },
        {
          icon: <ZoomOutOutlined />,
          onClick: () => {},
          disabled: true,
        },
      ]}
      rightTools={[
        {
          icon: <CloseOutlined />,
          onClick: () => {},
        },
      ]}
    >
      {`1 / 100`}
    </TopTools>,
  );
  expect(container).toMatchSnapshot();
});

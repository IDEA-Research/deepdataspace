import { render } from '@testing-library/react';
import {
  CloseOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import TopTools from '@/components/TopTools';

test('render TopTools by snapshot', () => {
  const { container } = render(
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

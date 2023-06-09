import Menu from '@/layouts/menu';
import { umiRender } from '../test-utils';

test('render Menu by snapshot', () => {
  const { container } = umiRender(<Menu collapsed={false} />);
  expect(container).toMatchSnapshot();
});

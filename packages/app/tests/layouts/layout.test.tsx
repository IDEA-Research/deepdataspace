import Layout from '@/layouts';
import { umiRender } from '../test-utils';

test('render Menu Layout snapshot', () => {
  const { container } = umiRender(<Layout />);
  expect(container).toMatchSnapshot();
});

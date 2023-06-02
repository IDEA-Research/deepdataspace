import DatasetList from '@/pages/DatasetList';
import { umiRender } from '../test-utils';

test('render Menu Layout snapshot', async () => {
  const { container } = umiRender(<DatasetList />);
  expect(container).toMatchSnapshot();
});

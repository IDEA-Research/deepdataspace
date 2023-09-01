import { umiRender } from '../test-utils';
import DropdownSelector from '@/components/DropdownSelector';

test('render DropdownSelector by snapshot', () => {
  const { container } = umiRender(<DropdownSelector />);
  expect(container).toMatchSnapshot();
});

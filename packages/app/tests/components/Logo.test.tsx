import { umiRender } from '../test-utils';
import { screen } from '@testing-library/react';
import Logo from '@/components/Logo';

test('render GlobalLoading by snapshot', () => {
  const { container } = umiRender(<Logo />);
  expect(screen.getByAltText('logo')).toBeDefined();
  expect(container).toMatchSnapshot();
});

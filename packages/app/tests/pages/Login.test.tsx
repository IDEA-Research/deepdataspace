import { screen } from '@testing-library/react';
import { umiRender } from '../test-utils';
import Login from '@/pages/Login';

test('render page Login', async () => {
  umiRender(<Login />);
  expect(screen.findAllByText('Deep Data Space')).toBeDefined();
});

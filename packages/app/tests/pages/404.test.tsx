import { screen } from '@testing-library/react';
import { umiRender } from '../test-utils';
import Page404 from '@/pages/404';

test('render page 404', async () => {
  umiRender(<Page404 />);
  expect(screen.findAllByText('404')).toBeDefined();
});

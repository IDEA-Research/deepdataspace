import { screen } from '@testing-library/react';
import { umiRender } from '../test-utils';
import DatasetList from '@/pages/DatasetList';

test('render page DatasetList', async () => {
  umiRender(<DatasetList />);
  expect(screen.getByText('Datasets')).toBeDefined();
});

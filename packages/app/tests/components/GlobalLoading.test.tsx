import { render } from '@testing-library/react';
import GlobalLoading from '@/components/GlobalLoading';

test('render GlobalLoading by snapshot', () => {
  const { container } = render(<GlobalLoading active>test</GlobalLoading>);
  expect(container).toMatchSnapshot();
});

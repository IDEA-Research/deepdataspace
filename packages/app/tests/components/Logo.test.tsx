import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Logo from '@/components/Logo';

test('render GlobalLoading by snapshot', () => {
  const { container } = render(
    <MemoryRouter>
      <Logo />
    </MemoryRouter>,
  );
  expect(container).toMatchSnapshot();
});

import { renderHook } from '@testing-library/react';
import { useModel } from '@umijs/max';
import { dataflowProvider } from '@@/plugin-model/runtime';

describe('useModel user', () => {
  it('useModel user returns expected state', () => {
    const { result } = renderHook(() => useModel('user'), {
      wrapper: ({ children }) => dataflowProvider(children, {}),
    });
    expect(result.current).toEqual(
      expect.objectContaining({
        user: {},
      }),
    );
  });
});

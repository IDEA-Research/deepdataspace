import { act, renderHook } from '@testing-library/react';
import { useModel } from '@umijs/max';
import { dataflowProvider } from '@@/plugin-model/runtime';

describe('useModel global', () => {
  // beforeAll(() => {
  // });

  // afterAll(() => {
  //   jest.resetModules();
  // });

  it('useModel global returns expected state', () => {
    const { result } = renderHook(() => useModel('global'), {
      wrapper: ({ children }) => dataflowProvider(children, {}),
    });
    expect(result.current).toEqual(
      expect.objectContaining({
        loading: false,
      }),
    );
  });

  it('useModel global setter', () => {
    const { result } = renderHook(() => useModel('global'), {
      wrapper: ({ children }) => dataflowProvider(children, {}),
    });
    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.loading).toEqual(true);
  });
});

import { act } from '@testing-library/react';
import { useModel } from '@umijs/max';
import { umiRenderHook } from '../test-utils';

describe('useModel datasets', () => {
  // beforeAll(() => {
  // });

  // afterAll(() => {
  //   jest.resetModules();
  // });

  it('useModel datasets returns expected state', () => {
    const { result } = umiRenderHook(() => useModel('datasets'));
    expect(result.current).toEqual(
      expect.objectContaining({
        loading: false,
      }),
    );
  });

  it('useModel datasets setter', () => {
    const { result } = umiRenderHook(() => useModel('datasets'));
    act(() => {
      result.current.onPageChange(2);
    });
    expect(result.current.pagination.page).toEqual(2);
  });
});

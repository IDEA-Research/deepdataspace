import { act } from '@testing-library/react';
import { useModel } from '@umijs/max';
import { umiRenderHook } from '../test-utils';

describe('useModel global', () => {
  // beforeAll(() => {
  // });

  // afterAll(() => {
  //   jest.resetModules();
  // });

  it('useModel global returns expected state', () => {
    const { result } = umiRenderHook(() => useModel('global'));
    expect(result.current).toEqual(
      expect.objectContaining({
        loading: false,
      }),
    );
  });

  it('useModel global setter', () => {
    const { result } = umiRenderHook(() => useModel('global'));
    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.loading).toEqual(true);
  });
});

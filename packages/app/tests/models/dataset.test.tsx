import { useModel } from '@umijs/max';
import { umiRenderHook } from '../test-utils';

describe('useModel dataset.comparisons', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('useModel dataset.comparisons returns expected state', () => {
    const { result } = umiRenderHook(() => useModel('dataset.comparisons'));
    expect(result.current).toEqual(
      expect.objectContaining({
        showAnalysisModal: false,
      }),
    );
  });
});

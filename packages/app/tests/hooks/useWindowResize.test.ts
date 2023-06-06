import { act, renderHook } from '@testing-library/react';
import useWindowResize from '@/hooks/useWindowResize';

// Unit tests
describe('useWindowResize', () => {
  it('returns an object with width and height properties', () => {
    const { result } = renderHook(() => useWindowResize());
    expect(result.current).toEqual(
      expect.objectContaining({
        width: expect.any(Number),
        height: expect.any(Number),
      }),
    );
  });

  it('updates width and height when window is resized', () => {
    const { result } = renderHook(() => useWindowResize());

    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 700;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(700);
  });
});

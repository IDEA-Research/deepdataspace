import { Direction } from '@/utils/compute';
import { updateMouseCursor } from '@/utils/style';

describe('updateMouseCursor', () => {
  it('should set the cursor style on the element to the provided value', () => {
    const element = document.createElement('div');
    updateMouseCursor(element, 'pointer');
    expect(element.style.cursor).toBe('pointer');
  });

  it('should set the cursor style on the element based on the TOP direction', () => {
    const element = document.createElement('div');
    updateMouseCursor(element, 'pointer', Direction.TOP);
    expect(element.style.cursor).toBe('ns-resize');
  });

  it('should set the cursor style on the element based on the TOP_LEFT direction', () => {
    const element = document.createElement('div');
    updateMouseCursor(element, 'pointer', Direction.TOP_LEFT);
    expect(element.style.cursor).toBe('nwse-resize');
  });

  it('should set the cursor style on the element based on the BOTTOM_LEFT direction', () => {
    const element = document.createElement('div');
    updateMouseCursor(element, 'pointer', Direction.BOTTOM_LEFT);
    expect(element.style.cursor).toBe('nesw-resize');
  });

  it('should set the cursor style on the element based on the CENTER direction', () => {
    const element = document.createElement('div');
    updateMouseCursor(element, 'pointer', Direction.CENTER);
    expect(element.style.cursor).toBe('ew-resize');
  });

  it('should do nothing if the element is null', () => {
    const element = null;
    updateMouseCursor(element, 'pointer', Direction.TOP);
    expect(element).toBe(null);
  });
});

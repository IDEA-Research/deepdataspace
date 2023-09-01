import { getUrlQueryVal, getUrlPathnameLastKey, backPath } from 'dds-utils/url';

describe('getUrlQueryVal', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: new URL(`https://example.com/path/key?foo=bar`),
    });
  });
  it('should return null if query param is not found', () => {
    const result = getUrlQueryVal('boo');
    expect(result).toBeNull();
  });

  it('should return the value of the query param if found', () => {
    expect(getUrlQueryVal('foo')).toBe('bar');
  });
});

describe('getUrlPathnameLastKey', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: new URL(`https://example.com/path/key?foo=bar`),
    });
  });

  it('returns the last key in the URL pathname', () => {
    // Object.defineProperty(window, 'location', {
    //   value: new URL(`https://example.com/path/key?foo=bar`),
    // });
    expect(getUrlPathnameLastKey()).toEqual('key');
  });
});

describe('backPath', () => {
  beforeEach(() => {});

  it('should go back in history if referrer includes backPath', () => {
    const spy = jest.spyOn(window.history, 'back');
    Object.defineProperty(document, 'referrer', {
      value: 'https://example.com/foo/bar',
    });
    backPath('/foo');
    expect(spy).toHaveBeenCalled();
  });

  // it('should push backPath to history if referrer does not include backPath', () => {
  //   jest.mock('@umijs/max', () => ({
  //     history: {
  //       push: jest.fn(),
  //     },
  //   }));
  //   Object.defineProperty(document, 'referrer', { value: 'https://example.com/foo/bar' });
  //   backPath('/baz');
  //   expect(history.push).toHaveBeenCalledWith('/baz');
  // });
});

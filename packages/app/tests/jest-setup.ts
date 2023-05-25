import '@testing-library/jest-dom';
import '@umijs/max/test-setup';

/** Partial third-party dependency mock */
jest.mock('clientjs', () => ({
  ClientJS: class ClientJS {
    getFingerprint() {
      return 'test';
    }
  },
}));

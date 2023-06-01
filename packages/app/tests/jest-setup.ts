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

// jest.mock('@umijs/max', () => {
//   // const originalModule = jest.requireActual('@umijs/max');
//   return {
//     // __esModule: true,
//     // ...originalModule,
//     useModel: jest.fn((model: string) => {
//       const useHook = require(`@/models/${model}`).default;
//       console.log('>>>> useHook', useHook);
//       return useHook();
//     }),
//   };
// });

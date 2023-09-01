import '@testing-library/jest-dom';
import '@umijs/max/test-setup';

window.matchMedia = jest.fn().mockReturnValue({
  matches: true,
  addListener: jest.fn(),
  removeListener: jest.fn(),
});

/** Partial third-party dependency mock */
// jest.mock('clientjs', () => ({
//   ClientJS: class ClientJS {
//     getFingerprint() {
//       return 'test';
//     }
//   },
// }));

/** Partial global mock */
jest.mock('@/services/user', () => ({
  fetchUserInfo: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
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

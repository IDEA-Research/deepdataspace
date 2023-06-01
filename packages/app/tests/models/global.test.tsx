import { renderHook } from '@testing-library/react';
import { useModel } from '@umijs/max';
// import { Context } from './mocks';

// const MockedContext = React.createContext({
//   dispatcher: {},
// });

// const mockedDispatch = jest.fn();

// const mockedUmiPlugin = {
//   apply: (hooks: any) => {
//     hooks.useModel(() => ({ state: { someState: 'someValue' }, dispatch: mockedDispatch }));
//   },
// };

describe('useModel global', () => {
  beforeEach(() => {
    // 模拟 useModel 返回的对象
    const mockUseModel = jest.fn((model: string) => {
      const useHook = require(`@/models/${model}`);
      return useHook;
    });

    // Mock 掉 useModel 方法
    jest.spyOn(useModel, 'default').mockImplementation(() => mockUseModel());
  });

  it('useModel returns expected state', () => {
    const { result } = renderHook(() => useModel('global'));
    expect(result.current).toEqual(
      expect.objectContaining({
        loading: false,
      }),
    );
  });
});

// test('useModel returns expected state', () => {
//   const { result } = renderHook(() => useModel('global'));
//   expect(result.current).toEqual(
//     expect.objectContaining({
//       loading: false,
//     })
//   );

//   // const { result } = renderHook(() => useModel('global'),
//   //   {
//   //     wrapper: ({ children }) => (
//   //       <Provider>
//   //         {/* <Provider plugins={mockContainer.plugins} models={mockContainer.models}> */}
//   //           {children}
//   //         {/* </Provider> */}
//   //       </Provider>
//   //     ),
//   //   }
//   // );
//   // expect(result.current).toEqual({ loading: false });
// });

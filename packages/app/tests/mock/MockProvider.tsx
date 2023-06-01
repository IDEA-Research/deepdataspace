// import { Provider } from '@umijs/max';
// import React, { ReactNode } from 'react';

// interface Props {
//   plugins: Plugin[];
//   models: Model[];
//   children: ReactNode;
// }

// interface Dispatcher {
//   [namespace: string]: Dispatch<any>;
// }

// interface ContextValue {
//   dispatcher: Dispatcher;
// }

// export const MockedContext = React.createContext<ContextValue>({
//   dispatcher: {},
// });

// export function MockedProvider({ plugins, models, children }: Props) {
//   const mockContainer = {
//     plugins: [],
//     models: [],
//   };
//   const mockDispatcher: Dispatcher = {};

//   plugins.forEach((plugin) => {
//     plugin.apply({
//       register: (api: any) => {
//         mockContainer.plugins.push(api);
//       },
//     });
//   });

//   models.forEach((model) => {
//     model.state = model.state || {};
//     const { namespace, state } = model;
//     if (namespace) {
//       mockDispatcher[namespace] = (payload: any) => {
//         model.reducers && Object.keys(model.reducers).forEach((type) => {
//           if (type in payload) {
//             state[type] = model.reducers[type](state[type], payload[type]);
//           }
//         });
//       };
//     }
//     mockContainer.models.push(model);
//   });

//   return (
//     <MockedContext.Provider value={{ dispatcher: mockDispatcher }}>
//       <Provider plugins={mockContainer.plugins} models={mockContainer.models}>
//         {children}
//       </Provider>
//     </MockedContext.Provider>
//   );
// }

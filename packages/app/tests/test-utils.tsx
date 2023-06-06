import {
  Queries,
  RenderHookOptions,
  RenderOptions,
  queries,
  render,
  renderHook,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { dataflowProvider } from '@@/plugin-model/runtime';
import { _LocaleContainer } from '@@/plugin-locale/locale';

export function umiRender<
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
>(ui: React.ReactElement, options?: RenderOptions<Q, Container, BaseElement>) {
  return render(ui, {
    wrapper: ({ children }) => (
      <_LocaleContainer>
        <MemoryRouter>{dataflowProvider(children, {})}</MemoryRouter>
      </_LocaleContainer>
    ),
    ...(options ? options : {}),
  });
}

export function umiRenderHook<
  Result,
  Props,
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
>(
  render: (initialProps: Props) => Result,
  options?: RenderHookOptions<Props, Q, Container, BaseElement>,
) {
  return renderHook(render, {
    wrapper: ({ children }) => dataflowProvider(children, {}),
    ...(options ? options : {}),
  });
}

import {
  Queries,
  RenderHookOptions,
  RenderOptions,
  queries,
  render,
  renderHook,
} from '@testing-library/react';
import { TestBrowser } from '@umijs/max';
import { dataflowProvider } from '@@/plugin-model/runtime';

export function umiRender<
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
>(ui: React.ReactElement, options?: RenderOptions<Q, Container, BaseElement>) {
  return render(ui, {
    wrapper: () => <TestBrowser />,
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

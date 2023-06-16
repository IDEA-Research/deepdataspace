// Runtime configuration
import React from 'react';
import humps from 'humps';
import { message } from 'antd';
import { RequestConfig, RunTimeLayoutConfig, history } from '@umijs/max';
import { ErrorBoundary, ErrorBoundaryProps } from '@sentry/react';
import { RunningErrorTip } from 'dds-component';
import { STORAGE_KEY } from './constants';
import { globalLocaleText } from '@/locales/helper';
import { matchErrorMsg } from '@/services/errorCode';

// Global initialization data configuration for Layout user information and permission initialization
// More info：https://next.umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<{ name: string }> {
  // Disable page zooming globally
  document.addEventListener(
    'wheel',
    function (event) {
      if (event.ctrlKey || event.detail) {
        event.preventDefault();
      }
    },
    {
      capture: false,
      passive: false,
    },
  );
  document.addEventListener(
    'keydown',
    function (event) {
      if (
        (event.ctrlKey === true || event.metaKey === true) &&
        (event.keyCode === 61 ||
          event.keyCode === 107 ||
          event.keyCode === 173 ||
          event.keyCode === 109 ||
          event.keyCode === 187 ||
          event.keyCode === 189)
      ) {
        event.preventDefault();
      }
    },
    false,
  );

  message.config({
    duration: 1.5,
    maxCount: 2,
  });

  return { name: '@umijs/max' };
}

export const layout: RunTimeLayoutConfig = () => ({
  pure: true,
  title: globalLocaleText('layout.title'),
});

export function rootContainer(container: JSX.Element) {
  const props = {
    showDialog: true,
    fallback: (props) => <RunningErrorTip {...props} />,
  } as ErrorBoundaryProps;

  return React.createElement(ErrorBoundary, props, container);
}

/**
 * Custom request：
 * 1、By default, the request returns the "data" field in the API protocol and determines whether to throw an error based on the "code".
 * 2、Add options: `shouldReturnCodeRsp` to skip the default code error handling and return the complete backend data.
 * 3、Add options: `skipErrorHandler` to skip the default error prompt (including the status code).
 * 4、Add options: `hideCodeErrorMsg` to hide the default code error prompt (excluding the status code).
 */
export const request: RequestConfig = {
  baseURL: process.env.API_PATH,
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
  },
  // dataField: 'data',
  // Error handler： umi@3
  errorConfig: {
    errorHandler: (error: any, opts: any) => {
      // Pop 2XX error out into catch function in order to customize msg info
      if (/^2/.test(error.status)) return;

      // Allow to skip errorHandler
      if (opts?.skipErrorHandler) return;

      // Not logged in / Unauthorized access
      if (error.response?.status === 401) {
        history.push('/');
        localStorage.removeItem(STORAGE_KEY.AUTH_TOKEN);
      }

      // Allow to hide common code error msg tip
      if (opts?.hideCodeErrorMsg) return;

      if (error.response) {
        // The request was successful and the server responded with a status code, but the status code is outside the 2xx range.
        // Match Common error tip
        message.error(matchErrorMsg(error.data?.code, error.response.status));
      } else if (error.request) {
        // The request has been successfully sent, but no response has been received
        message.error(globalLocaleText('requestConfig.noResponse.msg'));
      } else {
        message.error(globalLocaleText('requestConfig.requestError.msg'));
      }
    },
  },
  requestInterceptors: [
    (config: RequestConfig) => {
      if (config.params) {
        config.params = humps.decamelizeKeys(config.params);
      }
      if (config.data) {
        config.data = humps.decamelizeKeys(config.data);
      }
      if (config.headers) {
        const token = localStorage.getItem(STORAGE_KEY.AUTH_TOKEN);
        if (token) {
          config.headers['Token'] = token;
        }
      }
      return { ...config };
    },
  ],
  responseInterceptors: [
    (response: any) => {
      // 2xx response
      if (response.data?.code === 0) {
        response.data = humps.camelizeKeys(response.data?.data || {});
        return response;
      } else {
        if (!response.config?.hideCodeErrorMsg) {
          // Match 2xx customs error code
          message.error(matchErrorMsg(response.data?.code, 200));
        }
        throw response;
      }
    },
  ],
};

import { globalLocaleText } from '@/locales/helper';

export const ERROR_STATUS_MSG_MAP: Record<number, string> = {
  /** CODE_2XX */
  200: 'requestConfig.success.msg',
  /** CODE_4xx */
  401: 'requestConfig.unAuth.msg',
  403: 'requestConfig.permissionDenied.msg',
  /** CODE_5XX */
  500: 'requestConfig.responseStatus.msg',
};

export const ERROR_CODE_MSG_MAP: Record<number, string> = {
  101: 'requestConfig.errorContent.msg',
  /** CODE_2XXXXX */
  200001: 'requestConfig.success.msg',
  /** CODE_4XXXXX */
  401001: 'requestConfig.unAuth.msg',
  403001: 'requestConfig.permissionDenied.msg',
  /** CODE_5XXXXX */
  500001: 'requestConfig.responseStatus.msg',
};

/**
 * return common code / status message
 * @param code
 * @param status
 * @returns
 */
export const matchErrorMsg = (code?: number, status?: number) => {
  if (code && ERROR_CODE_MSG_MAP[code]) {
    return globalLocaleText(ERROR_CODE_MSG_MAP[code]);
  }
  if (status && ERROR_STATUS_MSG_MAP[status]) {
    return globalLocaleText('requestConfig.responseStatus.msg', {
      status: status ? status : '',
    });
  }
  return globalLocaleText('requestConfig.errorData.msg', {
    code: `${status}${code ? `-${code}` : ''}`,
  });
};

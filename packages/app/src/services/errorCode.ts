import { globalLocaleText } from '@/locales/helper';

export const ERROR_CODE_MSG_MAP: Record<number, string> = {
  /** CODE_2XX */
  200001: 'XXX',
  /** CODE_401 */
  401: 'requestConfig.unAuth.msg',
  401001: 'XXX',
  /** CODE_403 */
  403: 'requestConfig.permissionDenied.msg',
  403001: 'XXX',
  /** CODE_XXX */
  500: 'requestConfig.responseStatus.msg',
  500001: 'XXX',
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
  if (status && ERROR_CODE_MSG_MAP[status]) {
    return globalLocaleText(ERROR_CODE_MSG_MAP[status]);
  }
  return globalLocaleText('requestConfig.errorData.msg', {
    code: `${status}${code ? `-${code}` : ''}`,
  });
};

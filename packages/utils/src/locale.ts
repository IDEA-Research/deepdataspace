import { FormattedMessage, formatMessage, useIntl } from '@umijs/max';

/**
 * Use For: single function / global model / layout / app.tsx
 * The corresponding multilingual only takes effect after refreshing the page.
 * @param id
 * @param templateParams
 * @returns
 */

export const globalLocaleText = (
  id: string,
  templateParams: Record<string, any> = {},
) => {
  return formatMessage({ id }, templateParams);
};

/**
 * Use For: Render function
 * id
 * values
 */
export const LocaleText = FormattedMessage;

/**
 * Use For: Fuction Components
 */
export const useLocale = () => {
  const intl = useIntl();
  const localeText = (id: string, templateParams: Record<string, any> = {}) => {
    return intl.formatMessage({ id }, templateParams);
  };
  return {
    localeText,
  };
};

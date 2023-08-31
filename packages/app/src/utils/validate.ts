import { globalLocaleText } from 'dds-utils/locale';

//eslint-disable-next-line
export const emailRegExp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const Validate = {
  validatePwd: (rule, value) => {
    if (!value) {
      return Promise.reject(globalLocaleText('validatePwdRequire'));
    }
    if (value.length < 8) {
      return Promise.reject(globalLocaleText('validatePwdLengthMin'));
    }
    if (
      !/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*(),.?:;{}|<>'"]).{8,20}$/.test(
        value,
      )
    ) {
      return Promise.reject(globalLocaleText('validatepwdFormat'));
    }
    if (value.length > 20) {
      return Promise.reject(globalLocaleText('validatePwdLengthMax'));
    }
    return Promise.resolve();
  },
  validatePwdConfirm: (rule, value, password) => {
    if (!value) {
      return Promise.reject(globalLocaleText('validatePwdConfirmRequire'));
    } else if (value !== password) {
      return Promise.reject(globalLocaleText('validatePwdConfirmDiff'));
    } else {
      return Promise.resolve();
    }
  },
  validateEmail: (rule, value) => {
    if (!value) {
      return Promise.reject(globalLocaleText('validateEmailRequire'));
    } else if (!emailRegExp.test(value)) {
      return Promise.reject(globalLocaleText('validateEmailFormat'));
    } else {
      return Promise.resolve();
    }
  },
};

export default Validate;

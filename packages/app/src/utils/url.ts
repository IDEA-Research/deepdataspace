import { history } from '@umijs/max';

export const getUrlQueryVal = (name: string) => {
  let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
  let r = window.location.search.substr(1).match(reg);
  if (r !== null) {
    return decodeURIComponent(r[2]);
  }
  return null;
};

export const getUrlPathnameLastKey = () => {
  const keys = window.location.pathname.split('/');
  return keys[keys.length - 1];
};

export const backPath = (backPath: string) => {
  if (document.referrer.includes(backPath)) {
    window.history.back();
  } else {
    history.push(backPath);
  }
};

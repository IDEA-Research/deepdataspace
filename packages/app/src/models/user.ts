import { message } from 'antd';
import { history, useModel } from '@umijs/max';
import { useImmer } from 'use-immer';
import { login, logout, fetchUserInfo } from '@/services/user';
import { EUserStatus, STORAGE_KEY } from '@/constants';
import { globalLocaleText } from '@/locales/helper';
import { useState } from 'react';

export default () => {
  const { setLoading } = useModel('global');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useImmer<{
    isLogin?: boolean;
    username?: string;
    userId?: string;
    token?: string;
    isStaff?: boolean;
  }>({});

  const limitLoginAction = () => {
    return new Promise((resolve) => {
      if (user.isLogin) {
        resolve(null);
        return;
      }
      setShowLoginModal(true);
    });
  };

  const checkLoginStatus = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEY.AUTH_TOKEN);
      const { id, name, status, isStaff } = await fetchUserInfo();
      if (token && status === EUserStatus.Active)
        setUser({
          isLogin: true,
          username: name,
          userId: id,
          token,
          isStaff,
        });
    } catch (error) {
      console.error('error', error);
      setUser({
        isLogin: false,
      });
    }
  };

  const onLogin = async (formdata: { username: string; password: string }) => {
    const { username: name, password } = formdata;
    const { pathname } = window.location;
    const isFromLoginPage = pathname.includes('page/login');
    setLoading(true);
    try {
      const { username, userId, token, isStaff } = await login({
        username: name,
        password,
      });
      setUser({
        isLogin: true,
        username,
        token,
        userId,
        isStaff,
      });
      localStorage.setItem(STORAGE_KEY.AUTH_TOKEN, token);
      if (!isFromLoginPage) setShowLoginModal(false);
      message.success(globalLocaleText('loginSuccess'));
    } catch {
      message.error(globalLocaleText('loginAuthenticationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    try {
      await logout();
      setUser({ isLogin: false });
      message.success(globalLocaleText('logoutSuccess'));
      localStorage.removeItem(STORAGE_KEY.AUTH_TOKEN);
      history.push('/');
    } catch (error) {
      console.error('error', error);
      message.error(globalLocaleText('logoutFailed'));
    }
  };

  const withLoginCheck = (handler: (...args: any) => any) => {
    return function (event: any) {
      if (!user.isLogin) {
        setShowLoginModal(true);
      } else {
        handler(event);
      }
    };
  };

  return {
    user,
    setUser,
    checkLoginStatus,
    onLogin,
    onLogout,
    showLoginModal,
    setShowLoginModal,
    limitLoginAction,
    withLoginCheck,
  };
};

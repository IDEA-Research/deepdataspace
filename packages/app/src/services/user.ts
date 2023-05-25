import { request } from '@umijs/max';
import { API } from './type';

export async function fetchUserInfo(options?: { [key: string]: any }) {
  return request<API.FetchUserInfoRsp>(`/api/v1/user_info`, {
    method: 'GET',
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function login(
  params: {
    username: string;
    password: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.ReqLoginRsp>(`/api/v1/login`, {
    method: 'POST',
    data: {
      ...params,
    },
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function logout(options?: { [key: string]: any }) {
  return request<API.ReqLoginRsp>(`/api/v1/logout`, {
    method: 'POST',
    ...(options || {}),
  });
}

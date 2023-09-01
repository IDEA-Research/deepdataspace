import { useModel } from '@umijs/max';
import { umiRenderHook } from '../test-utils';
import { act } from 'react-dom/test-utils';
import { fetchUserInfo, login, logout } from '@/services/user';
import { EUserStatus, STORAGE_KEY } from '@/constants';

describe('useModel user', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('useModel user returns expected state', () => {
    const { result } = umiRenderHook(() => useModel('user'));
    expect(result.current).toEqual(
      expect.objectContaining({
        user: {},
      }),
    );
  });

  it('mock onLogin', async () => {
    const mockedFetch = jest.mocked(login);
    mockedFetch.mockResolvedValueOnce({
      username: 'test user',
      userId: '123',
      token: 'test token',
    });
    const { result } = umiRenderHook(() => useModel('user'));
    await act(async () => {
      await result.current.onLogin('', 'test user@xxx.com', '123');
      expect(login).toHaveBeenCalledTimes(1);
    });
    expect(result.current.user.isLogin).toEqual(true);
  });

  it('mock onLogout', async () => {
    const mockedFetch = jest.mocked(logout);
    mockedFetch.mockResolvedValueOnce(undefined);
    const { result } = umiRenderHook(() => useModel('user'));
    await act(async () => {
      await result.current.onLogout();
      expect(logout).toHaveBeenCalledTimes(1);
    });
    expect(result.current.user.isLogin).toEqual(false);
  });

  it('useModel user limitLoginAction flase', () => {
    const { result } = umiRenderHook(() => useModel('user'));
    act(() => {
      result.current.limitLoginAction();
    });
    expect(result.current.showLoginModal).toEqual(true);
  });

  it('mock checkLoginStatus error', async () => {
    const mockedFetchUserInfo = jest.mocked(fetchUserInfo);
    mockedFetchUserInfo.mockRejectedValueOnce(null);
    localStorage.setItem(STORAGE_KEY.AUTH_TOKEN, 'test token');
    const { result } = umiRenderHook(() => useModel('user'));
    await act(async () => {
      await result.current.checkLoginStatus();
      expect(fetchUserInfo).toHaveBeenCalledTimes(1);
    });
    expect(result.current.user.isLogin).toEqual(false);
  });

  it('mock checkLoginStatus logined in', async () => {
    const mockedFetchUserInfo = jest.mocked(fetchUserInfo);
    mockedFetchUserInfo.mockResolvedValueOnce({
      id: '123',
      name: 'test user',
      status: EUserStatus.Active,
    });
    localStorage.setItem(STORAGE_KEY.AUTH_TOKEN, 'test token');
    const { result } = umiRenderHook(() => useModel('user'));
    await act(async () => {
      await result.current.checkLoginStatus();
      expect(fetchUserInfo).toHaveBeenCalledTimes(1);
    });
    act(async () => {
      result.current.limitLoginAction();
    });
    expect(result.current.user.isLogin).toEqual(true);
  });
});

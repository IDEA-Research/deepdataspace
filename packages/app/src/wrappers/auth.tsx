import { Navigate, Outlet, useLocation, useModel } from '@umijs/max';

export default () => {
  const { user } = useModel('user');
  const { pathname } = useLocation();

  // Status not retrieved
  if (user.isLogin === undefined) {
    return null;
  }
  // Not logged in
  if (!user.isLogin) {
    return <Navigate to={`/login?redirect=${pathname}`} replace />;
  }
  // Validation passed
  return <Outlet />;
};

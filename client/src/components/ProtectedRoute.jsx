import { Navigate, Outlet } from "react-router";

export function ProtectedRoute({ isAuth }) {
  return isAuth ? <Outlet /> : <Navigate to="/" />;
}

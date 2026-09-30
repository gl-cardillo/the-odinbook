import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute({ isAuth }) {
  return isAuth ? <Outlet /> : <Navigate to="/" />;
}

import { useContext } from "react";
import { Navigate, Outlet } from "react-router";
import { UserContext } from "../dataContext/dataContext";

export function ProtectedRoute() {
  const { user } = useContext(UserContext);
  return user ? <Outlet /> : <Navigate to="/" />;
}

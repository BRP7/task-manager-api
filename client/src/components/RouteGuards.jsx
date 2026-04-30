import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

export function ProtectedRoute({ children }) {
  const { token, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return <LoadingScreen label="Restoring your workspace..." />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { token, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return <LoadingScreen label="Checking your session..." />;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function RootRedirect() {
  const { token, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return <LoadingScreen label="Preparing Task Orbit..." />;
  }

  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

import { Navigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../context/AuthContext";

export default function PublicOnlyRoute({ children }) {
  const { currentUser, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-card p-6">
          <LoadingSpinner label="Checking your session..." />
        </div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}
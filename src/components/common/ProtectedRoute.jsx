import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { Loading } from "../ui";

const ProtectedRoute = ({ requiredRole, allowedRoles, redirectTo }) => {
  const { user, isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading size="lg" text="Đang tải..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role || "USER";

  const getDefaultPath = (userRole) => {
    if (userRole === "ADMIN") return "/admin";
    if (userRole === "CONSULTANT") return "/portal/document-approval";
    if (userRole === "INSTRUCTOR") return "/portal/instructor-schedule";
    return "/portal";
  };

  // Kiểm tra quyền truy cập (requiredRole hoặc allowedRoles)
  const isAuthorized = requiredRole
    ? role === requiredRole
    : (allowedRoles ? allowedRoles.includes(role) : true);

  console.log("role", role);
  if (!isAuthorized) {
    // Nếu sai role, chuyển về dashboard của chính họ
    return <Navigate to={redirectTo || getDefaultPath(role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

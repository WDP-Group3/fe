import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { USER_ROLES } from '../../constants';
import { Loading } from '../ui';

const ProtectedRoute = ({ children, requiredRole, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading size="lg" text="Đang tải..." />
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on user role
    if (user?.role === USER_ROLES.ADMIN) {
      return <Navigate to="/portal/admin" replace />;
    }
    return <Navigate to="/portal/overview" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/portal/overview" replace />;
  }

  return children;
};

export default ProtectedRoute;

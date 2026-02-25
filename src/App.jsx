import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider"; // Keep this imports clean, wait. context/index.js exports AuthProvider.
import { ToastProvider } from "./context/ToastContext";
import { useAuthContext } from "./context/AuthContext";
import Landing from "./pages/Landing";
import PortalLayout from "./components/layout/PortalLayout";
import AdminLayout from "./components/layout/AdminLayout";
import Overview from "./pages/Overview";
import Courses from "./pages/Courses";
import Enrollment from "./pages/Enrollment";
import Payments from "./pages/Payments";
import Schedule from "./pages/Schedule";
import Exams from "./pages/Exams";
import ExamTaking from "./pages/ExamTaking";
import ExamResult from "./pages/ExamResult";
import Notifications from "./pages/Notifications";
import Reports from "./pages/admin/Reports";
import UserManagement from "./pages/admin/UserManagement";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminNotifications from "./pages/admin/AdminNotifications";
import Feedback from "./pages/Feedback";
import Profile from "./pages/Profile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import CourseDetail from "./pages/CourseDetail";
import ProtectedRoute from "./components/common/ProtectedRoute";
import InstructorSchedule from "./pages/instructor/InstructorSchedule";

// Component xử lý điều hướng khi người dùng gõ linh tinh (404)
const NotFoundRedirect = () => {
  const { user, isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/portal'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* Student/Instructor/Consultant/Admin Portal */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "STUDENT", "INSTRUCTOR", "CONSULTANT", "GUEST"]}
                />
              }
            >
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="courses" element={<Courses />} />
                <Route path="enrollment" element={<Enrollment />} />
                <Route path="payments" element={<Payments />} />
                <Route path="schedule" element={<Schedule />} />

                <Route
                  element={
                    <ProtectedRoute
                      requiredRole="INSTRUCTOR"
                    />
                  }
                >
                  <Route
                    path="instructor-schedule"
                    element={<InstructorSchedule />}
                  />
                </Route>
                <Route path="exams" element={<Exams />} />
                <Route path="exam-taking" element={<ExamTaking />} />
                <Route path="exam-result/:id" element={<ExamResult />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:id" element={<Profile />} />
              </Route>
            </Route>

            <Route
              element={
                <ProtectedRoute requiredRole="ADMIN" />
              }
            >
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Route>

            {/* Global catch-all - Điều hướng thông minh theo role */}
            <Route path="*" element={<NotFoundRedirect />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

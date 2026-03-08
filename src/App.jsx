import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ToastProvider } from './context/ToastContext';
import { useAuthContext } from './context/AuthContext';
import Landing from './pages/Landing';
import PortalLayout from './components/layout/PortalLayout';
import AdminLayout from './components/layout/AdminLayout';
import Overview from './pages/Overview';
import Courses from './pages/Courses';
import Enrollment from './pages/Enrollment';
import Payments from './pages/Payments';
import Schedule from './pages/Schedule';
import Exams from './pages/Exams';
import ExamTaking from './pages/ExamTaking';
import ExamResult from './pages/ExamResult';
import Notifications from './pages/Notifications';
import Reports from './pages/admin/Reports';
import UserManagement from './pages/admin/UserManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminNotifications from './pages/admin/AdminNotifications';
import Feedback from './pages/Feedback';
import Leads from './pages/Lead';
import Profile from './pages/Profile';
import LetterRequest from './pages/LetterRequest';
import LetterRequestManagement from './pages/admin/LetterRequestManagement';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import CourseDetail from './pages/CourseDetail';
import CourseGuest from './pages/CourseGuest';
import Blogs from './pages/Blogs';
import BlogDetails from './pages/BlogDetails';
import ProtectedRoute from './components/common/ProtectedRoute';
import InstructorSchedule from './pages/instructor/InstructorSchedule';
import DocumentApproval from './pages/DocumentApproval';

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
            <Route path="/courses" element={<CourseGuest />} />
            <Route path="/exams" element={<PortalLayout><Exams /></PortalLayout>} />
            <Route path="/exam-taking" element={<ExamTaking />} />
            <Route path="/exam-result/:id" element={<ExamResult />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:id" element={<BlogDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['ADMIN', 'STUDENT', 'INSTRUCTOR', 'CONSULTANT', 'GUEST']}
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
                <Route path="admin" element={<ProtectedRoute requiredRole="ADMIN"><UserManagement /></ProtectedRoute>} />
                <Route path="letter" element={<LetterRequest />} />
                <Route path="leads" element={<Leads />} />

                <Route
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'CONSULTANT']} />
                  }
                >
                  <Route path="document-approval" element={<DocumentApproval />} />
                </Route>
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
                <Route path="documents" element={<DocumentApproval />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="letter" element={<LetterRequestManagement />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="payments" element={<Payments />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="reports" element={<Reports />} />
                <Route path="leads" element={<Leads />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundRedirect />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

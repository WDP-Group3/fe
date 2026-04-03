import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { useAuthContext } from './context/AuthContext';
import Landing from './pages/Landing';
import PortalLayout from './components/layout/PortalLayout';
import AdminLayout from './components/layout/AdminLayout';
import Overview from './pages/Overview';
import Courses from './pages/Courses';
import Enrollment from './pages/Enrollment';
import Payments from './pages/Payments';
import PaymentQr from './pages/PaymentQr';
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
import AdminFeedbacks from './pages/admin/AdminFeedbacks';
import Feedback from './pages/Feedback';
import Leads from './pages/Lead';
import Profile from './pages/Profile';
import LetterRequest from './pages/LetterRequest';
import LetterRequestManagement from './pages/admin/LetterRequestManagement';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import CourseDetail from './pages/CourseDetail';
import CourseUser from './pages/CourseUser';
import Blogs from './pages/Blogs';
import BlogDetails from './pages/BlogDetails';
import ProtectedRoute from './components/common/ProtectedRoute';
import InstructorSchedule from './pages/instructor/InstructorSchedule';
import AdminBlogs from './pages/admin/AdminBlogs';
import DocumentApproval from './pages/DocumentApproval';
import LearnerDashboard from './pages/LearnerDashboard';
import AdminSystemHolidays from './pages/admin/AdminSystemHolidays';
import AdminLearningLocations from './pages/admin/AdminLearningLocations';
import AdminExamLocations from './pages/admin/AdminExamLocations';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSalary from './pages/admin/AdminSalary';
import Salary from './pages/Salary';
import FeeSubmissions from './pages/FeeSubmissions';

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

  return (
    <Navigate to={user?.role === "ADMIN" ? "/admin" : user?.role === "CONSULTANT" ? "/portal/document-approval" : user?.role === "INSTRUCTOR" ? "/portal/instructor-schedule" : "/portal"} replace />
  );
};

const PortalIndexRedirect = () => {
  const { user } = useAuthContext();
  if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user?.role === "CONSULTANT") return <Navigate to="document-approval" replace />;
  if (user?.role === "INSTRUCTOR") return <Navigate to="instructor-schedule" replace />;
  return <Navigate to="overview" replace />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/courses" element={<CourseUser />} />
              <Route
                path="/exams"
                element={
                  <PortalLayout>
                    <Exams />
                  </PortalLayout>
                }
              />
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
                    allowedRoles={[
                      "learner",
                      "INSTRUCTOR",
                      "CONSULTANT",
                      "USER",
                    ]}
                  />
                }
              >
                <Route path="/portal" element={<PortalLayout />}>
                  <Route index element={<PortalIndexRedirect />} />
                  <Route element={<ProtectedRoute allowedRoles={["learner", "USER"]} />}>
                    <Route path="overview" element={<Overview />} />
                  </Route>
                  <Route path="courses" element={<Courses />} />
                  <Route path="enrollment" element={<Enrollment />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="payments/qr" element={<PaymentQr />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="letter" element={<LetterRequest />} />
                  <Route path="leads" element={<Leads />} />

                  <Route
                    element={
                      <ProtectedRoute allowedRoles={["ADMIN", "CONSULTANT", "INSTRUCTOR"]} />
                    }
                  >
                    <Route
                      path="document-approval"
                      element={<DocumentApproval />}
                    />
                  </Route>
                  <Route element={<ProtectedRoute requiredRole="INSTRUCTOR" />}>
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
                  <Route
                    path="learner-dashboard"
                    element={<LearnerDashboard />}
                  />
                  <Route path="salary" element={<Salary />} />
                  <Route path="my-salary" element={<Salary />} />
                  <Route path="fee-submissions" element={<FeeSubmissions />} />
                  <Route path="profile/:id" element={<Profile />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route
                    index
                    element={<Navigate to="/admin/reports" replace />}
                  />{" "}
                  <Route path="documents" element={<DocumentApproval />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="letter" element={<LetterRequestManagement />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="feedbacks" element={<AdminFeedbacks />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="blogs" element={<AdminBlogs />} />
                  <Route
                    path="system-holidays"
                    element={<AdminSystemHolidays />}
                  />
                  <Route
                    path="learning-locations"
                    element={<AdminLearningLocations />}
                  />
                  <Route path="exam-locations" element={<AdminExamLocations />} />
                  <Route path="salary" element={<AdminSalary />} />
                  <Route path="fee-submissions" element={<FeeSubmissions />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundRedirect />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

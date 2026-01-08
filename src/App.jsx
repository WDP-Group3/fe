import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Landing from './pages/Landing';
import PortalLayout from './components/layout/PortalLayout';
import Overview from './pages/Overview';
import Courses from './pages/Courses';
import Enrollment from './pages/Enrollment';
import Payments from './pages/Payments';
import Schedule from './pages/Schedule';
import Exams from './pages/Exams';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/portal" element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/portal/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="courses" element={<Courses />} />
              <Route path="enrollment" element={<Enrollment />} />
              <Route path="payments" element={<Payments />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="exams" element={<Exams />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="admin" element={<ProtectedRoute requiredRole="ADMIN"><Admin /></ProtectedRoute>} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:id" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { Button, Input } from '../../components/ui';
import { Container, Card } from '../../components/common';
import apiClient from '../../services/apiClient';
import config from '../../config';

const ForgotPassword = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      if (response.status === 'success') {
        setSent(true);
        showToast(response.message || 'Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư.', 'success');
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
      showToast('Gửi email thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center py-12 px-4">
      <Container size="sm">
        <Card className="shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-2xl font-bold shadow-lg mb-4">
              DC
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Quên mật khẩu</h1>
            <p className="text-slate-600">
              {sent
                ? 'Vui lòng kiểm tra email để đặt lại mật khẩu'
                : 'Nhập email để nhận link đặt lại mật khẩu'}
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">
                Chúng tôi đã gửi link đặt lại mật khẩu đến <strong>{email}</strong>
              </p>
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                required
                leftIcon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />

              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                Gửi link đặt lại mật khẩu
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default ForgotPassword;

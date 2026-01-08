import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Input } from '../../components/ui';
import { Container, Card } from '../../components/common';
import config from '../../config';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthContext();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.password) newErrors.password = 'Mật khẩu là bắt buộc';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await login(formData);
      showToast('Đăng nhập thành công', 'success');
      navigate('/portal/overview');
    } catch (error) {
      showToast(error.message || 'Đăng nhập thất bại', 'error');
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Đăng nhập</h1>
            <p className="text-slate-600">Chào mừng trở lại {config.appName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              required
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              required
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="ml-2 text-sm text-slate-600">Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Đăng nhập
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default Login;

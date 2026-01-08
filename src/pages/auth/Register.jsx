import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Select } from '../../components/ui';
import { Container, Card } from '../../components/common';
import { FormRow } from '../../components/forms';
import config from '../../config';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuthContext();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Họ tên là bắt buộc';
    if (!formData.email) newErrors.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.phone) newErrors.phone = 'Số điện thoại là bắt buộc';
    else if (!/^[0-9]{10,11}$/.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';
    if (!formData.password) newErrors.password = 'Mật khẩu là bắt buộc';
    else if (formData.password.length < 8) newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(formData);
      showToast('Đăng ký thành công! Vui lòng đăng nhập', 'success');
      navigate('/login');
    } catch (error) {
      showToast(error.message || 'Đăng ký thất bại', 'error');
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Đăng ký</h1>
            <p className="text-slate-600">Tạo tài khoản mới tại {config.appName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Họ tên"
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
            />

            <FormRow cols={2}>
              <Input
                label="Email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                required
              />
              <Input
                label="Số điện thoại"
                type="tel"
                placeholder="0912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                required
              />
            </FormRow>

            <Select
              label="Vai trò"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'STUDENT', label: 'Học viên' },
                { value: 'INSTRUCTOR', label: 'Giáo viên' },
              ]}
            />

            <FormRow cols={2}>
              <Input
                label="Mật khẩu"
                type="password"
                placeholder="Tối thiểu 8 ký tự"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                required
              />
              <Input
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                required
              />
            </FormRow>

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Đăng ký
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default Register;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Select } from '../../components/ui';
import { Container, Card } from '../../components/common';
import { FormRow } from '../../components/forms';
import PortalLayout from '../../components/layout/PortalLayout';
import config from '../../config';
import { GoogleLogin } from '@react-oauth/google';
import axiosInstance from "../../services/axios";

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, loginWithGoogle } = useAuthContext();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    // Họ tên: bắt buộc, chỉ chữ cái + khoảng trắng, tối thiểu 2 từ
    if (!formData.name.trim()) {
      newErrors.name = 'Họ tên là bắt buộc';
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/u.test(formData.name.trim())) {
      newErrors.name = 'Họ tên chỉ được chứa chữ cái';
    } else if (formData.name.trim().split(/\s+/).length < 2) {
      newErrors.name = 'Vui lòng nhập đầy đủ họ và tên';
    }

    // Email: bắt buộc, đúng định dạng
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Số điện thoại: bắt buộc, đúng chuẩn Việt Nam (bắt đầu 03/05/07/08/09, 10 số)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
    }

    // Mật khẩu: bắt buộc, tối thiểu 8 ký tự
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    // Xác nhận mật khẩu
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axiosInstance.post('/auth/google', {
        token: credentialResponse.credential,
      });

      showToast("Đăng ký bằng Google thành công!", "success");

      const mappedUser = {
        id: response.user._id || response.user.id,
        email: response.user.email,
        name: response.user.fullName || response.user.name,
        role: response.user.role,
        phone: response.user.phone,
        avatar: response.user.avatar || null,
      };

      loginWithGoogle(response.token, mappedUser);

      if (mappedUser?.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/portal");
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      showToast(error.message || "Đăng ký bằng Google thất bại", "error", 5000);
    }
  };

  return (
    <PortalLayout hideNav={true}>
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-12 px-4">
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

              <FormRow cols={2}>
                <Input
                  label="Mật khẩu"
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  required
                  showPasswordToggle
                />
                <Input
                  label="Xác nhận mật khẩu"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                  required
                  showPasswordToggle
                />
              </FormRow>

              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                Đăng ký
              </Button>
            </form>

            {/* Divider */}
            <div className="relative mb-4 mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-slate-400 font-medium">
                  Hoặc đăng ký với Google
                </span>
              </div>
            </div>

            {/* Nút đăng nhập bằng Google */}
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                showToast('Đăng nhập Google thất bại', 'error');
              }}
              text="signup_with"
            />

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
    </PortalLayout>
  );
};

export default Register;

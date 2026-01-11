import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { canEditProfile, canViewProfile } from '../utils/permissions';
import apiClient from '../services/apiClient';
import {
  Card,
  PageHeader,
  Avatar,
  Container,
  Stack,
  Grid,
} from '../components/common';
import {
  Button,
  Input,
  Select,
  Textarea,
  Loading,
  ErrorMessage,
  SectionHeader,
} from '../components/ui';
import { FormGroup, FormRow } from '../components/forms';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuthContext();
  const { showToast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Determine if viewing own profile or another user's profile
  const isOwnProfile = !id || id === currentUser?.id;
  const targetUserId = id || currentUser?.id;

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }
      
      // Debug token
      const tokenRaw = localStorage.getItem('token');
      console.log('🔍 Profile: Token check:', tokenRaw ? 'Found' : 'Not found');
      if (tokenRaw) {
        console.log('🔍 Profile: Token length:', tokenRaw.length);
        console.log('🔍 Profile: Token preview:', tokenRaw.substring(0, 20) + '...');
      }
      
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(isOwnProfile ? '/auth/profile' : `/users/${targetUserId}`);
        const userData = response.data || response;
        const profile = {
          id: userData._id || userData.id,
          email: userData.email,
          name: userData.fullName || userData.name,
          phone: userData.phone,
          role: userData.role,
          address: userData.address || '',
          dateOfBirth: userData.dateOfBirth || '',
          gender: userData.gender || '',
          avatar: userData.avatar || null,
          createdAt: userData.createdAt || '',
          studentCode: userData.studentCode || '',
          enrollmentStatus: userData.enrollmentStatus || '',
          assignedStudents: userData.assignedStudents || [],
          licenseNumber: userData.licenseNumber || null,
          isActive: userData.status === 'ACTIVE',
        };
        setProfileUser(profile);
        setFormData(profile);
      } catch (err) {
        console.error('Profile fetch error:', err);
        const errorMessage = err.message || 'Không thể tải thông tin profile';
        setError(errorMessage);
        
        // Nếu là lỗi 401, hiển thị thông báo rõ ràng
        if (errorMessage.includes('Token') || errorMessage.includes('hết hạn') || errorMessage.includes('Unauthorized')) {
          // Error message đã được set, apiClient sẽ xử lý redirect sau 2 giây
          // Không cần làm gì thêm ở đây
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchProfile();
    } else {
      setLoading(false);
      setError('Vui lòng đăng nhập để xem thông tin');
    }
  }, [targetUserId, currentUser?.id]);

  // Check permissions
  const canEdit = profileUser ? canEditProfile(currentUser, profileUser) : false;
  const canView = profileUser ? canViewProfile(currentUser, profileUser) : false;

  // Handle form change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Họ tên là bắt buộc';
    if (!formData.email?.trim()) errors.email = 'Email là bắt buộc';
    if (!formData.phone?.trim()) errors.phone = 'Số điện thoại là bắt buộc';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      };
      const response = await apiClient.put('/auth/profile', updateData);
      const userData = response.data || response;
      const updatedProfile = {
        ...formData,
        id: userData._id || userData.id,
        name: userData.fullName || userData.name,
      };
      setProfileUser(updatedProfile);
      setFormData(updatedProfile);
      setIsEditMode(false);
      showToast('Cập nhật thông tin thành công', 'success');
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData(profileUser);
    setFormErrors({});
    setIsEditMode(false);
  };

  if (loading) {
    return (
      <Container>
        <Loading fullScreen text="Đang tải thông tin..." />
      </Container>
    );
  }

  if (error || !canView) {
    return (
      <Container>
        <ErrorMessage
          message={error || 'Bạn không có quyền xem profile này'}
          onRetry={() => window.location.reload()}
        />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title={isOwnProfile ? 'Thông tin cá nhân' : `Thông tin ${profileUser?.name}`}
        description={isOwnProfile ? 'Quản lý thông tin cá nhân của bạn' : 'Xem và quản lý thông tin người dùng'}
        action={
          canEdit && !isEditMode ? (
            <Button onClick={() => setIsEditMode(true)}>Chỉnh sửa</Button>
          ) : null
        }
      />

      <Grid cols={1} gap={6}>
        {/* Avatar Section */}
        <Card>
          <Stack direction="row" spacing={6} align="center">
            <Avatar name={profileUser?.name} size="xl" src={profileUser?.avatar} />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-slate-900">{profileUser?.name}</h3>
              <p className="text-sm text-slate-600">{profileUser?.email}</p>
              {profileUser?.role && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                    {profileUser.role}
                  </span>
                </div>
              )}
            </div>
          </Stack>
        </Card>

        {/* Basic Information */}
        <Card title="Thông tin cơ bản">
          {isEditMode ? (
            <Stack spacing={4}>
              <FormRow cols={2}>
                <FormGroup label="Họ tên" required error={formErrors.name}>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Nhập họ tên"
                  />
                </FormGroup>
                <FormGroup label="Email" required error={formErrors.email}>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </FormGroup>
              </FormRow>

              <FormRow cols={2}>
                <FormGroup label="Số điện thoại" required error={formErrors.phone}>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="0912345678"
                  />
                </FormGroup>
                <FormGroup label="Ngày sinh">
                  <Input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  />
                </FormGroup>
              </FormRow>

              <FormRow cols={2}>
                <FormGroup label="Giới tính">
                  <Select
                    value={formData.gender || ''}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    options={[
                      { value: 'MALE', label: 'Nam' },
                      { value: 'FEMALE', label: 'Nữ' },
                      { value: 'OTHER', label: 'Khác' },
                    ]}
                    placeholder="Chọn giới tính"
                  />
                </FormGroup>
                <FormGroup label="Địa chỉ">
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Nhập địa chỉ"
                  />
                </FormGroup>
              </FormRow>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                  Hủy
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  Lưu thay đổi
                </Button>
              </div>
            </Stack>
          ) : (
            <Grid cols={2} gap={4}>
              <div>
                <p className="text-sm font-medium text-slate-500">Họ tên</p>
                <p className="mt-1 text-slate-900">{profileUser?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Email</p>
                <p className="mt-1 text-slate-900">{profileUser?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Số điện thoại</p>
                <p className="mt-1 text-slate-900">{profileUser?.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Ngày sinh</p>
                <p className="mt-1 text-slate-900">{profileUser?.dateOfBirth || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Giới tính</p>
                <p className="mt-1 text-slate-900">
                  {profileUser?.gender === 'MALE' ? 'Nam' : profileUser?.gender === 'FEMALE' ? 'Nữ' : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Địa chỉ</p>
                <p className="mt-1 text-slate-900">{profileUser?.address || '-'}</p>
              </div>
            </Grid>
          )}
        </Card>

        {/* Role-specific Information */}
        {profileUser?.role === 'STUDENT' && (
          <Card title="Thông tin học viên">
            <Grid cols={2} gap={4}>
              <div>
                <p className="text-sm font-medium text-slate-500">Mã học viên</p>
                <p className="mt-1 text-slate-900">{profileUser?.studentCode || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Trạng thái đăng ký</p>
                <p className="mt-1 text-slate-900">{profileUser?.enrollmentStatus || '-'}</p>
              </div>
            </Grid>
          </Card>
        )}

        {profileUser?.role === 'INSTRUCTOR' && (
          <Card title="Thông tin giáo viên">
            <Grid cols={2} gap={4}>
              <div>
                <p className="text-sm font-medium text-slate-500">Số bằng lái</p>
                <p className="mt-1 text-slate-900">{profileUser?.licenseNumber || '-'}</p>
              </div>
            </Grid>
          </Card>
        )}

        {/* System Information (Admin only) */}
        {currentUser?.role === 'ADMIN' && (
          <Card title="Thông tin hệ thống">
            <Grid cols={2} gap={4}>
              <div>
                <p className="text-sm font-medium text-slate-500">ID</p>
                <p className="mt-1 text-slate-900">{profileUser?.id || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Trạng thái</p>
                <p className="mt-1 text-slate-900">
                  {profileUser?.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Ngày tạo</p>
                <p className="mt-1 text-slate-900">{profileUser?.createdAt || '-'}</p>
              </div>
            </Grid>
          </Card>
        )}
      </Grid>
    </Container>
  );
};

export default Profile;


import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { canEditProfile, canViewProfile } from '../utils/permissions';
import apiClient from '../services/apiClient';
import config from '../config';
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
  Loading,
  ErrorMessage,
  FileUpload,
} from '../components/ui';
import { FormGroup, FormRow } from '../components/forms';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, getProfile } = useAuthContext();
  const { showToast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [learnerDocument, setlearnerDocument] = useState(null);
  const [loadinglearnerDocument, setLoadinglearnerDocument] = useState(false);

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
          learnerCode: userData.learnerCode || '',
          enrollmentStatus: userData.enrollmentStatus || '',
          assignedlearners: userData.assignedlearners || [],
          licenseNumber: userData.licenseNumber || null,
          isActive: userData.status === 'ACTIVE',
          workingLocation: userData.workingLocation || '',
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
  }, [targetUserId, currentUser?.id, isOwnProfile]);

  // Check permissions
  const canEdit = profileUser ? canEditProfile(currentUser, profileUser) : false;
  const canView = profileUser ? canViewProfile(currentUser, profileUser) : false;

  useEffect(() => {
    const loadlearnerDocument = async () => {
      if (!profileUser || !isOwnProfile) return;
      if (profileUser.role !== 'learner' && profileUser.role !== 'USER') return;
      try {
        setLoadinglearnerDocument(true);
        const response = await apiClient.get('/documents/me');
        if (response.status === 'success') {
          setlearnerDocument(response.data || null);
        }
      } catch (err) {
        console.error('Load learner document error:', err);
      } finally {
        setLoadinglearnerDocument(false);
      }
    };

    loadlearnerDocument();
  }, [profileUser, isOwnProfile]);

  // Handle form change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Handle avatar upload to Cloudinary
  const handleAvatarUpload = async (file) => {
    if (!file) return;

    if (!config.cloudinary.cloudName || !config.cloudinary.uploadPreset) {
      showToast('Cloudinary chưa được cấu hình. Vui lòng thêm VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.', 'error');
      return;
    }

    try {
      setAvatarUploading(true);

      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', config.cloudinary.uploadPreset);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (!res.ok || !data.secure_url) {
        throw new Error(data.error?.message || 'Upload ảnh thất bại');
      }

      const avatarUrl = data.secure_url;

      // Cập nhật local state để hiển thị ngay
      setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
      setProfileUser((prev) => (prev ? { ...prev, avatar: avatarUrl } : prev));

      // Gửi lên backend để lưu avatar (không thay đổi các field khác)
      try {
        await apiClient.put('/auth/profile', { avatar: avatarUrl });
        // Đồng bộ lại AuthContext để header avatar cập nhật
        if (isOwnProfile && typeof getProfile === 'function') {
          await getProfile();
        }
      } catch (e) {
        console.error('Save avatar error:', e);
        // Không chặn UI, chỉ thông báo nhẹ nếu cần
      }

      showToast('Upload ảnh thành công', 'success');
    } catch (err) {
      console.error('Avatar upload error:', err);
      showToast(err.message || 'Upload ảnh thất bại', 'error');
    } finally {
      setAvatarUploading(false);
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
        avatar: formData.avatar,
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

      // Đồng bộ lại AuthContext để header avatar / tên cập nhật
      if (isOwnProfile && typeof getProfile === 'function') {
        try {
          await getProfile();
        } catch {
          // ignore
        }
      }
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

  const handleLogout = async () => {
    try {
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        await apiClient.post('/auth/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout anyway
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
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
          <div className="flex gap-2">
            {isOwnProfile && (
              <Button variant="danger" onClick={handleLogout}>Đăng xuất</Button>
            )}
            {canEdit && !isEditMode ? (
              <Button onClick={() => setIsEditMode(true)}>Chỉnh sửa</Button>
            ) : null}
          </div>
        }
      />

      <Grid cols={1} gap={6}>
        {/* Avatar Section */}
        <Card>
          <Stack direction="row" spacing={6} align="center">
            <Avatar name={profileUser?.name} size="xl" src={formData.avatar || profileUser?.avatar} />
            <div className="flex-1 space-y-3">
              <div>
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

              {isEditMode && (
                <div className="max-w-xs">
                  <FormGroup
                    label="Ảnh đại diện"
                    helperText="Hỗ trợ .jpg, .png, tối đa 5MB. Ảnh sẽ được lưu trên Cloudinary."
                  >
                    <FileUpload
                      accept=".jpg,.jpeg,.png"
                      multiple={false}
                      maxSize={5 * 1024 * 1024}
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                    />
                    {avatarUploading && (
                      <p className="mt-2 text-xs text-slate-500">
                        Đang upload ảnh...
                      </p>
                    )}
                  </FormGroup>
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
        {(profileUser?.role === 'learner' || profileUser?.role === 'USER') && profileUser?.role === 'learner' && (
          <>
            <Card title="Thông tin học viên">
              <Grid cols={2} gap={4}>
                <div>
                  <p className="text-sm font-medium text-slate-500">Mã học viên</p>
                  <p className="mt-1 text-slate-900">{profileUser?.learnerCode || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Trạng thái đăng ký</p>
                  <p className="mt-1 text-slate-900">{profileUser?.enrollmentStatus || '-'}</p>
                </div>
              </Grid>
            </Card>
          </>
        )}

        {(profileUser?.role === 'learner' || profileUser?.role === 'USER') && (
          <Card title="Hồ sơ cá nhân đã nộp">
            {loadinglearnerDocument ? (
              <p className="text-sm text-slate-500">Đang tải hồ sơ...</p>
            ) : !learnerDocument ? (
              <p className="text-sm text-slate-500">Chưa có hồ sơ cá nhân.</p>
            ) : (
              <Grid cols={2} gap={4}>
                <div>
                  <p className="text-sm font-medium text-slate-500">Số CMND/CCCD</p>
                  <p className="mt-1 text-slate-900">{learnerDocument?.cccdNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Trạng thái duyệt</p>
                  <p className="mt-1 text-slate-900">{learnerDocument?.status || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">CCCD mặt trước</p>
                  {learnerDocument?.cccdImageFront ? (
                    <a href={learnerDocument.cccdImageFront} target="_blank" rel="noreferrer" className="mt-1 inline-block text-indigo-600 hover:underline">
                      Xem file
                    </a>
                  ) : <p className="mt-1 text-slate-900">-</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">CCCD mặt sau</p>
                  {learnerDocument?.cccdImageBack ? (
                    <a href={learnerDocument.cccdImageBack} target="_blank" rel="noreferrer" className="mt-1 inline-block text-indigo-600 hover:underline">
                      Xem file
                    </a>
                  ) : <p className="mt-1 text-slate-900">-</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Giấy khám sức khỏe</p>
                  {learnerDocument?.healthCertificate ? (
                    <a href={learnerDocument.healthCertificate} target="_blank" rel="noreferrer" className="mt-1 inline-block text-indigo-600 hover:underline">
                      Xem file
                    </a>
                  ) : <p className="mt-1 text-slate-900">-</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Ảnh 3x4</p>
                  {learnerDocument?.photo ? (
                    <a href={learnerDocument.photo} target="_blank" rel="noreferrer" className="mt-1 inline-block text-indigo-600 hover:underline">
                      Xem file
                    </a>
                  ) : <p className="mt-1 text-slate-900">-</p>}
                </div>
              </Grid>
            )}
          </Card>
        )}

        {profileUser?.role === 'INSTRUCTOR' && (
          <Card title="Thông tin giáo viên">
            <Grid cols={2} gap={4}>
              <div>
                <p className="text-sm font-medium text-slate-500">Số bằng lái</p>
                <p className="mt-1 text-slate-900">{profileUser?.licenseNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Địa điểm dạy hiện tại</p>
                <p className="mt-1 text-slate-900">{profileUser?.workingLocation || '-'}</p>
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


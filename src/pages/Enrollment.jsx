import { useEffect, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileUpload, Input, Button, SectionHeader, StatusBadge, DataTable } from '../components/ui';
import apiClient from '../services/apiClient';
import config from '../config';
import { docs, enrollmentSteps } from '../data/mockData';

const Enrollment = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  const [selectedRegistrationId, setSelectedRegistrationId] = useState('');
  const [cccdNumber, setCccdNumber] = useState('');
  const [cccdFile, setCccdFile] = useState(null);
  const [healthFile, setHealthFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const docColumns = [
    { key: 'name', title: 'Hồ sơ', dataIndex: 'name' },
    { key: 'status', title: 'Trạng thái', dataIndex: 'status', render: (val) => <StatusBadge status={val} /> },
    { key: 'owner', title: 'Phụ trách', dataIndex: 'owner' },
  ];

  const registrationColumns = [
    { key: 'code', title: 'Mã hồ sơ', dataIndex: 'code' },
    { key: 'batch', title: 'Lớp / địa điểm', dataIndex: 'batch' },
    { key: 'status', title: 'Trạng thái', dataIndex: 'status' },
    { key: 'action', title: '', dataIndex: 'action' },
  ];

  const mappedRegistrations = registrations.map((item, index) => ({
    key: item._id || index,
    code: item._id || '-',
    batch: item.batchId?.location || '—',
    status: item.status || 'NEW',
    action: (
      <Button
        size="sm"
        variant={selectedRegistrationId === (item._id || '') ? 'secondary' : 'outline'}
        onClick={() => setSelectedRegistrationId(item._id || '')}
      >
        {selectedRegistrationId === (item._id || '') ? 'Đang chọn' : 'Chọn để upload'}
      </Button>
    ),
  }));

  const loadRegistrations = async () => {
    if (!user?.id) return;
    try {
      setLoadingRegistrations(true);
      const response = await apiClient.get(`/registrations?studentId=${user.id}`);
      if (response.status === 'success') {
        setRegistrations(response.data || []);
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const uploadToCloudinary = async (file) => {
    if (!file) return null;

    if (!config.cloudinary.cloudName || !config.cloudinary.uploadPreset) {
      showToast(
        'Cloudinary chưa được cấu hình. Vui lòng thêm VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.',
        'error',
      );
      return null;
    }

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

    return data.secure_url;
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRegistrationId) {
      showToast('Vui lòng chọn một hồ sơ đăng ký để upload', 'error');
      return;
    }

    if (!cccdNumber.trim()) {
      showToast('Vui lòng nhập số CMND/CCCD', 'error');
      return;
    }

    try {
      setUploading(true);

      const [cccdImageUrl, healthUrl, photoUrl] = await Promise.all([
        uploadToCloudinary(cccdFile),
        uploadToCloudinary(healthFile),
        uploadToCloudinary(photoFile),
      ]);

      await apiClient.post('/documents/upload', {
        registrationId: selectedRegistrationId,
        cccdImage: cccdImageUrl,
        healthCertificate: healthUrl,
        photo: photoUrl,
        cccdNumber: cccdNumber.trim(),
      });

      showToast('Upload hồ sơ thành công', 'success');
    } catch (error) {
      console.error('Upload documents error:', error);
      showToast(error?.message || 'Upload hồ sơ thất bại', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Quy trình hồ sơ"
          description="Chuẩn hóa đăng ký – duyệt hồ sơ – nộp Sở"
          action={
            <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              Tạo hồ sơ mới
            </button>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {enrollmentSteps.map((step) => (
            <div key={step.id} className="rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-indigo-600">{step.owner}</p>
                <StatusBadge status={step.status} />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="text-xs text-slate-600">{step.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Hồ sơ đăng ký của tôi"
          description="Danh sách hồ sơ đã đăng ký theo tài khoản hiện tại · Chọn 1 hồ sơ để upload giấy tờ"
        />
        {loadingRegistrations ? (
          <div className="flex justify-center py-6 text-sm text-slate-500">
            Đang tải danh sách hồ sơ...
          </div>
        ) : mappedRegistrations.length === 0 ? (
          <div className="py-6 text-sm text-slate-500">
            Chưa có hồ sơ đăng ký nào được tạo cho tài khoản này.
          </div>
        ) : (
          <DataTable columns={registrationColumns} data={mappedRegistrations} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader
            title="Tài liệu cần thiết"
            description="Học viên upload ảnh, staff kiểm tra và duyệt"
            action={<button className="text-sm font-semibold text-indigo-700">Gửi link upload</button>}
          />
          <DataTable columns={docColumns} data={docs} />

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">Upload hồ sơ</h3>
            <p className="mt-1 text-xs text-slate-500">
              Chọn hồ sơ đăng ký phía trên, nhập số CMND/CCCD và upload ảnh giấy tờ trực tiếp.
            </p>
            <form onSubmit={handleUploadSubmit} className="mt-3 space-y-3 text-sm">
              <Input
                label="Số CMND/CCCD"
                placeholder="Nhập số CMND/CCCD"
                value={cccdNumber}
                onChange={(e) => setCccdNumber(e.target.value)}
                required
              />
              <div className="grid gap-4 md:grid-cols-3">
                <FileUpload
                  label="Ảnh CMND/CCCD"
                  accept=".jpg,.jpeg,.png"
                  multiple={false}
                  maxSize={5 * 1024 * 1024}
                  onChange={setCccdFile}
                  helperText="Upload ảnh chụp rõ thông tin"
                />
                <FileUpload
                  label="Giấy khám sức khoẻ"
                  accept=".jpg,.jpeg,.png"
                  multiple={false}
                  maxSize={5 * 1024 * 1024}
                  onChange={setHealthFile}
                  helperText="Upload bản chụp giấy khám sức khoẻ"
                />
                <FileUpload
                  label="Ảnh 3x4"
                  accept=".jpg,.jpeg,.png"
                  multiple={false}
                  maxSize={5 * 1024 * 1024}
                  onChange={setPhotoFile}
                  helperText="Ảnh nền sáng, rõ mặt"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="mt-2 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {uploading ? 'Đang upload hồ sơ...' : 'Lưu hồ sơ đăng ký'}
              </button>
            </form>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader
            title="Luật huỷ hồ sơ"
            description="Tự động cảnh báo sau thời gian quá hạn"
          />
          <div className="space-y-3 text-sm text-slate-700">
            <p>• Đóng học phí chậm: có đơn gia hạn 1 tháng → quá hạn → huỷ hồ sơ.</p>
            <p>• Không đơn: 7 ngày không liên lạc → huỷ hồ sơ.</p>
            <p>• Không huỷ trước 24h lịch học → mất quyền lợi buổi học.</p>
            <p>• Mọi thay đổi nghiệp vụ cần quyền Staff hoặc Admin.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;


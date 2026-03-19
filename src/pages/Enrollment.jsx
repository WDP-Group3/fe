import { useEffect, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileUpload, Input, SectionHeader } from '../components/ui';
import apiClient from '../services/apiClient';
import config from '../config';

const Enrollment = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [, setMyDocument] = useState(null);
  const [cccdNumber, setCccdNumber] = useState('');
  const [consultantEmail, setConsultantEmail] = useState('');
  const [consultantLookup, setConsultantLookup] = useState(null);
  const [consultantLookupStatus, setConsultantLookupStatus] = useState('idle');
  const [cccdFrontFile, setCccdFrontFile] = useState(null);
  const [cccdBackFile, setCccdBackFile] = useState(null);
  const [healthFile, setHealthFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadMyDocument = async () => {
    if (!user?.id) return;
    try {
      const response = await apiClient.get('/documents/me');
      if (response.status === 'success') {
        setMyDocument(response.data || null);
        setCccdNumber(response.data?.cccdNumber || '');
        setConsultantEmail(response.data?.consultantEmail || '');
        setConsultantLookup(response.data?.consultantId || null);
      }
    } catch (error) {
      console.error('Error loading my document:', error);
    }
  };




  useEffect(() => {
    loadMyDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const lookupConsultant = async () => {
      const trimmed = consultantEmail.trim();
      if (!trimmed) {
        setConsultantLookup(null);
        setConsultantLookupStatus('idle');
        return;
      }

      try {
        setConsultantLookupStatus('loading');
        const response = await apiClient.get(`/documents/consultants/lookup?email=${encodeURIComponent(trimmed)}`);
        if (response.status === 'success') {
          setConsultantLookup(response.data || null);
          setConsultantLookupStatus('success');
        } else {
          setConsultantLookup(null);
          setConsultantLookupStatus('error');
        }
      } catch (error) {
        setConsultantLookup(null);
        setConsultantLookupStatus('error');
      }
    };

    lookupConsultant();
  }, [consultantEmail]);

  const uploadToCloudinary = async (file) => {
    if (!file) return null;

    if (!config.cloudinary.cloudName || !config.cloudinary.uploadPreset) {
      throw new Error('Cloudinary chưa cấu hình VITE_CLOUDINARY_CLOUD_NAME hoặc VITE_CLOUDINARY_UPLOAD_PRESET');
    }

    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', config.cloudinary.uploadPreset);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`;
    const res = await fetch(uploadUrl, { method: 'POST', body: form });
    const data = await res.json();

    if (!res.ok || !data.secure_url) {
      throw new Error(data.error?.message || 'Upload ảnh thất bại');
    }

    return data.secure_url;
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!cccdNumber.trim()) {
      showToast('Vui lòng nhập số CMND/CCCD', 'error');
      return;
    }

    try {
      setUploading(true);

      const [cccdFrontUrl, cccdBackUrl, healthUrl, photoUrl] = await Promise.all([
        uploadToCloudinary(cccdFrontFile),
        uploadToCloudinary(cccdBackFile),
        uploadToCloudinary(healthFile),
        uploadToCloudinary(photoFile),
      ]);

      await apiClient.post('/documents/upload', {
        cccdImageFront: cccdFrontUrl,
        cccdImageBack: cccdBackUrl,
        healthCertificate: healthUrl,
        photo: photoUrl,
        cccdNumber: cccdNumber.trim(),
        consultantEmail: consultantEmail.trim() || undefined,
      });

      await loadMyDocument();
      showToast('Lưu hồ sơ cá nhân thành công', 'success');
    } catch (error) {
      console.error('Upload documents error:', error);
      showToast(error?.message || 'Upload hồ sơ thất bại', 'error');
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="space-y-4">
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur">
          <SectionHeader
            title="Upload hồ sơ cá nhân"
            description="Hồ sơ có thể cập nhật bổ sung bất kỳ lúc nào."
          />
          <div className="mt-3">

            <form onSubmit={handleUploadSubmit} className="mt-2 space-y-2 text-sm">
              <Input
                label="Số CMND/CCCD"
                placeholder="Nhập số CMND/CCCD"
                value={cccdNumber}
                onChange={(e) => setCccdNumber(e.target.value)}
                required
              />

              <div className="space-y-2">
                <Input
                  label="Email tư vấn viên"
                  placeholder="Nhập email của tư vấn viên"
                  value={consultantEmail}
                  onChange={(e) => setConsultantEmail(e.target.value)}
                />
                {consultantLookupStatus === 'loading' && (
                  <p className="text-xs text-slate-500">Đang kiểm tra tư vấn viên...</p>
                )}
                {consultantLookupStatus === 'error' && (
                  <p className="text-xs text-red-600">Không tìm thấy tư vấn viên theo email đã nhập.</p>
                )}
                {consultantLookupStatus === 'success' && consultantLookup && (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 shadow-sm">
                    {consultantLookup.avatar ? (
                      <img
                        src={consultantLookup.avatar}
                        alt={consultantLookup.fullName}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-200 text-emerald-800">
                        {consultantLookup.fullName?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{consultantLookup.fullName}</p>
                      <p className="text-xs">{consultantLookup.email}{consultantLookup.phone ? ` · ${consultantLookup.phone}` : ''}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2 md:items-start">
                <div className="space-y-3">
                  <FileUpload
                    label="Ảnh CMND/CCCD - Mặt trước"
                    accept=".jpg,.jpeg,.png"
                    multiple={false}
                    maxSize={5 * 1024 * 1024}
                    onChange={setCccdFrontFile}
                    helperText="Upload ảnh mặt trước CCCD"
                  />
                  <FileUpload
                    label="Ảnh CMND/CCCD - Mặt sau"
                    accept=".jpg,.jpeg,.png"
                    multiple={false}
                    maxSize={5 * 1024 * 1024}
                    onChange={setCccdBackFile}
                    helperText="Upload ảnh mặt sau CCCD"
                  />
                </div>
                <div className="space-y-3">
                  <FileUpload
                    label="Giấy khám sức khỏe (không bắt buộc)"
                    accept=".jpg,.jpeg,.png"
                    multiple={false}
                    maxSize={5 * 1024 * 1024}
                    onChange={setHealthFile}
                    helperText="Bên trung tâm sẽ nộp giúp sau khi khám xong"
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
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="mt-2 w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {uploading ? 'Đang upload hồ sơ...' : 'Lưu hồ sơ cá nhân'}
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm backdrop-blur">
          <SectionHeader title="Luật huỷ hồ sơ" description="Tự động cảnh báo sau thời gian quá hạn" />
          <div className="space-y-3 text-sm text-slate-700">
            <p>• Đóng học phí chậm: có đơn gia hạn 1 tháng → quá hạn → huỷ hồ sơ.</p>
            <p>• Không đơn: 7 ngày không liên lạc → huỷ hồ sơ.</p>
            <p>• Không huỷ trước 24h lịch học → mất quyền lợi buổi học.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;

import { useEffect, useState, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileUpload, Input, SectionHeader } from '../components/ui';
import apiClient from '../services/apiClient';
import { validateCccd } from '../utils/validators';

const Enrollment = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [myDocument, setMyDocument] = useState(null);
  const [cccdNumber, setCccdNumber] = useState('');
  const [consultantEmail, setConsultantEmail] = useState('');
  const [consultantLookup, setConsultantLookup] = useState(null);
  const [consultantLookupStatus, setConsultantLookupStatus] = useState('idle');
  const [cccdFrontFile, setCccdFrontFile] = useState(null);
  const [cccdBackFile, setCccdBackFile] = useState(null);
  const [healthFile, setHealthFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [formErrors, setFormErrors] = useState({});

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

  // Debounce consultant lookup
  const lookupTimerRef = useRef(null);
  useEffect(() => {
    const trimmed = consultantEmail.trim();
    if (!trimmed) {
      setConsultantLookup(null);
      setConsultantLookupStatus('idle');
      return;
    }

    setConsultantLookupStatus('loading');

    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);

    lookupTimerRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.get(`/documents/consultants/lookup?email=${encodeURIComponent(trimmed)}`);
        if (response.status === 'success') {
          setConsultantLookup(response.data || null);
          setConsultantLookupStatus('success');
        } else {
          setConsultantLookup(null);
          setConsultantLookupStatus('error');
        }
      } catch {
        setConsultantLookup(null);
        setConsultantLookupStatus('error');
      }
    }, 400);

    return () => {
      if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    };
  }, [consultantEmail]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!cccdNumber.trim()) {
      errors.cccdNumber = 'Vui lòng nhập số CMND/CCCD';
    } else if (!validateCccd(cccdNumber)) {
      errors.cccdNumber = 'Số CMND/CCCD phải là 9 hoặc 12 chữ số';
    }

    if (!cccdFrontFile) errors.cccdFrontFile = 'Vui lòng upload ảnh mặt trước CCCD';
    if (!cccdBackFile) errors.cccdBackFile = 'Vui lòng upload ảnh mặt sau CCCD';
    if (!photoFile) errors.photoFile = 'Vui lòng upload ảnh 3x4';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setUploading(true);
      setUploadStatus('Đang tải ảnh lên...');

      const formData = new FormData();
      formData.append('cccdNumber', cccdNumber.trim());
      formData.append('cccdImageFront', cccdFrontFile);
      formData.append('cccdImageBack', cccdBackFile);
      formData.append('photo', photoFile);
      if (healthFile) formData.append('healthCertificate', healthFile);
      if (consultantEmail.trim()) formData.append('consultantEmail', consultantEmail.trim());

      const response = await apiClient.post('/documents/upload', formData);

      setUploadStatus('');
      await loadMyDocument();
      showToast(response.message || 'Lưu hồ sơ cá nhân thành công', 'success');
    } catch (error) {
      setUploadStatus('');
      console.error('Upload documents error:', error);
      showToast(error?.message || 'Upload hồ sơ thất bại', 'error');
    } finally {
      setUploading(false);
    }
  };

  const statusLabel = {
    DRAFT: { text: 'Nháp', color: 'text-slate-600 bg-slate-100' },
    PENDING: { text: 'Chờ duyệt', color: 'text-amber-700 bg-amber-50' },
    APPROVED: { text: 'Đã duyệt', color: 'text-emerald-700 bg-emerald-50' },
    REJECTED: { text: 'Bị từ chối', color: 'text-red-700 bg-red-50' },
  };

  const currentStatus = myDocument?.status || 'DRAFT';
  const info = statusLabel[currentStatus] || statusLabel.DRAFT;
  const isRejected = currentStatus === 'REJECTED';
  const rejectionReason = myDocument?.rejectionReason;

  return (
    <div className="space-y-4">
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <div className="space-y-4">
          {currentStatus !== 'DRAFT' && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${isRejected
                ? 'border-red-200 bg-red-50'
                : currentStatus === 'APPROVED'
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50'
              }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Trạng thái hồ sơ:</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${info.color}`}>
                  {info.text}
                </span>
              </div>
              {isRejected && rejectionReason && (
                <p className="mt-2 text-xs text-red-700">
                  <span className="font-semibold">Lý do từ chối: </span>
                  {rejectionReason}
                </p>
              )}
              {isRejected && !rejectionReason && (
                <p className="mt-2 text-xs text-red-600">
                  Hồ sơ bị từ chối. Vui lòng bổ sung và nộp lại.
                </p>
              )}
              {currentStatus === 'PENDING' && (
                <p className="mt-2 text-xs text-amber-700">
                  Hồ sơ đang chờ tư vấn viên xét duyệt.
                </p>
              )}
              {currentStatus === 'APPROVED' && (
                <p className="mt-2 text-xs text-emerald-700">
                  Hồ sơ đã được duyệt. Bạn có thể bổ sung bất kỳ lúc nào.
                </p>
              )}
            </div>
          )}

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
                  error={formErrors.cccdNumber}
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
                      onChange={(f) => { setCccdFrontFile(f); setFormErrors((e) => ({ ...e, cccdFrontFile: '' })); }}
                      error={formErrors.cccdFrontFile}
                      helperText="Upload ảnh mặt trước CCCD"
                    />
                    <FileUpload
                      label="Ảnh CMND/CCCD - Mặt sau"
                      accept=".jpg,.jpeg,.png"
                      multiple={false}
                      maxSize={5 * 1024 * 1024}
                      onChange={(f) => { setCccdBackFile(f); setFormErrors((e) => ({ ...e, cccdBackFile: '' })); }}
                      error={formErrors.cccdBackFile}
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
                      onChange={(f) => { setPhotoFile(f); setFormErrors((e) => ({ ...e, photoFile: '' })); }}
                      error={formErrors.photoFile}
                      helperText="Ảnh nền sáng, rõ mặt"
                    />
                  </div>
                </div>

                {uploading && uploadStatus && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
                    <div className="mb-1 font-medium">{uploadStatus}</div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-200">
                      <div className="h-full animate-pulse rounded-full bg-indigo-500" style={{ width: '100%' }} />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className="mt-2 w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {uploading ? 'Đang tải lên...' : 'Lưu hồ sơ cá nhân'}
                </button>
              </form>
            </div>
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

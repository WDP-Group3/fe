import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileUpload, Input, Button, SectionHeader, StatusBadge, DataTable, Select, SearchInput, Modal } from '../components/ui';
import apiClient from '../services/apiClient';
import config from '../config';
import { docs, enrollmentSteps } from '../data/mockData';

const Enrollment = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [creatingRegistration, setCreatingRegistration] = useState(false);

  const [studentPayments, setStudentPayments] = useState([]);
  const [loadingStudentPayments, setLoadingStudentPayments] = useState(false);

  const [myDocument, setMyDocument] = useState(null);
  const [loadingMyDocument, setLoadingMyDocument] = useState(false);

  const [saleOption, setSaleOption] = useState('HAS');
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [saleSearch, setSaleSearch] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState('');

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
    { key: 'code', title: 'Mã đăng ký', dataIndex: 'code' },
    { key: 'batch', title: 'Khóa học / địa điểm', dataIndex: 'batch' },
    { key: 'status', title: 'Trạng thái', dataIndex: 'status' },
  ];

  const mappedRegistrations = registrations.map((item, index) => {
    const courseName = item?.batchId?.courseId?.name || item?.batchId?.courseId?.code || 'Khóa học';
    const location = item?.batchId?.location || '—';

    return {
      key: item._id || index,
      code: item._id || '-',
      batch: `${courseName} · ${location}`,
      status: item.status || 'NEW',
    };
  });

  const isDocumentComplete = useMemo(
    () => !!(myDocument?.cccdNumber && myDocument?.cccdImage && myDocument?.healthCertificate && myDocument?.photo),
    [myDocument]
  );

  const totalPaid = useMemo(
    () => (studentPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [studentPayments]
  );

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

  const loadMyDocument = async () => {
    if (!user?.id) return;
    try {
      setLoadingMyDocument(true);
      const response = await apiClient.get('/documents/me');
      if (response.status === 'success') {
        setMyDocument(response.data || null);
        setCccdNumber(response.data?.cccdNumber || '');
      }
    } catch (error) {
      console.error('Error loading my document:', error);
    } finally {
      setLoadingMyDocument(false);
    }
  };

  const loadBatches = async () => {
    try {
      setLoadingBatches(true);
      const response = await apiClient.get('/batches?status=OPEN');
      if (response.status === 'success') {
        setBatches(response.data || []);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      showToast(error?.message || 'Không thể tải danh sách lớp', 'error');
    } finally {
      setLoadingBatches(false);
    }
  };

  const loadStudentPayments = async () => {
    if (!user?.id) return;
    try {
      setLoadingStudentPayments(true);
      const response = await apiClient.get('/payments');
      if (response.status === 'success') {
        setStudentPayments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading student payments:', error);
    } finally {
      setLoadingStudentPayments(false);
    }
  };

  const loadSales = async () => {
    try {
      setLoadingSales(true);
      const response = await apiClient.get('/users?role=CONSULTANT');
      setSales(response.data || []);
    } catch (error) {
      console.error('Error loading sales/consultants:', error);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
    loadMyDocument();
    loadStudentPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (isCreateModalOpen) {
      loadBatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateModalOpen]);

  useEffect(() => {
    if (saleOption === 'HAS' && sales.length === 0 && !loadingSales) {
      loadSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleOption]);

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

      const [cccdImageUrl, healthUrl, photoUrl] = await Promise.all([
        uploadToCloudinary(cccdFile),
        uploadToCloudinary(healthFile),
        uploadToCloudinary(photoFile),
      ]);

      await apiClient.post('/documents/upload', {
        cccdImage: cccdImageUrl,
        healthCertificate: healthUrl,
        photo: photoUrl,
        cccdNumber: cccdNumber.trim(),
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

  const handleCreateRegistration = async () => {
    if (!selectedBatchId) {
      showToast('Vui lòng chọn lớp (batch) để đăng ký', 'error');
      return;
    }

    if (!isDocumentComplete) {
      showToast('Bạn cần nộp đủ hồ sơ cá nhân trước khi đăng ký lớp', 'error');
      return;
    }

    try {
      setCreatingRegistration(true);
      const registerMethod = saleOption === 'HAS' ? 'CONSULTANT' : 'ONLINE';

      const response = await apiClient.post('/registrations', {
        batchId: selectedBatchId,
        registerMethod,
      });

      if (response.status === 'success') {
        showToast('Tạo đăng ký lớp thành công', 'success');
        setIsCreateModalOpen(false);
        setSelectedBatchId('');
        await loadRegistrations();
      } else {
        showToast(response.message || 'Tạo đăng ký thất bại', 'error');
      }
    } catch (error) {
      console.error('Create registration error:', error);
      showToast(error?.message || 'Tạo đăng ký thất bại', 'error');
    } finally {
      setCreatingRegistration(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Quy trình hồ sơ"
          description="Nộp hồ sơ cá nhân → duyệt hồ sơ → đăng ký lớp"
          action={
            <button
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!isDocumentComplete}
            >
              Tạo đăng ký lớp
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

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo đăng ký lớp mới"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} disabled={creatingRegistration}>
              Hủy
            </Button>
            <Button onClick={handleCreateRegistration} loading={creatingRegistration} disabled={loadingBatches}>
              Tạo đăng ký
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">Chọn lớp (batch) đang mở đăng ký. Bạn phải nộp đủ hồ sơ cá nhân trước khi đăng ký.</p>
          <Select
            label="Chọn lớp (batch)"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            disabled={loadingBatches}
            placeholder={loadingBatches ? 'Đang tải danh sách lớp...' : 'Chọn lớp'}
            options={(batches || []).map((b) => {
              const courseLabel = b?.courseId?.name || b?.courseId?.code || 'Khóa học';
              const locationLabel = b?.location || b?.location?.join?.(', ') || '';
              const startLabel = b?.startDate ? new Date(b.startDate).toLocaleDateString('vi-VN') : '';
              const label = [courseLabel, locationLabel, startLabel].filter(Boolean).join(' · ');
              return { value: b?._id, label: label || (b?._id || 'Batch') };
            })}
            helperText="Chỉ hiển thị các lớp có trạng thái OPEN từ backend."
          />
        </div>
      </Modal>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Student dashboard"
          description="Theo dõi nhanh hồ sơ, đăng ký và thanh toán của bạn"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Hồ sơ cá nhân</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{isDocumentComplete ? 'Đầy đủ' : 'Chưa đủ'}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Tổng đăng ký</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{mappedRegistrations.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Đang học</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{registrations.filter((r) => r.status === 'STUDYING').length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Đã thanh toán</p>
            <p className="mt-1 text-base font-semibold text-emerald-700">
              {totalPaid.toLocaleString('vi-VN')} đ
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Đăng ký lớp của tôi"
          description="Danh sách đăng ký lớp theo tài khoản hiện tại"
        />
        {loadingRegistrations ? (
          <div className="flex justify-center py-6 text-sm text-slate-500">Đang tải danh sách đăng ký...</div>
        ) : mappedRegistrations.length === 0 ? (
          <div className="py-6 text-sm text-slate-500">Chưa có đăng ký lớp nào.</div>
        ) : (
          <div className="space-y-3">
            <DataTable columns={registrationColumns} data={mappedRegistrations} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader
            title="Tài liệu cần thiết"
            description="Học viên upload ảnh, staff/admin kiểm tra và duyệt"
            action={<button className="text-sm font-semibold text-indigo-700">Gửi link upload</button>}
          />
          <DataTable columns={docColumns} data={docs} />
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {loadingMyDocument
              ? 'Đang tải hồ sơ cá nhân...'
              : isDocumentComplete
                ? 'Hồ sơ cá nhân đã đủ điều kiện để đăng ký lớp.'
                : 'Hồ sơ cá nhân chưa đầy đủ. Vui lòng bổ sung đủ CCCD, giấy khám sức khỏe và ảnh 3x4 trước khi đăng ký lớp.'}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">Upload hồ sơ cá nhân</h3>
            <p className="mt-1 text-xs text-slate-500">Hồ sơ dùng chung cho mọi đăng ký lớp và có thể cập nhật bổ sung bất kỳ lúc nào.</p>

            <form onSubmit={handleUploadSubmit} className="mt-3 space-y-3 text-sm">
              <div className="space-y-2 rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-xs font-semibold text-slate-700">Sale tư vấn hồ sơ</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSaleOption('HAS')}
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${saleOption === 'HAS' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}
                  >
                    Có Sale tư vấn
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleOption('NONE')}
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${saleOption === 'NONE' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}
                  >
                    Không có Sale tư vấn
                  </button>
                </div>

                {saleOption === 'HAS' && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-600">Chọn Sale phụ trách</p>
                      <div className="w-40">
                        <SearchInput
                          placeholder="Tìm Sale theo tên, SĐT..."
                          size="xs"
                          value={saleSearch}
                          onChange={(e) => setSaleSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <Select
                      value={selectedSaleId}
                      onChange={(e) => setSelectedSaleId(e.target.value)}
                      disabled={loadingSales}
                      options={[
                        { value: '', label: loadingSales ? 'Đang tải danh sách Sale...' : 'Chọn Sale phụ trách' },
                        ...sales
                          .filter((s) => {
                            if (!saleSearch.trim()) return true;
                            const keyword = saleSearch.toLowerCase();
                            return (
                              (s.fullName || s.name || '').toLowerCase().includes(keyword)
                              || (s.phone || '').toLowerCase().includes(keyword)
                              || (s.email || '').toLowerCase().includes(keyword)
                            );
                          })
                          .map((s) => ({
                            value: s._id,
                            label: `${s.fullName || s.name || 'Sale'} · ${s.phone || s.email || ''}`,
                          })),
                      ]}
                    />
                    <p className="text-[11px] text-slate-500">Thông tin Sale chỉ dùng để hiển thị, chưa thay đổi luồng backend.</p>
                  </div>
                )}
              </div>

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
                {uploading ? 'Đang upload hồ sơ...' : 'Lưu hồ sơ cá nhân'}
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Lịch sử thanh toán gần đây" description="Các giao dịch học phí mới nhất của bạn" />
          {loadingStudentPayments ? (
            <div className="py-4 text-sm text-slate-500">Đang tải lịch sử thanh toán...</div>
          ) : studentPayments.length === 0 ? (
            <div className="py-4 text-sm text-slate-500">Chưa có giao dịch thanh toán.</div>
          ) : (
            <div className="space-y-2 text-sm">
              {studentPayments.slice(0, 6).map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <p className="font-medium text-slate-900">{p.method || 'PAYMENT'}</p>
                    <p className="text-xs text-slate-500">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('vi-VN') : '—'}
                    </p>
                  </div>
                  <p className="font-semibold text-emerald-700">{(Number(p.amount) || 0).toLocaleString('vi-VN')} đ</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Luật huỷ hồ sơ" description="Tự động cảnh báo sau thời gian quá hạn" />
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

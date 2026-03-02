import { useEffect, useState } from 'react';
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

  // Create registration (UC09)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [creatingRegistration, setCreatingRegistration] = useState(false);

  // Lựa chọn Sale tư vấn cho hồ sơ (frontend only, không đổi payload gửi BE)
  const [saleOption, setSaleOption] = useState('HAS'); // 'HAS' | 'NONE'
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [saleSearch, setSaleSearch] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState('');

  // Lưu ý: giấy tờ CCCD/khám sức khoẻ/ảnh 3x4 dùng chung, nên FE sẽ tự áp dụng upload cho tất cả hồ sơ hiện có.
  // selectedRegistrationId chỉ dùng để hiển thị "hồ sơ mới nhất" (nếu cần), không bắt buộc người dùng chọn.
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
  ];

  const mappedRegistrations = registrations.map((item, index) => ({
    key: item._id || index,
    code: item._id || '-',
    batch: item.batchId?.location || '—',
    status: item.status || 'NEW',
  }));

  const loadRegistrations = async () => {
    if (!user?.id) return;
    try {
      setLoadingRegistrations(true);
      const response = await apiClient.get(`/registrations?studentId=${user.id}`);
      if (response.status === 'success') {
        const list = response.data || [];
        setRegistrations(list);

        // API BE sort createdAt desc, phần tử đầu là hồ sơ mới nhất → dùng để hiển thị (không bắt buộc chọn)
        if (!selectedRegistrationId && list.length > 0) {
          setSelectedRegistrationId(list[0]?._id || '');
        }
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoadingRegistrations(false);
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

  const handleCreateRegistration = async () => {
    if (!selectedBatchId) {
      showToast('Vui lòng chọn lớp (batch) để tạo hồ sơ', 'error');
      return;
    }

    try {
      setCreatingRegistration(true);

      // BE hỗ trợ registerMethod enum: ONLINE | CONSULTANT
      const registerMethod = saleOption === 'HAS' ? 'CONSULTANT' : 'ONLINE';

      const response = await apiClient.post('/registrations', {
        batchId: selectedBatchId,
        registerMethod,
      });

      if (response.status === 'success') {
        showToast('Tạo hồ sơ đăng ký thành công', 'success');
        setIsCreateModalOpen(false);
        setSelectedBatchId('');
        await loadRegistrations();
      } else {
        showToast(response.message || 'Tạo hồ sơ thất bại', 'error');
      }
    } catch (error) {
      console.error('Create registration error:', error);
      showToast(error?.message || 'Tạo hồ sơ thất bại', 'error');
    } finally {
      setCreatingRegistration(false);
    }
  };

  // Load danh sách Sale (tư vấn viên) khi cần, dùng role CONSULTANT từ BE
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (isCreateModalOpen) {
      loadBatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateModalOpen]);

  // Chỉ load danh sách Sale khi người dùng chọn "Có Sale tư vấn"
  useEffect(() => {
    if (saleOption === 'HAS' && sales.length === 0 && !loadingSales) {
      loadSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleOption]);

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
    // Giấy tờ dùng chung → áp dụng cho tất cả hồ sơ đăng ký hiện có của học viên
    const registrationIds = (registrations || [])
      .map((r) => r?._id)
      .filter(Boolean);

    if (registrationIds.length === 0) {
      showToast('Bạn chưa có hồ sơ đăng ký nào. Vui lòng tạo hồ sơ mới trước khi upload giấy tờ.', 'error');
      setIsCreateModalOpen(true);
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

      // Upload 1 lần và áp dụng cho tất cả hồ sơ đăng ký (không thay đổi logic BE)
      await Promise.all(
        registrationIds.map((registrationId) =>
          apiClient.post('/documents/upload', {
            registrationId,
            cccdImage: cccdImageUrl,
            healthCertificate: healthUrl,
            photo: photoUrl,
            cccdNumber: cccdNumber.trim(),
          })
        )
      );

      showToast(`Upload hồ sơ thành công (áp dụng cho ${registrationIds.length} hồ sơ)`, 'success');
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
            <button
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setIsCreateModalOpen(true)}
            >
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

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo hồ sơ đăng ký mới"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} disabled={creatingRegistration}>
              Hủy
            </Button>
            <Button onClick={handleCreateRegistration} loading={creatingRegistration} disabled={loadingBatches}>
              Tạo hồ sơ
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">
            Chọn lớp (batch) đang mở đăng ký để tạo hồ sơ. Sau khi tạo xong bạn có thể upload giấy tờ dùng chung.
          </p>

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
              return {
                value: b?._id,
                label: label || (b?._id || 'Batch'),
              };
            })}
            helperText="Chỉ hiển thị các lớp có trạng thái OPEN từ backend."
          />

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Ghi chú</p>
            <p className="mt-1 text-xs text-slate-600">
              - Nếu bạn chọn <span className="font-semibold">Có Sale tư vấn</span>, hồ sơ sẽ được tạo với registerMethod = CONSULTANT.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              - Nếu chọn <span className="font-semibold">Không có Sale tư vấn</span>, hồ sơ sẽ là ONLINE để Admin quản lý.
            </p>
          </div>
        </div>
      </Modal>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Hồ sơ đăng ký của tôi"
          description="Danh sách hồ sơ đã đăng ký theo tài khoản hiện tại · Giấy tờ (CCCD/Khám sức khoẻ/Ảnh) dùng chung"
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
          <div className="space-y-3">
            <DataTable columns={registrationColumns} data={mappedRegistrations} />
            <p className="text-xs text-slate-500">
              Khi upload giấy tờ, hệ thống sẽ tự áp dụng cho <span className="font-semibold">{mappedRegistrations.length}</span> hồ sơ hiện có của bạn.
            </p>
          </div>
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
              Nhập số CMND/CCCD và upload ảnh giấy tờ. Giấy tờ sẽ được áp dụng cho tất cả hồ sơ đăng ký hiện có.
            </p>
            <form onSubmit={handleUploadSubmit} className="mt-3 space-y-3 text-sm">
              {/* UC09 - Chọn Sale tư vấn (chỉ hiển thị trên giao diện, không đổi logic BE) */}
              <div className="space-y-2 rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-xs font-semibold text-slate-700">Sale tư vấn hồ sơ</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSaleOption('HAS')}
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      saleOption === 'HAS'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Có Sale tư vấn
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleOption('NONE')}
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      saleOption === 'NONE'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
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
                        {
                          value: '',
                          label: loadingSales ? 'Đang tải danh sách Sale...' : 'Chọn Sale phụ trách',
                        },
                        ...sales
                          .filter((s) => {
                            if (!saleSearch.trim()) return true;
                            const keyword = saleSearch.toLowerCase();
                            return (
                              (s.fullName || s.name || '').toLowerCase().includes(keyword) ||
                              (s.phone || '').toLowerCase().includes(keyword) ||
                              (s.email || '').toLowerCase().includes(keyword)
                            );
                          })
                          .map((s) => ({
                            value: s._id,
                            label: `${s.fullName || s.name || 'Sale'} · ${s.phone || s.email || ''}`,
                          })),
                      ]}
                    />
                    <p className="text-[11px] text-slate-500">
                      Thông tin Sale chỉ dùng để hiển thị cho học viên, chưa thay đổi luồng xử lý hồ sơ ở backend.
                    </p>
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


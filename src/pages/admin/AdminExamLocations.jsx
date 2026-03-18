import { useState, useEffect } from 'react';
import SectionHeader from '../../components/ui/SectionHeader';
import { FileUpload } from '../../components/ui';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import apiClient from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/common/Pagination';
import config from '../../config';

const AdminExamLocations = () => {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    googleMapUrl: '',
    image: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    loadList();
  }, [currentPage]);

  const loadList = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/exam-locations?page=${currentPage}&limit=10`);
      if (res.status === 'success') {
        setList(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      showToast('Không tải được danh sách sân sát hạch', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', address: '', googleMapUrl: '', image: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      address: item.address || '',
      googleMapUrl: item.googleMapUrl || '',
      image: item.image || '',
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    if (!config.cloudinary.cloudName || !config.cloudinary.uploadPreset) {
      showToast(
        "Cloudinary chưa được cấu hình. Vui lòng thêm VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.",
      );
      return;
    }

    try {
      setImageUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", config.cloudinary.uploadPreset);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`;

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.secure_url) {
        throw new Error(data.error?.message || "Upload ảnh thất bại");
      }

      const imageUrl = data.secure_url;
      setForm((prev) => ({ ...prev, image: imageUrl }));
    } catch (err) {
      console.error("Image upload error:", err);
      showToast(err.message || "Upload ảnh thất bại");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Vui lòng nhập tên trường thi sát hạch', 'error');
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        googleMapUrl: form.googleMapUrl.trim(),
        image: form.image.trim(),
      };
      if (editing) {
        await apiClient.put(`/exam-locations/${editing._id}`, payload);
      } else {
        await apiClient.post('/exam-locations', payload);
      }
      showToast(editing ? 'Đã cập nhật sân sát hạch' : 'Đã tạo sân sát hạch', 'success');
      setModalOpen(false);
      loadList();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Có lỗi', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setSubmitLoading(true);
    try {
      await apiClient.delete(`/exam-locations/${deleteConfirm.id}`);
      showToast('Đã xóa sân sát hạch', 'success');
      setDeleteConfirm({ open: false, id: null, name: '' });
      loadList();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Có lỗi', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-6">
      <SectionHeader
        title="Quản lý sân sát hạch"
        description="Quản lý danh sách trường thi sát hạch, địa điểm và hình ảnh. Thông tin này sẽ được sử dụng khi tạo lớp học."
      />
      <div className="mt-4 flex justify-end">
        <Button onClick={openCreate}>+ Thêm sân sát hạch</Button>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="mt-3 text-slate-500">Chưa có sân sát hạch nào.</p>
          <Button variant="secondary" className="mt-3" onClick={openCreate}>
            + Thêm sân sát hạch đầu tiên
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => (
            <div
              key={item._id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {item.image ? (
                <div className="h-40 w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 w-full flex items-center justify-center bg-slate-100">
                  <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-slate-800">{item.name}</h3>
                {item.address && (
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.address}</p>
                )}
                {item.googleMapUrl && (
                  <a
                    href={item.googleMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Xem trên bản đồ
                  </a>
                )}
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
                    Sửa
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteConfirm({ open: true, id: item._id, name: item.name })}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Chỉnh sửa sân sát hạch' : 'Tạo sân sát hạch mới'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} loading={submitLoading}>
              {editing ? 'Cập nhật' : 'Tạo'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tên trường thi sát hạch *
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Trung tâm sát hạch lái xe Bắc Ninh"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Địa điểm
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="VD: Đường 21, phường Võ Cường, TP Bắc Ninh"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Google Maps URL
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.googleMapUrl}
              onChange={(e) => setForm((f) => ({ ...f, googleMapUrl: e.target.value }))}
              placeholder="VD: https://maps.google.com/..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ảnh trường thi
            </label>
            <FileUpload
              accept=".jpg,.jpeg,.png"
              multiple={false}
              maxSize={5 * 1024 * 1024}
              onChange={handleImageUpload}
              disabled={imageUploading}
            />
            {imageUploading && (
              <p className="mt-2 text-xs text-slate-500">Đang upload ảnh...</p>
            )}
            {form.image && !imageUploading && (
              <div className="mt-3 relative inline-block">
                <img
                  src={form.image}
                  alt="Preview"
                  className="h-32 w-auto rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, image: '' }))}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Xóa sân sát hạch"
        message={`Bạn có chắc muốn xóa "${deleteConfirm.name}"?`}
        variant="danger"
        loading={submitLoading}
      />
    </div>
  );
};

export default AdminExamLocations;
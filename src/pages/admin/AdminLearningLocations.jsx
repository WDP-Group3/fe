import { useState, useEffect } from 'react';
import SectionHeader from '../../components/ui/SectionHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import apiClient from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/common/Pagination';

const AdminLearningLocations = () => {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    areaName: '',
    yardName: '',
    googleMapAddress: '',
  });
  const [instructorRows, setInstructorRows] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [instructorSearchQueries, setInstructorSearchQueries] = useState({});
  const [openInstructorDropdown, setOpenInstructorDropdown] = useState(null);

  useEffect(() => {
    loadList();
  }, [currentPage]);

  useEffect(() => {
    loadCourses();
    loadInstructors();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openInstructorDropdown !== null) {
        const dropdownElements = document.querySelectorAll('[data-instructor-dropdown]');
        let clickedInside = false;
        dropdownElements.forEach((el) => {
          if (el.contains(e.target)) clickedInside = true;
        });
        if (!clickedInside) {
          setOpenInstructorDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openInstructorDropdown]);

  const loadList = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/learning-locations?page=${currentPage}&limit=10`);
      if (res.status === 'success') {
        setList(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      showToast('Không tải được danh sách địa điểm học', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await apiClient.get('/courses');
      if (res.status === 'success') setCourses(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInstructors = async () => {
    try {
      // Backend phân trang mặc định limit=10; cần lấy đủ tất cả thầy cho dropdown tìm kiếm
      const res = await apiClient.get('/users?role=INSTRUCTOR&limit=500');
      if (res.status === 'success') setInstructors(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ areaName: '', yardName: '', googleMapAddress: '' });
    setInstructorRows([]);
    setInstructorSearchQueries({});
    setOpenInstructorDropdown(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      areaName: item.areaName || '',
      yardName: item.yardName || '',
      googleMapAddress: item.googleMapAddress || '',
    });
    setInstructorRows(item.instructors || []);
    setInstructorSearchQueries({});
    setOpenInstructorDropdown(null);
    setModalOpen(true);
  };

  const getInstructorDisplayName = (row) => {
    const id = row.instructorId?._id || row.instructorId;
    if (!id) return '';
    const idStr = String(id);
    const found = instructors.find((u) => String(u._id) === idStr);
    return found ? `${found.fullName} (${found.email})` : (row.instructorId?.fullName && row.instructorId?.email ? `${row.instructorId.fullName} (${row.instructorId.email})` : '');
  };

  // Bỏ dấu tiếng Việt để tìm "nguye" khớp "Nguyễn"
  const removeVietnameseTone = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const getFilteredInstructors = (query) => {
    if (!(query && query.trim())) return instructors;
    const q = removeVietnameseTone(query.trim());
    return instructors.filter((u) => {
      const name = removeVietnameseTone(String(u.fullName || ''));
      const email = String(u.email || '').toLowerCase();
      const emailNorm = removeVietnameseTone(u.email || '');
      return name.includes(q) || email.includes(q) || emailNorm.includes(q);
    });
  };

  const setInstructorSearch = (idx, value) => {
    setInstructorSearchQueries((prev) => ({ ...prev, [idx]: value }));
    setOpenInstructorDropdown(idx);
  };

  const selectInstructor = (idx, instructorId) => {
    updateInstructorRow(idx, 'instructorId', instructorId);
    setInstructorSearchQueries((prev) => ({ ...prev, [idx]: '' }));
    setOpenInstructorDropdown(null);
  };

  const handleSave = async () => {
    if (!form.areaName.trim()) {
      showToast('Vui lòng nhập tên khu vực', 'error');
      return;
    }
    const instructorPayload = instructorRows
      .map((r) => ({
        instructorId: r.instructorId?._id || r.instructorId,
        courseId: r.courseId?._id || r.courseId,
      }))
      .filter((r) => r.instructorId && r.courseId);
    const hasPartial = instructorRows.some(
      (r) => (r.instructorId || r.courseId) && (!(r.instructorId?._id || r.instructorId) || !(r.courseId?._id || r.courseId))
    );
    if (hasPartial) {
      showToast('Vui lòng chọn đủ thầy và khóa học cho từng dòng', 'error');
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = {
        areaName: form.areaName.trim(),
        yardName: form.yardName.trim(),
        googleMapAddress: form.googleMapAddress.trim(),
        instructors: instructorPayload,
      };
      if (editing) {
        await apiClient.put(`/learning-locations/${editing._id}`, payload);
      } else {
        await apiClient.post('/learning-locations', payload);
      }
      showToast(editing ? 'Đã cập nhật địa điểm học' : 'Đã tạo địa điểm học', 'success');
      setModalOpen(false);
      loadList();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Có lỗi', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const addInstructorRow = () => {
    setInstructorRows((prev) => [...prev, { instructorId: null, courseId: null }]);
  };

  const removeInstructorRow = (idx) => {
    setInstructorRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateInstructorRow = (idx, field, value) => {
    setInstructorRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setSubmitLoading(true);
    try {
      await apiClient.delete(`/learning-locations/${deleteConfirm.id}`);
      showToast('Đã xóa địa điểm học', 'success');
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
        title="Địa điểm học"
        description="Quản lý khu vực học, tên sân, địa chỉ bản đồ và phân công giáo viên theo hạng/khoá. Mỗi thầy chỉ được 1 khu vực + 1 hạng dạy; nếu thêm thầy đã ở khu vực khác sẽ chuyển thầy sang đây."
      />
      <div className="mt-4 flex justify-end">
        <Button onClick={openCreate}>Tạo địa điểm học</Button>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Tên khu vực</th>
                <th className="px-4 py-3">Tên sân</th>
                <th className="px-4 py-3">Địa chỉ GG Map</th>
                <th className="px-4 py-3">Thầy / Hạng dạy</th>
                <th className="px-4 py-3 w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Chưa có địa điểm học. Nhấn "Tạo địa điểm học" để thêm.
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.areaName}</td>
                    <td className="px-4 py-3 text-slate-600">{item.yardName || '—'}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={item.googleMapAddress}>
                      {item.googleMapAddress || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {(item.instructors || []).map((a) => (
                          <li key={`${a.instructorId?._id}-${a.courseId?._id}`} className="text-slate-700">
                            {a.instructorId?.fullName} – {a.courseId?.code || a.courseId?.name}
                          </li>
                        ))}
                        {(item.instructors || []).length === 0 && (
                          <li className="text-slate-400 italic">Chưa gán thầy</li>
                        )}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
                          Sửa
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteConfirm({ open: true, id: item._id, name: item.areaName })}
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100">
              <Pagination 
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Chỉnh sửa địa điểm học' : 'Tạo địa điểm học'}
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
        <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tên khu vực *</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.areaName}
              onChange={(e) => setForm((f) => ({ ...f, areaName: e.target.value }))}
              placeholder="VD: Hà Nội"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tên sân</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.yardName}
              onChange={(e) => setForm((f) => ({ ...f, yardName: e.target.value }))}
              placeholder="VD: Sân tập A"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Địa chỉ Google Map</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.googleMapAddress}
              onChange={(e) => setForm((f) => ({ ...f, googleMapAddress: e.target.value }))}
              placeholder="Link hoặc địa chỉ bản đồ"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Thầy / Khóa dạy</span>
              <Button variant="secondary" size="sm" onClick={addInstructorRow}>
                + Thêm thầy
              </Button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Chọn thầy và khóa (hạng) thầy đảm nhận tại địa điểm này. Mỗi thầy chỉ 1 khu vực + 1 khóa.
            </p>
            <div className="space-y-3">
              {instructorRows.map((row, idx) => {
                const selectedInstructorId = row.instructorId?._id || row.instructorId;
                const query = instructorSearchQueries[idx] || '';
                const filteredInstructors = getFilteredInstructors(query);
                const isDropdownOpen = openInstructorDropdown === idx;
                return (
                <div
                  key={idx}
                  className="relative flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="relative min-w-0 flex-1" data-instructor-dropdown>
                    <div className="flex rounded-lg border border-slate-300 bg-white shadow-sm">
                      <input
                        type="text"
                        className="min-w-0 flex-1 rounded-l-lg border-0 bg-transparent px-3 py-2 text-sm outline-none"
                        placeholder="Chọn thầy hoặc gõ tìm theo tên / email..."
                        value={isDropdownOpen ? query : (selectedInstructorId ? getInstructorDisplayName(row) : '')}
                        onChange={(e) => setInstructorSearch(idx, e.target.value)}
                        onFocus={() => setOpenInstructorDropdown(idx)}
                      />
                      <button
                        type="button"
                        className="flex shrink-0 items-center rounded-r-lg border-l border-slate-200 bg-slate-50 px-2 text-slate-500 hover:bg-slate-100"
                        onClick={() => setOpenInstructorDropdown(isDropdownOpen ? null : idx)}
                        title={isDropdownOpen ? 'Đóng danh sách' : 'Mở danh sách thầy'}
                      >
                        <svg className={`h-5 w-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {isDropdownOpen && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        {filteredInstructors.length > 0 ? (
                          filteredInstructors.map((u) => (
                            <button
                              key={u._id}
                              type="button"
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                                String(u._id) === String(selectedInstructorId) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700'
                              }`}
                              onClick={() => selectInstructor(idx, u._id)}
                            >
                              {u.fullName} ({u.email})
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-400">Không tìm thấy thầy</div>
                        )}
                      </div>
                    )}
                  </div>
                  <select
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={row.courseId?._id || row.courseId || ''}
                    onChange={(e) => updateInstructorRow(idx, 'courseId', e.target.value)}
                  >
                    <option value="">Chọn khóa / hạng</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.code} – {c.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="danger"
                    size="sm"
                    className="shrink-0"
                    onClick={() => removeInstructorRow(idx)}
                  >
                    Xóa
                  </Button>
                </div>
              )})}
              {instructorRows.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-sm text-slate-400">
                  Chưa có thầy. Nhấn &quot;+ Thêm thầy&quot; để thêm.
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Xóa địa điểm học"
        message={`Bạn có chắc muốn xóa "${deleteConfirm.name}"?`}
        variant="danger"
        loading={submitLoading}
      />
    </div>
  );
};

export default AdminLearningLocations;

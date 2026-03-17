import { useState, useEffect } from 'react';
import axios from '../../services/axios';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/common/Pagination';

const AdminSystemHolidays = () => {
  const { showToast } = useToast();
  const [holidays, setHolidays] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
    location: '' // null = toàn hệ thống, có giá trị = theo khu vực
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchHolidays();
  }, [currentPage]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get('/users/locations');
      const locs = res?.data?.data || res?.data || [];
      setLocations(locs.map(l => ({ value: l, label: l })));
    } catch (err) {
      console.error('Lỗi khi tải danh sách khu vực:', err);
    }
  };

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/system-holidays?page=${currentPage}&limit=10`);
      // Backend trả về { status: 'success', data: [...], pagination: {...} }; axios đã return response.data nên res = body
      setHolidays(Array.isArray(res?.data) ? res.data : (res?.data?.data || []));
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch nghỉ:', error);
      showToast('Lỗi khi tải lịch nghỉ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Chuẩn bị dữ liệu gửi lên
    const payload = {
      title: formData.title,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
      location: formData.location || null // null = toàn hệ thống
    };

    const successMessage = editingId 
      ? 'Cập nhật lịch nghỉ thành công! Email thông báo đã được gửi.'
      : 'Thêm lịch nghỉ thành công! Email thông báo đã được gửi.';
    
    try {
      let response;
      if (editingId) {
        response = await axios.put(`/system-holidays/${editingId}`, payload);
        setHolidays((prev) => prev.map(h => h._id === editingId ? response?.data?.data || response?.data : h));
      } else {
        response = await axios.post('/system-holidays', payload);
        setHolidays((prev) => [response?.data?.data || response?.data, ...prev]);
      }
      
      showToast(successMessage, 'success');
      
      setShowModal(false);
      setFormData({ title: '', startDate: '', endDate: '', description: '', location: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      showToast(error.response?.data?.message || error.message || 'Lỗi khi lưu lịch nghỉ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa lịch nghỉ này?')) return;
    try {
      await axios.delete(`/system-holidays/${id}`);
      showToast('Xóa lịch nghỉ thành công! Email thông báo đã được gửi đến giáo viên và học viên.', 'success');
      setHolidays((prev) => prev.filter(h => h._id !== id));
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      showToast(error.response?.data?.message || error.message || 'Lỗi khi xóa lịch nghỉ', 'error');
    }
  };

  const handleEdit = (holiday) => {
    setFormData({
      title: holiday.title,
      startDate: holiday.startDate.split('T')[0],
      endDate: holiday.endDate.split('T')[0],
      description: holiday.description || '',
      location: holiday.location || ''
    });
    setEditingId(holiday._id);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lịch nghỉ toàn hệ thống</h1>
        <button
          onClick={() => {
            setFormData({ title: '', startDate: '', endDate: '', description: '', location: '' });
            setEditingId(null);
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Thêm lịch nghỉ
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên lịch nghỉ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phạm vi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày bắt đầu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày kết thúc</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {holidays.map((holiday) => (
              <tr key={holiday._id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{holiday.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {holiday.location ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                      {holiday.location}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                      Toàn hệ thống
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(holiday.startDate).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(holiday.endDate).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4">{holiday.description || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleEdit(holiday)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(holiday._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {holidays.length === 0 && (
          <div className="text-center py-8 text-gray-500">Chưa có lịch nghỉ nào</div>
        )}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination 
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Sửa lịch nghỉ' : 'Thêm lịch nghỉ'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên lịch nghỉ</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: Nghỉ Tết Nguyên Đán"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phạm vi áp dụng</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <option value="">Toàn hệ thống</option>
                  {locations.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Để trống = áp dụng cho toàn hệ thống. Chọn khu vực = chỉ nghỉ ở khu vực đó.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ví dụ: Nghỉ Tết Nguyên Đán 2026"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystemHolidays;

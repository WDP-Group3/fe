import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';

const Courses = () => {
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', price: '0', description: '', image: '' });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/courses');
      if (response.status === 'success') {
        const mappedCourses = (response.data || []).map((course) => ({
          id: course.code || course._id,
          _id: course._id, // Keep real ID for API calls
          name: course.name,
          price: course.price || course.estimatedCost || 0,
          duration: course.estimatedDuration ? `${course.estimatedDuration} tháng` : '3 tháng',
          description: course.description || '',
          location: course.location || [],
          installments: course.price ? [
            `Đợt 1: ${formatCurrency(Math.floor(course.price * 0.5))}`,
            `Đợt 2: ${formatCurrency(Math.floor(course.price * 0.5))}`,
          ] : [],
          startDates: ['Hàng tuần'],
          perks: course.note ? [course.note] : ['Hỗ trợ học online', 'Thi thử không giới hạn'],
        }));
        setCourses(mappedCourses);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await apiClient.put(`/courses/${editingCourse._id}`, formData);
      } else {
        await apiClient.post('/courses', formData);
      }
      setShowModal(false);
      setEditingCourse(null);
      setFormData({ code: '', name: '', price: '0', description: '', image: '' });
      loadCourses();
    } catch (error) {
      alert('Failed to save course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.id,
      name: course.name,
      price: course.price,
      description: course.description,
      image: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá?')) {
      try {
        await apiClient.delete(`/courses/${id}`);
        loadCourses();
      } catch (error) {
        alert('Failed to delete course');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="text-center py-8 text-red-600">
            <p>Lỗi tải dữ liệu: {error}</p>
            <button
              onClick={loadCourses}
              className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Danh sách khóa học"
          description="Công khai học phí, phụ phí và lịch khai giảng"
          action={
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingCourse(null);
                    setFormData({ code: '', name: '', price: '0', description: '', image: '' });
                    setShowModal(true);
                  }}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Thêm khóa học
                </button>
              )}
            </div>
          }
        />

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-slate-900">{editingCourse ? 'Sửa khoá học' : 'Thêm khoá học mới'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Mã khoá học</label>
                    <input
                      required
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Tên khoá học</label>
                    <input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Học phí (VND)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  ></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Chưa có khóa học nào</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className="relative rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <StatusBadge status="done" label="Mở đăng ký" />
                  <p className="text-xs font-semibold text-indigo-600">{course.id}</p>
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-900">{course.name}</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(course.price)}</p>
                <p className="text-xs text-slate-500">Chia đợt, nhắc phí tự động</p>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  {course.installments.map((item) => (
                    <p key={item}>• {item}</p>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                  <p className="font-semibold text-indigo-700">Khai giảng</p>
                  <p className="text-xs text-slate-500">{course.startDates.join(' · ')}</p>
                  <p className="text-xs text-slate-500">Thời lượng: {course.duration}</p>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {course.perks?.map((perk) => (
                    <div key={perk} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      {perk}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                    Chọn khóa
                  </button>
                  <button className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800">
                    Tư vấn
                  </button>
                </div>
                {isAdmin && (
                  <div className="mt-4 flex gap-2 border-t pt-3">
                    <button onClick={() => handleEdit(course)} className="text-xs text-indigo-600 hover:underline">Sửa</button>
                    <button onClick={() => handleDelete(course._id)} className="text-xs text-red-600 hover:underline">Xoá</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;


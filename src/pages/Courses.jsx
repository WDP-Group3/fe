import { useState, useEffect } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/courses');
      if (response.status === 'success') {
        // Map backend course format to frontend format
        const mappedCourses = (response.data || []).map((course) => ({
          id: course.code || course._id,
          name: course.name,
          price: course.estimatedCost || 0,
          duration: course.estimatedDuration ? `${course.estimatedDuration} tháng` : 'Chưa cập nhật',
          description: course.description || '',
          location: course.location || [],
          installments: course.estimatedCost ? [
            `Đợt 1: ${formatCurrency(Math.floor(course.estimatedCost * 0.5))}`,
            `Đợt 2: ${formatCurrency(Math.floor(course.estimatedCost * 0.5))}`,
          ] : [],
          startDates: [], // Will need batch data for this
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
          action={<button className="text-sm font-semibold text-indigo-700">Xuất PDF</button>}
        />
        {courses.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Chưa có khóa học nào</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
            <div key={course.id} className="rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
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
                {course.perks.map((perk) => (
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
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;


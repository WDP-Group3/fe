import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Carousel, Button } from '../components/ui';
import StatCard from '../components/ui/StatCard';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { sessions } from '../data/mockData';
import apiClient from '../services/apiClient';
import PortalLayout from '../components/layout/PortalLayout';
import { useToast } from '../context/ToastContext';

const Landing = () => {
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    course: '',
    timeToCall: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/courses");
      if (response.status === "success") {
        const mappedCourses = (response.data || []).map((course) => ({
          ...course,
          id: course._id,   // dùng cho internal
          code: course.code, // dùng cho URL
          feePayments: course.feePayments || [],
          displayLocation: Array.isArray(course.location)
            ? course.location.join(", ")
            : course.location,
        }));
        setCourses(mappedCourses);
        // Set default course if available
        if (mappedCourses.length > 0) {
          setFormData(prev => ({ ...prev, course: mappedCourses[0].id }));
        }
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.course) {
      showToast('Vui lòng điền đầy đủ các trường bắt buộc (*)', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/leads', formData);
      showToast('Gửi yêu cầu tư vấn thành công! Chúng tôi sẽ liên hệ sớm.', 'success');
      setFormData({
        name: '',
        phone: '',
        course: courses[0]?.id || '',
        timeToCall: '',
        note: ''
      });
    } catch (err) {
      console.error('Error submitting lead:', err);
      showToast(err.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToConsultForm = () => {
    const element = document.getElementById('consult-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const banners = [
    {
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200',
      title: 'Khóa học lái xe B2 - Ưu đãi đặc biệt',
      description: 'Giảm 500.000đ cho 50 học viên đầu tiên đăng ký trong tháng này',
      button: { label: 'Đăng ký ngay', onClick: () => window.location.href = '/register' },
    },
    {
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',
      title: 'Thi thử 600 câu miễn phí',
      description: 'Luyện tập không giới hạn với bộ đề thi mới nhất từ Bộ GTVT',
      button: { label: 'Bắt đầu thi thử', onClick: () => window.location.href = '/portal/exams' },
    },
    {
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      title: 'Hỗ trợ học phí linh hoạt',
      description: 'Chia đợt thanh toán, hỗ trợ công nợ cho học viên',
      button: { label: 'Xem chi tiết', onClick: () => window.location.href = '/portal/courses' },
    },
  ];

  return (
    <PortalLayout>
      <div className="pb-16 pt-2">
        {/* Banner Carousel */}
        <div className="mb-10">
          <Carousel items={banners} autoPlay interval={2000} showDots showArrows />
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100 shadow-sm">
              Minh bạch khóa học · Lịch học rõ ràng · Nhắc phí tự động
            </div>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Trung tâm đào tạo lái xe minh bạch, <span className="text-indigo-600">dễ theo dõi</span> từ đăng ký đến sát hạch
            </h1>
            <p className="text-lg text-slate-600">
              Công khai học phí, lịch khai giảng, tiến độ hồ sơ. Học viên và nhân viên cùng theo dõi một nguồn thông tin duy nhất.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/portal/overview"
                className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5"
              >
                Bắt đầu ngay
              </Link>
              <button
                onClick={scrollToConsultForm}
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-indigo-200 hover:text-indigo-700"
              >
                Nhận tư vấn miễn phí
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard title="Học viên đang học" value="180" delta="+12 so với tuần trước" />
              <StatCard title="Tỷ lệ thi đậu lý thuyết" value="92%" delta="Thi thử không giới hạn" />
              <StatCard title="Lịch trống tuần này" value="38 slot" delta="Thực hành + lý thuyết" />
            </div>
          </div>
          <div className="relative">
            <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-indigo-100 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white/80 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-indigo-600">Lịch học mẫu</p>
                  <p className="text-sm text-slate-600">Cập nhật mỗi ngày · Nhắc qua SMS/App</p>
                </div>
                <StatusBadge status="doing" label="Học viên xem trực tiếp" />
              </div>
              <div className="divide-y divide-slate-100">
                {sessions.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="rounded-2xl bg-slate-50 px-4 py-2 text-center">
                      <p className="text-xs font-semibold text-indigo-600">{item.date}</p>
                      <p className="text-[11px] text-slate-500">{item.time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.type}</p>
                      <p className="text-xs text-slate-500">
                        {item.instructor} · {item.location}
                      </p>
                    </div>
                    <StatusBadge status="done" label="Còn slot" />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-slate-50 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Thi thử 600 câu</p>
                  <p className="text-Thời gian gọi text-slate-500">Lưu lịch sử, thống kê câu sai</p>
                </div>
                <button className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm">
                  Bắt đầu ngay
                </button>
              </div>
            </div>
          </div>
        </div>


        <div className="mt-14 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-8 shadow-sm text-center">
          <p className="text-xs font-semibold uppercase text-indigo-500 tracking-wider mb-2">Khóa học & Học phí</p>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Công khai học phí, lịch khai giảng, phụ phí
          </h2>
          <p className="text-slate-500 mb-6 text-sm max-w-md mx-auto">
            Xem đầy đủ các khóa học, chi tiết học phí từng đợt và lịch khai giảng mới nhất của trung tâm.
          </p>
          <Link
            to="/portal/courses"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
          >
            Xem tất cả khóa học →
          </Link>
        </div>


        <div id="consult-form" className="mt-12 grid gap-6 md:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Đặt lịch tư vấn nhanh"
              description="Hẹn giờ gọi điện, tự động gửi SMS nhắc"
            />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Họ tên *</label>
                <input
                  name="name"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  placeholder="Nhập họ tên"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Số điện thoại *</label>
                  <input
                    name="phone"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                    placeholder="0912 xxx xxx"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Chọn khóa *</label>
                  <select
                    name="course"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                    value={formData.course}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Chọn khóa học</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Thời gian gọi<span className="text-xs text-slate-500">(các cuộc tư vấn thường chỉ mất từ 15 - 30 phút)</span></label>
                <input
                  name="timeToCall"
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  value={formData.timeToCall}
                  onChange={handleInputChange}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
              </button>
              <p className="text-xs text-slate-500">Chúng tôi sẽ gọi trong vòng 30 phút giờ hành chính.</p>
            </form>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm backdrop-blur">
            <SectionHeader title="Luật & blog" description="Thông tin chính thống, cập nhật liên tục" />
            <div className="space-y-3">
              {[
                { title: '600 câu Bộ GTVT - phiên bản mới nhất', tag: 'Thi thử' },
                { title: 'Quy trình nộp hồ sơ và sát hạch', tag: 'Hồ sơ' },
                { title: 'Mức phí và phụ phí theo quy định', tag: 'Học phí' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 p-4 hover:border-indigo-100">
                  <div className="flex items-center gap-2">
                    <StatusBadge status="doing" label={item.tag} />
                    <span className="text-xs text-slate-400">Cập nhật 08/01/2026</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600">Xem chi tiết trên portal</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout >
  );
};

export default Landing;
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
    timeToCall: '',
    note: ''
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
      button: { label: 'Bắt đầu thi thử', onClick: () => window.location.href = '/exams' },
    },
    {
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      title: 'Hỗ trợ học phí linh hoạt',
      description: 'Chia đợt thanh toán, hỗ trợ công nợ cho học viên',
      button: { label: 'Xem chi tiết', onClick: () => window.location.href = '/courses' },
    },
  ];

  return (
    <PortalLayout>
      <div className="pb-16 pt-2">
        {/* Banner Carousel */}
        <div className="mb-10">
          <Carousel items={banners} autoPlay interval={2000} showDots showArrows />
        </div>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
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

          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-indigo-100 to-sky-50 opacity-50 blur-2xl" />
            <img
              src="https://bizweb.dktcdn.net/100/415/690/files/lai-xe-ban-dem-1.jpg"
              alt="Học viên học lái xe"
              className="relative h-[480px] w-full rounded-3xl object-cover shadow-2xl"
            />
            <div className="absolute right-8 top-8 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur">
              <div className="flex items-center gap-3">
                <div>
                </div>
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
            to="/courses"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
          >
            Xem tất cả khóa học →
          </Link>
        </div>


        <div id="consult-form" className="relative mt-16 overflow-hidden rounded-[2.5rem] shadow-2xl">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80"
              alt="Background"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
          </div>

          <div className="relative grid gap-10 md:grid-cols-2 lg:gap-16 items-center p-8 md:p-12 lg:p-16">
            {/* Left Content */}
            <div className="text-white space-y-6">
              <h2 className="text-3xl font-bold sm:text-4xl text-white leading-tight">
                Dạy lái bằng cả trái tim!<br />
                <span className="text-yellow-400 text-5xl mt-2 block">Tự tin vững lái</span>
              </h2>
              <div className="w-16 h-1 bg-yellow-400 rounded-full" />
              <p className="text-lg text-white/90 leading-relaxed font-medium">
                Đào tạo học lái xe ô tô Uy Tín và Chất Lượng 100% luôn đi đầu trong khu vực và trong cả nước.
              </p>
              <p className="text-white/80">
                Với chi phí hợp lí, bạn đã có thể học lái xe ô tô một cách thuần thục.
              </p>
              <ul className="space-y-3 mt-6 text-white/90">
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Thủ tục đơn giản, làm hồ sơ tận nhà
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Dàn xe đời mới, sân tập đạt chuẩn
                </li>
              </ul>
            </div>

            {/* Right Form */}
            <div className="rounded-3xl bg-white/95 p-6 shadow-xl backdrop-blur-sm sm:p-8">
              <div className="mb-6 border-b border-slate-100 pb-6 text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Kỷ niệm 10 năm thành lập</p>
                <h3 className="mt-2 text-2xl font-black uppercase text-slate-900 leading-tight">
                  <span className="text-indigo-600">Khuyến mãi toàn quốc</span><br />
                  <span className="text-red-500 text-lg">Giảm ngay 20% học phí</span>
                </h3>
                <p className="mt-3 text-sm text-slate-600 flex justify-center items-center gap-1">
                  <span className="text-orange-500">🔥</span> Chỉ còn 5 suất ưu đãi cuối cùng
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    name="name"
                    className="w-full rounded-xl border-none bg-slate-100 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    placeholder="👤 Nhập tên của bạn *"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <input
                      name="phone"
                      className="w-full rounded-xl border-none bg-slate-100 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-shadow"
                      placeholder="📞 Số điện thoại *"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <select
                      name="course"
                      className="w-full rounded-xl border-none bg-slate-100 px-4 py-3 text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 transition-shadow"
                      value={formData.course}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>🚗 Chọn loại bằng muốn học *</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <input
                    name="timeToCall"
                    type="datetime-local"
                    placeholder="Thời gian gọi lại *"
                    className="w-full rounded-xl border-none bg-slate-100 px-4 py-3 text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    value={formData.timeToCall}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <textarea
                    name="note"
                    rows="2"
                    placeholder="📝 Ghi chú thêm (Ví dụ: Thời gian rảnh, yêu cầu riêng...)"
                    className="w-full rounded-xl border-none bg-slate-100 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none"
                    value={formData.note}
                    onChange={handleInputChange}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-yellow-400 py-4 text-sm font-bold uppercase text-slate-900 shadow-lg shadow-yellow-400/30 transition hover:bg-yellow-500 hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi...' : 'GỬI THÔNG TIN'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Landing;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalLayout from '../components/layout/PortalLayout';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';

import { useToast } from '../context/ToastContext';

const CourseUSER = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
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
            const response = await apiClient.get('/courses');
            if (response.status === 'success') {
                const mappedCourses = (response.data || []).map((course) => ({
                    ...course,
                    id: course._id,
                    code: course.code,
                    feePayments: course.feePayments || [],
                    displayLocation: Array.isArray(course.location)
                        ? course.location.join(', ')
                        : course.location,
                }));
                setCourses(mappedCourses);
                if (mappedCourses.length > 0) {
                    setFormData(prev => ({ ...prev, course: mappedCourses[0].id }));
                }
            }
        } catch (err) {
            console.error('Error loading courses:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const scrollToConsultForm = () => {
        const element = document.getElementById('consult-form');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    return (
        <PortalLayout>
            <div className="pb-16 pt-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100 shadow-sm mb-3">
                        Công khai học phí · Lịch khai giảng rõ ràng
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                        Khóa học tại <span className="text-indigo-600">Trung tâm</span>
                    </h1>
                    <p className="mt-2 text-slate-500 text-base">
                        Minh bạch học phí, lịch học, tiến độ hồ sơ — một nguồn thông tin duy nhất.
                    </p>
                </div>

                {/* Course List */}
                <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
                    <SectionHeader
                        title="Danh sách khóa học & học phí"
                        description="Công khai học phí, lịch khai giảng, phụ phí"
                    />

                    {loading && (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8 text-red-600">
                            <p>Lỗi tải dữ liệu: {error}</p>
                            <button
                                onClick={loadCourses}
                                className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!loading && !error && courses.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <p>Chưa có khóa học nào</p>
                        </div>
                    )}

                    {!loading && !error && courses.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
                            {courses.map((course) => (
                                <div
                                    key={course.id}
                                    className="relative rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <StatusBadge status="done" label="Mở đăng ký" />
                                        <p className="text-xs font-semibold text-indigo-600">{course.code}</p>
                                    </div>

                                    {/* Course Image */}
                                    <div className="mt-3 overflow-hidden rounded-xl bg-slate-100">
                                        <img
                                            src={course.image}
                                            alt={course.name}
                                            className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                                        />
                                    </div>

                                    <p className="mt-3 text-lg font-semibold text-slate-900">{course.name}</p>

                                    {/* Price */}
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-bold text-slate-900">
                                            {formatCurrency(course.estimatedCost)}
                                        </p>
                                        {course.feePayments && course.feePayments.length > 0 && (
                                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                                {course.feePayments.length} đợt đóng
                                            </span>
                                        )}
                                    </div>

                                    {/* Fee Payments Preview */}
                                    <div className="mt-2 space-y-1 text-sm text-slate-700 h-16 overflow-y-auto pr-1">
                                        {course.feePayments && course.feePayments.length > 0 ? (
                                            course.feePayments.map((p, idx) => (
                                                <p key={idx}>
                                                    • {p.name}: {formatCurrency(p.amount)}{' '}
                                                    <span className="text-slate-500 text-xs">
                                                        {p.note ? `(${p.note})` : ''}
                                                    </span>
                                                </p>
                                            ))
                                        ) : (
                                            <p className="text-slate-500 italic text-xs">Phí nộp 1 lần</p>
                                        )}
                                    </div>

                                    {/* Duration */}
                                    <div className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                                        <p className="font-semibold text-indigo-700">
                                            Thời lượng:{' '}
                                            {course.estimatedDuration
                                                ? `${course.estimatedDuration} tháng`
                                                : 'Chưa cập nhật'}
                                        </p>
                                    </div>

                                    {/* Locations */}
                                    {course.location && course.location.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {course.location.map((loc, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                                                >
                                                    {loc}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => navigate(`/courses/${course.id}`)}
                                            className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                                        >
                                            Xem chi tiết
                                        </button>
                                        <button
                                            onClick={scrollToConsultForm}
                                            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                                        >
                                            Đăng ký tư vấn
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Consult Form */}
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
                                    <span className="text-indigo-600">Khuyến mãi toàn quốc</span><br/>
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
                                        className="w-full rounded-xl border-none bg-slate-100 px-4 py-3 text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                        value={formData.timeToCall}
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

export default CourseUSER;

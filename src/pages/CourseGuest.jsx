import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalLayout from '../components/layout/PortalLayout';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';

const CourseGuest = () => {
    const navigate = useNavigate();
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
                <div id="consult-form" className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <SectionHeader
                        title="Đặt lịch tư vấn nhanh"
                        description="Hẹn giờ gọi điện, tự động gửi SMS nhắc"
                    />
                    <form className="mt-4 space-y-4 max-w-lg">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Họ tên *</label>
                            <input
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                placeholder="Nhập họ tên"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Số điện thoại *</label>
                                <input
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                    placeholder="0912 xxx xxx"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Chọn khóa</label>
                                <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none">
                                    <option value="">-- Chọn khóa học --</option>
                                    {courses.map((c) => (
                                        <option key={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Thời gian gọi</label>
                            <input
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                placeholder="Ví dụ: Sau 18h, ưu tiên thứ 3"
                            />
                        </div>
                        <button
                            type="button"
                            className="w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                            Gửi yêu cầu tư vấn
                        </button>
                        <p className="text-xs text-slate-500">Chúng tôi sẽ gọi trong vòng 30 phút giờ hành chính.</p>
                    </form>
                </div>
            </div>
        </PortalLayout>
    );
};

export default CourseGuest;

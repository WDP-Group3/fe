import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';
import StatusBadge from '../components/ui/StatusBadge';
import PortalLayout from '../components/layout/PortalLayout';

const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCourse();
    }, [id]);

    const loadCourse = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get(`/courses/${id}`);
            if (response.status === "success") {
                setCourse(response.data);
            }
        } catch (err) {
            console.error("Error loading course:", err);
            setError(err.message || "Không thể tải thông tin khóa học");
        } finally {
            setLoading(false);
        }
    };

    const scrollToConsultForm = () => {
        // Navigate back to landing page with hash
        navigate('/#consult-form');
    };

    if (loading) {
        return (
            <PortalLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            </PortalLayout>
        );
    }

    if (error || !course) {
        return (
            <PortalLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error || "Không tìm thấy khóa học"}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white"
                        >
                            Quay lại trang chủ
                        </button>
                    </div>
                </div>
            </PortalLayout>
        );
    }

    return (
        <PortalLayout>
            <div className="mx-auto max-w-4xl pt-2 pb-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"
                >
                    <span>←</span> Quay lại
                </button>

                {/* Course Header */}
                <div className="rounded-3xl border border-slate-100 bg-white/90 p-8 shadow-lg backdrop-blur">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700">
                                {course.code}
                            </span>
                            <StatusBadge status="done" label="Nhận hồ sơ" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold text-slate-900 mb-2">{course.name}</h1>

                    <div className="flex items-baseline gap-3 mb-6">
                        <p className="text-5xl font-bold text-indigo-600">
                            {formatCurrency(course.estimatedCost)}
                        </p>
                        {course.feePayments && course.feePayments.length > 0 && (
                            <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                Chia {course.feePayments.length} đợt
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {course.description && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                            <h3 className="text-sm font-semibold text-slate-700 mb-2">
                                Mô tả khóa học
                            </h3>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                                {course.description}
                            </p>
                        </div>
                    )}


                    {/* Fee Payments Details */}
                    {course.feePayments && course.feePayments.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Các đợt đóng phí</h3>
                            <div className="space-y-3">
                                {course.feePayments.map((payment, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-white rounded-xl border border-indigo-100">
                                        <div>
                                            <p className="font-semibold text-slate-900">{payment.name}</p>
                                            {payment.note && (
                                                <p className="text-sm text-slate-500">{payment.note}</p>
                                            )}
                                        </div>
                                        <p className="text-xl font-bold text-indigo-600">
                                            {formatCurrency(payment.amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Course Info Grid */}
                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                        {/* Duration */}
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm font-semibold text-slate-600 mb-1">Thời lượng</p>
                            <p className="text-lg font-bold text-slate-900">
                                {course.estimatedDuration || 'Chưa cập nhật'}
                            </p>
                        </div>

                        {/* Status */}
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm font-semibold text-slate-600 mb-1">Trạng thái</p>
                            <p className="text-lg font-bold text-green-600">
                                {course.status === 'Active' ? 'Đang mở đăng ký' : course.status}
                            </p>
                        </div>
                    </div>

                    {/* Locations */}
                    {course.location && course.location.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Địa điểm học</h3>
                            <div className="flex flex-wrap gap-2">
                                {course.location.map((loc, i) => (
                                    <span
                                        key={i}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold"
                                    >
                                        📍 {loc}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Note */}
                    {course.note && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <h3 className="text-sm font-semibold text-amber-800 mb-1">Ghi chú</h3>
                            <p className="text-sm text-amber-700">{course.note}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-slate-200">
                        <button
                            onClick={() => navigate(`/login`)}
                            className="flex-1 rounded-full bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition"
                        >
                            Đăng ký học
                        </button>
                        <button
                            onClick={scrollToConsultForm}
                            className="flex-1 rounded-full bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition"
                        >
                            Đăng ký tư vấn ngay
                        </button>
                        <button
                            onClick={() => navigate('/courses')}
                            className="rounded-full border-2 border-slate-200 px-6 py-4 text-base font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-700 transition"
                        >
                            Xem khóa khác
                        </button>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
};

export default CourseDetail;

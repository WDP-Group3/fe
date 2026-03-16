import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import axios from '../services/axios';

const LetterRequest = () => {
    const { user } = useAuthContext();
    const { showToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState(() => {
        if (user?.role === 'INSTRUCTOR') return 'CANCEL_SESSION';
        return 'LATE_PAYMENT';
    });
    const [reason, setReason] = useState('');
    const [expectedPayDate, setExpectedPayDate] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [studentName, setStudentName] = useState('');
    const [courseName, setCourseName] = useState('');
    // LATE_PAYMENT extra fields (student)
    const [paymentBatch, setPaymentBatch] = useState('');
    const [batchCourse, setBatchCourse] = useState('');
    // CANCEL_SESSION fields (instructor)
    const [sessionInfo, setSessionInfo] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // LATE_PAYMENT: Registrations của student (có batch + course + feePlanSnapshot)
    const [myRegistrations, setMyRegistrations] = useState([]);
    const [feePayments, setFeePayments] = useState([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);

    // OFFLINE_PAYMENT: dành cho consultant/admin
    const [offlineStudents, setOfflineStudents] = useState([]);          // danh sách học viên
    const [offlineStudentId, setOfflineStudentId] = useState('');         // học viên đang chọn
    const [offlineStudentRegs, setOfflineStudentRegs] = useState([]);     // registrations của học viên
    const [offlineSelectedRegId, setOfflineSelectedRegId] = useState(''); // registration (khóa/batch) đang chọn
    const [offlineFeePayments, setOfflineFeePayments] = useState([]);     // đợt nộp của registration đó
    const [offlinePaymentBatch, setOfflinePaymentBatch] = useState('');   // đợt nộp đang chọn
    const [loadingOfflineStudents, setLoadingOfflineStudents] = useState(false);
    const [loadingOfflineRegs, setLoadingOfflineRegs] = useState(false);

    // Role helpers - khai báo sớm để dùng trong useEffect
    const isStudent = user?.role === 'STUDENT';
    const isInstructor = user?.role === 'INSTRUCTOR';
    const isConsultantOrAdmin = user?.role === 'CONSULTANT' || user?.role === 'ADMIN';

    useEffect(() => {
        loadRequests();
        if (isStudent) loadMyRegistrations();
        if (isConsultantOrAdmin) loadOfflineStudents();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/requests/my-requests');
            if (response.status === 'success') {
                setRequests(response.data);
            }
        } catch (err) {
            console.error('Error loading requests:', err);
            showToast('Không thể tải danh sách yêu cầu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadMyRegistrations = async () => {
        try {
            setLoadingRegistrations(true);
            // GET /registrations tự filter theo studentId khi user là STUDENT
            const response = await axios.get('/registrations');
            if (response.status === 'success') {
                // Chỉ lấy những registration có batch + course hợp lệ
                const valid = (response.data || []).filter(
                    (r) => r.batchId?.courseId && r.status !== 'CANCELLED'
                );
                setMyRegistrations(valid);
            }
        } catch (err) {
            console.error('Error loading registrations:', err);
        } finally {
            setLoadingRegistrations(false);
        }
    };

    // LATE_PAYMENT: Khi chọn khóa học (registrationId), lấy feePlanSnapshot tương ứng
    const handleCourseChange = (registrationId) => {
        setBatchCourse(registrationId);
        setPaymentBatch('');
        const reg = myRegistrations.find((r) => r._id === registrationId);
        setFeePayments(reg?.feePlanSnapshot || []);
    };

    // OFFLINE_PAYMENT: load danh sách học viên
    const loadOfflineStudents = async () => {
        try {
            setLoadingOfflineStudents(true);
            const response = await axios.get('/users?role=STUDENT&status=ACTIVE');
            if (response.status === 'success') {
                setOfflineStudents(response.data || []);
            }
        } catch (err) {
            console.error('Error loading students:', err);
        } finally {
            setLoadingOfflineStudents(false);
        }
    };

    // OFFLINE_PAYMENT: khi chọn học viên → load registrations của họ
    const handleOfflineStudentChange = async (studentId) => {
        setOfflineStudentId(studentId);
        setOfflineSelectedRegId('');
        setOfflineFeePayments([]);
        setOfflinePaymentBatch('');
        setOfflineStudentRegs([]);
        if (!studentId) return;
        try {
            setLoadingOfflineRegs(true);
            const response = await axios.get(`/registrations?studentId=${studentId}`);
            if (response.status === 'success') {
                const valid = (response.data || []).filter(
                    (r) => r.batchId?.courseId && r.status !== 'CANCELLED'
                );
                setOfflineStudentRegs(valid);
            }
        } catch (err) {
            console.error('Error loading student registrations:', err);
        } finally {
            setLoadingOfflineRegs(false);
        }
    };

    // OFFLINE_PAYMENT: khi chọn khóa học → load đợt nộp từ feePlanSnapshot
    const handleOfflineRegChange = (regId) => {
        setOfflineSelectedRegId(regId);
        setOfflinePaymentBatch('');
        const reg = offlineStudentRegs.find((r) => r._id === regId);
        setOfflineFeePayments(reg?.feePlanSnapshot || []);
    };

    const resetForm = () => {
        setReason('');
        setExpectedPayDate('');
        setPaymentDate('');
        setStudentName('');
        setCourseName('');
        setPaymentBatch('');
        setBatchCourse('');
        setSessionInfo('');
        setFeePayments([]);
        // Reset offline payment fields
        setOfflineStudentId('');
        setOfflineSelectedRegId('');
        setOfflineFeePayments([]);
        setOfflinePaymentBatch('');
        setOfflineStudentRegs([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (type === 'LATE_PAYMENT') {
            if (!reason.trim()) { showToast('Vui lòng nhập lý do', 'error'); return; }
            if (!expectedPayDate) { showToast('Vui lòng chọn ngày dự kiến nộp', 'error'); return; }
            if (!batchCourse) { showToast('Vui lòng chọn khóa học', 'error'); return; }
            if (!paymentBatch) { showToast('Vui lòng chọn đợt nộp', 'error'); return; }
        }

        if (type === 'OFFLINE_PAYMENT') {
            if (!paymentDate) { showToast('Vui lòng chọn ngày nộp tiền', 'error'); return; }
            if (!offlineStudentId) { showToast('Vui lòng chọn học viên', 'error'); return; }
            if (!offlineSelectedRegId) { showToast('Vui lòng chọn khóa học', 'error'); return; }
            if (!offlinePaymentBatch) { showToast('Vui lòng chọn đợt nộp', 'error'); return; }
        }

        if (type === 'CANCEL_SESSION') {
            if (!reason.trim()) { showToast('Vui lòng nhập lý do hủy dạy', 'error'); return; }
            if (!sessionInfo.trim()) { showToast('Vui lòng nhập thông tin ca dạy', 'error'); return; }
        }

        if ((type === 'SUPPORT' || type === 'OTHER') && !reason.trim()) {
            showToast('Vui lòng nhập lý do', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                type,
                reason: type === 'OFFLINE_PAYMENT' ? (reason || 'Duyệt offline') : reason,
                status: user?.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
            };

            if (type === 'LATE_PAYMENT') {
                payload.expectedPayDate = expectedPayDate;
                payload.paymentBatch = paymentBatch;
                // Resolve tên khóa học từ registration đã chọn
                const selectedReg = myRegistrations.find((r) => r._id === batchCourse);
                const course = selectedReg?.batchId?.courseId;
                payload.batchCourse = course
                    ? `[${course.code}] ${course.name}`
                    : batchCourse;
            }
            if (type === 'OFFLINE_PAYMENT') {
                payload.paymentDate = paymentDate;
                // Resolve tên từ các state đã chọn
                const selectedStudent = offlineStudents.find((s) => s._id === offlineStudentId);
                const selectedReg = offlineStudentRegs.find((r) => r._id === offlineSelectedRegId);
                const selectedCourse = selectedReg?.batchId?.courseId;
                payload.studentName = selectedStudent
                    ? `${selectedStudent.fullName} (${selectedStudent.phone})`
                    : offlineStudentId;
                payload.courseName = selectedCourse
                    ? `[${selectedCourse.code}] ${selectedCourse.name}`
                    : offlineSelectedRegId;
                payload.paymentBatch = offlinePaymentBatch;
            }
            if (type === 'CANCEL_SESSION') {
                payload.sessionInfo = sessionInfo;
            }

            const response = await axios.post('/requests', payload);
            if (response.status === 'success') {
                showToast(user?.role === 'ADMIN' ? 'Yêu cầu đã được tự động duyệt' : 'Gửi yêu cầu thành công', 'success');
                resetForm();
                loadRequests();
            }
        } catch (err) {
            console.error('Error submitting request:', err);
            showToast(err.message || 'Gửi yêu cầu thất bại', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const today = new Date();
    const maxDate = new Date();
    const minDate = today.toISOString().split('T')[0];
    maxDate.setMonth(maxDate.getMonth() + 1);
    const maxDateString = maxDate.toISOString().split('T')[0];



    const columns = [
        {
            key: 'createdAt',
            title: 'Ngày gửi',
            dataIndex: 'createdAt',
            render: (val) => new Date(val).toLocaleDateString('vi-VN')
        },
        {
            key: 'type',
            title: 'Loại đơn',
            dataIndex: 'type',
            render: (val) => {
                const types = {
                    'LATE_PAYMENT': 'Xin nộp muộn',
                    'SUPPORT': 'Hỗ trợ',
                    'OTHER': 'Khác',
                    'OFFLINE_PAYMENT': 'Xác nhận nộp tiền offline',
                    'CANCEL_SESSION': 'Hủy dạy đột xuất',
                };
                return types[val] || val;
            }
        },
        {
            key: 'reason',
            title: 'Lý do',
            dataIndex: 'reason'
        },
        {
            key: 'details',
            title: 'Chi tiết',
            render: (_, record) => {
                if (record.type === 'LATE_PAYMENT') {
                    const parts = [`Hẹn nộp: ${new Date(record.expectedPayDate).toLocaleDateString('vi-VN')}`];
                    if (record.paymentBatch) parts.push(`Đợt: ${record.paymentBatch}`);
                    if (record.batchCourse) parts.push(`Khóa: ${record.batchCourse}`);
                    return parts.join(' | ');
                }
                if (record.type === 'OFFLINE_PAYMENT') return `Nộp: ${new Date(record.paymentDate).toLocaleDateString('vi-VN')} - HV: ${record.studentName} - Khóa: ${record.courseName}`;
                if (record.type === 'CANCEL_SESSION') return record.sessionInfo ? `Ca dạy: ${record.sessionInfo}` : '-';
                return '-';
            }
        },
        {
            key: 'status',
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (val) => {
                let status = 'pending';
                if (val === 'APPROVED') status = 'active';
                if (val === 'REJECTED') status = 'inactive';
                return <StatusBadge status={status} text={val} />;
            }
        },
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur h-full">
                        <SectionHeader
                            title="Gửi đơn yêu cầu"
                            description="Chọn loại đơn và điền thông tin cần thiết"
                        />
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            {/* Loại đơn */}
                            <div>
                                <label className="text-sm font-medium text-slate-700">Loại đơn</label>
                                <select
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                    value={type}
                                    onChange={(e) => { setType(e.target.value); resetForm(); }}
                                    disabled={submitting}
                                >
                                    {/* LATE_PAYMENT chỉ student */}
                                    {(isStudent || isConsultantOrAdmin) && (
                                        <option value="LATE_PAYMENT">Xin nộp muộn</option>
                                    )}
                                    <option value="SUPPORT">Yêu cầu hỗ trợ</option>
                                    <option value="OTHER">Yêu cầu khác</option>
                                    {/* OFFLINE_PAYMENT chỉ consultant/admin */}
                                    {isConsultantOrAdmin && (
                                        <option value="OFFLINE_PAYMENT">Xác nhận nộp tiền offline</option>
                                    )}
                                    {/* CANCEL_SESSION chỉ instructor */}
                                    {isInstructor && (
                                        <option value="CANCEL_SESSION">Hủy dạy đột xuất</option>
                                    )}
                                </select>
                            </div>

                            {/* === LATE_PAYMENT fields (student) === */}
                            {type === 'LATE_PAYMENT' && (<>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Lý do</label>
                                    <textarea
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none min-h-[100px]"
                                        placeholder="Vui lòng trình bày rõ lý do xin nộp muộn..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Khóa học</label>
                                    <select
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                        value={batchCourse}
                                        onChange={(e) => handleCourseChange(e.target.value)}
                                        disabled={submitting || loadingRegistrations}
                                    >
                                        <option value="">
                                            {loadingRegistrations ? 'Đang tải...' : myRegistrations.length === 0 ? 'Không có khóa học đang học' : '-- Chọn khóa học --'}
                                        </option>
                                        {myRegistrations.map((reg) => {
                                            const course = reg.batchId?.courseId;
                                            if (!course) return null;
                                            return (
                                                <option key={reg._id} value={reg._id}>
                                                    {course.code ? `[${course.code}] ` : ''}{course.name}
                                                    {reg.batchId?.location ? ` – ${reg.batchId.location}` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Đợt nộp</label>
                                    <select
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                        value={paymentBatch}
                                        onChange={(e) => setPaymentBatch(e.target.value)}
                                        disabled={submitting || !batchCourse}
                                    >
                                        <option value="">
                                            {!batchCourse ? 'Chọn khóa học trước' : feePayments.length === 0 ? 'Không có đợt nộp' : '-- Chọn đợt nộp --'}
                                        </option>
                                        {feePayments.map((fp, idx) => (
                                            <option key={fp._id || idx} value={fp.name || `Đợt ${idx + 1}`}>
                                                {fp.name || `Đợt ${idx + 1}`}{fp.amount ? ` – ${fp.amount.toLocaleString('vi-VN')}đ` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Thời gian sẽ nộp</label>
                                    <input
                                        type="date"
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                        value={expectedPayDate}
                                        onChange={(e) => setExpectedPayDate(e.target.value)}
                                        disabled={submitting}
                                        required
                                        min={minDate}
                                        max={maxDateString}
                                    />
                                </div>
                            </>)}

                            {/* === SUPPORT / OTHER fields === */}
                            {(type === 'SUPPORT' || type === 'OTHER') && (
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Lý do / Nội dung</label>
                                    <textarea
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none min-h-[120px]"
                                        placeholder="Vui lòng trình bày rõ nội dung..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>
                            )}

                            {/* === OFFLINE_PAYMENT fields === */}
                            {type === 'OFFLINE_PAYMENT' && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Ngày nộp tiền</label>
                                        <input
                                            type="date"
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                            disabled={submitting}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Học viên nộp</label>
                                        <select
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                            value={offlineStudentId}
                                            onChange={(e) => handleOfflineStudentChange(e.target.value)}
                                            disabled={submitting || loadingOfflineStudents}
                                        >
                                            <option value="">
                                                {loadingOfflineStudents ? 'Đang tải...' : offlineStudents.length === 0 ? 'Không có học viên' : '-- Chọn học viên --'}
                                            </option>
                                            {offlineStudents.map((s) => (
                                                <option key={s._id} value={s._id}>
                                                    {s.fullName} – {s.phone}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Nộp cho khóa học</label>
                                        <select
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                            value={offlineSelectedRegId}
                                            onChange={(e) => handleOfflineRegChange(e.target.value)}
                                            disabled={submitting || !offlineStudentId || loadingOfflineRegs}
                                        >
                                            <option value="">
                                                {!offlineStudentId ? 'Chọn học viên trước' : loadingOfflineRegs ? 'Đang tải...' : offlineStudentRegs.length === 0 ? 'Học viên chưa đăng ký khóa nào' : '-- Chọn khóa học --'}
                                            </option>
                                            {offlineStudentRegs.map((reg) => {
                                                const course = reg.batchId?.courseId;
                                                if (!course) return null;
                                                return (
                                                    <option key={reg._id} value={reg._id}>
                                                        {course.code ? `[${course.code}] ` : ''}{course.name}
                                                        {reg.batchId?.location ? ` – ${reg.batchId.location}` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Đợt nộp</label>
                                        <select
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                            value={offlinePaymentBatch}
                                            onChange={(e) => setOfflinePaymentBatch(e.target.value)}
                                            disabled={submitting || !offlineSelectedRegId}
                                        >
                                            <option value="">
                                                {!offlineSelectedRegId ? 'Chọn khóa học trước' : offlineFeePayments.length === 0 ? 'Không có đợt nộp' : '-- Chọn đợt nộp --'}
                                            </option>
                                            {offlineFeePayments.map((fp, idx) => (
                                                <option key={fp._id || idx} value={fp.name || `Đợt ${idx + 1}`}>
                                                    {fp.name || `Đợt ${idx + 1}`}{fp.amount ? ` – ${fp.amount.toLocaleString('vi-VN')}đ` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* === CANCEL_SESSION fields (instructor only) === */}
                            {type === 'CANCEL_SESSION' && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Lý do hủy dạy</label>
                                        <textarea
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none min-h-[100px]"
                                            placeholder="Trình bày rõ lý do cần hủy buổi dạy..."
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Ca dạy</label>
                                        <input
                                            type="text"
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                            placeholder="VD: Ca sáng 08/03 – Lớp JS01..."
                                            value={sessionInfo}
                                            onChange={(e) => setSessionInfo(e.target.value)}
                                            disabled={submitting}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
                                <p className="font-semibold mb-1">💡 Lưu ý:</p>
                                {user?.role === 'ADMIN' ? (
                                    <p>Yêu cầu của Admin sẽ được hệ thống tự động duyệt ngay lập tức.</p>
                                ) : (
                                    <p>Yêu cầu của bạn sẽ được Ban quản trị xem xét trong vòng 24-48h làm việc.</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                                disabled={submitting}
                            >
                                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History Section */}
                <div className="lg:col-span-2">
                    <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur h-full">
                        <SectionHeader
                            title="Lịch sử yêu cầu"
                            description="Theo dõi trạng thái các đơn đã gửi"
                        />
                        <div className="mt-6">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="py-12 text-center text-slate-500">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p>Chưa có yêu cầu nào được gửi</p>
                                </div>
                            ) : (
                                <DataTable columns={columns} data={requests} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LetterRequest;

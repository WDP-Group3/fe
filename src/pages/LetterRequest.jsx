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
        if (user?.role === 'learner') return 'LATE_PAYMENT';
        return 'SUPPORT';
    });
    const [reason, setReason] = useState('');
    const [expectedPayDate, setExpectedPayDate] = useState('');
    // LATE_PAYMENT extra fields (learner)
    const [paymentBatch, setPaymentBatch] = useState('');
    const [batchCourse, setBatchCourse] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Max date dựa trên dueDate + 30 ngày của đợt đã chọn
    const [latePayMaxDate, setLatePayMaxDate] = useState('');

    // LATE_PAYMENT: Registrations của learner (có batch + course + feePlanSnapshot)
    const [myRegistrations, setMyRegistrations] = useState([]);
    const [feePayments, setFeePayments] = useState([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);

    // Role helpers - khai báo sớm để dùng trong useEffect
    const isLearner = user?.role === 'learner';
    const isInstructor = user?.role === 'INSTRUCTOR';
    const isConsultantOrAdmin = user?.role === 'CONSULTANT' || user?.role === 'ADMIN';

    useEffect(() => {
        loadRequests();
        if (isLearner) loadMyRegistrations();
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
            // GET /registrations tự filter theo learnerId khi user là learner
            const response = await axios.get('/registrations');
            if (response.status === 'success') {
                // Chỉ lấy những registration có (batch + course) hoặc (course) hợp lệ
                const valid = (response.data || []).filter(
                    (r) => (r.batchId?.courseId || r.courseId) && r.status !== 'CANCELLED'
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
        setLatePayMaxDate('');
        setExpectedPayDate('');
        const reg = myRegistrations.find((r) => r._id === registrationId);
        setFeePayments(reg?.feePlanSnapshot || []);
    };

    // LATE_PAYMENT: Khi chọn đợt nộp → tính maxDate = dueDate + 30 ngày
    const handlePaymentBatchChange = (batchName) => {
        setPaymentBatch(batchName);
        setExpectedPayDate('');
        const fp = feePayments.find((f) => (f.name || '') === batchName);
        if (fp?.dueDate) {
            const due = new Date(fp.dueDate);
            due.setDate(due.getDate() + 30);
            setLatePayMaxDate(due.toISOString().split('T')[0]);
        } else {
            setLatePayMaxDate('');
        }
    };

    // Helper: kiểm tra đợt nộp đã có đơn LATE_PAYMENT PENDING/APPROVED chưa
    const isBatchAlreadyRequested = (regId, batchName) => {
        return requests.some(
            (r) =>
                r.type === 'LATE_PAYMENT' &&
                r.registrationId === regId &&
                r.paymentBatch === batchName &&
                (r.status === 'PENDING' || r.status === 'APPROVED')
        );
    };

    const resetForm = () => {
        setReason('');
        setExpectedPayDate('');
        setPaymentBatch('');
        setBatchCourse('');
        setFeePayments([]);
        setLatePayMaxDate('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (type === 'LATE_PAYMENT') {
            if (!reason.trim()) { showToast('Vui lòng nhập lý do', 'error'); return; }
            if (!expectedPayDate) { showToast('Vui lòng chọn ngày dự kiến nộp', 'error'); return; }
            if (!batchCourse) { showToast('Vui lòng chọn khóa học', 'error'); return; }
            if (!paymentBatch) { showToast('Vui lòng chọn đợt nộp', 'error'); return; }
        }

        if (type === 'SUPPORT' && !reason.trim()) {
            showToast('Vui lòng nhập lý do', 'error');
            return;
        }

        if (type === 'LATE_PAYMENT' && !expectedPayDate) {
            showToast('Vui lòng chọn ngày dự kiến nộp', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                type,
                reason,
                status: user?.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
            };

            if (type === 'LATE_PAYMENT') {
                payload.expectedPayDate = expectedPayDate;
                payload.paymentBatch = paymentBatch;
                payload.registrationId = batchCourse;
                // Resolve tên khóa học từ registration đã chọn
                const selectedReg = myRegistrations.find((r) => r._id === batchCourse);
                const course = selectedReg?.batchId?.courseId || selectedReg?.courseId;
                payload.batchCourse = course
                    ? `[${course.code}] ${course.name}`
                    : batchCourse;
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
                                    {/* LATE_PAYMENT chỉ learner */}
                                    {isLearner && (
                                        <option value="LATE_PAYMENT">Xin nộp muộn</option>
                                    )}
                                    <option value="SUPPORT">Yêu cầu hỗ trợ</option>
                                </select>
                            </div>

                            {/* === LATE_PAYMENT fields (learner) === */}
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
                                            const course = reg.batchId?.courseId || reg.courseId;
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
                                        onChange={(e) => handlePaymentBatchChange(e.target.value)}
                                        disabled={submitting || !batchCourse}
                                    >
                                        <option value="">
                                            {!batchCourse ? 'Chọn khóa học trước' : feePayments.length === 0 ? 'Không có đợt nộp' : '-- Chọn đợt nộp --'}
                                        </option>
                                        {feePayments.map((fp, idx) => {
                                            const batchName = fp.name || `Đợt ${idx + 1}`;
                                            const alreadyRequested = isBatchAlreadyRequested(batchCourse, batchName);
                                            return (
                                                <option key={fp._id || idx} value={batchName} disabled={alreadyRequested}>
                                                    {batchName}{fp.amount ? ` – ${fp.amount.toLocaleString('vi-VN')}đ` : ''}
                                                    {fp.dueDate ? ` (Hạn: ${new Date(fp.dueDate).toLocaleDateString('vi-VN')})` : ''}
                                                    {alreadyRequested ? ' ✓ Đã xin' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {paymentBatch && isBatchAlreadyRequested(batchCourse, paymentBatch) && (
                                        <p className="mt-1 text-xs text-red-500">Bạn đã có đơn xin nộp muộn cho đợt này rồi.</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Thời gian sẽ nộp</label>
                                    <input
                                        type="date"
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                        value={expectedPayDate}
                                        onChange={(e) => setExpectedPayDate(e.target.value)}
                                        disabled={submitting || !paymentBatch}
                                        required
                                        min={minDate}
                                        max={latePayMaxDate || maxDateString}
                                    />
                                    {latePayMaxDate && (
                                        <p className="mt-1 text-xs text-slate-500">⏱ Hạn tối đa: {new Date(latePayMaxDate).toLocaleDateString('vi-VN')} (30 ngày từ hạn nộp)</p>
                                    )}
                                </div>
                            </>)}

                            {/* === SUPPORT fields === */}
                            {type === 'SUPPORT' && (
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

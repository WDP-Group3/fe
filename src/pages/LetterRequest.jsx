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
    const [type, setType] = useState('LATE_PAYMENT');
    const [reason, setReason] = useState('');
    const [expectedPayDate, setExpectedPayDate] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [learnerName, setlearnerName] = useState('');
    const [courseName, setCourseName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/requests/my-requests');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            showToast('Vui lòng nhập lý do', 'error');
            return;
        }

        if (type === 'LATE_PAYMENT' && !expectedPayDate) {
            showToast('Vui lòng chọn ngày dự kiến nộp', 'error');
            return;
        }

        if (type === 'OFFLINE_PAYMENT') {
            if (!paymentDate || !learnerName || !courseName) {
                showToast('Vui lòng điền đầy đủ thông tin nộp tiền', 'error');
                return;
            }
        }

        try {
            setSubmitting(true);
            const response = await axios.post('/requests', {
                type,
                reason: type === 'LATE_PAYMENT' ? reason : (reason || 'Duyệt offline'),
                expectedPayDate: type === 'LATE_PAYMENT' ? expectedPayDate : undefined,
                paymentDate: type === 'OFFLINE_PAYMENT' ? paymentDate : undefined,
                learnerName: type === 'OFFLINE_PAYMENT' ? learnerName : undefined,
                courseName: type === 'OFFLINE_PAYMENT' ? courseName : undefined,
                status: user?.role === 'ADMIN' ? 'APPROVED' : 'PENDING'
            });
            if (response.status === 'success') {
                showToast(user?.role === 'ADMIN' ? 'Yêu cầu đã được tự động duyệt' : 'Gửi yêu cầu thành công', 'success');
                setReason('');
                setExpectedPayDate('');
                setPaymentDate('');
                setlearnerName('');
                setCourseName('');
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
    const minDate = today.toISOString().split("T")[0];
    maxDate.setMonth(maxDate.getMonth() + 1);
    const maxDateString = maxDate.toISOString().split("T")[0];

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
                    'OFFLINE_PAYMENT': 'Xác nhận nộp tiền offline'
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
                if (record.type === 'LATE_PAYMENT') return `Hẹn nộp: ${new Date(record.expectedPayDate).toLocaleDateString('vi-VN')}`;
                if (record.type === 'OFFLINE_PAYMENT') return `Nộp: ${new Date(record.paymentDate).toLocaleDateString('vi-VN')} - HV: ${record.learnerName} - Khóa: ${record.courseName}`;
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
                            title="Xin nộp muộn"
                            description="Học viên có thể xin gia hạn nộp học phí tối đa 1 tháng"
                        />
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Loại đơn</label>
                                <select
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    disabled={submitting}
                                >
                                    <option value="LATE_PAYMENT">Xin nộp muộn</option>
                                    <option value="SUPPORT">Yêu cầu hỗ trợ</option>
                                    <option value="OTHER">Yêu cầu khác</option>
                                    {(user?.role === 'CONSULTANT' || user?.role === 'ADMIN') && (
                                        <option value="OFFLINE_PAYMENT">Xác nhận nộp tiền offline</option>
                                    )}
                                </select>
                            </div>

                            {type === 'LATE_PAYMENT' && (<>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Lý do</label>
                                    <textarea
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none min-h-[120px]"
                                        placeholder="Vui lòng trình bày rõ nội dung..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        disabled={submitting}
                                    />
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
                                </div></>
                            )}

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
                                        <input
                                            type="text"
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                            placeholder="Tên học viên..."
                                            value={learnerName}
                                            onChange={(e) => setlearnerName(e.target.value)}
                                            disabled={submitting}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Nộp cho khóa học</label>
                                        <input
                                            type="text"
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                                            placeholder="Tên khóa học..."
                                            value={courseName}
                                            onChange={(e) => setCourseName(e.target.value)}
                                            disabled={submitting}
                                            required
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
                            description="Theo dõi trạng thái các đơn xin gia hạn đã gửi"
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

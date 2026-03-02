import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import DataTable from '../../components/ui/DataTable';
import apiClient from '../../services/apiClient';

const LetterRequestManagement = () => {
    const { showToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // ID of request being updated

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/requests');
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

    const handleUpdateStatus = async (id, status) => {
        try {
            setActionLoading(id);
            const response = await apiClient.put(`/requests/${id}/status`, { status });
            if (response.status === 'success') {
                showToast(`Đã ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} yêu cầu`, 'success');
                loadRequests();
            }
        } catch (err) {
            console.error('Error updating status:', err);
            showToast(err.message || 'Cập nhật thất bại', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const columns = [
        {
            key: 'user',
            title: 'Học viên',
            dataIndex: 'user',
            render: (user) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{user?.fullName}</span>
                    <span className="text-xs text-slate-500">{user?.email}</span>
                </div>
            )
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
            title: 'Nội dung/Lý do',
            dataIndex: 'reason'
        },
        {
            key: 'details',
            title: 'Chi tiết/Hẹn nộp',
            render: (_, record) => {
                if (record.type === 'LATE_PAYMENT') return record.expectedPayDate ? new Date(record.expectedPayDate).toLocaleDateString('vi-VN') : '-';
                if (record.type === 'OFFLINE_PAYMENT') return `Nộp: ${new Date(record.paymentDate).toLocaleDateString('vi-VN')} | HV: ${record.studentName} | Khóa: ${record.courseName}`;
                return '-';
            }
        },
        {
            key: 'createdAt',
            title: 'Ngày gửi',
            dataIndex: 'createdAt',
            render: (val) => new Date(val).toLocaleDateString('vi-VN')
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
        {
            key: 'actions',
            title: 'Thao tác',
            render: (_, record) => (
                record.status === 'PENDING' ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleUpdateStatus(record._id, 'APPROVED')}
                            disabled={actionLoading === record._id}
                            className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                            Duyệt
                        </button>
                        <button
                            onClick={() => handleUpdateStatus(record._id, 'REJECTED')}
                            disabled={actionLoading === record._id}
                            className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                            Từ chối
                        </button>
                    </div>
                ) : (
                    <span className="text-xs text-slate-400 italic">Đã xử lý</span>
                )
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
                <SectionHeader
                    title="Quản lý đơn từ học viên"
                    description="Xem xét và phê duyệt các yêu cầu, đơn từ của học viên"
                />
                <div className="mt-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <p>Chưa có yêu cầu nào cần xử lý</p>
                        </div>
                    ) : (
                        <DataTable columns={columns} data={requests} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LetterRequestManagement;

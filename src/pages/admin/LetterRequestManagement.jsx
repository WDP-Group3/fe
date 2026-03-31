import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import DataTable from '../../components/ui/DataTable';
import apiClient from '../../services/apiClient';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { useSocket } from '../../context/SocketContext';

const LetterRequestManagement = () => {
    const { showToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [instructorRequests, setInstructorRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // ID of request being updated
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        id: null,
        status: null,
        title: '',
        message: '',
        variant: 'success'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [currentInstructorPage, setCurrentInstructorPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [instructorPagination, setInstructorPagination] = useState({ total: 0, totalPages: 0 });
    const [activeTab, setActiveTab] = useState('learner'); // 'learner' or 'instructor'
    const socket = useSocket();
    const [reloadTrigger, setReloadTrigger] = useState(0);

    // Lắng nghe socket để realtime cập nhật danh sách đơn (Sạch sẽ, không dính cache closure)
    useEffect(() => {
        if (!socket) return;

        const handleScheduleUpdate = (payload) => {
            if (payload.status === 'NEW_REQUEST' || payload.status === 'SCHEDULE_CANCELLED' || payload.status === 'SCHEDULE_RESTORED') {
                setReloadTrigger(prev => prev + 1);
            }
        };

        socket.on('schedule-updated', handleScheduleUpdate);
        return () => {
            socket.off('schedule-updated', handleScheduleUpdate);
        };
    }, [socket]);

    useEffect(() => {
        if (activeTab === 'learner') {
            loadRequests();
        } else {
            loadInstructorRequests();
        }
    }, [currentPage, currentInstructorPage, activeTab, reloadTrigger]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/requests?page=${currentPage}&limit=10&type=LATE_PAYMENT`);
            if (response.status === 'success') {
                setRequests(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (err) {
            console.error('Error loading requests:', err);
            showToast('Không thể tải danh sách yêu cầu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadInstructorRequests = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/requests?page=${currentInstructorPage}&limit=10&type=INSTRUCTOR_BUSY`);
            if (response.status === 'success') {
                setInstructorRequests(response.data);
                if (response.pagination) {
                    setInstructorPagination(response.pagination);
                }
            }
        } catch (err) {
            console.error('Error loading instructor requests:', err);
            showToast('Không thể tải danh sách yêu cầu từ giáo viên', 'error');
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
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                if (activeTab === 'learner') {
                    loadRequests();
                } else {
                    loadInstructorRequests();
                }
            }
        } catch (err) {
            console.error('Error updating status:', err);
            showToast(err.message || 'Cập nhật thất bại', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const openConfirm = (id, status) => {
        const isApprove = status === 'APPROVED';
        setConfirmConfig({
            isOpen: true,
            id,
            status,
            title: isApprove ? 'Xác nhận duyệt' : 'Xác nhận từ chối',
            message: `Bạn có chắc chắn muốn ${isApprove ? 'phê duyệt' : 'từ chối'} yêu cầu này không?`,
            variant: isApprove ? 'success' : 'danger'
        });
    };

    const columns = [
        {
            key: 'user',
            title: 'Người gửi',
            dataIndex: 'user',
            render: (user) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{user?.fullName}</span>
                    <span className="text-xs text-slate-500">{user?.email}</span>
                    <span className="text-xs text-slate-400">{user?.phone || ''}</span>
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
                    'OFFLINE_PAYMENT': 'Xác nhận nộp tiền offline',
                    'INSTRUCTOR_BUSY': 'Báo bận khẩn cấp'
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
            title: 'Chi tiết',
            render: (_, record) => {
                if (record.type === 'LATE_PAYMENT') return record.expectedPayDate ? new Date(record.expectedPayDate).toLocaleDateString('vi-VN') : '-';
                if (record.type === 'OFFLINE_PAYMENT') return `Nộp: ${new Date(record.paymentDate).toLocaleDateString('vi-VN')} | HV: ${record.learnerName} | Khóa: ${record.courseName}`;
                if (record.type === 'INSTRUCTOR_BUSY') {
                    const meta = record.metadata || {};
                    const dateStr = meta.date ? new Date(meta.date).toLocaleDateString('vi-VN') : '-';
                    const slotStr = meta.timeSlot === 'all' ? 'Cả ngày' : `Ca ${meta.timeSlot}`;
                    return (
                        <div className="text-xs">
                            <div><strong>Ngày:</strong> {dateStr}</div>
                            <div><strong>Ca:</strong> {slotStr}</div>
                            {meta.bookingInfo && (
                                <div className="mt-1 text-amber-600">
                                    <div>⚠️ Có {Array.isArray(meta.bookingsInfo) ? meta.bookingsInfo.length : 1} học viên đặt lịch
                                </div>
                                {meta.bookingsInfo?.map((b, i) => (
                                    <div key={i} className="ml-2 text-slate-500">
                                        • Ca {b.timeSlot}: {b.learnerName} - {b.learnerPhone}
                                    </div>
                                ))}
                                {meta.bookingInfo && !meta.bookingsInfo && (
                                    <div className="ml-2 text-slate-500">
                                        • {meta.bookingInfo.learnerName} - {meta.bookingInfo.learnerPhone}
                                    </div>
                                )}
                            </div>
                            )}
                        </div>
                    );
                }
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
                            onClick={() => openConfirm(record._id, 'APPROVED')}
                            disabled={actionLoading === record._id}
                            className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                            Duyệt
                        </button>
                        <button
                            onClick={() => openConfirm(record._id, 'REJECTED')}
                            disabled={actionLoading === record._id}
                            className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                            Từ chối
                        </button>
                    </div>
                ) : (
                    <span className={`text-xs font-medium italic ${record.status === 'APPROVED' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {record.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                    </span>
                )
            )
        },
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
                    <SectionHeader
                        title="Quản lý đơn từ"
                        description="Xem xét và phê duyệt các yêu cầu, đơn từ của học viên và giáo viên"
                    />
                    
                    {/* Tab */}
                    <div className="mt-4 mb-6 border-b border-slate-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('learner')}
                                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'learner'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                Đơn từ học viên
                            </button>
                            <button
                                onClick={() => setActiveTab('instructor')}
                                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'instructor'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                Đơn từ giáo viên
                                {instructorRequests.filter(r => r.status === 'PENDING').length > 0 && (
                                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                                        {instructorRequests.filter(r => r.status === 'PENDING').length}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>

                    <div className="mt-6">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                            </div>
                        ) : (activeTab === 'learner' ? requests : instructorRequests).length === 0 ? (
                            <div className="py-12 text-center text-slate-500">
                                <p>{activeTab === 'learner' ? 'Chưa có yêu cầu nào từ học viên' : 'Chưa có yêu cầu nào từ giáo viên'}</p>
                            </div>
                        ) : (
                            <>
                                <DataTable columns={columns} data={activeTab === 'learner' ? requests : instructorRequests} />
                                {activeTab === 'learner' ? (
                                    pagination.totalPages > 1 && (
                                        <div className="mt-4 px-4 py-3 border-t border-slate-100">
                                            <Pagination 
                                                currentPage={currentPage}
                                                totalPages={pagination.totalPages}
                                                onPageChange={setCurrentPage}
                                            />
                                        </div>
                                    )
                                ) : (
                                    instructorPagination.totalPages > 1 && (
                                        <div className="mt-4 px-4 py-3 border-t border-slate-100">
                                            <Pagination 
                                                currentPage={currentInstructorPage}
                                                totalPages={instructorPagination.totalPages}
                                                onPageChange={setCurrentInstructorPage}
                                            />
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => handleUpdateStatus(confirmConfig.id, confirmConfig.status)}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.variant}
                loading={actionLoading === confirmConfig.id}
            />
        </div>
    );
};

export default LetterRequestManagement;

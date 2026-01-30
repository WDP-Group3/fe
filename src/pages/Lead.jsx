import { useState, useEffect } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import apiClient from '../services/apiClient';
import { Button } from '../components/ui';
import { useAuthContext } from '../context/AuthContext';

const Leads = () => {
    const { user: currentUser } = useAuthContext();
    const [leads, setLeads] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination and Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        limit: 10
    });

    useEffect(() => {
        // Chỉ load danh sách consultants nếu là ADMIN hoặc các role có quyền gán
        if (currentUser?.role === 'ADMIN') {
            loadConsultants();
        }
    }, [currentUser]);

    useEffect(() => {
        loadLeads();
    }, [currentPage, searchTerm]);

    const loadConsultants = async () => {
        try {
            const response = await apiClient.get('/users?role=CONSULTANT');
            setConsultants(response.data || []);
        } catch (err) {
            console.error('Error loading consultants:', err);
        }
    };

    const loadLeads = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get(`/leads?page=${currentPage}&limit=${pagination.limit}&search=${searchTerm}`);

            setLeads(response.data || []);
            setPagination(prev => ({
                ...prev,
                ...response.pagination
            }));
        } catch (err) {
            console.error('Error loading leads data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (leadId, consultantId) => {
        try {
            if (!consultantId) return;

            await apiClient.patch(`/leads/${leadId}/assign`, { consultantId });

            // Update local state
            setLeads(prevLeads => prevLeads.map(lead => {
                if (lead._id === leadId) {
                    const consultant = consultants.find(c => c._id === consultantId);
                    return { ...lead, assignTo: consultant };
                }
                return lead;
            }));

            alert('Đã gán thành công!');
        } catch (err) {
            console.error('Error assigning lead:', err);
            alert('Lỗi: ' + err.message);
        }
    };

    const baseColumns = [
        {
            key: 'name',
            title: 'Họ tên',
            dataIndex: 'name',
            render: (val) => <span className="font-medium text-slate-900">{val}</span>
        },
        {
            key: 'phone',
            title: 'Số điện thoại',
            dataIndex: 'phone'
        },
        {
            key: 'course',
            title: 'Khóa học quan tâm',
            dataIndex: 'course',
            render: (course) => course?.name || 'N/A'
        },
        {
            key: 'createdAt',
            title: 'Ngày đăng ký',
            dataIndex: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            key: 'status',
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (status) => <StatusBadge status={status === 'pending' ? 'undo' : 'done'} label={status} />
        },
    ];

    // Chỉ hiển thị cột "Người phụ trách" cho ADMIN
    const columns = currentUser?.role === 'ADMIN' ? [
        ...baseColumns,
        {
            key: 'assignTo',
            title: 'Người phụ trách',
            dataIndex: 'assignTo',
            render: (user, record) => (
                <div className="flex items-center gap-2">
                    <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                        value={user?._id || ''}
                        onChange={(e) => handleAssign(record._id, e.target.value)}
                    >
                        <option value="">Chưa gán</option>
                        {consultants.map(c => (
                            <option key={c._id} value={c._id}>
                                {c.fullName || c.name}
                            </option>
                        ))}
                    </select>
                </div>
            )
        }
    ] : baseColumns;

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
                <SectionHeader
                    title="Quản lý Ứng viên (Leads)"
                    description={`Tổng số: ${pagination.total} ứng viên`}
                    action={
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => loadLeads()}>
                                Làm mới
                            </Button>
                        </div>
                    }
                />

                {/* Filter Section */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="relative w-full max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc số điện thoại..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                        />
                    </div>

                    <div className="text-xs text-slate-500">
                        Hiển thị {leads.length} trên tổng số {pagination.total} kết quả
                    </div>
                </div>

                {error && (
                    <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-6">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        </div>
                    ) : (
                        <>
                            <DataTable columns={columns} data={leads} />

                            {leads.length === 0 && (
                                <div className="py-12 text-center text-slate-500">
                                    {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có ứng viên nào đăng ký.'}
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {pagination.totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    <div className="flex gap-1">
                                        {[...Array(pagination.totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all ${currentPage === i + 1
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        disabled={currentPage === pagination.totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leads;

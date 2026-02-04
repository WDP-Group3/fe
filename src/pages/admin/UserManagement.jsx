import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import apiClient from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

const UserManagement = () => {
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', role: '', status: '' });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', role: 'STUDENT', password: '' });

    // Confirmation dialog states
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'default'
    });

    useEffect(() => {
        loadUsers();
        loadStats();
    }, [filters]);

    const loadStats = async () => {
        try {
            const res = await apiClient.get('/users/stats');
            if (res.status === 'success') {
                setStats(res.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.role) queryParams.append('role', filters.role);
            if (filters.status) queryParams.append('status', filters.status);

            const response = await apiClient.get(`/users?${queryParams.toString()}`);

            if (response.status === 'success') {
                const mappedUsers = (response.data || []).map((user) => ({
                    id: user._id,
                    name: user.fullName || user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone || '-',
                    status: user.status === 'ACTIVE' ? 'active' : 'inactive',
                }));
                setUsers(mappedUsers);
            }
        } catch (err) {
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/users', formData);
            setShowCreateModal(false);
            setFormData({ fullName: '', email: '', phone: '', role: 'STUDENT', password: '' });
            loadUsers();
            loadStats();
            showToast('Tạo người dùng thành công', 'success');
        } catch (error) {
            showToast(error.message || 'Tạo người dùng thất bại', 'error');
        }
    };

    const handleChangeRole = (user, newRole) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Xác nhận thay đổi quyền',
            message: `Bạn có chắc chắn muốn thay đổi quyền của "${user.name}" từ ${user.role} sang ${newRole}?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    await apiClient.patch(`/users/${user.id}/change-role`, { role: newRole });
                    showToast(`Đã thay đổi quyền của ${user.name} thành ${newRole}`, 'success');
                    loadUsers();
                    loadStats();
                } catch (error) {
                    showToast(error.message || 'Thay đổi quyền thất bại', 'error');
                    throw error; // Rethrow for ConfirmDialog loading state
                }
            }
        });
    };

    const handleLock = (user) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Xác nhận khóa tài khoản',
            message: `Bạn có chắc chắn muốn khóa tài khoản "${user.name}"? Người dùng sẽ không thể đăng nhập sau khi bị khóa.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await apiClient.patch(`/users/${user.id}/deactivate`);
                    showToast(`Đã khóa tài khoản ${user.name}`, 'success');
                    loadUsers();
                    loadStats();
                } catch (error) {
                    showToast(error.message || 'Khóa tài khoản thất bại', 'error');
                    throw error; // Rethrow for ConfirmDialog loading state
                }
            }
        });
    };

    const handleRestore = (user) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Xác nhận khôi phục tài khoản',
            message: `Bạn có chắc chắn muốn khôi phục tài khoản "${user.name}"? Người dùng sẽ có thể đăng nhập trở lại.`,
            type: 'default',
            onConfirm: async () => {
                try {
                    await apiClient.patch(`/users/${user.id}/restore`);
                    showToast(`Đã khôi phục tài khoản ${user.name}`, 'success');
                    loadUsers();
                    loadStats();
                } catch (error) {
                    showToast(error.message || 'Khôi phục tài khoản thất bại', 'error');
                    throw error; // Rethrow for ConfirmDialog loading state
                }
            }
        });
    };

    const columns = [
        { key: 'name', title: 'Tên', dataIndex: 'name' },
        { key: 'email', title: 'Email', dataIndex: 'email' },
        {
            key: 'role',
            title: 'Vai trò',
            render: (_, record) => (
                <select
                    value={record.role}
                    onChange={(e) => handleChangeRole(record, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="GUEST">Khách (Guest)</option>
                    <option value="STUDENT">Học viên</option>
                    <option value="INSTRUCTOR">Giáo viên</option>
                    <option value="CONSULTANT">Tư vấn viên</option>
                    <option value="ADMIN">Admin</option>
                </select>
            )
        },
        {
            key: 'status',
            title: 'Trạng thái',
            render: (_, record) => (
                <StatusBadge
                    status={record.status === 'active' ? 'done' : 'error'}
                    label={record.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                />
            )
        },
        {
            key: 'actions',
            title: 'Hành động',
            render: (_, record) => (
                <div className="flex gap-2">
                    {record.status === 'active' ? (
                        <button
                            onClick={() => handleLock(record)}
                            className="rounded-md bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                        >
                            Khóa
                        </button>
                    ) : (
                        <button
                            onClick={() => handleRestore(record)}
                            className="rounded-md bg-green-50 px-3 py-1 text-sm font-semibold text-green-600 hover:bg-green-100 transition-colors"
                        >
                            Khôi phục
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Quick Links Section */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Link to="/portal/reports" className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:bg-slate-50 transition-colors">
                    <span className="text-2xl">📊</span>
                    <span className="mt-2 font-semibold text-slate-900">Báo cáo</span>
                </Link>
                <Link to="/portal/feedback" className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:bg-slate-50 transition-colors">
                    <span className="text-2xl">⭐</span>
                    <span className="mt-2 font-semibold text-slate-900">Phản hồi</span>
                </Link>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm opacity-50 cursor-not-allowed">
                    <span className="text-2xl">⚙️</span>
                    <span className="mt-2 font-semibold text-slate-900">Cấu hình</span>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
                <SectionHeader
                    title="Quản trị & phân quyền"
                    description="Admin toàn quyền hệ thống, Staff chỉ xem phạm vi được phân"
                    action={
                        <button
                            onClick={() => {
                                setFormData({ fullName: '', email: '', phone: '', role: 'STUDENT', password: '' });
                                setShowCreateModal(true);
                            }}
                            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Tạo user
                        </button>
                    }
                />

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            placeholder="🔍 Tìm kiếm theo tên, email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả vai trò</option>
                            <option value="STUDENT">Học viên</option>
                            <option value="INSTRUCTOR">Giáo viên</option>
                            <option value="CONSULTANT">Tư vấn viên</option>
                            <option value="GUEST">Khách (Guest)</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Đã khóa</option>
                        </select>
                    </div>
                </div>

                {/* User Count */}
                <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">Danh sách User</h3>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-600">
                        {stats.totalUsers}
                    </span>
                </div>

                {/* Create User Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <h3 className="mb-4 text-xl font-bold text-slate-900">Tạo User Mới</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Họ tên</label>
                                    <input
                                        required
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Số điện thoại</label>
                                    <input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Vai trò</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="GUEST">Khách (Guest)</option>
                                        <option value="STUDENT">Học viên</option>
                                        <option value="INSTRUCTOR">Giáo viên</option>
                                        <option value="CONSULTANT">Tư vấn viên</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu (Mặc định 123456)</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                                    >
                                        Huỷ
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        Lưu
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                    onConfirm={confirmDialog.onConfirm}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    type={confirmDialog.type}
                />

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                        <div className="text-4xl mb-3">📭</div>
                        <p>Không tìm thấy user nào</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <DataTable columns={columns} data={users} />
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
                    <SectionHeader title="Quyền chỉnh sửa profile" />
                    <div className="space-y-2 text-sm text-slate-700">
                        <p>• Student: chỉnh profile của chính mình.</p>
                        <p>• Instructor: chỉnh profile của chính mình.</p>
                        <p>• Consultant (Sale): chỉnh profile của mình & học viên được phân công.</p>
                        <p>• Admin: chỉnh tất cả profile, phân quyền, khoá/mở tài khoản.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;

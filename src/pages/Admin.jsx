import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import apiClient from '../services/apiClient';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', role: 'STUDENT', password: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users');
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
      if (editingUser) {
        await apiClient.put(`/users/${editingUser.id}`, formData);
      } else {
        await apiClient.post('/users', formData);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ fullName: '', email: '', phone: '', role: 'STUDENT', password: '' });
      loadUsers();
    } catch (error) {
      alert('Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: '' // Don't show password
    });
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn khoá tài khoản này?')) {
      try {
        await apiClient.patch(`/users/${id}/deactivate`);
        loadUsers();
      } catch (error) {
        alert('Failed to deactivate user');
      }
    }
  };

  const columns = [
    { key: 'name', title: 'Tên', dataIndex: 'name' },
    { key: 'email', title: 'Email', dataIndex: 'email' },
    { key: 'role', title: 'Vai trò', dataIndex: 'role' },
    { key: 'status', title: 'Trạng thái', dataIndex: 'status', render: (val) => <StatusBadge status={val === 'active' ? 'done' : 'error'} label={val} /> },
    {
      key: 'actions',
      title: 'Hành động',
      render: (_, record) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(record)} className="text-indigo-600 hover:underline">Sửa</button>
          <button onClick={() => handleDeactivate(record.id)} className="text-red-600 hover:underline">Khoá</button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Links Section */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link to="/portal/reports" className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:bg-slate-50">
          <span className="text-2xl">📊</span>
          <span className="mt-2 font-semibold text-slate-900">Báo cáo</span>
        </Link>
        <Link to="/portal/feedback" className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:bg-slate-50">
          <span className="text-2xl">⭐</span>
          <span className="mt-2 font-semibold text-slate-900">Phản hồi</span>
        </Link>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm opacity-50">
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
                setEditingUser(null);
                setFormData({ fullName: '', email: '', phone: '', role: 'STUDENT', password: '' });
                setShowModal(true);
              }}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Tạo user
            </button>
          }
        />

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-slate-900">{editingUser ? 'Sửa User' : 'Tạo User Mới'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Họ tên</label>
                  <input
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Số điện thoại</label>
                  <input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="STUDENT">Học viên</option>
                    <option value="INSTRUCTOR">Giáo viên</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SALE">Sale</option>
                  </select>
                </div>
                {!editingUser && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu (Mặc định 123456)</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p>Chưa có user nào</p>
          </div>
        ) : (
          <DataTable columns={columns} data={users} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Quyền chỉnh sửa profile" />
          <div className="space-y-2 text-sm text-slate-700">
            <p>• Student: chỉnh profile của chính mình.</p>
            <p>• Instructor: chỉnh profile của chính mình.</p>
            <p>• Sale/Staff: chỉnh profile của mình & học viên được phân công.</p>
            <p>• Admin: chỉnh tất cả profile, phân quyền, khoá/mở tài khoản.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;


import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import apiClient from '../services/apiClient';

const Notifications = () => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', recipientType: 'batch', group: 'Batch K12' });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/notifications${user?.id ? `?userId=${user.id}` : ''}`);
      if (response.status === 'success') {
        const mappedNotifications = (response.data || []).map((notif) => ({
          id: notif._id,
          title: notif.title,
          message: notif.message,
          audience: 'Học viên',
          channel: 'App',
          time: new Date(notif.createdAt).toLocaleDateString('vi-VN'),
          isRead: notif.isRead,
        }));
        setNotifications(mappedNotifications);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/notifications', formData);
      setShowModal(false);
      loadNotifications();
      // Reset form
      setFormData({ title: '', message: '', recipientType: 'batch', group: 'Batch K12' });
    } catch (error) {
      alert('Failed to send notification');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Thông báo & Automation"
          description="SMS / Email / App notification với trigger rõ ràng"
          action={
            <button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Tạo thông báo
            </button>
          }
        />

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Gửi thông báo thủ công</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tiêu đề</label>
                  <input
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nội dung</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  ></textarea>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Đối tượng</label>
                  <select
                    value={formData.recipientType}
                    onChange={e => setFormData({ ...formData, recipientType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="batch">Nhóm/Batch</option>
                    <option value="individual">Cá nhân</option>
                  </select>
                </div>
                {formData.recipientType === 'batch' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Chọn nhóm</label>
                    <select
                      value={formData.group}
                      onChange={e => setFormData({ ...formData, group: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option>Batch K12</option>
                      <option>Batch K13</option>
                      <option>Giảng viên</option>
                    </select>
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
                    Gửi ngay
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
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p>Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500 text-slate-600 my-1">{item.message}</p>
                  <p className="text-xs text-slate-400">
                    {item.audience} · {item.channel} · Trigger: {item.time}
                  </p>
                </div>
                <StatusBadge status="doing" label="Đã gửi" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader title="Log thao tác" description="Log thao tác nhân viên, log thanh toán, log huỷ hồ sơ" />
        <div className="space-y-2 text-sm text-slate-700">
          <p>• Staff Hoa cập nhật hồ sơ B1-102 lúc 09:12.</p>
          <p>• Instructor Trí huỷ lịch S-102 lúc 20:05 (cảnh báo mất buổi học).</p>
          <p>• Admin ghi nhận thanh toán PM-02 lúc 10:30.</p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;


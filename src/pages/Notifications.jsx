import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import apiClient from '../services/apiClient';

const Notifications = () => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/notifications${user?.id ? `?userId=${user.id}` : ''}`);
      if (response.status === 'success') {
        // Map backend notification format to frontend format
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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Thông báo & Automation"
          description="SMS / Email / App notification với trigger rõ ràng"
          action={<button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Tạo automation</button>}
        />
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
                <p className="text-xs text-slate-500">
                  {item.audience} · {item.channel}
                </p>
                <p className="text-xs text-slate-500">Trigger: {item.time}</p>
              </div>
              <StatusBadge status="doing" label="Đang bật" />
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


import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import SectionHeader from "../components/ui/SectionHeader";
import StatusBadge from "../components/ui/StatusBadge";
import apiClient from "../services/apiClient";
import { TYPE_TITLES_Notification } from "../constants";

const Notifications = () => {
  const { user } = useAuthContext();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    id: null,
    type: "OTHER",
    title: "",
    message: "",
    expirationDays: 30,
  });

  useEffect(() => {
    loadNotifications();
  }, [filterType, user?.id]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const query = filterType
        ? `?type=${filterType}&userId=${user?.id || ""}`
        : `?userId=${user?.id || ""}`;
      const response = await apiClient.get(`/notifications${query}`);
      if (response.status === "success") {
        setNotifications(response.data);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (notif) => {
    setSelectedNotification(notif);
    setShowDetailModal(true);

    if (!notif.isRead) {
      try {
        await apiClient.patch(`/notifications/${notif._id}/read`, {});
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notif._id ? { ...item, isRead: true } : item,
          ),
        );
      } catch (error) {
        console.error("Error marking notification read:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Thông báo hệ thống"
          description="Xem các thông báo mới nhất"
        />

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700">
            Lọc theo loại:
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Tất cả</option>
            {TYPE_TITLES_Notification.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* List */}
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
              <div
                key={item._id}
                onClick={() => openDetail(item)}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-4 transition-colors hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {TYPE_TITLES_Notification.find(
                        (t) => t.value === item.type,
                      )?.label || item.type}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-slate-900">
                    {item.title}
                  </h3>
                  {item.expireAt && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>
                      <span className="text-[11px] font-medium text-amber-600">
                        Hệ thống tự động xoá sau:{" "}
                        <span className="font-bold">
                          {Math.max(
                            0,
                            Math.ceil(
                              (new Date(item.expireAt) - new Date()) /
                                (24 * 60 * 60 * 1000),
                            ),
                          )}{" "}
                          ngày
                        </span>
                      </span>
                    </div>
                  )}
                </div>
                {!item.isRead && (
                  <span className="inline-flex h-3 w-3 rounded-full bg-red-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              {formData.id ? "Sửa thông báo" : "Tạo thông báo mới"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Loại thông báo
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {TYPE_TITLES_Notification.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === "OTHER" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tiêu đề
                  </label>
                  <input
                    required={formData.type === "OTHER"}
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Nhập tiêu đề..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nội dung
                </label>
                <textarea
                  required
                  rows="5"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Thời gian hết hạn (ngày)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.expirationDays}
                  onChange={(e) =>
                    setFormData({ ...formData, expirationDays: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Thông báo sẽ tự động xóa sau số ngày này.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {selectedNotification.title}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                {selectedNotification.createdAt
                  ? new Date(selectedNotification.createdAt).toLocaleString(
                      "vi-VN",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                  : ""}
              </span>
              <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                {
                  TYPE_TITLES_Notification.find(
                    (t) => t.value === selectedNotification.type,
                  )?.label
                }
              </span>
            </div>

            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line">
              {selectedNotification.message}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;

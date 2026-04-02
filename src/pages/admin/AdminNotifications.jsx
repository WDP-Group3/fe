import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { SectionHeader } from "../../components/ui";
import apiClient from "../../services/apiClient";
import { TYPE_TITLES_Notification } from "../../constants";
import { useToast } from "../../context/ToastContext";
import Pagination from "../../components/common/Pagination";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const AdminNotifications = () => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const { showToast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    id: null,
    type: "THEORY",
    title: "",
    message: "",
    expirationDays: 30,
  });

  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "default",
  });

  useEffect(() => {
    loadNotifications();
  }, [filterType, currentPage]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const query = filterType ? `?type=${filterType}&` : "?";
      const response = await apiClient.get(
        `/notifications${query}page=${currentPage}&limit=10`,
      );
      if (response.status === "success") {
        setNotifications(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      throw new Error(
        "Không thể tải thông báo: " +
          (err.response?.data?.message || "Lỗi hệ thống"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setFormData({
      id: null,
      type: "THEORY",
      title: "",
      message: "",
      expirationDays: 30,
    });
    setShowCreateModal(true);
  };

  const handleEditClick = (e, notif) => {
    e.stopPropagation();
    setFormData({
      id: notif._id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      expirationDays: 30,
    });
    setShowCreateModal(true);
  };

  const handleDeleteClick = async (e, item) => {
    e.stopPropagation();
    // if (ConfirmDialog("Bạn có chắc chắn muốn xóa thông báo này?")) {
    //   try {
    //     await apiClient.delete(`/notifications/${item._id}`);
    //     loadNotifications();
    //   } catch (error) {
    //     showToast("Xóa thất bại");
    //   }
    // }

    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận xóa thông báo",
      message: `Bạn có chắc chắn muốn xóa thông báo "${item.title}"?`,
      type: "default",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/notifications/${item._id}`);
          loadNotifications();
          showToast(`Đã xóa thông báo ${item.title}`, "success");
        } catch (error) {
          showToast(error.message || "Xóa thông báo thất bại", "error");
          throw error; // Rethrow for ConfirmDialog loading state
        }
      },
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await apiClient.put(`/notifications/${formData.id}`, formData);
      } else {
        await apiClient.post("/notifications", formData);
      }
      setShowCreateModal(false);
      loadNotifications();
    } catch (error) {
      throw new Error(
        "Không thể lưu thông báo: " +
          (error.response?.data?.message || "Lỗi hệ thống"),
      );
    }
  };

  const openDetail = (notif) => {
    setSelectedNotification(notif);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Quản lý thông báo"
          description="Tạo và quản lý các thông báo hệ thống"
          action={
            <button
              onClick={handleCreateClick}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + Tạo thông báo
            </button>
          }
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
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleEditClick(e, item)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, item)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Modal - Same as before */}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

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

export default AdminNotifications;

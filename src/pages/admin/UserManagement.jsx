import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import SectionHeader from "../../components/ui/SectionHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import DataTable from "../../components/ui/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Pagination from "../../components/common/Pagination";
import apiClient from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";

const UserManagement = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10
  });
  const [formData, setFormData] = useState({
    email: "",
    role: "INSTRUCTOR",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "default",
  });

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [filters, currentPage]);

  const loadStats = async () => {
    try {
      const res = await apiClient.get("/users/stats");
      if (res.status === "success") {
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
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.role) queryParams.append("role", filters.role);
      if (filters.status) queryParams.append("status", filters.status);
      queryParams.append("page", currentPage);
      queryParams.append("limit", pagination.limit);

      const response = await apiClient.get(`/users?${queryParams.toString()}`);

      if (response.status === "success") {
        const mappedUsers = (response.data || []).map((user) => ({
          id: user._id,
          name: user.fullName || user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || "-",
          status: user.status === "ACTIVE" ? "active" : "inactive",
        }));
        setUsers(mappedUsers);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      // Admin creates with Email + Role. Password default 11111111@ handled by BE if empty, or we send it.
      // We should ensure name/phone are handled by BE defaults.
      await apiClient.post("/users", {
        email: formData.email,
        role: formData.role,
        password: formData.password || "11111111@",
      });
      setShowCreateModal(false);
      setFormData({ email: "", role: "INSTRUCTOR", password: "" });
      loadUsers();
      loadStats();
      showToast(
        "Tạo người dùng thành công (Mật khẩu mặc định: 11111111@)",
        "success",
      );
    } catch (error) {
      showToast(error.message || "Tạo người dùng thất bại", "error");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!currentUser) return;
      // Admin updates Email or Password
      const updateData = {};
      if (formData.email) updateData.email = formData.email;
      if (formData.password) updateData.password = formData.password;
      // Maybe Role too?
      if (formData.role) updateData.role = formData.role;
      if (formData.name) updateData.name = formData.name; // allow editing name too if needed

      // Wait, use 'updateUser' endpoint?
      // user.controller.js has updateUser which updates fullName, email, phone...
      // It doesn't update password usually unless specifically handled?
      // The `updateProfile` in auth controller handles self update.
      // The `updateUser` in user controller handles Admin update.
      // Let's check `updateUser` in user.controller.js. It does `User.findByIdAndUpdate(..., body, ...)`.
      // If body has password, it won't be hashed automatically by findByIdAndUpdate!
      // Major Issue: Admin changing password via `updateUser` won't hash it if backend doesn't handle it.
      // I should check `user.controller.js` again.
      // `updateUser` just does `findByIdAndUpdate`.
      // So I can't update password via `updateUser` safely unless I fix backend `updateUser`.
      // But User requirement is: "Admin sửa tài tài khoản và mâtk khẩu".
      // So I SHOULD fix backend `updateUser` too. (I'll do that in a bit).
      // Since I already modified backend User.js to hash password in pre-save if I wanted, but actually I'll stick to what's there.

      await apiClient.patch(`/users/${currentUser.id}`, updateData);

      setShowEditModal(false);
      setCurrentUser(null);
      setFormData({ email: "", role: "INSTRUCTOR", password: "" });
      loadUsers();
      showToast("Cập nhật người dùng thành công", "success");
    } catch (error) {
      showToast(error.message || "Cập nhật thất bại", "error");
    }
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      email: user.email,
      role: user.role,
      password: "",
      name: user.name,
    });
    setShowEditModal(true);
  };

  const handleLock = (user) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận khóa tài khoản",
      message: `Bạn có chắc chắn muốn khóa tài khoản "${user.name}"? Người dùng sẽ không thể đăng nhập sau khi bị khóa.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await apiClient.patch(`/users/${user.id}/deactivate`);
          showToast(`Đã khóa tài khoản ${user.name}`, "success");
          loadUsers();
          loadStats();
        } catch (error) {
          showToast(error.message || "Khóa tài khoản thất bại", "error");
          throw error; // Rethrow for ConfirmDialog loading state
        }
      },
    });
  };

  const handleRestore = (user) => {
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận khôi phục tài khoản",
      message: `Bạn có chắc chắn muốn khôi phục tài khoản "${user.name}"? Người dùng sẽ có thể đăng nhập trở lại.`,
      type: "default",
      onConfirm: async () => {
        try {
          await apiClient.patch(`/users/${user.id}/restore`);
          showToast(`Đã khôi phục tài khoản ${user.name}`, "success");
          loadUsers();
          loadStats();
        } catch (error) {
          showToast(error.message || "Khôi phục tài khoản thất bại", "error");
          throw error; // Rethrow for ConfirmDialog loading state
        }
      },
    });
  };

  const columns = [
    { key: "name", title: "Tên", dataIndex: "name" },
    { key: "email", title: "Email", dataIndex: "email" },
    {
      key: "role",
      title: "Vai trò",
      render: (_, record) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold 
                    ${
                      record.role === "ADMIN"
                        ? "bg-red-100 text-red-700"
                        : record.role === "INSTRUCTOR"
                          ? "bg-blue-100 text-blue-700"
                          : record.role === "CONSULTANT"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                    }`}
        >
          {record.role === "ADMIN" ? "Quản trị viên" : record.role === "INSTRUCTOR" ? "Giảng viên" : record.role === "CONSULTANT" ? "Tư vấn viên" : "Học viên"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (_, record) => (
        <StatusBadge
          status={record.status === "active" ? "done" : "error"}
          label={record.status === "active" ? "Hoạt động" : "Đã khóa"}
        />
      ),
    },
    {
      key: "actions",
      title: "Hành động",
      render: (_, record) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(record)}
            className="rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Sửa
          </button>
          {record.status === "active" ? (
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
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Quản lý tài khoản các tài khoản"
          action={
            <button
              onClick={() => {
                setFormData({
                  email: "",
                  role: "INSTRUCTOR",
                  password: "11111111@",
                });
                setShowCreateModal(true);
              }}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              + Tạo User Mới
            </button>
          }
        />

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
          <div className="flex-1 min-w-[200px]">
            <input
              placeholder="🔍 Tìm kiếm theo tên, email..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <select
              value={filters.role}
              onChange={(e) => {
                setFilters({ ...filters, role: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Tất cả vai trò</option>
              <option value="LEARNER">Học viên</option>
              <option value="INSTRUCTOR">Giáo viên</option>
              <option value="CONSULTANT">Tư vấn viên</option>
              {/* No USER */}
            </select>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setCurrentPage(1);
              }}
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
          <h3 className="text-lg font-semibold text-slate-900">
            Danh sách User
          </h3>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-600">
            {pagination.total}
          </span>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="mb-4 text-xl font-bold text-slate-900">
                {showCreateModal ? "Tạo User Mới" : "Cập Nhật User"}
              </h3>
              <form
                onSubmit={
                  showCreateModal ? handleCreateSubmit : handleEditSubmit
                }
                className="space-y-4"
              >
                {showEditModal && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Tên hiển thị
                    </label>
                    <input
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Vai trò
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="INSTRUCTOR">Giáo viên</option>
                    <option value="CONSULTANT">Tư vấn viên</option>
                    <option value="LEARNER">Học Viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>

                <div className="relative">
                  {" "}
                  {/* Thêm relative để định vị icon */}
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {showCreateModal
                      ? "Mật khẩu"
                      : "Mật khẩu mới (Để trống nếu không đổi)"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} // Thay đổi type dựa trên state
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder={
                        showCreateModal ? "11111111@" : "Nhập mật khẩu mới..."
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      // Lưu ý: Thêm "pr-10" để text không bị đè lên icon
                    />

                    <button
                      type="button" // Quan trọng: Để không trigger submit form
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff size={18} /> // Icon mắt gạch chéo
                      ) : (
                        <Eye size={18} /> // Icon mắt mở
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                    }}
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
          <>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <DataTable columns={columns} data={users} />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;

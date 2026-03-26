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
    limit: 10,
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

  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineUser, setOfflineUser] = useState(null);
  const [offlineRegistrations, setOfflineRegistrations] = useState([]);
  const [loadingOfflineRegs, setLoadingOfflineRegs] = useState(false);
  const [offlineForm, setOfflineForm] = useState({
    registrationId: "",
    feePlanId: "",
  });
  const [submittingOffline, setSubmittingOffline] = useState(false);

  // [MỚI] Hạng học viên
  const [enrolledCoursesData, setEnrolledCoursesData] = useState([]); // list course objects
  const [enrolledCourseCodes, setEnrolledCourseCodes] = useState([]); // codes đã tick
  const [lockedCourseCodes, setLockedCourseCodes] = useState([]); // codes đang in-batch
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);
  const [showEnrolmentModal, setShowEnrolmentModal] = useState(false);
  const [savingEnrolled, setSavingEnrolled] = useState(false);

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
          enrolledCourseCodes: user.enrolledCourseCodes || [],
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
      const updateData = {};
      if (formData.email) updateData.email = formData.email;
      if (formData.password) updateData.password = formData.password;
      if (formData.role) updateData.role = formData.role;
      if (formData.name) updateData.name = formData.name;

      await apiClient.patch(`/users/${currentUser.id}`, updateData);

      // [MỚI] Cập nhật enrolled courses cho learner
      if (currentUser.role === "learner") {
        try {
          await apiClient.patch(`/users/${currentUser.id}/enrolled-courses`, {
            enrolledCourseCodes,
          });
        } catch (enrollErr) {
          showToast(enrollErr.message || "Cập nhật hạng học thất bại", "error");
          return;
        }
      }

      setShowEditModal(false);
      setCurrentUser(null);
      setFormData({ email: "", role: "INSTRUCTOR", password: "" });
      setEnrolledCoursesData([]);
      setEnrolledCourseCodes([]);
      setLockedCourseCodes([]);
      loadUsers();
      loadStats();
      showToast("Cập nhật người dùng thành công", "success");
    } catch (error) {
      showToast(error.message || "Cập nhật thất bại", "error");
    }
  };

  const openOfflinePaymentModal = async (user) => {
    setOfflineUser(user);
    setOfflineForm({ registrationId: "", feePlanId: "" });
    setShowOfflineModal(true);
    setLoadingOfflineRegs(true);
    setOfflineRegistrations([]); // reset
    try {
      const resp = await apiClient.get(`/registrations?learnerId=${user.id}`);
      if (resp.status === "success") {
        setOfflineRegistrations(resp.data || []);
      }
    } catch (e) {
      showToast("Lỗi khi tải danh sách khóa học", "error");
    } finally {
      setLoadingOfflineRegs(false);
    }
  };

  const submitOfflinePayment = async (e) => {
    e.preventDefault();
    if (!offlineForm.registrationId || !offlineForm.feePlanId) {
      return showToast("Vui lòng chọn khóa học và đợt nộp", "error");
    }
    try {
      setSubmittingOffline(true);
      await apiClient.patch(
        `/registrations/${offlineForm.registrationId}/offline-payment`,
        {
          feePlanId: offlineForm.feePlanId,
        },
      );
      showToast("Xác nhận nộp tiền offline thành công", "success");
      setShowOfflineModal(false);
    } catch (err) {
      showToast(err.message || "Xác nhận thất bại", "error");
    } finally {
      setSubmittingOffline(false);
    }
  };

  const openEditModal = async (user) => {
    setCurrentUser(user);
    setFormData({
      email: user.email,
      role: user.role,
      password: "",
      name: user.name,
    });

    // [MỚI] Load enrolled courses cho learner
    if (user.role === "learner") {
      setLoadingEnrolled(true);
      setEnrolledCoursesData([]);
      setEnrolledCourseCodes([]);
      setLockedCourseCodes([]);
      try {
        const resp = await apiClient.get(`/users/${user.id}/enrolled-courses`);
        if (resp.status === "success") {
          const courses = resp.data.courses || [];
          setEnrolledCoursesData(courses);
          // enrolled codes = courses có enrolled = true (đã thanh toán)
          setEnrolledCourseCodes(courses.filter((c) => c.enrolled).map((c) => c.code));
          // codes đang in-batch = đã thanh toán + đã vào lớp
          setLockedCourseCodes(courses.filter((c) => c.inBatch).map((c) => c.code));
        }
      } catch (e) {
        console.error("Lỗi load enrolled courses:", e);
      } finally {
        setLoadingEnrolled(false);
      }
    }

    setShowEditModal(true);
  };

  const openEnrolmentModal = async (user) => {
    setCurrentUser(user);
    setLoadingEnrolled(true);
    setEnrolledCoursesData([]);
    setEnrolledCourseCodes([]);
    setLockedCourseCodes([]);
    setShowEnrolmentModal(true);
    try {
      const resp = await apiClient.get(`/users/${user.id}/enrolled-courses`);
      if (resp.status === "success") {
        const courses = resp.data.courses || [];
        setEnrolledCoursesData(courses);
        setEnrolledCourseCodes(courses.filter((c) => c.enrolled).map((c) => c.code));
        setLockedCourseCodes(courses.filter((c) => c.inBatch).map((c) => c.code));
      }
    } catch (e) {
      console.error("Lỗi load enrolled courses:", e);
      showToast("Lỗi khi tải danh sách hạng học", "error");
    } finally {
      setLoadingEnrolled(false);
    }
  };

  const handleEnrolmentSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setSavingEnrolled(true);
      await apiClient.patch(`/users/${currentUser.id}/enrolled-courses`, {
        enrolledCourseCodes,
      });
      setShowEnrolmentModal(false);
      loadUsers();
      showToast("Cập nhật hạng học thành công", "success");
    } catch (err) {
      showToast(err.message || "Cập nhật hạng học thất bại", "error");
    } finally {
      setSavingEnrolled(false);
    }
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
          {record.role === "ADMIN"
            ? "Quản trị viên"
            : record.role === "INSTRUCTOR"
              ? "Giảng viên"
              : record.role === "CONSULTANT"
                ? "Tư vấn viên"
                : "Học viên"}
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
      key: "enrolledCourses",
      title: "Hạng học",
      render: (_, record) => {
        if (record.role !== "learner") return "-";
        return (
          <div className="flex flex-wrap gap-1">
            {(record.enrolledCourseCodes || []).map((code) => (
              <span key={code} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs font-medium border border-indigo-100">
                {code}
              </span>
            ))}
            {(record.enrolledCourseCodes || []).length === 0 && <span className="text-slate-400 text-xs italic">Chưa chọn</span>}
          </div>
        );
      }
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
          {record.role === "learner" && record.status === "active" && (
            <button
              onClick={() => openEnrolmentModal(record)}
              className="rounded-md bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              Hạng học
            </button>
          )}
          {record.role === "learner" && record.status === "active" && (
            <button
              onClick={() => openOfflinePaymentModal(record)}
              className="rounded-md bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-600 hover:bg-amber-100 transition-colors"
            >
              Nộp offline
            </button>
          )}
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
              <option value="learner">Học viên</option>
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
                onReset={() => {
                  setEnrolledCoursesData([]);
                  setEnrolledCourseCodes([]);
                  setLockedCourseCodes([]);
                }}
              >
                {showEditModal && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Tên hiển thị
                    </label>
                    <input
                      disabled={showEditModal}
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200  disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    disabled={showEditModal} // Email thường không cho đổi sau khi tạo
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-400"
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
                    <option value="learner">Học Viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>


                {!showEditModal && (
                  <div className="relative">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      {showCreateModal
                        ? "Mật khẩu"
                        : "Mật khẩu mới (Để trống nếu không đổi)"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder={
                          showCreateModal ? "11111111@" : "Nhập mật khẩu mới..."
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setEnrolledCoursesData([]);
                      setEnrolledCourseCodes([]);
                      setLockedCourseCodes([]);
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

        {/* Enrolment Management Modal */}
        {showEnrolmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  Quản lý Hạng học
                </h3>
                <span className="text-sm font-medium text-slate-500">
                  {currentUser?.name}
                </span>
              </div>

              {loadingEnrolled ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                  <p className="text-slate-500 font-medium">Đang tải danh sách hạng học...</p>
                </div>
              ) : (
                <form onSubmit={handleEnrolmentSubmit} className="space-y-6">
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
                    {/* Nhóm Xe Máy (A*) */}
                    {(() => {
                      const xeMayCourses = enrolledCoursesData.filter(
                        (c) => /^A[12]$/.test(c.code)
                      );
                      if (xeMayCourses.length === 0) return null;
                      
                      // Kiểm tra xem có bất kỳ course nào trong nhóm này bị locked không
                      const anyLocked = xeMayCourses.some(c => lockedCourseCodes.includes(c.code));
                      const selected = xeMayCourses.filter(
                        (c) => enrolledCourseCodes.includes(c.code)
                      );

                      return (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                              Hạng Xe Máy (A1, A2)
                            </span>
                            <span className="h-px flex-1 bg-slate-200"></span>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {xeMayCourses.map((course) => {
                              const isCourseLocked = lockedCourseCodes.includes(course.code);
                              // Disable nếu hạng này bị locked HOẶC hạng khác trong nhóm bị locked
                              const isDisabled = anyLocked; 
                              const isSelected = enrolledCourseCodes.includes(course.code);
                              const isPaid = course.paid;
                              
                              return (
                                <label
                                  key={course.code}
                                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                                    isDisabled
                                      ? "cursor-not-allowed border-slate-200 bg-slate-100/50 grayscale-[0.5]"
                                      : isSelected
                                        ? "border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-400"
                                        : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                                  }`}
                                >
                                  <div className="relative flex h-5 w-5 items-center justify-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isDisabled}
                                      onChange={() => {
                                        if (isDisabled) return;
                                        setEnrolledCourseCodes((prev) => {
                                          const others = prev.filter(
                                            (code) => !xeMayCourses.some((c) => c.code === code)
                                          );
                                          // Toggle logic: chọn cái này thì bỏ tất cả cái khác cùng loại
                                          return isSelected ? others : [...others, course.code];
                                        });
                                      }}
                                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${isDisabled ? "text-slate-500" : "text-slate-900"}`}>
                                      Hạng {course.code}
                                    </span>
                                    <span className="text-xs text-slate-500 line-clamp-1">
                                      {course.name}
                                    </span>
                                  </div>
                                  {isCourseLocked && (
                                    <div className="ml-auto flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
                                      In Class
                                    </div>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                          {anyLocked && (
                            <p className="mt-2 text-[11px] text-amber-600 flex items-center gap-1 font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              Không thể đổi hạng Xe máy vì học viên đã vào lớp
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Nhóm Ô Tô (B1, B2) */}
                    {(() => {
                      // Ở đây tôi giả định Ô tô là B1/B2 theo yêu cầu, các hạng khác có thể thêm sau
                      const oToCourses = enrolledCoursesData.filter(
                        (c) => /^[BCD]/.test(c.code) // Lấy các hạng B, C, D... cho vào nhóm ô tô
                      );
                      if (oToCourses.length === 0) return null;

                      const anyLocked = oToCourses.some(c => lockedCourseCodes.includes(c.code));
                      const selected = oToCourses.filter((c) =>
                        enrolledCourseCodes.includes(c.code)
                      );

                      return (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                              Hạng Ô Tô (B1, B2, C, ...)
                            </span>
                            <span className="h-px flex-1 bg-slate-200"></span>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {oToCourses.map((course) => {
                              const isCourseLocked = lockedCourseCodes.includes(course.code);
                              const isDisabled = anyLocked;
                              const isSelected = enrolledCourseCodes.includes(course.code);
                              
                              return (
                                <label
                                  key={course.code}
                                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                                    isDisabled
                                      ? "cursor-not-allowed border-slate-200 bg-slate-100/50 grayscale-[0.5]"
                                      : isSelected
                                        ? "border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-400"
                                        : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                                  }`}
                                >
                                  <div className="relative flex h-5 w-5 items-center justify-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isDisabled}
                                      onChange={() => {
                                        if (isDisabled) return;
                                        setEnrolledCourseCodes((prev) => {
                                          const others = prev.filter(
                                            (code) => !oToCourses.some((c) => c.code === code)
                                          );
                                          return isSelected ? others : [...others, course.code];
                                        });
                                      }}
                                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${isDisabled ? "text-slate-500" : "text-slate-900"}`}>
                                      Hạng {course.code}
                                    </span>
                                    <span className="text-xs text-slate-500 line-clamp-1">
                                      {course.name}
                                    </span>
                                  </div>
                                  {isCourseLocked && (
                                    <div className="ml-auto flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
                                      In Class
                                    </div>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                          {anyLocked && (
                            <p className="mt-2 text-[11px] text-amber-600 flex items-center gap-1 font-medium">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              Không thể đổi hạng Ô tô vì học viên đã vào lớp
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={savingEnrolled}
                      onClick={() => {
                        setShowEnrolmentModal(false);
                      }}
                      className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={savingEnrolled}
                      className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {savingEnrolled ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Đang lưu...
                        </>
                      ) : (
                        "Lưu thay đổi"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {showOfflineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="mb-4 text-xl font-bold text-slate-900">
                Nộp Tiền Offline
              </h3>
              <div className="mb-4 text-sm text-slate-600">
                Học viên:{" "}
                <span className="font-semibold text-slate-900">
                  {offlineUser?.name}
                </span>
              </div>
              <form onSubmit={submitOfflinePayment} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Khóa học
                  </label>
                  <select
                    required
                    value={offlineForm.registrationId}
                    onChange={(e) =>
                      setOfflineForm({
                        registrationId: e.target.value,
                        feePlanId: "",
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={submittingOffline || loadingOfflineRegs}
                  >
                    <option value="">
                      {loadingOfflineRegs
                        ? "Đang tải..."
                        : offlineRegistrations.length === 0
                          ? "Không có khóa học nào"
                          : "-- Chọn khóa học --"}
                    </option>
                    {offlineRegistrations.map((reg) => {
                      const course = reg.batchId?.courseId || reg.courseId;
                      if (!course) return null;
                      return (
                        <option key={reg._id} value={reg._id}>
                          {course.code ? `[${course.code}] ` : ""}
                          {course.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Đợt nộp
                  </label>
                  <select
                    required
                    value={offlineForm.feePlanId}
                    onChange={(e) =>
                      setOfflineForm({
                        ...offlineForm,
                        feePlanId: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={submittingOffline || !offlineForm.registrationId}
                  >
                    <option value="">
                      {!offlineForm.registrationId
                        ? "Chọn khóa học trước"
                        : "-- Chọn đợt nộp --"}
                    </option>
                    {offlineRegistrations
                      .find((r) => r._id === offlineForm.registrationId)
                      ?.feePlanSnapshot?.filter((f) => !f.paymented)
                      .map((fp, idx) => (
                        <option key={fp._id || idx} value={fp._id || fp.name}>
                          {fp.name} -{" "}
                          {fp.amount
                            ? `${fp.amount.toLocaleString("vi-VN")}đ`
                            : "0đ"}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOfflineModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:bg-indigo-400"
                    disabled={submittingOffline}
                  >
                    {submittingOffline ? "Đang xử lý..." : "Xác nhận nộp"}
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

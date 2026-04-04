import { useState, useEffect, useMemo, useCallback } from "react";
import SectionHeader from "../../components/ui/SectionHeader";
import useDebounce from "../../hooks/useDebounce";
import { useToast } from "../../context/ToastContext";
import apiClient from "../../services/apiClient";
import { formatCurrency } from "../../utils/formatters";
import Pagination from "../../components/common/Pagination";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const fmt = (n) => formatCurrency(n || 0);

const KpiCard = ({ label, value, sub, color = "text-slate-900" }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const AdminSalary = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState([]);
  const [config, setConfig] = useState(null);
  const [courses, setCourses] = useState([]);
  const [activeCourses, setActiveCourses] = useState([]);
  const [noConfig, setNoConfig] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];
  const [stats, setStats] = useState({
    totalSalary: 0,
    totalHours: 0,
    totalCommission: 0,
    totalDocuments: 0,
    instructorCount: 0,
    consultantCount: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  // Filters
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    role: "", // '', 'INSTRUCTOR', 'CONSULTANT'
    search: "",
  });

  // Debounced search value — prevents API call on every keystroke
  const debouncedSearch = useDebounce(filters.search, 300);

  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddCommissionModal, setShowAddCommissionModal] = useState(false);
  const [addCommissionForm, setAddCommissionForm] = useState({
    courseId: "",
    commissionAmount: "",
    effectiveFrom: todayStr,
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Penalty state
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [selectedPenaltyUser, setSelectedPenaltyUser] = useState(null);
  const [userPenalties, setUserPenalties] = useState([]);
  const [penaltyForm, setPenaltyForm] = useState({ amount: '', reason: '' });
  const [loadingPenalties, setLoadingPenalties] = useState(false);
  const [showAddPenalty, setShowAddPenalty] = useState(false);
  const [penaltyFilters, setPenaltyFilters] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [penaltyToDelete, setPenaltyToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [overrideForm, setOverrideForm] = useState({
    salaryHourlyRate: "",
    commissionOverrides: [],
  });


  // Config form
  const [configForm, setConfigForm] = useState({
    instructorHourlyRate: 80000,
    courseCommissions: [],
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "",
    note: "",
  });


  const handleOpenPenalty = (row) => {
    setSelectedPenaltyUser(row);
    setShowPenaltyModal(true);
    setShowAddPenalty(false);
    setPenaltyForm({ amount: '', reason: '' });
    setPenaltyFilters({ month: filters.month, year: filters.year });
    fetchPenalties(row.userId || row._id, filters.month, filters.year);
  };

  const fetchPenalties = async (userId, month, year) => {
    try {
      setLoadingPenalties(true);
      const res = await apiClient.get(`/salary/users/${userId}/penalties?month=${month}&year=${year}`);

      if (res?.status === "success") {
        setUserPenalties(res.data);
      }
    } catch (e) {
      showToast("Lỗi khi tải danh sách nộp phạt", "error");
    } finally {
      setLoadingPenalties(false);
    }
  };
  useEffect(() => {
    // optional effect check
  }, [userPenalties])
  const handleCreatePenalty = async () => {
    if (!penaltyForm.amount || !penaltyForm.reason) {
      return showToast("Vui lòng nhập đủ số tiền và lý do", "error");
    }
    try {
      const payload = {
        amount: Number(penaltyForm.amount),
        reason: penaltyForm.reason,
        date: new Date(penaltyFilters.year, penaltyFilters.month - 1, 15).toISOString()
      };
      await apiClient.post(`/salary/users/${selectedPenaltyUser.userId || selectedPenaltyUser._id}/penalties`, payload);
      showToast("Thêm nộp phạt thành công", "success");
      fetchPenalties(selectedPenaltyUser.userId || selectedPenaltyUser._id, penaltyFilters.month, penaltyFilters.year);
      setShowAddPenalty(false);
      setPenaltyForm({ amount: '', reason: '' });
      loadData(); // Reload table data
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi khi thêm nộp phạt", "error");
    }
  };

  const handleDeletePenalty = (penaltyId) => {
    setPenaltyToDelete(penaltyId);
  };

  const confirmDeletePenalty = async () => {
    if (!penaltyToDelete) return;
    try {
      await apiClient.delete(`/salary/penalties/${penaltyToDelete}`);
      showToast("Đã hủy nộp phạt", "success");
      fetchPenalties(selectedPenaltyUser.userId || selectedPenaltyUser._id, penaltyFilters.month, penaltyFilters.year);
      loadData();
    } catch (e) {
      showToast("Lỗi", "error");
    } finally {
      setPenaltyToDelete(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.month, filters.year, filters.role, debouncedSearch, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Clear previous data immediately to avoid stale display during debounce delay
      setSalaryData([]);
      const query = new URLSearchParams({
        month: filters.month,
        year: filters.year,
        role: filters.role || "",
        search: debouncedSearch || "",
        page: currentPage,
        limit: 10,
      });

      // Gọi song song: catch lỗi riêng của summary để không làm sập toàn bộ Promise.all
      const summaryPromise = apiClient.get(`/salary/monthly-summary?${query.toString()}`).catch(err => ({ error: err }));
      const [summaryRes, configRes, coursesRes] = await Promise.all([
        summaryPromise,
        apiClient.get("/salary/config"),
        apiClient.get("/salary/courses"),
      ]);

      const users = summaryRes?.data?.users || [];
      setSalaryData(users);
      if (summaryRes?.data?.pagination) {
        setPagination({
          total: summaryRes.data.pagination.total,
          totalPages: summaryRes.data.pagination.pages,
        });
      }
      setConfig(configRes?.data || null);
      console.log("[AdminSalary] configRes.data:", configRes?.data);
      setCourses(coursesRes?.data || []);

      if (summaryRes?.error) {
        throw summaryRes.error;
      }

      // Extract active courses from the summary response for dynamic columns
      const coursesFromSummary = summaryRes?.data?.courses || [];
      console.log("[AdminSalary] coursesFromSummary:", coursesFromSummary);
      setActiveCourses(coursesFromSummary);

      // Stats tổng hợp từ backend (tính trên toàn bộ users, không phân trang)
      const ts = summaryRes?.data?.totalStats;
      setStats({
        totalSalary: ts?.totalSalary || 0,
        totalHours: ts?.totalHours || 0,
        totalCommission: ts?.totalCommission || 0,
        totalDocuments: ts?.totalDocuments || 0,
        instructorCount: ts?.instructorCount || 0,
        consultantCount: ts?.consultantCount || 0,
      });

      setNoConfig(false);
    } catch (error) {
      console.error("Error loading salary data:", error);
      const msg = error?.message || "";
      if (msg.includes("cấu hình lương") || msg.includes("Chưa có cấu hình")) {
        setNoConfig(true);
        showToast("Vui lòng tạo cấu hình lương trước", "warning");
      } else {
        showToast(`Lỗi: ${msg || "Không tải được dữ liệu"}`, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfig = () => {
    if (config) {
      setConfigForm({
        instructorHourlyRate: config.instructorHourlyRate || 80000,
        courseCommissions: (config.courseCommissions || []).map(c => ({
          ...c,
          courseId: c.courseId?._id || c.courseId
        })),
        effectiveFrom: config.effectiveFrom
          ? config.effectiveFrom.split("T")[0]
          : "",
        effectiveTo: config.effectiveTo ? config.effectiveTo.split("T")[0] : "",
        note: config.note || "",
      });
    }
    setShowConfigModal(true);
  };

  const handleOpenOverride = useCallback(
    async (user) => {
      const userId = user._id || user.userId;
      if (!userId) {
        showToast("Không tìm được thông tin user", "error");
        return;
      }
      setSelectedUser(user);
      setShowOverrideModal(true);
      try {
        const res = await apiClient.get(`/salary/users/${userId}/override`);
        const data = res?.data?.data;
        setOverrideForm({
          salaryHourlyRate: data?.salaryHourlyRate ?? "",
          commissionOverrides: data?.commissionOverrides || [],
        });
      } catch {
        showToast("Không tải được cấu hình lương cá nhân", "error");
      }
    },
    [showToast],
  );

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    const userId = selectedUser?._id || selectedUser?.userId;
    if (!selectedUser || !userId) {
      showToast("Không tìm được thông tin user", "error");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        salaryHourlyRate:
          overrideForm.salaryHourlyRate === ""
            ? null
            : Number(overrideForm.salaryHourlyRate),
        commissionOverrides: overrideForm.commissionOverrides
          .filter((c) => c.courseId)
          .map((c) => ({
            courseId: c.courseId?._id || c.courseId,
            commissionAmount: Number(c.commissionAmount || 0),
          })),
      };
      await apiClient.put(`/salary/users/${userId}/override`, payload);
      setShowOverrideModal(false);
      await loadData();
      showToast("Đã cập nhật lương cá nhân", "success");
    } catch (error) {
      showToast(error.message || "Cập nhật thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const updateOverrideCommission = (courseId, value) => {
    setOverrideForm((prev) => {
      const exists = prev.commissionOverrides.find(
        (c) => (c.courseId?._id || c.courseId) === courseId,
      );
      if (exists) {
        return {
          ...prev,
          commissionOverrides: prev.commissionOverrides.map((c) =>
            (c.courseId?._id || c.courseId) === courseId
              ? { ...c, commissionAmount: value }
              : c,
          ),
        };
      }
      return {
        ...prev,
        commissionOverrides: [
          ...prev.commissionOverrides,
          { courseId, commissionAmount: value },
        ],
      };
    });
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!configForm.effectiveFrom) {
      showToast("Vui lòng chọn ngày hiệu lực", "error");
      return;
    }
    if (
      !configForm.instructorHourlyRate ||
      configForm.instructorHourlyRate <= 0
    ) {
      showToast("Vui lòng nhập lương/giờ hợp lệ", "error");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        ...configForm,
        courseCommissions: configForm.courseCommissions.map((c) => ({
          courseId: c.courseId,
          commissionAmount: Number(c.commissionAmount),
          effectiveFrom: c.effectiveFrom || null,
        })),
      };

      if (config?._id) {
        await apiClient.put(`/salary/config/${config._id}`, payload);
      } else {
        await apiClient.post("/salary/config", payload);
      }

      await loadData();
      setShowConfigModal(false);
      showToast("Đã lưu cấu hình", "success");
    } catch (error) {
      showToast(error.message || "Lưu thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = useCallback(
    (user) => {
      const userId = user._id || user.userId;
      if (!userId) {
        showToast("Không tìm được thông tin user", "error");
        return;
      }
      setSelectedUser(user);
      setDetailLoading(true);
      setShowDetailModal(true);

      apiClient
        .get(
          `/salary/detail?${new URLSearchParams({ month: filters.month, year: filters.year, userId })}`,
        )
        .then((res) => setDetailData(res?.data || null))
        .catch((error) => console.error("Error loading detail:", error))
        .finally(() => setDetailLoading(false));
    },
    [filters.month, filters.year, showToast],
  );

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        month: filters.month,
        year: filters.year,
        role: filters.role || "",
      });
      const url = `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/salary/export-all?${params}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(() => {
            let token = localStorage.getItem("token");
            if (!token) return "";
            try {
              const p = JSON.parse(token);
              return typeof p === "string" ? p : p;
            } catch {
              return token;
            }
          })()}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || "Xuất file thất bại", "error");
        return;
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute(
        "download",
        `luong_tong_hop_${filters.month}_${filters.year}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      showToast("Xuất file thất bại", "error");
    }
  };

  const updateCommission = (courseId, field, value) => {
    setConfigForm((prev) => ({
      ...prev,
      courseCommissions: prev.courseCommissions.map((c) =>
        c.courseId === courseId ? { ...c, [field]: value } : c,
      ),
    }));
  };

  const addCommission = (courseId, effectiveFrom) => {
    if (configForm.courseCommissions.find((c) => c.courseId === courseId))
      return;
    setConfigForm((prev) => ({
      ...prev,
      courseCommissions: [
        ...prev.courseCommissions,
        { courseId, commissionAmount: 0, effectiveFrom },
      ],
    }));
  };

  const removeCommission = (courseId) => {
    setConfigForm((prev) => ({
      ...prev,
      courseCommissions: prev.courseCommissions.filter(
        (c) => c.courseId !== courseId,
      ),
    }));
  };

  const handleOpenAddCommission = () => {
    setAddCommissionForm({
      courseId: "",
      commissionAmount: "",
      effectiveFrom: "",
    });
    setShowAddCommissionModal(true);
  };

  const handleConfirmAddCommission = () => {
    if (!addCommissionForm.courseId) {
      showToast("Vui lòng chọn khóa học", "warning");
      return;
    }
    if (
      addCommissionForm.commissionAmount === "" ||
      Number(addCommissionForm.commissionAmount) < 0
    ) {
      showToast("Vui lòng nhập số tiền hợp lệ", "warning");
      return;
    }
    addCommission(addCommissionForm.courseId, addCommissionForm.effectiveFrom);
    updateCommission(
      addCommissionForm.courseId,
      "commissionAmount",
      addCommissionForm.commissionAmount,
    );
    setShowAddCommissionModal(false);
  };

  const columns = useMemo(() => {
    // Dynamic course-specific columns
    const courseCols = activeCourses.map((course) => ({
      key: `course_${course._id}`,
      title: course.code || course.name,
      render: (_, row) => {
        const count =
          row.courseCounts?.[course._id?.toString()] ||
          row.courseCounts?.[course.code] ||
          0;
        return count > 0 ? (
          <span className="font-medium text-indigo-600">{count}</span>
        ) : (
          "—"
        );
      },
    }));

    return [
      {
        key: "userName",
        title: "Nhân viên",
        render: (_, row) => (
          <div className="flex items-center gap-1">
            <p className="font-medium text-slate-900">
              {row.fullName || row.userName || "—"}
            </p>
            {row.hasOverride && (
              <span
                title="Có cấu hình lương riêng"
                className="text-amber-500 text-xs"
              >
                ★
              </span>
            )}
          </div>
        ),
      },
      {
        key: "totalTeachingSessions",
        title: "Số buổi dạy",
        render: (_, row) => row.totalTeachingSessions || 0,
      },
      {
        key: "totalTeachingHours",
        title: "Giờ dạy",
        render: (_, row) => row.totalTeachingHours || 0,
      },
      ...courseCols,
      {
        key: "totalDocuments",
        title: "Tổng hồ sơ",
        render: (_, row) => row.totalDocuments || 0,
      },
      {
        key: "hourlyRate",
        title: "Lương/giờ",
        render: (_, row) => fmt(row.hourlyRate || 0),
      },
      {
        key: "teachingSalary",
        title: "Lương giờ",
        render: (_, row) => (
          <span className="font-medium">{fmt(row.teachingSalary || 0)}</span>
        ),
      },
      {
        key: "totalCommission",
        title: "Hoa hồng",
        render: (_, row) => (
          <span className="text-indigo-600 font-medium">
            {fmt(row.totalCommission || 0)}
          </span>
        ),
      },
      {
        key: "totalPenalty",
        title: "Tổng phạt",
        render: (_, row) => (
          <span className="text-red-500 font-medium tracking-tight">
            {row.totalPenalty ? fmt(row.totalPenalty) : "—"}
          </span>
        ),
      },
      {
        key: "totalSalary",
        title: "Tổng lương",
        render: (_, row) => (
          <span className="font-bold text-emerald-600">
            {fmt(row.totalSalary || 0)}
          </span>
        ),
      },
      {
        key: "actions",
        title: "Thao tác",
        render: (_, row) => (
          <div className="relative group flex justify-center">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-600 flex items-center justify-center outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
            </button>
            <div className="absolute right-8 top-0 min-w-[140px] bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-focus-within:opacity-100 group-hover:visible group-focus-within:visible transition-all z-[50] flex flex-col py-1 overflow-hidden">
              <button onClick={() => handleViewDetail(row)} className="px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors w-full">Chi tiết</button>
              <button onClick={() => handleOpenOverride(row)} className="px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors w-full border-t border-slate-50">Chỉnh lương</button>
              <button onClick={() => handleOpenPenalty(row)} className="px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full border-t border-slate-50">Nộp phạt</button>
            </div>
          </div>
        ),
      },
    ];
  }, [activeCourses, handleViewDetail, handleOpenOverride, handleOpenPenalty]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i,
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="QUẢN LÝ LƯƠNG"
        description="Quản lý lương và hoa hồng cho giảng viên và tư vấn viên"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Tổng lương"
          value={fmt(stats.totalSalary)}
          sub="Tháng này"
          color="text-emerald-600"
        />
        <KpiCard
          label="Tổng giờ dạy"
          value={stats.totalHours}
          sub="Giảng viên"
        />
        <KpiCard
          label="Tổng hồ sơ"
          value={stats.totalDocuments}
          sub="Tư vấn viên"
          color="text-indigo-600"
        />
        <KpiCard
          label="Nhân viên"
          value={stats.instructorCount + stats.consultantCount}
          sub={`${stats.instructorCount} GV, ${stats.consultantCount} TV`}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.month}
            onChange={(e) =>
              setFilters((f) => ({ ...f, month: Number(e.target.value) }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={filters.year}
            onChange={(e) =>
              setFilters((f) => ({ ...f, year: Number(e.target.value) }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={filters.role}
            onChange={(e) =>
              setFilters((f) => ({ ...f, role: e.target.value }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            <option value="INSTRUCTOR">Giảng viên</option>
            <option value="CONSULTANT">Tư vấn viên</option>
          </select>

          <input
            type="text"
            placeholder="Tìm tên..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="flex-1 min-w-[150px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />

          <button
            onClick={() =>
              setFilters({
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                role: "",
                search: "",
              })
            }
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            Xóa lọc
          </button>

          <button
            onClick={handleOpenConfig}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Cấu hình lương
          </button>

          <button
            onClick={handleExport}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Xuất Excel
          </button>

        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : noConfig ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-6xl">⚙️</div>
            <h3 className="text-lg font-semibold text-slate-700">
              Chưa có cấu hình lương
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-md">
              Vui lòng tạo cấu hình lương trước khi xem báo cáo lương. Cấu hình
              sẽ áp dụng cho các tháng có ngày hiệu lực nằm trong tháng được
              chọn.
            </p>
            <button
              onClick={handleOpenConfig}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Tạo cấu hình lương
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salaryData.map((row, idx) => (
                    <tr
                      key={row.id || row.userId || idx}
                      className="hover:bg-slate-50"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 py-3 text-sm text-slate-800"
                        >
                          {col.render
                            ? col.render(null, row)
                            : (row[col.key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Cấu hình lương
            </h3>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Lương/giờ (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={configForm.instructorHourlyRate}
                    onChange={(e) =>
                      setConfigForm((f) => ({
                        ...f,
                        instructorHourlyRate: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ngày hiệu lực
                  </label>
                  <input
                    type="date"
                    value={configForm.effectiveFrom}
                    min={todayStr}
                    onChange={(e) =>
                      setConfigForm((f) => ({
                        ...f,
                        effectiveFrom: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Hoa hồng theo khóa học
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenAddCommission}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Thêm hoa hồng theo khóa
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {configForm.courseCommissions.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-2">
                      Chưa có hoa hồng nào. Nhấn "+ Thêm hoa hồng theo khóa" để
                      thêm.
                    </p>
                  )}
                  {configForm.courseCommissions.map((commission) => {
                    const course = courses.find(
                      (c) => c._id === commission.courseId,
                    );
                    if (!course) return null;
                    return (
                      <div
                        key={commission.courseId}
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                      >
                        <span className="flex-1 text-sm">
                          {course.name} ({course.code})
                        </span>
                        <input
                          type="number"
                          placeholder="Số tiền"
                          value={commission?.commissionAmount ?? ""}
                          onChange={(e) =>
                            updateCommission(
                              commission.courseId,
                              "commissionAmount",
                              e.target.value,
                            )
                          }
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <input
                          type="date"
                          value={commission?.effectiveFrom || todayStr}
                          min={todayStr}
                          onChange={(e) =>
                            updateCommission(
                              commission.courseId,
                              "effectiveFrom",
                              e.target.value,
                            )
                          }
                          className="w-36 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeCommission(commission.courseId)}
                          className="px-2 py-1 text-xs rounded bg-red-100 text-red-600 hover:bg-red-200"
                        >
                          Xóa
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={configForm.note}
                  onChange={(e) =>
                    setConfigForm((f) => ({ ...f, note: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>

            {/* Add Commission Modal */}
            {showAddCommissionModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
                  <h4 className="text-base font-bold text-slate-900 mb-3">
                    Thêm hoa hồng theo khóa
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Khóa học
                      </label>
                      <select
                        value={addCommissionForm.courseId}
                        onChange={(e) =>
                          setAddCommissionForm((f) => ({
                            ...f,
                            courseId: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="">-- Chọn khóa học --</option>
                        {courses
                          .filter(
                            (c) =>
                              !configForm.courseCommissions.find(
                                (cc) => cc.courseId === c._id,
                              ),
                          )
                          .map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Số tiền hoa hồng (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={addCommissionForm.commissionAmount}
                        onChange={(e) =>
                          setAddCommissionForm((f) => ({
                            ...f,
                            commissionAmount: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Từ ngày
                      </label>
                      <input
                        type="date"
                        value={addCommissionForm.effectiveFrom || todayStr}
                        min={todayStr}
                        onChange={(e) =>
                          setAddCommissionForm((f) => ({
                            ...f,
                            effectiveFrom: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddCommissionModal(false)}
                      className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-semibold text-slate-700"
                    >
                      Huỷ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAddCommission}
                      className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Chi tiết lương
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {selectedUser.fullName || selectedUser.userName} -{" "}
              {selectedUser.role === "INSTRUCTOR"
                ? "Giảng viên"
                : "Tư vấn viên"}
            </p>

            {detailLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : detailData ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-xs text-slate-500">Lương giờ</p>
                    <p className="text-lg font-bold">
                      {fmt(detailData.teachingSalary || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Hoa hồng</p>
                    <p className="text-lg font-bold text-indigo-600">
                      {fmt(detailData.totalCommission || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tổng lương</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {fmt(detailData.totalSalary || 0)}
                    </p>
                  </div>
                </div>

                {/* Teaching Details */}
                {detailData.teachingDetails?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">
                      Chi tiết giờ dạy
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {detailData.teachingDetails.map((t, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm p-2 bg-slate-50 rounded"
                        >
                          <span>
                            {new Date(t.date).toLocaleDateString("vi-VN")} - Ca{" "}
                            {t.timeSlot} - {t.learnerName}
                          </span>
                          <span className="font-medium">{fmt(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commission Details */}
                {detailData.commissionDetails?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">
                      Chi tiết hoa hồng
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {detailData.commissionDetails.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm p-2 bg-indigo-50 rounded"
                        >
                          <span>
                            {c.courseName} - {c.learnerName}
                          </span>
                          <span className="font-medium text-indigo-600">
                            {fmt(c.commissionAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">
                Không có dữ liệu
              </p>
            )}

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}

      <ConfirmDialog
        isOpen={!!penaltyToDelete}
        onClose={() => setPenaltyToDelete(null)}
        onConfirm={confirmDeletePenalty}
        title="Hủy bỏ nộp phạt"
        message="Bạn có chắc chắn muốn hủy bỏ khoản nộp phạt này không?"
        type="danger"
        confirmText="Hủy khoản này"
      />

      {/* Penalty Modal */}
      {showPenaltyModal && selectedPenaltyUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Danh sách nộp phạt
                </h3>
                <p className="text-sm text-slate-500">
                  Nhân viên: {selectedPenaltyUser.fullName || selectedPenaltyUser.userName}
                </p>
              </div>
              <button
                onClick={() => setShowPenaltyModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {!showAddPenalty ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-slate-700">Lịch sử nộp phạt</h4>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <select
                          className="text-sm bg-transparent outline-none font-medium text-slate-700 cursor-pointer"
                          value={penaltyFilters.month}
                          onChange={(e) => {
                            const newMonth = Number(e.target.value);
                            setPenaltyFilters(p => ({ ...p, month: newMonth }));
                            fetchPenalties(selectedPenaltyUser.userId || selectedPenaltyUser._id, newMonth, penaltyFilters.year);
                          }}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>Tháng {m}</option>
                          ))}
                        </select>
                        <span className="text-slate-300">/</span>
                        <select
                          className="text-sm bg-transparent outline-none font-medium text-slate-700 cursor-pointer"
                          value={penaltyFilters.year}
                          onChange={(e) => {
                            const newYear = Number(e.target.value);
                            setPenaltyFilters(p => ({ ...p, year: newYear }));
                            fetchPenalties(selectedPenaltyUser.userId || selectedPenaltyUser._id, penaltyFilters.month, newYear);
                          }}
                        >
                          {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddPenalty(true)}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      + Thêm nộp phạt
                    </button>
                  </div>

                  {loadingPenalties ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                    </div>
                  ) : userPenalties.length > 0 ? (
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 w-1/2">Lý do</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Số tiền</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Ngày tạo</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {userPenalties.map(p => (
                            <tr key={p._id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-800">{p.reason}</td>
                              <td className="px-4 py-3 text-sm text-red-600 font-medium text-right">{fmt(p.amount)}</td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <button
                                  onClick={() => handleDeletePenalty(p._id)}
                                  className="text-slate-400 hover:text-red-500 font-medium text-xs px-2 py-1 rounded hover:bg-red-50"
                                >
                                  Hủy
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                      <p className="text-slate-500">Người này không có nộp phạt nào trong tháng.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-4 text-lg">Tạo nộp phạt mới</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền phạt (VNĐ)</label>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="VD: 50000"
                        value={penaltyForm.amount}
                        onChange={e => setPenaltyForm(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Lý do nộp phạt</label>
                      <textarea
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="Nhập lý do nộp phạt..."
                        rows="3"
                        value={penaltyForm.reason}
                        onChange={e => setPenaltyForm(prev => ({ ...prev, reason: e.target.value }))}
                      ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setShowAddPenalty(false)}
                        className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleCreatePenalty}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer just for closing the dialog when on list view */}
            {!showAddPenalty && (
              <div className="border-t border-slate-100 p-6 shrink-0 flex justify-end">
                <button
                  onClick={() => setShowPenaltyModal(false)}
                  className="rounded-xl px-6 py-2.5 text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      {showOverrideModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Chỉnh lương cá nhân
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {selectedUser.fullName || selectedUser.userName} -{" "}
              {selectedUser.role === "INSTRUCTOR"
                ? "Giảng viên"
                : "Tư vấn viên"}
            </p>

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lương/giờ (để trống = dùng cấu hình chung)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={overrideForm.salaryHourlyRate}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setOverrideForm((f) => ({ ...f, salaryHourlyRate: raw }));
                  }}
                  placeholder="Để trống = dùng cấu hình chung"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hoa hồng theo khóa học
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {courses.map((course) => {
                    const ov = overrideForm.commissionOverrides.find(
                      (c) => (c.courseId?._id || c.courseId) === course._id,
                    );
                    return (
                      <div
                        key={course._id}
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                      >
                        <span className="flex-1 text-sm">
                          {course.name} ({course.code})
                        </span>
                        <input
                          type="number"
                          placeholder="Số tiền"
                          value={ov?.commissionAmount ?? ""}
                          onChange={(e) =>
                            updateOverrideCommission(course._id, e.target.value)
                          }
                          className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Nếu để trống hoa hồng, hệ thống sẽ dùng cấu hình chung.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSalary;

 import { useState, useEffect, useMemo, useCallback } from 'react';
import SectionHeader from '../../components/ui/SectionHeader';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';

const fmt = (n) => formatCurrency(n || 0);

const KpiCard = ({ label, value, sub, color = 'text-slate-900' }) => (
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
  const [stats, setStats] = useState({ totalSalary: 0, totalHours: 0, totalCommission: 0, totalDocuments: 0, instructorCount: 0, consultantCount: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  // Filters
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    role: '', // '', 'INSTRUCTOR', 'CONSULTANT'
    search: '',
  });

  // Debounced search value — prevents API call on every keystroke
  const debouncedSearch = useDebounce(filters.search, 300);

  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddCommissionModal, setShowAddCommissionModal] = useState(false);
  const [addCommissionForm, setAddCommissionForm] = useState({ courseId: '', commissionAmount: '', effectiveFrom: '' });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [overrideForm, setOverrideForm] = useState({
    salaryHourlyRate: '',
    commissionOverrides: [],
  });

  // Leave config
  const [leaveConfig, setLeaveConfig] = useState({ paidLeaveDaysPerYear: 12, leaveDeductionPerDay: 0 });
  const [showLeaveConfig, setShowLeaveConfig] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ paidLeaveDaysPerYear: 12, leaveDeductionPerDay: 0 });
  const [leaveUsage, setLeaveUsage] = useState(null);
  const [showLeavePanel, setShowLeavePanel] = useState(false);

  // Config form
  const [configForm, setConfigForm] = useState({
    instructorHourlyRate: 80000,
    courseCommissions: [],
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    note: '',
  });

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
        role: filters.role || '',
        search: debouncedSearch || '',
        page: currentPage,
        limit: 20
      });

      // Gọi song song: salary summary + config + courses + leave config
      const [summaryRes, configRes, coursesRes, leaveRes] = await Promise.all([
        apiClient.get(`/salary/monthly-summary?${query.toString()}`),
        apiClient.get('/salary/config'),
        apiClient.get('/salary/courses'),
        apiClient.get(`/salary/leave-config?year=${filters.year}`),
      ]);

      const users = summaryRes?.data?.users || [];
      setSalaryData(users);
      if (summaryRes?.data?.pagination) {
        setPagination({
          total: summaryRes.data.pagination.total,
          totalPages: summaryRes.data.pagination.pages
        });
      }
      setConfig(configRes?.data || null);
      setCourses(coursesRes?.data || []);
      if (leaveRes?.data) {
        setLeaveConfig(leaveRes.data);
        setLeaveForm({
          paidLeaveDaysPerYear: leaveRes.data.paidLeaveDaysPerYear ?? 12,
          leaveDeductionPerDay: leaveRes.data.leaveDeductionPerDay ?? 0,
        });
      }
      // Extract active courses from the summary response for dynamic columns
      const coursesFromSummary = summaryRes?.data?.courses || [];
      console.log('[AdminSalary] coursesFromSummary:', coursesFromSummary);
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
      console.error('Error loading salary data:', error);
      const msg = error?.message || '';
      if (msg.includes('cấu hình lương') || msg.includes('Chưa có cấu hình')) {
        setNoConfig(true);
        showToast('Vui lòng tạo cấu hình lương trước', 'warning');
      } else {
        showToast(`Lỗi: ${msg || 'Không tải được dữ liệu'}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfig = () => {
    if (config) {
      setConfigForm({
        instructorHourlyRate: config.instructorHourlyRate || 80000,
        courseCommissions: config.courseCommissions || [],
        effectiveFrom: config.effectiveFrom ? config.effectiveFrom.split('T')[0] : '',
        effectiveTo: config.effectiveTo ? config.effectiveTo.split('T')[0] : '',
        note: config.note || '',
      });
    }
    setShowConfigModal(true);
  };

  const handleOpenOverride = useCallback(async (user) => {
    const userId = user._id || user.userId;
    if (!userId) {
      showToast('Không tìm được thông tin user', 'error');
      return;
    }
    setSelectedUser(user);
    setShowOverrideModal(true);
    try {
      const res = await apiClient.get(`/salary/users/${userId}/override`);
      const data = res?.data?.data;
      setOverrideForm({
        salaryHourlyRate: data?.salaryHourlyRate ?? '',
        commissionOverrides: data?.commissionOverrides || [],
      });
    } catch {
      showToast('Không tải được cấu hình lương cá nhân', 'error');
    }
  }, [showToast]);

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    const userId = selectedUser?._id || selectedUser?.userId;
    if (!selectedUser || !userId) {
      showToast('Không tìm được thông tin user', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        salaryHourlyRate: overrideForm.salaryHourlyRate === '' ? null : Number(overrideForm.salaryHourlyRate),
        commissionOverrides: overrideForm.commissionOverrides
          .filter(c => c.courseId)
          .map(c => ({
            courseId: c.courseId?._id || c.courseId,
            commissionAmount: Number(c.commissionAmount || 0),
          })),
      };
      await apiClient.put(`/salary/users/${userId}/override`, payload);
      setShowOverrideModal(false);
      await loadData();
      showToast('Đã cập nhật lương cá nhân', 'success');
    } catch (error) {
      showToast(error.message || 'Cập nhật thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateOverrideCommission = (courseId, value) => {
    setOverrideForm(prev => {
      const exists = prev.commissionOverrides.find(c => (c.courseId?._id || c.courseId) === courseId);
      if (exists) {
        return {
          ...prev,
          commissionOverrides: prev.commissionOverrides.map(c =>
            (c.courseId?._id || c.courseId) === courseId
              ? { ...c, commissionAmount: value }
              : c
          ),
        };
      }
      return {
        ...prev,
        commissionOverrides: [...prev.commissionOverrides, { courseId, commissionAmount: value }],
      };
    });
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!configForm.effectiveFrom) {
      showToast('Vui lòng chọn ngày hiệu lực', 'error');
      return;
    }
    if (!configForm.instructorHourlyRate || configForm.instructorHourlyRate <= 0) {
      showToast('Vui lòng nhập lương/giờ hợp lệ', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        ...configForm,
        courseCommissions: configForm.courseCommissions.map(c => ({
          courseId: c.courseId,
          commissionAmount: Number(c.commissionAmount),
          effectiveFrom: c.effectiveFrom || null,
        })),
      };

      if (config?._id) {
        await apiClient.put(`/salary/config/${config._id}`, payload);
      } else {
        await apiClient.post('/salary/config', payload);
      }

      await loadData();
      setShowConfigModal(false);
      showToast('Đã lưu cấu hình', 'success');
    } catch (error) {
      showToast(error.message || 'Lưu thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLeaveConfig = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.put('/salary/leave-config', {
        ...leaveForm,
        year: filters.year,
      });
      setShowLeaveConfig(false);
      showToast('Đã lưu cấu hình nghỉ phép', 'success');
      await loadData();
    } catch (error) {
      showToast(error.message || 'Lưu thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = useCallback((user) => {
    const userId = user._id || user.userId;
    if (!userId) {
      showToast('Không tìm được thông tin user', 'error');
      return;
    }
    setSelectedUser(user);
    setDetailLoading(true);
    setShowDetailModal(true);

    apiClient.get(`/salary/detail?${new URLSearchParams({ month: filters.month, year: filters.year, userId })}`)
      .then(res => setDetailData(res?.data || null))
      .catch(error => console.error('Error loading detail:', error))
      .finally(() => setDetailLoading(false));
  }, [filters.month, filters.year, showToast]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        month: filters.month,
        year: filters.year,
        role: filters.role || '',
      });
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/salary/export-all?${params}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(() => {
            let token = localStorage.getItem('token');
            if (!token) return '';
            try { const p = JSON.parse(token); return typeof p === 'string' ? p : p; } catch { return token; }
          })()}`
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Xuất file thất bại', 'error');
        return;
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `luong_tong_hop_${filters.month}_${filters.year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      showToast('Xuất file thất bại', 'error');
    }
  };

  const updateCommission = (courseId, field, value) => {
    setConfigForm(prev => ({
      ...prev,
      courseCommissions: prev.courseCommissions.map(c =>
        c.courseId === courseId ? { ...c, [field]: value } : c
      ),
    }));
  };

  const addCommission = (courseId, effectiveFrom = '') => {
    if (configForm.courseCommissions.find(c => c.courseId === courseId)) return;
    setConfigForm(prev => ({
      ...prev,
      courseCommissions: [...prev.courseCommissions, { courseId, commissionAmount: 0, effectiveFrom }],
    }));
  };

  const removeCommission = (courseId) => {
    setConfigForm(prev => ({
      ...prev,
      courseCommissions: prev.courseCommissions.filter(c => c.courseId !== courseId),
    }));
  };

  const handleOpenAddCommission = () => {
    setAddCommissionForm({ courseId: '', commissionAmount: '', effectiveFrom: '' });
    setShowAddCommissionModal(true);
  };

  const handleConfirmAddCommission = () => {
    if (!addCommissionForm.courseId) {
      showToast('Vui lòng chọn khóa học', 'warning');
      return;
    }
    if (addCommissionForm.commissionAmount === '' || Number(addCommissionForm.commissionAmount) < 0) {
      showToast('Vui lòng nhập số tiền hợp lệ', 'warning');
      return;
    }
    addCommission(addCommissionForm.courseId, addCommissionForm.effectiveFrom);
    updateCommission(addCommissionForm.courseId, 'commissionAmount', addCommissionForm.commissionAmount);
    setShowAddCommissionModal(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const columns = useMemo(() => {
    // Dynamic course-specific columns
    const courseCols = activeCourses.map(course => ({
      key: `course_${course._id}`,
      title: course.code || course.name,
      render: (_, row) => {
        const count = row.courseCounts?.[course._id?.toString()] ||
          row.courseCounts?.[course.code] || 0;
        return count > 0 ? (
          <span className="font-medium text-indigo-600">{count}</span>
        ) : '—';
      },
    }));

    return [
      {
        key: 'userName',
        title: 'Nhân viên',
        render: (_, row) => (
          <div className="flex items-center gap-1">
            <p className="font-medium text-slate-900">{row.fullName || row.userName || '—'}</p>
            {row.hasOverride && (
              <span title="Có cấu hình lương riêng" className="text-amber-500 text-xs">★</span>
            )}
          </div>
        ),
      },
      {
        key: 'totalTeachingSessions',
        title: 'Số buổi dạy',
        render: (_, row) => row.totalTeachingSessions || 0,
      },
      {
        key: 'totalTeachingHours',
        title: 'Giờ dạy',
        render: (_, row) => row.totalTeachingHours || 0,
      },
      ...courseCols,
      {
        key: 'totalDocuments',
        title: 'Tổng hồ sơ',
        render: (_, row) => row.totalDocuments || 0,
      },
      {
        key: 'hourlyRate',
        title: 'Lương/giờ',
        render: (_, row) => fmt(row.hourlyRate || 0),
      },
      {
        key: 'teachingSalary',
        title: 'Lương giờ',
        render: (_, row) => <span className="font-medium">{fmt(row.teachingSalary || 0)}</span>,
      },
      {
        key: 'totalCommission',
        title: 'Hoa hồng',
        render: (_, row) => <span className="text-indigo-600 font-medium">{fmt(row.totalCommission || 0)}</span>,
      },
      {
        key: 'totalSalary',
        title: 'Tổng lương',
        render: (_, row) => <span className="font-bold text-emerald-600">{fmt(row.totalSalary || 0)}</span>,
      },
      {
        key: 'actions',
        title: 'Thao tác',
        render: (_, row) => (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleViewDetail(row)}
              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
            >
              Chi tiết
            </button>
            <button
              onClick={() => handleOpenOverride(row)}
              className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              Chỉnh lương
            </button>
          </div>
        ),
      },
    ];
  }, [activeCourses, handleViewDetail, handleOpenOverride]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="QUẢN LÝ LƯƠNG"
        description="Quản lý lương và hoa hồng cho giảng viên và tư vấn viên"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tổng lương" value={fmt(stats.totalSalary)} sub="Tháng này" color="text-emerald-600" />
        <KpiCard label="Tổng giờ dạy" value={stats.totalHours} sub="Giảng viên" />
        <KpiCard label="Tổng hồ sơ" value={stats.totalDocuments} sub="Tư vấn viên" color="text-indigo-600" />
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
            onChange={(e) => setFilters(f => ({ ...f, month: Number(e.target.value) }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={filters.year}
            onChange={(e) => setFilters(f => ({ ...f, year: Number(e.target.value) }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={filters.role}
            onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
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
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="flex-1 min-w-[150px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />

          <button
            onClick={() => setFilters({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), role: '', search: '' })}
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

          <button
            onClick={() => {
              setLeaveForm({
                paidLeaveDaysPerYear: leaveConfig?.paidLeaveDaysPerYear ?? 12,
                leaveDeductionPerDay: leaveConfig?.leaveDeductionPerDay ?? 0,
              });
              setShowLeaveConfig(true);
            }}
            className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            Cấu hình nghỉ phép
          </button>

        </div>
      </div>

      {/* Leave Config Modal */}
      {showLeaveConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Cấu hình nghỉ phép {filters.year}</h3>
            <form onSubmit={handleSaveLeaveConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số ngày nghỉ phép có lương / năm</label>
                <input
                  type="number"
                  min="0"
                  value={leaveForm.paidLeaveDaysPerYear}
                  onChange={(e) => setLeaveForm(f => ({ ...f, paidLeaveDaysPerYear: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">Số ngày nghỉ phép được phép trong năm mà không bị trừ lương.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền khấu trừ / ngày vượt quá</label>
                <input
                  type="number"
                  min="0"
                  value={leaveForm.leaveDeductionPerDay}
                  onChange={(e) => setLeaveForm(f => ({ ...f, leaveDeductionPerDay: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">Khấu trừ cho mỗi ngày nghỉ vượt quá số ngày được phép (chỉ áp dụng cho giảng viên).</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveConfig(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : noConfig ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-6xl">⚙️</div>
            <h3 className="text-lg font-semibold text-slate-700">Chưa có cấu hình lương</h3>
            <p className="text-sm text-slate-500 text-center max-w-md">
              Vui lòng tạo cấu hình lương trước khi xem báo cáo lương. Cấu hình sẽ áp dụng cho các tháng có ngày hiệu lực nằm trong tháng được chọn.
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
                    {columns.map(col => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salaryData.map((row, idx) => (
                    <tr key={row.id || row.userId || idx} className="hover:bg-slate-50">
                      {columns.map(col => (
                        <td key={col.key} className="px-4 py-3 text-sm text-slate-800">
                          {col.render ? col.render(null, row) : (row[col.key] ?? '')}
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

      {/* Leave Usage Panel */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-amber-100 transition-colors"
          onClick={() => {
            if (!leaveUsage) {
              apiClient.get(`/salary/leave-usage?year=${filters.year}`)
                .then(res => setLeaveUsage(res?.data?.data))
                .catch(err => console.error('Error loading leave usage:', err));
            }
            setShowLeavePanel(prev => !prev);
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">Nghỉ phép</span>
            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
              {leaveConfig?.paidLeaveDaysPerYear ?? 12} ngày/năm
            </span>
          </div>
          <span className={`transition-transform ${showLeavePanel ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {showLeavePanel && (
          <div className="px-5 pb-5">
            {/* Summary row */}
            {leaveUsage && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">Tổng giáo viên</p>
                  <p className="text-lg font-bold text-slate-800">{leaveUsage.summary?.totalInstructors ?? 0}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">Tổng ngày nghỉ</p>
                  <p className="text-lg font-bold text-slate-800">{leaveUsage.summary?.totalLeaves ?? 0}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">Ngày vượt quá</p>
                  <p className="text-lg font-bold text-amber-600">{leaveUsage.summary?.totalExtraDays ?? 0}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">Tổng khấu trừ</p>
                  <p className="text-lg font-bold text-red-600">{fmt(leaveUsage.summary?.totalDeduction ?? 0)}</p>
                </div>
              </div>
            )}

            {/* Usage table */}
            {leaveUsage?.instructors?.length > 0 ? (
              <div className="bg-white rounded-xl overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Giáo viên</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-600">Ngày nghỉ</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-600">Miễn phí</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-600">Vượt quá</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600">Khấu trừ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveUsage.instructors.map((inst, idx) => (
                        <tr key={inst.userId || idx} className="border-t border-slate-50 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{inst.fullName}</td>
                          <td className="px-4 py-3 text-center">{inst.emergencyLeaveCount ?? 0}</td>
                          <td className="px-4 py-3 text-center text-slate-500">{inst.paidLeaveDays ?? 12}</td>
                          <td className="px-4 py-3 text-center">
                            {inst.extraLeaveDays > 0 ? (
                              <span className="text-amber-600 font-semibold">{inst.extraLeaveDays}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {inst.leaveDeduction > 0 ? (
                              <span className="text-red-600 font-semibold">{fmt(inst.leaveDeduction)}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500 py-6 bg-white rounded-xl border border-slate-100">
                Không có dữ liệu nghỉ phép cho năm này
              </p>
            )}
          </div>
        )}
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Cấu hình lương</h3>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lương/giờ (VNĐ)</label>
                  <input
                    type="number"
                    value={configForm.instructorHourlyRate}
                    onChange={(e) => setConfigForm(f => ({ ...f, instructorHourlyRate: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hiệu lực</label>
                  <input
                    type="date"
                    value={configForm.effectiveFrom}
                    min={todayStr}
                    onChange={(e) => setConfigForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Hoa hồng theo khóa học</label>
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
                    <p className="text-sm text-slate-400 italic text-center py-2">Chưa có hoa hồng nào. Nhấn "+ Thêm hoa hồng theo khóa" để thêm.</p>
                  )}
                  {configForm.courseCommissions.map(commission => {
                    const course = courses.find(c => c._id === commission.courseId);
                    if (!course) return null;
                    return (
                      <div key={commission.courseId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <span className="flex-1 text-sm">{course.name} ({course.code})</span>
                        <input
                          type="number"
                          placeholder="Số tiền"
                          value={commission?.commissionAmount ?? ''}
                          onChange={(e) => updateCommission(commission.courseId, 'commissionAmount', e.target.value)}
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <input
                          type="date"
                          value={commission?.effectiveFrom || ''}
                          min={todayStr}
                          onChange={(e) => updateCommission(commission.courseId, 'effectiveFrom', e.target.value)}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  value={configForm.note}
                  onChange={(e) => setConfigForm(f => ({ ...f, note: e.target.value }))}
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
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>

            {/* Add Commission Modal */}
            {showAddCommissionModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
                  <h4 className="text-base font-bold text-slate-900 mb-3">Thêm hoa hồng theo khóa</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Khóa học</label>
                      <select
                        value={addCommissionForm.courseId}
                        onChange={(e) => setAddCommissionForm(f => ({ ...f, courseId: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="">-- Chọn khóa học --</option>
                        {courses
                          .filter(c => !configForm.courseCommissions.find(cc => cc.courseId === c._id))
                          .map(c => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền hoa hồng (VNĐ)</label>
                      <input
                        type="number"
                        value={addCommissionForm.commissionAmount}
                        onChange={(e) => setAddCommissionForm(f => ({ ...f, commissionAmount: e.target.value }))}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Từ ngày</label>
                      <input
                        type="date"
                        value={addCommissionForm.effectiveFrom}
                        min={todayStr}
                        onChange={(e) => setAddCommissionForm(f => ({ ...f, effectiveFrom: e.target.value }))}
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Chi tiết lương</h3>
            <p className="text-sm text-slate-600 mb-4">
              {selectedUser.fullName || selectedUser.userName} - {selectedUser.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Tư vấn viên'}
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
                    <p className="text-lg font-bold">{fmt(detailData.teachingSalary || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Hoa hồng</p>
                    <p className="text-lg font-bold text-indigo-600">{fmt(detailData.totalCommission || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tổng lương</p>
                    <p className="text-lg font-bold text-emerald-600">{fmt(detailData.totalSalary || 0)}</p>
                  </div>
                </div>

                {/* Teaching Details */}
                {detailData.teachingDetails?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Chi tiết giờ dạy</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {detailData.teachingDetails.map((t, idx) => (
                        <div key={idx} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                          <span>{new Date(t.date).toLocaleDateString('vi-VN')} - Ca {t.timeSlot} - {t.learnerName}</span>
                          <span className="font-medium">{fmt(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commission Details */}
                {detailData.commissionDetails?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Chi tiết hoa hồng</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {detailData.commissionDetails.map((c, idx) => (
                        <div key={idx} className="flex justify-between text-sm p-2 bg-indigo-50 rounded">
                          <span>{c.courseName} - {c.learnerName}</span>
                          <span className="font-medium text-indigo-600">{fmt(c.commissionAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">Không có dữ liệu</p>
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
      {showOverrideModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Chỉnh lương cá nhân</h3>
            <p className="text-sm text-slate-600 mb-4">
              {selectedUser.fullName || selectedUser.userName} - {selectedUser.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Tư vấn viên'}
            </p>

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lương/giờ (để trống = dùng cấu hình chung)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={overrideForm.salaryHourlyRate}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setOverrideForm(f => ({ ...f, salaryHourlyRate: raw }));
                  }}
                  placeholder="Để trống = dùng cấu hình chung"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hoa hồng theo khóa học</label>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {courses.map(course => {
                    const ov = overrideForm.commissionOverrides.find(c => (c.courseId?._id || c.courseId) === course._id);
                    return (
                      <div key={course._id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <span className="flex-1 text-sm">{course.name} ({course.code})</span>
                        <input
                          type="number"
                          placeholder="Số tiền"
                          value={ov?.commissionAmount ?? ''}
                          onChange={(e) => updateOverrideCommission(course._id, e.target.value)}
                          className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">Nếu để trống hoa hồng, hệ thống sẽ dùng cấu hình chung.</p>
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
                  {submitting ? 'Đang lưu...' : 'Lưu'}
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

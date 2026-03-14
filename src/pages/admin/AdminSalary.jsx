import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { useAuthContext } from '../../context/AuthContext';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0);

const MONTHS = [
  { value: 1, label: 'Tháng 1' },
  { value: 2, label: 'Tháng 2' },
  { value: 3, label: 'Tháng 3' },
  { value: 4, label: 'Tháng 4' },
  { value: 5, label: 'Tháng 5' },
  { value: 6, label: 'Tháng 6' },
  { value: 7, label: 'Tháng 7' },
  { value: 8, label: 'Tháng 8' },
  { value: 9, label: 'Tháng 9' },
  { value: 10, label: 'Tháng 10' },
  { value: 11, label: 'Tháng 11' },
  { value: 12, label: 'Tháng 12' },
];

const getLastMonth = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-11 (tháng hiện tại - 1 = tháng trước)
  const year = now.getFullYear();
  if (month === 0) {
    return { month: 12, year: year - 1 };
  }
  return { month, year };
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminSalary = () => {
  const { user } = useAuthContext();
  const lastMonth = getLastMonth();

  // State
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [config, setConfig] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Filter state
  const [month, setMonth] = useState(lastMonth.month);
  const [year, setYear] = useState(lastMonth.year);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Config form state
  const [configForm, setConfigForm] = useState({
    instructorHourlyRate: 80000,
    courseCommissions: [],
    effectiveFrom: new Date().toISOString().split('T')[0],
    note: ''
  });

  // ── Fetch Data ────────────────────────────────────────────────────────────
  const fetchSalaryData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('month', month);
      params.append('year', year);
      if (role) params.append('role', role);
      if (search) params.append('search', search);
      params.append('page', page);
      params.append('limit', 10);

      const res = await apiClient.get(`/salary/monthly-summary?${params.toString()}`);
      if (res.data?.status === 'success') {
        setSalaryData(res.data.data.users || []);
        setTotalPages(res.data.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching salary data:', err);
    } finally {
      setLoading(false);
    }
  }, [month, year, role, search, page]);

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get('/salary/courses');
      if (res.data?.status === 'success') {
        setCourses(res.data.data || []);
        // Initialize commission form
        const commissions = (res.data.data || []).map(c => ({
          courseId: c._id,
          commissionAmount: 0
        }));
        setConfigForm(prev => ({ ...prev, courseCommissions: commissions }));
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await apiClient.get('/salary/config');
      if (res.data?.status === 'success') {
        const data = res.data.data;
        setConfig(data);
        if (data && !data.isNew) {
          setConfigForm({
            instructorHourlyRate: data.instructorHourlyRate || 80000,
            courseCommissions: data.courseCommissions?.map(cc => ({
              courseId: cc.courseId?._id || cc.courseId,
              commissionAmount: cc.commissionAmount
            })) || [],
            effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            note: data.note || ''
          });
        }
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, [fetchSalaryData]);

  useEffect(() => {
    fetchCourses();
    fetchConfig();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      if (config && !config.isNew) {
        // Update
        await apiClient.put(`/salary/config/${config._id}`, configForm);
      } else {
        // Create
        await apiClient.post('/salary/config', configForm);
      }
      await fetchConfig();
      setShowConfigModal(false);
      alert('Lưu cấu hình thành công!');
    } catch (err) {
      console.error('Error saving config:', err);
      alert('Lỗi khi lưu cấu hình: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExport = async (userId, userName) => {
    try {
      const params = new URLSearchParams();
      params.append('userId', userId);
      params.append('month', month);
      params.append('year', year);

      const res = await apiClient.get(`/salary/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `luong_${userName.replace(/\s+/g, '_')}_${month}_${year}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting:', err);
      alert('Lỗi khi xuất file: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSalaryData();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý lương</h1>
          <p className="text-slate-500">Xem và xuất bảng lương hàng tháng</p>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Cấu hình lương
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Tháng</label>
            <select
              value={month}
              onChange={(e) => { setMonth(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Năm</label>
            <select
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Vai trò</label>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Tất cả</option>
              <option value="INSTRUCTOR">Giảng viên</option>
              <option value="CONSULTANT">Tư vấn viên</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-600">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">STT</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Họ tên</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Vai trò</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Giờ dạy</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Ghi chú</th>
                {courses.map(c => (
                  <th key={c._id} className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    {c.code}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Hoa hồng</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Tổng lương</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9 + courses.length} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : salaryData.length === 0 ? (
                <tr>
                  <td colSpan={9 + courses.length} className="px-4 py-8 text-center text-slate-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                salaryData.map((item, index) => (
                  <tr key={item._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{(page - 1) * 10 + index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.fullName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Tư vấn viên'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {item.totalTeachingHours || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {item.role === 'CONSULTANT' ? 'Hoa hồng theo hồ sơ gán' : '-'}
                    </td>
                    {courses.map(c => (
                      <td key={c._id} className="px-4 py-3 text-sm text-center text-slate-600">
                        {item.courseCounts?.[c.code] || 0}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-right text-slate-600">
                      {fmt(item.totalCommission)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-indigo-600">
                      {fmt(item.totalSalary)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleExport(item._id, item.fullName)}
                        className="rounded px-3 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
                      >
                        Xuất CSV
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-sm text-slate-500">Trang {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Cấu hình lương</h2>
            <form onSubmit={handleSaveConfig}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Lương theo giờ (VNĐ)
                </label>
                <input
                  type="number"
                  value={configForm.instructorHourlyRate}
                  onChange={(e) => setConfigForm({ ...configForm, instructorHourlyRate: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  min="0"
                  step="1000"
                />
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Hoa hồng theo khóa học
                </label>
                <div className="max-h-60 space-y-2 overflow-y-auto rounded border border-slate-200 p-3">
                  {configForm.courseCommissions.map((cc, idx) => {
                    const course = courses.find(c => c._id === cc.courseId);
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">{course?.code} - {course?.name}</span>
                        <input
                          type="number"
                          value={cc.commissionAmount}
                          onChange={(e) => {
                            const newCommissions = [...configForm.courseCommissions];
                            newCommissions[idx].commissionAmount = Number(e.target.value);
                            setConfigForm({ ...configForm, courseCommissions: newCommissions });
                          }}
                          className="w-32 rounded border border-slate-300 px-2 py-1 text-right"
                          min="0"
                          step="1000"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Ngày hiệu lực
                </label>
                <input
                  type="date"
                  value={configForm.effectiveFrom}
                  onChange={(e) => setConfigForm({ ...configForm, effectiveFrom: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-600">Ghi chú</label>
                <textarea
                  value={configForm.note}
                  onChange={(e) => setConfigForm({ ...configForm, note: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                >
                  Lưu
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

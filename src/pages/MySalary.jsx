import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { useAuthContext } from '../context/AuthContext';

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
const MySalary = () => {
  const { user } = useAuthContext();
  const lastMonth = getLastMonth();

  // State
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState(null);
  const [month, setMonth] = useState(lastMonth.month);
  const [year, setYear] = useState(lastMonth.year);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ── Fetch Data ────────────────────────────────────────────────────────────
  const fetchMySalary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('month', month);
      params.append('year', year);

      const res = await apiClient.get(`/salary/my?${params.toString()}`);
      setSalaryData(res?.data || null);
    } catch (err) {
      console.error('Error fetching my salary:', err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchMySalary();
  }, [fetchMySalary]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('userId', user._id);
      params.append('month', month);
      params.append('year', year);

      const res = await apiClient.get(`/salary/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `luong_cua_toi_${month}_${year}.csv`;
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

  // ── Render ────────────────────────────────────────────────────────────────
  const roleLabel = user?.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Tư vấn viên';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Lương của tôi</h1>
        <p className="text-slate-500">Xem chi tiết lương tháng</p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Tháng</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
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
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowDetailModal(true)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50"
          >
            Xem chi tiết
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Xuất CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : salaryData ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card: Vai trò */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Vai trò</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{roleLabel}</p>
          </div>

          {/* Card: Giờ dạy (chỉ INSTRUCTOR) */}
          {user?.role === 'INSTRUCTOR' && (
            <>
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Tổng giờ dạy</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {salaryData.totalTeachingHours || 0} giờ
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Số buổi dạy</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {salaryData.totalTeachingSessions || 0} buổi
                </p>
              </div>
            </>
          )}

          {/* Card: Hoa hồng */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Hoa hồng</p>
            <p className="mt-1 text-xl font-bold text-green-600">
              {fmt(salaryData.totalCommission)}
            </p>
          </div>

          {/* Card: Tổng lương */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Tổng lương</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">
              {fmt(salaryData.totalSalary)}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Không có dữ liệu lương
        </div>
      )}

      {/* Course Stats */}
      {salaryData?.courseCounts?.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Số hồ sơ theo khóa học</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {salaryData.courseCounts.map((cc, idx) => (
              <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">{cc.courseCode}</p>
                <p className="text-lg font-bold text-slate-900">{cc.count} hồ sơ</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && salaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Chi tiết lương {MONTHS.find(m => m.value === month)?.label}/{year}
            </h2>

            {/* Teaching Details */}
            {user?.role === 'INSTRUCTOR' && salaryData.teachingDetails?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-slate-800">Chi tiết giờ dạy</h3>
                <div className="max-h-60 overflow-y-auto rounded border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Ngày</th>
                        <th className="px-3 py-2 text-left">Ca</th>
                        <th className="px-3 py-2 text-left">Học viên</th>
                        <th className="px-3 py-2 text-right">Số giờ</th>
                        <th className="px-3 py-2 text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryData.teachingDetails.map((d, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            {new Date(d.date).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-3 py-2">Ca {d.timeSlot}</td>
                          <td className="px-3 py-2">{d.learnerName}</td>
                          <td className="px-3 py-2 text-right">{d.hours}</td>
                          <td className="px-3 py-2 text-right">{fmt(d.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Commission Details */}
            {salaryData.commissionDetails?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-slate-800">Chi tiết hoa hồng</h3>
                <div className="max-h-60 overflow-y-auto rounded border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Khóa học</th>
                        <th className="px-3 py-2 text-left">Học viên</th>
                        <th className="px-3 py-2 text-left">Ngày nhận</th>
                        <th className="px-3 py-2 text-right">Hoa hồng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryData.commissionDetails.map((d, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="px-3 py-2">{d.courseCode}</td>
                          <td className="px-3 py-2">{d.learnerName}</td>
                          <td className="px-3 py-2">
                            {new Date(d.registrationDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-3 py-2 text-right text-green-600">{fmt(d.commissionAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tổng giờ dạy:</span>
                <span className="font-medium">{salaryData.totalTeachingHours || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tổng hoa hồng:</span>
                <span className="font-medium text-green-600">{fmt(salaryData.totalCommission)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-900">Tổng lương:</span>
                <span className="font-bold text-indigo-600">{fmt(salaryData.totalSalary)}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50"
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

export default MySalary;

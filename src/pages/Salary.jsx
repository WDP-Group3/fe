import { useCallback, useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const fmt = (n) => formatCurrency(n || 0);

const KpiCard = ({ label, value, sub, color = 'text-slate-900' }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const Salary = () => {
  useAuthContext(); // access auth context to trigger re-renders on login/logout
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState(null);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [showDetail, setShowDetail] = useState(false);

  // Default: tháng trước
  const now = new Date();
  const prevMonth = now.getMonth(); // 0-indexed, Jan=0
  const prevMonthNum = prevMonth === 0 ? 12 : prevMonth;
  const prevYear = prevMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const [filters, setFilters] = useState({
    month: prevMonthNum,
    year: prevYear,
    courseId: '',
  });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await apiClient.get('/salary/courses');
        setCourses(res?.data || []);
      } catch {
        // ignore
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({
          month: filters.month,
          year: filters.year,
        });
        if (filters.courseId) params.append('courseId', filters.courseId);
        const res = await apiClient.get(`/salary/my?${params}`);
        setSalaryData(res?.data || null);
      } catch (err) {
        setError(err.message || 'Không thể tải dữ liệu lương');
        setSalaryData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters.month, filters.year, filters.courseId]);

  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        month: filters.month,
        year: filters.year,
      });
      if (filters.courseId) params.append('courseId', filters.courseId);
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/salary/my-export?${params}`;
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
      link.setAttribute('download', `luong_cua_toi_${filters.month}_${filters.year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      showToast('Xuất file thất bại', 'error');
    }
  }, [filters, showToast]);

  const summary = useMemo(() => {
    if (!salaryData) return null;
    const isInstructor = salaryData.role === 'INSTRUCTOR';
    const isConsultant = salaryData.role === 'CONSULTANT';

    const totalDocs = (salaryData.courseCounts || []).reduce((sum, c) => sum + (c.count || 0), 0);

    return {
      isInstructor,
      isConsultant,
      totalDocs,
      totalTeachingHours: salaryData.totalTeachingHours || 0,
      totalTeachingSessions: salaryData.totalTeachingSessions || 0,
      totalCommission: salaryData.totalCommission || 0,
      totalSalary: salaryData.totalSalary || 0,
      filterMonth: salaryData.filter?.month || filters.month,
      filterYear: salaryData.filter?.year || filters.year,
    };
  }, [salaryData, filters.month, filters.year]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="LƯƠNG CỦA TÔI"
        description="Theo dõi lương và chi tiết theo tháng"
      />

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Tháng</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters((f) => ({ ...f, month: Number(e.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Năm</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters((f) => ({ ...f, year: Number(e.target.value) }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Khóa học</label>
            <select
              value={filters.courseId}
              onChange={(e) => setFilters((f) => ({ ...f, courseId: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Tất cả khóa học</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowDetail(true)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Xem chi tiết
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          >
            Xuất CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : !salaryData ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
          Không có dữ liệu lương
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Tổng lương"
              value={fmt(summary.totalSalary)}
              sub={`${summary.filterMonth}/${summary.filterYear}`}
              color={summary.totalSalary < 0 ? 'text-red-500' : 'text-emerald-600'}
            />
            {summary.isInstructor && (
              <>
                <KpiCard
                  label="Giờ dạy"
                  value={summary.totalTeachingHours}
                  sub="Tổng giờ trong tháng"
                />
                <KpiCard
                  label="Số buổi"
                  value={summary.totalTeachingSessions}
                  sub="Buổi dạy hoàn thành"
                />
              </>
            )}
            {summary.isConsultant && (
              <KpiCard
                label="Số hồ sơ"
                value={summary.totalDocs}
                sub="Hồ sơ ghi nhận trong tháng"
              />
            )}
            <KpiCard
              label="Hoa hồng"
              value={fmt(summary.totalCommission)}
              sub="Tổng hoa hồng"
              color="text-indigo-600"
            />
          </div>

          {summary.isInstructor && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Chi tiết giờ dạy</h3>
              {salaryData.teachingDetails?.length ? (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {salaryData.teachingDetails.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">
                          {new Date(item.date).toLocaleDateString('vi-VN')} - Ca {item.timeSlot}
                        </p>
                        <p className="text-xs text-slate-500">{item.learnerName}</p>
                      </div>
                      <span className="font-semibold text-slate-900">{fmt(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Không có buổi dạy trong tháng</p>
              )}
            </div>
          )}

          {summary.isConsultant && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Chi tiết hoa hồng</h3>
              {salaryData.commissionDetails?.length ? (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {salaryData.commissionDetails.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{item.courseName}</p>
                        <p className="text-xs text-slate-500">
                          {item.learnerName} · {new Date(item.registrationDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <span className="font-semibold text-indigo-700">{fmt(item.commissionAmount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Không có hoa hồng trong tháng</p>
              )}
            </div>
          )}

          {salaryData.courseCounts?.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Thống kê theo khóa học</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {salaryData.courseCounts.map((c) => (
                  <div key={c.courseId} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-medium text-slate-800">{c.courseCode} - {c.courseName}</p>
                    <p className="text-xs text-slate-500">Số hồ sơ: {c.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetail && salaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Chi tiết lương Tháng {filters.month}/{filters.year}
            </h2>

            {summary.isInstructor && salaryData.teachingDetails?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-slate-800">Chi tiết giờ dạy</h3>
                <div className="max-h-60 overflow-y-auto rounded border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50">
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
                          <td className="px-3 py-2">{new Date(d.date).toLocaleDateString('vi-VN')}</td>
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

            {summary.isConsultant && salaryData.commissionDetails?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold text-slate-800">Chi tiết hoa hồng</h3>
                <div className="max-h-60 overflow-y-auto rounded border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50">
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
                          <td className="px-3 py-2">{new Date(d.registrationDate).toLocaleDateString('vi-VN')}</td>
                          <td className="px-3 py-2 text-right text-green-600">{fmt(d.commissionAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tổng giờ dạy:</span>
                <span className="font-medium">{summary.totalTeachingHours || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tổng hoa hồng:</span>
                <span className="font-medium text-green-600">{fmt(summary.totalCommission)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-900">Tổng lương:</span>
                <span className={`font-bold ${summary.totalSalary < 0 ? 'text-red-500' : 'text-indigo-600'}`}>{fmt(summary.totalSalary)}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDetail(false)}
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

export default Salary;

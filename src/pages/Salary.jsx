import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';

const fmt = (n) => formatCurrency(n || 0);

const KpiCard = ({ label, value, sub, color = 'text-slate-900' }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const Salary = () => {
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState(null);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await apiClient.get(`/salary/my?month=${filters.month}&year=${filters.year}`);
        setSalaryData(res?.data || null);
      } catch (err) {
        setError(err.message || 'Không thể tải dữ liệu lương');
        setSalaryData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters.month, filters.year]);

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
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.month}
            onChange={(e) => setFilters((f) => ({ ...f, month: Number(e.target.value) }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

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
              color="text-emerald-600"
            />
            {summary.isInstructor && (
              <KpiCard
                label="Giờ dạy"
                value={summary.totalTeachingHours}
                sub="Tổng giờ trong tháng"
              />
            )}
            {summary.isInstructor && (
              <KpiCard
                label="Số buổi"
                value={summary.totalTeachingSessions}
                sub="Buổi dạy hoàn thành"
              />
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
<></>
          {summary.isInstructor && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Chi tiết giờ dạy</h3>
              {salaryData.teachingDetails?.length ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {salaryData.teachingDetails.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">
                          {new Date(item.date).toLocaleDateString('vi-VN')} - Ca {item.timeSlot}
                        </p>
                        <p className="text-xs text-slate-500">{item.studentName}</p>
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
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Chi tiết hoa hồng</h3>
              {salaryData.commissionDetails?.length ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {salaryData.commissionDetails.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{item.courseName}</p>
                        <p className="text-xs text-slate-500">
                          {item.studentName} · {new Date(item.registrationDate).toLocaleDateString('vi-VN')}
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
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Thống kê theo khóa học</h3>
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
    </div>
  );
};

export default Salary;

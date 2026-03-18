import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { useAuthContext } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import Pagination from '../components/common/Pagination';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const PAYMENT_STATUS_MAP = {
  paid: { label: 'Đã đóng đủ', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  partial: { label: 'Đóng một phần', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  unpaid: { label: 'Chưa đóng', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  overdue: { label: 'Trễ hạn', cls: 'bg-red-100 text-red-700 border-red-200' },
};

const REG_STATUS_MAP = {
  NEW: { label: 'Mới', cls: 'bg-sky-100 text-sky-700' },
  PROCESSING: { label: 'Đang xử lý', cls: 'bg-amber-100 text-amber-700' },
  STUDYING: { label: 'Đang học', cls: 'bg-indigo-100 text-indigo-700' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Hủy', cls: 'bg-red-100 text-red-700' },
  WAITING: { label: 'Chờ lớp', cls: 'bg-purple-100 text-purple-700' },
};

const METHOD_LABELS = { CASH: 'Tiền mặt', TRANSFER: 'Chuyển khoản', ONLINE: 'Online' };

const initials = (name = '') =>
  name.split(' ').slice(-2).map((w) => w[0]?.toUpperCase()).join('');

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color = 'slate', icon }) {
  const colorMap = {
    slate: 'from-slate-50 to-white text-slate-700 border-slate-200',
    emerald: 'from-emerald-50 to-white text-emerald-700 border-emerald-200',
    amber: 'from-amber-50 to-white text-amber-700 border-amber-200',
    indigo: 'from-indigo-50 to-white text-indigo-700 border-indigo-200',
  };
  return (
    <div className={`flex items-center gap-3 rounded-2xl border bg-linear-to-br p-4 shadow-sm ${colorMap[color]}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium opacity-70">{label}</p>
        <p className="text-base font-bold">{value}</p>
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }) {
  const info = PAYMENT_STATUS_MAP[status] || PAYMENT_STATUS_MAP.unpaid;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${info.cls}`}>
      {info.label}
    </span>
  );
}

function FeePlanRow({ item, idx }) {
  const installAmt = Number(item.amount || 0);
  const isPaid = !!item.paymented;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 ${isPaid ? 'bg-emerald-50 border border-emerald-100' : 'bg-white border border-slate-100'}`}>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isPaid ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
          {idx + 1}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">{item.name || `Đợt ${idx + 1}`}</p>
          {item.dueDate && (
            <p className="text-xs text-slate-500">Hạn nộp: {fmtDate(item.dueDate)}</p>
          )}
          {item.note && <p className="text-xs text-slate-400 italic">{item.note}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold text-slate-800">{formatCurrency(installAmt)}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {isPaid ? '✓ Đã nộp' : '○ Chưa nộp'}
        </span>
      </div>
    </div>
  );
}

function PaymentHistoryRow({ payment }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-2.5 border border-slate-100">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-slate-800">{formatCurrency(payment.amount)}</p>
          <p className="text-xs text-slate-500">{fmtDate(payment.paidAt)} · {METHOD_LABELS[payment.method] || payment.method}</p>
        </div>
      </div>
      <div className="text-right">
        {payment.note && <p className="text-xs text-slate-400">{payment.note}</p>}
        <p className="text-xs text-slate-400">{payment.receivedBy === 'SYSTEM' ? '💻 Hệ thống' : '👤 Tư vấn viên'}</p>
      </div>
    </div>
  );
}

function LearnerRow({ item, expanded, onToggle }) {
  const pct = item.totalFee > 0 ? Math.min((item.paidAmount / item.totalFee) * 100, 100) : 0;

  return (
    <>
      {/* Main row */}
      <tr
        className={`group cursor-pointer border-b border-slate-100 transition-colors hover:bg-indigo-50/40 ${expanded ? 'bg-indigo-50/60' : ''}`}
        onClick={onToggle}
      >
        {/* Avatar + Name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {item.learnerAvatar ? (
              <img src={item.learnerAvatar} alt={item.learnerName} className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-sky-400 text-xs font-bold text-white shadow">
                {initials(item.learnerName)}
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800 text-sm">{item.learnerName}</p>
              <p className="text-xs text-slate-500">{item.learnerPhone}</p>
            </div>
          </div>
        </td>

        {/* Course */}
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-slate-700">{item.courseName}</p>
          <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 font-mono">{item.courseCode}</span>
        </td>

        {/* Progress bar */}
        <td className="px-4 py-3">
          <div className="w-32">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-500">{Math.round(pct)}%</span>
              <span className="text-slate-400">{formatCurrency(item.paidAmount)} / {formatCurrency(item.totalFee)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </td>

        {/* Remaining */}
        <td className="px-4 py-3">
          <p className={`text-sm font-bold ${item.remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {formatCurrency(item.remaining)}
          </p>
          {item.dueDate && (
            <p className={`text-xs ${item.isOverdue ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
              {item.isOverdue ? '⚠️ Trễ: ' : 'Hạn: '}{fmtDate(item.dueDate)}
            </p>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <PaymentStatusBadge status={item.paymentStatus} />
          <div className="mt-1">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${REG_STATUS_MAP[item.registrationStatus]?.cls || 'bg-slate-100 text-slate-600'}`}>
              {REG_STATUS_MAP[item.registrationStatus]?.label || item.registrationStatus}
            </span>
          </div>
        </td>

        {/* Expand toggle */}
        <td className="px-4 py-3 text-center">
          <button
            type="button"
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${expanded ? 'border-indigo-300 bg-indigo-100 text-indigo-700 rotate-180' : 'border-slate-200 bg-white text-slate-400 hover:border-indigo-200 hover:text-indigo-500'}`}
            onClick={onToggle}
            aria-label="Xem chi tiết"
          >
            <svg className="h-4 w-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-indigo-50/40 px-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Fee plan */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700">
                  <span>📋</span> Lịch đóng học phí ({item.feePlanSnapshot?.length || 0} đợt)
                </p>
                <div className="space-y-2">
                  {(item.feePlanSnapshot || []).length === 0 && (
                    <p className="text-xs text-slate-400">Chưa có lịch đóng phí.</p>
                  )}
                  {(item.feePlanSnapshot || []).map((fp, idx) => (
                    <FeePlanRow key={idx} item={fp} idx={idx} />
                  ))}
                </div>
              </div>

              {/* Payment history + info */}
              <div className="space-y-3">
                {/* Learner info */}
                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Thông tin học viên</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email</span>
                      <span className="font-medium text-slate-700">{item.learnerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hình thức</span>
                      <span className="font-medium text-slate-700">{item.paymentPlanType === 'FULL' ? 'Đóng 1 lần' : 'Trả góp'}</span>
                    </div>
                    {item.batchStartDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Khai giảng</span>
                        <span className="font-medium text-slate-700">{fmtDate(item.batchStartDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ngày đăng ký</span>
                      <span className="font-medium text-slate-700">{fmtDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Payments */}
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                    <span>💳</span> Lịch sử giao dịch ({item.payments?.length || 0})
                  </p>
                  <div className="space-y-1.5">
                    {(item.payments || []).length === 0 && (
                      <p className="text-xs text-slate-400">Chưa có giao dịch nào.</p>
                    )}
                    {(item.payments || []).map((p) => (
                      <PaymentHistoryRow key={p._id} payment={p} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const FeeSubmissions = () => {
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ totalFee: 0, paidAmount: 0, remaining: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  // Filters
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('limit', 10);
    if (search) params.set('search', search);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return params.toString();
  }, [currentPage, search, paymentStatus, dateFrom, dateTo]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/registrations/fee-submissions?${buildQuery()}`);
      if (res.status === 'success') {
        setItems(res.data?.items || []);
        setSummary({
          totalFee: res.data?.totalFee || 0,
          paidAmount: res.data?.paidAmount || 0,
          remaining: res.data?.remaining || 0,
        });
        setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
    setExpandedRows({});
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
    setExpandedRows({});
  };

  const toggleRow = (registrationId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [registrationId]: !prev[registrationId],
    }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setExpandedRows({});
  };

  const resetFilters = () => {
    setSearch('');
    setPaymentStatus('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    setExpandedRows({});
  };

  const hasFilters = search || paymentStatus || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            💰 Đợt nộp học phí
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin ? 'Xem toàn bộ đợt nộp học phí của tất cả học viên' : 'Danh sách học viên được phân công cho bạn'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Tổng học phí" value={formatCurrency(summary.totalFee)} color="indigo" icon="📚" />
        <SummaryCard label="Đã thu" value={formatCurrency(summary.paidAmount)} color="emerald" icon="✅" />
        <SummaryCard label="Còn lại" value={formatCurrency(summary.remaining)} color="amber" icon="⏰" />
        <SummaryCard label="Tổng học viên" value={`${pagination.total} người`} color="slate" icon="👥" />
      </div>

      {/* Main Card */}
      <div className="rounded-3xl border border-slate-100 bg-white/90 shadow-sm backdrop-blur overflow-hidden">

        {/* Filter bar */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                id="fee-search"
                type="text"
                placeholder="Tìm theo tên, SĐT, khoá học..."
                value={search}
                onChange={handleSearch}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-all"
              />
            </div>

            {/* Payment status filter */}
            <select
              id="fee-status-filter"
              value={paymentStatus}
              onChange={handleFilterChange(setPaymentStatus)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="paid">Đã đóng đủ</option>
              <option value="partial">Đóng một phần</option>
              <option value="unpaid">Chưa đóng</option>
              <option value="overdue">Trễ hạn</option>
            </select>

            {/* Date from */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 whitespace-nowrap">Từ ngày</span>
              <input
                type="date"
                value={dateFrom}
                onChange={handleFilterChange(setDateFrom)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
              />
            </div>

            {/* Date to */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 whitespace-nowrap">Đến ngày</span>
              <input
                type="date"
                value={dateTo}
                onChange={handleFilterChange(setDateTo)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
              />
            </div>

            {/* Reset filters */}
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Xóa bộ lọc
              </button>
            )}

            <div className="ml-auto text-xs text-slate-400">
              {pagination.total} kết quả · Trang {pagination.page}/{pagination.totalPages || 1}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <svg className="h-12 w-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium">
              {hasFilters ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dữ liệu đợt nộp học phí.'}
            </p>
            {hasFilters && (
              <button onClick={resetFilters} className="text-xs text-indigo-600 hover:underline">
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Học viên</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Khóa học</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tiến độ</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Còn lại</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-center">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <LearnerRow
                      key={String(item.registrationId)}
                      item={item}
                      expanded={!!expandedRows[String(item.registrationId)]}
                      onToggle={() => toggleRow(String(item.registrationId))}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-slate-100 px-6 py-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeeSubmissions;

import { useState, useEffect, useMemo } from 'react';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => formatCurrency(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

// Lấy đợt quá hạn đầu tiên (nếu có)
const getFirstOverdueInstallment = (item) => {
  const schedule = item.paymentSchedule || [];
  const now = new Date();
  for (const s of schedule) {
    if (!s.paymented && s.dueDate && new Date(s.dueDate) < now) {
      return s;
    }
  }
  return null;
};

// Payment status helper — uses Number() coercion and a grace threshold to avoid
// floating-point and type-mismatch inconsistencies between frontend and backend.
const PAYMENT_GRACE = 1000; // VND; amounts below this are considered "paid"
const getPaymentStatus = (item) => {
  const remaining = Number(item.remaining || 0);
  const paidAmount = Number(item.paidAmount || 0);
  if (remaining <= PAYMENT_GRACE) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'unpaid';
};

// ── Inline notify button ───────────────────────────────────────────────────────
const InlineNotifyBtn = ({ item, onNotify }) => {
  const [sending, setSending] = useState(false);

  const handleClick = async () => {
    setSending(true);
    try {
      await onNotify(item);
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={sending}
      className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
      title="Gửi nhắc nhở"
    >
      {sending ? '...' : 'Nhắc'}
    </button>
  );
};
const KpiCard = ({ label, value, sub, color = 'text-slate-900', bgColor = '' }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ${bgColor}`}>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const AdminPayments = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tuitionData, setTuitionData] = useState({ items: [], summary: {} });
  const [transactions, setTransactions] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  // Filters
  const [filters, setFilters] = useState({
    status: '', // '', 'paid', 'partial', 'unpaid', 'overdue'
    search: '',
  });

  // Modal states
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [notifyForm, setNotifyForm] = useState({ message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [filters.status, filters.search, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[AdminPayments] Loading data with filters:', filters);

      // Build query params
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      params.append('page', currentPage);
      params.append('limit', 10);

      const queryString = params.toString();
      console.log('[AdminPayments] Query:', queryString);

      const [tuitionRes, transactionsRes] = await Promise.all([
        apiClient.get(`/payments/tuition-info?${queryString}`),
        apiClient.get('/payments/transactions'),
      ]);

      console.log('[AdminPayments] tuitionRes:', tuitionRes);
      console.log('[AdminPayments] transactionsRes:', transactionsRes?.data?.length || 0, 'transactions');

      // Handle different response structures
      const tuitionItems = tuitionRes?.status === 'success'
        ? tuitionRes?.data?.items || []
        : tuitionRes?.data?.data?.items || [];
      const tuitionSummary = tuitionRes?.status === 'success'
        ? tuitionRes?.data || {}
        : tuitionRes?.data?.data || {};

      console.log('[AdminPayments] tuitionItems:', tuitionItems.length, 'items');

      setTuitionData({
        items: tuitionItems,
        summary: tuitionSummary,
      });
      if (tuitionSummary.pagination) {
        setPagination(tuitionSummary.pagination);
      }
      setTransactions(transactionsRes?.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const stats = useMemo(() => {
    const items = tuitionData.items || [];
    const totalFee = items.reduce((sum, i) => sum + (i.totalFee || 0), 0);
    const paidAmount = items.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const remaining = items.reduce((sum, i) => sum + (i.remaining || 0), 0);
    const overdue = items.filter(i => i.isOverdue).length;
    const paid = items.filter(i => getPaymentStatus(i) === 'paid').length;
    const partial = items.filter(i => getPaymentStatus(i) === 'partial').length;
    const unpaid = items.filter(i => getPaymentStatus(i) === 'unpaid').length;

    // This month
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const thisMonthTransactions = transactions.filter(t => {
      const d = new Date(t.paidAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && t.status === 'completed';
    });
    const thisMonthRevenue = thisMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      totalFee,
      paidAmount,
      remaining,
      overdue,
      paid,
      partial,
      unpaid,
      thisMonthRevenue,
    };
  }, [tuitionData, transactions]);

  // Filtered data is now handled by server
  const filteredItems = tuitionData.items;

  // Table columns
  const columns = [
    {
      key: 'learnerName',
      title: 'Học viên',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-900">{row.learnerName || '—'}</p>
          <p className="text-xs text-slate-500">{row.phone || ''}</p>
        </div>
      ),
    },
    {
      key: 'courseName',
      title: 'Khoá học',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-900">{row.courseName || '—'}</p>
          <p className="text-xs text-slate-500">{row.courseCode || ''}</p>
        </div>
      ),
    },
    {
      key: 'batchName',
      title: 'Lớp',
      render: (_, row) => <span className="text-indigo-600 font-medium">{row.batchName || '—'}</span>,
    },
    {
      key: 'totalFee',
      title: 'Tổng phí',
      render: (_, row) => <span className="font-semibold">{fmt(row.totalFee)}</span>,
    },
    {
      key: 'paidAmount',
      title: 'Đã đóng',
      render: (_, row) => <span className="text-emerald-600 font-medium">{fmt(row.paidAmount)}</span>,
    },
    {
      key: 'remaining',
      title: 'Còn lại',
      render: (_, row) => {
        const status = getPaymentStatus(row);
        const overdueInstallment = getFirstOverdueInstallment(row);
        return (
          <div>
            <span className={status === 'paid' ? 'text-emerald-600 font-medium' : row.isOverdue ? 'text-red-600 font-bold' : 'text-amber-600 font-medium'}>
              {fmt(row.remaining)}
            </span>
            {overdueInstallment && (
              <div className="text-xs text-red-500 mt-0.5 font-medium">
                ⚠️ {overdueInstallment.name || `Đợt ${(row.paymentSchedule || []).indexOf(overdueInstallment) + 1}`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'dueDate',
      title: 'Hạn kế tiếp',
      render: (_, row) => {
        if (row.remaining <= 0) return <span className="text-emerald-500">—</span>;
        const schedule = row.paymentSchedule || [];
        // Tìm đợt chưa đóng đầu tiên
        const next = schedule.find(s => !s.paymented);
        if (!next) return <span className="text-slate-400">—</span>;
        const isOver = next.dueDate && new Date(next.dueDate) < new Date();
        return (
          <div>
            <span className={isOver ? 'text-red-500 font-medium' : 'text-slate-700'}>
              {next.dueDate ? fmtDate(next.dueDate) : '—'}
            </span>
            {isOver && <div className="text-xs text-red-400">Quá hạn</div>}
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (_, row) => {
        if (row.remaining <= 0) return <span className="text-slate-400">—</span>;
        return (
          <InlineNotifyBtn
            item={row}
            onNotify={async (item) => {
              const overdue = getFirstOverdueInstallment(item);
              const msg = overdue
                ? `Hệ thống nhắc nhở: Đợt "${overdue.name}" đã quá hạn. Số tiền: ${fmt(overdue.amount)} VND. Vui lòng thanh toán sớm nhất có thể.`
                : `Hệ thống nhắc nhở: Bạn có học phí còn lại ${fmt(item.remaining)} VND. Vui lòng thanh toán sớm nhất có thể.`;
              await apiClient.post('/notifications', {
                type: 'PAYMENT_REMINDER',
                title: 'Nhắc đóng học phí',
                message: msg,
                userId: item.learnerId?._id || item.learnerId,
                expirationDays: 7,
              });
              showToast(`Đã gửi nhắc nhở tới ${item.learnerName}`, 'success');
            }}
          />
        );
      },
    },
  ];

  // Handlers
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      await apiClient.post('/notifications', {
        type: 'PAYMENT_REMINDER',
        title: 'Nhắc đóng học phí',
        message: notifyForm.message.trim() || `Học viên {name} có học phí cần thanh toán: ${fmt(selectedItem.remaining)}`,
        userId: selectedItem.learnerId?._id || selectedItem.learnerId,
        expirationDays: 7,
      });
      await loadData();
      setShowNotifyModal(false);
      showToast('Đã gửi thông báo', 'success');
    } catch (error) {
      showToast(error.message || 'Gửi thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="QUẢN LÝ HỌC PHÍ"
        description="Theo dõi tình trạng đóng phí của học viên và gửi nhắc nhở thanh toán"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Tổng học phí"
          value={fmt(stats.totalFee)}
          sub={`${stats.items?.length || 0} học viên`}
        />
        <KpiCard
          label="Đã thu"
          value={fmt(stats.paidAmount)}
          sub={`${stats.paid} học viên đã đóng`}
          color="text-emerald-600"
        />
        <KpiCard
          label="Còn nợ"
          value={fmt(stats.remaining)}
          sub={`${stats.partial + stats.unpaid} học viên`}
          color={stats.overdue > 0 ? 'text-red-600' : 'text-amber-600'}
        />
        <KpiCard
          label="Thu tháng này"
          value={fmt(stats.thisMonthRevenue)}
          sub={`${new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`}
          color="text-indigo-600"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
          <p className="text-xs text-emerald-700">Đã đóng</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
          <p className="text-xs text-amber-700">Còn nợ</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-2xl font-bold text-slate-600">{stats.unpaid}</p>
          <p className="text-xs text-slate-600">Chưa đóng</p>
        </div>
        <div className="rounded-xl bg-red-50 p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          <p className="text-xs text-red-700">Quá hạn</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 min-w-[200px] gap-2">
            <input
              type="text"
              placeholder=", khóa học..."
              value={filters.search}
              onChange={(e) => {
                setFilters(f => ({ ...f, search: e.target.value }));
                setCurrentPage(1);
              }}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              onClick={() => { setCurrentPage(1); loadData(); }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Tìm
            </button>
          </div>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters(f => ({ ...f, status: e.target.value }));
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="paid">Đã đóng</option>
            <option value="partial">Còn nợ</option>
            <option value="unpaid">Chưa đóng</option>
            <option value="overdue">Quá hạn</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="px-4 pt-4 text-xs text-slate-500">
              Hiển thị {filteredItems.length} trên tổng số {pagination.total} kết quả
            </div>
            <DataTable columns={columns} data={filteredItems} />
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

      {/* Notify Modal */}
      {showNotifyModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Gửi nhắc nhở</h3>
            <p className="text-sm text-slate-600 mb-4">
              Gửi đến: {selectedItem.learnerName} ({selectedItem.email || selectedItem.learnerId?.email || '—'})
            </p>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung</label>
                <textarea
                  value={notifyForm.message}
                  onChange={(e) => setNotifyForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={4}
                  placeholder={`Nhắc nhở thanh toán học phí còn lại: ${fmt(selectedItem.remaining)}`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;

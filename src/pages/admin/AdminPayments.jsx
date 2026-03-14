import { useState, useEffect, useMemo } from 'react';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => formatCurrency(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color = 'text-slate-900', bgColor = '' }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ${bgColor}`}>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const AdminPayments = () => {
  const [loading, setLoading] = useState(true);
  const [tuitionData, setTuitionData] = useState({ items: [], summary: {} });
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    courseId: '',
    batchId: '',
    status: '', // '', 'paid', 'partial', 'unpaid', 'overdue'
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  // Modal states
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dueDateForm, setDueDateForm] = useState({
    scheduleIndex: 0,
    dueDate: '',
    name: '',
    amount: '',
    note: '',
  });
  const [notifyForm, setNotifyForm] = useState({ message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[AdminPayments] Loading data...');

      const [tuitionRes, coursesRes, batchesRes, transactionsRes] = await Promise.all([
        apiClient.get('/payments/tuition-info'),
        apiClient.get('/courses'),
        apiClient.get('/batches'),
        apiClient.get('/payments/transactions'),
      ]);

      console.log('[AdminPayments] tuitionRes:', tuitionRes);
      console.log('[AdminPayments] coursesRes:', coursesRes?.data?.data?.length || 0, 'courses');
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
      setCourses(coursesRes?.data?.data || []);
      setBatches(batchesRes?.data?.data || []);
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
    const paid = items.filter(i => i.remaining === 0).length;
    const partial = items.filter(i => i.remaining > 0 && i.paidAmount > 0).length;
    const unpaid = items.filter(i => i.paidAmount === 0).length;

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

  // Filtered data
  const filteredItems = useMemo(() => {
    let items = [...(tuitionData.items || [])];

    if (filters.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(i =>
        (i.studentName || '').toLowerCase().includes(s) ||
        (i.courseName || '').toLowerCase().includes(s) ||
        (i.phone || '').includes(s)
      );
    }

    if (filters.courseId) {
      items = items.filter(i => i.courseId === filters.courseId);
    }

    if (filters.batchId) {
      items = items.filter(i => i.batchId === filters.batchId);
    }

    if (filters.status) {
      switch (filters.status) {
        case 'paid':
          items = items.filter(i => i.remaining === 0);
          break;
        case 'partial':
          items = items.filter(i => i.remaining > 0 && i.paidAmount > 0);
          break;
        case 'unpaid':
          items = items.filter(i => i.paidAmount === 0);
          break;
        case 'overdue':
          items = items.filter(i => i.isOverdue);
          break;
      }
    }

    if (filters.dateFrom) {
      items = items.filter(i => i.dueDate && new Date(i.dueDate) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      items = items.filter(i => i.dueDate && new Date(i.dueDate) <= new Date(filters.dateTo));
    }

    return items;
  }, [tuitionData, filters]);

  // Table columns
  const columns = [
    {
      key: 'studentName',
      title: 'Học viên',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-900">{row.studentName || '—'}</p>
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
      render: (_, row) => (
        <span className={row.isOverdue ? 'text-red-600 font-bold' : 'text-amber-600 font-medium'}>
          {fmt(row.remaining)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      title: 'Hạn nộp',
      render: (_, row) => (
        <div>
          <p className={row.isOverdue ? 'text-red-600 font-medium' : ''}>{fmtDate(row.dueDate)}</p>
          {row.isOverdue && <span className="text-xs text-red-500">Quá hạn</span>}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, row) => {
        if (row.remaining === 0) {
          return <StatusBadge status="COMPLETED" label="Đã đóng" />;
        }
        if (row.isOverdue) {
          return <StatusBadge status="OVERDUE" label="Quá hạn" />;
        }
        if (row.paidAmount > 0) {
          return <StatusBadge status="PENDING" label="Còn nợ" />;
        }
        return <StatusBadge status="UNPAID" label="Chưa đóng" />;
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openDueDateModal(row)}
            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
          >
            Đặt hạn
          </button>
          <button
            onClick={() => openNotifyModal(row)}
            className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Gửi nhắc
          </button>
        </div>
      ),
    },
  ];

  // Handlers
  const openDueDateModal = (item) => {
    setSelectedItem(item);
    const nextSchedule = (item.paymentSchedule || [])[0];
    setDueDateForm({
      scheduleIndex: 0,
      dueDate: nextSchedule?.dueDate ? nextSchedule.dueDate.split('T')[0] : '',
      name: nextSchedule?.name || '',
      amount: nextSchedule?.amount || item.remaining || '',
      note: nextSchedule?.note || '',
    });
    setShowDueDateModal(true);
  };

  const openNotifyModal = (item) => {
    setSelectedItem(item);
    setNotifyForm({ message: '' });
    setShowNotifyModal(true);
  };

  const handleUpdateDueDate = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      await apiClient.post('/payments/upsert-due-date', {
        registrationId: selectedItem.registrationId,
        scheduleIndex: dueDateForm.scheduleIndex,
        dueDate: dueDateForm.dueDate,
        name: dueDateForm.name,
        amount: dueDateForm.amount ? Number(dueDateForm.amount) : undefined,
        note: dueDateForm.note,
      });
      await loadData();
      setShowDueDateModal(false);
      alert('Đã cập nhật hạn thanh toán');
    } catch (error) {
      alert(error.message || 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      await apiClient.post('/notifications', {
        type: 'PAYMENT_REMINDER',
        title: 'Nhắc đóng học phí',
        message: notifyForm.message.trim() || `Học viên {name} có học phí cần thanh toán: ${fmt(selectedItem.remaining)}`,
        userId: selectedItem.studentId?._id || selectedItem.studentId,
        expirationDays: 7,
      });
      await loadData();
      setShowNotifyModal(false);
      alert('Đã gửi thông báo');
    } catch (error) {
      alert(error.message || 'Gửi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickExtend = async (days) => {
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      await apiClient.post('/payments/upsert-due-date', {
        registrationId: selectedItem.registrationId,
        scheduleIndex: 0,
        dueDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        note: `Admin gia hạn ${days} ngày`,
      });
      await loadData();
      setShowDueDateModal(false);
      alert('Đã gia hạn');
    } catch (error) {
      alert(error.message || 'Gia hạn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="QUẢN LÝ HỌC PHÍ"
        description="Quản lý học phí, theo dõi công nợ và gửi nhắc nhở"
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
              placeholder="Tìm học viên, khóa học, SĐT..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              onClick={loadData}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Tìm
            </button>
          </div>

          <select
            value={filters.courseId}
            onChange={(e) => setFilters(f => ({ ...f, courseId: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tất cả khóa học</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="paid">Đã đóng</option>
            <option value="partial">Còn nợ</option>
            <option value="unpaid">Chưa đóng</option>
            <option value="overdue">Quá hạn</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Từ ngày"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Đến ngày"
          />

          <button
            onClick={() => setFilters({ courseId: '', batchId: '', status: '', search: '', dateFrom: '', dateTo: '' })}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            Xóa lọc
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredItems} />
        )}
      </div>

      {/* Due Date Modal */}
      {showDueDateModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Đặt hạn thanh toán</h3>
            <p className="text-sm text-slate-600 mb-4">
              {selectedItem.studentName} - {selectedItem.courseName}
            </p>
            <form onSubmit={handleUpdateDueDate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên đợt</label>
                <input
                  type="text"
                  value={dueDateForm.name}
                  onChange={(e) => setDueDateForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Đợt 1, Đợt 2..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền</label>
                  <input
                    type="number"
                    value={dueDateForm.amount}
                    onChange={(e) => setDueDateForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hạn nộp</label>
                  <input
                    type="date"
                    value={dueDateForm.dueDate}
                    onChange={(e) => setDueDateForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  value={dueDateForm.note}
                  onChange={(e) => setDueDateForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleQuickExtend(7)} className="flex-1 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">
                  +7 ngày
                </button>
                <button type="button" onClick={() => handleQuickExtend(14)} className="flex-1 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">
                  +14 ngày
                </button>
                <button type="button" onClick={() => handleQuickExtend(30)} className="flex-1 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">
                  +30 ngày
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDueDateModal(false)}
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

      {/* Notify Modal */}
      {showNotifyModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Gửi nhắc nhở</h3>
            <p className="text-sm text-slate-600 mb-4">
              Gửi đến: {selectedItem.studentName} ({selectedItem.email || selectedItem.studentId?.email || '—'})
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

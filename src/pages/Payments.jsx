import { useState, useEffect, useRef } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';
import { useAuthContext } from '../context/AuthContext';

const Payments = () => {
  const { user } = useAuthContext();
  const [payments, setPayments] = useState([]);
  const [tuitionInfo, setTuitionInfo] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dueDateSubmitting, setDueDateSubmitting] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    registrationId: '',
    amount: '',
    method: 'TRANSFER',
    note: '',
  });

  const [studentExtendForm, setStudentExtendForm] = useState({
    registrationId: '',
    scheduleIndex: 0,
    extendedDays: 7,
    reason: '',
  });

  const [adminDueDateForm, setAdminDueDateForm] = useState({
    registrationId: '',
    scheduleIndex: '',
    dueDate: '',
    name: '',
    amount: '',
    note: '',
  });

  const [qrForm, setQrForm] = useState({
    amount: '',
    orderInfo: '',
  });
  const [creatingQr, setCreatingQr] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [paymentTransferContent, setPaymentTransferContent] = useState('');
  const [selectedRegistrationForQr, setSelectedRegistrationForQr] = useState('');
  const [currentTransactionId, setCurrentTransactionId] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('idle');
  const [transactions, setTransactions] = useState([]);
  const pollRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsResponse, tuitionResponse, transactionResponse] = await Promise.all([
        apiClient.get('/payments'),
        apiClient.get('/payments/tuition-info'),
        apiClient.get('/payments/transactions'),
      ]);

      if (paymentsResponse.status === 'success') {
        setPayments(paymentsResponse.data || []);
      }

      if (tuitionResponse.status === 'success') {
        const info = tuitionResponse.data;
        setTuitionInfo(info);

        const defaultRegId = info?.items?.[0]?.registrationId || '';
        setStudentExtendForm((prev) => ({ ...prev, registrationId: prev.registrationId || defaultRegId }));
        setAdminDueDateForm((prev) => ({ ...prev, registrationId: prev.registrationId || defaultRegId }));

        const aiRes = await apiClient.post('/payments/ai-suggestion', {
          totalFee: info.totalFee,
          paidAmount: info.paidAmount,
          remaining: info.remaining,
        });
        if (aiRes.status === 'success') {
          setAiSuggestion(aiRes.data);
        }
      }

      if (transactionResponse.status === 'success') {
        setTransactions(transactionResponse.data || []);
      }
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.registrationId || !paymentForm.amount) {
      alert('Vui lòng chọn hồ sơ và nhập số tiền');
      return;
    }

    try {
      setSubmitting(true);
      const paymentRes = await apiClient.post('/payments', {
        registrationId: paymentForm.registrationId,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        receivedBy: 'CONSULTANT',
        note: paymentForm.note,
      });

      const paymentId = paymentRes?.data?._id;
      if (paymentId) {
        await apiClient.post(`/invoices/from-payment/${paymentId}`, {});
      }

      setPaymentForm({ registrationId: '', amount: '', method: 'TRANSFER', note: '' });
      await loadData();
      alert('Đã ghi nhận giao dịch học phí và tạo hóa đơn tự động');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Tạo giao dịch thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentExtend = async (e) => {
    e.preventDefault();
    if (!studentExtendForm.registrationId) {
      alert('Vui lòng chọn hồ sơ cần gia hạn');
      return;
    }

    try {
      setDueDateSubmitting(true);
      await apiClient.post('/payments/extend-due-date', {
        registrationId: studentExtendForm.registrationId,
        scheduleIndex: Number(studentExtendForm.scheduleIndex),
        extendedDays: Number(studentExtendForm.extendedDays),
        reason: studentExtendForm.reason,
      });
      await loadData();
      alert('Đã gia hạn hạn thanh toán thành công');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Gia hạn thất bại');
    } finally {
      setDueDateSubmitting(false);
    }
  };

  const handleAdminUpsertDueDate = async (e) => {
    e.preventDefault();
    if (!adminDueDateForm.registrationId || !adminDueDateForm.dueDate) {
      alert('Vui lòng chọn hồ sơ và nhập hạn thanh toán');
      return;
    }

    try {
      setDueDateSubmitting(true);
      await apiClient.post('/payments/upsert-due-date', {
        registrationId: adminDueDateForm.registrationId,
        scheduleIndex:
          adminDueDateForm.scheduleIndex === '' ? undefined : Number(adminDueDateForm.scheduleIndex),
        dueDate: adminDueDateForm.dueDate,
        name: adminDueDateForm.name,
        amount: adminDueDateForm.amount === '' ? undefined : Number(adminDueDateForm.amount),
        note: adminDueDateForm.note,
      });
      await loadData();
      alert('Đã cập nhật hạn thanh toán');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Cập nhật hạn thất bại');
    } finally {
      setDueDateSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const confirmed = window.confirm('Bạn chắc chắn muốn xóa giao dịch này?');
    if (!confirmed) return;

    try {
      await apiClient.delete(`/payments/${paymentId}`);
      await loadData();
      alert('Đã xóa giao dịch thành công');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Xóa giao dịch thất bại');
    }
  };

  const startPollingTransaction = (transactionId) => {
    if (!transactionId) return;

    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    pollRef.current = setInterval(async () => {
      try {
        const statusRes = await apiClient.get(`/payments/transaction-status/${transactionId}`);
        const paymentStatus = statusRes?.data?.paymentStatus || 'pending';
        setTransactionStatus(paymentStatus);

        if (paymentStatus === 'completed') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          await loadData();
          alert('Thanh toán đã được xác nhận. Hệ thống đã cập nhật học phí.');
        }
      } catch (e) {
        // ignore single polling errors
      }
    }, 5000);
  };

  const handleCreateQr = async (e) => {
    e.preventDefault();

    if (!qrForm.amount || Number(qrForm.amount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      setCreatingQr(true);
      setPaymentQrUrl('');
      setPaymentTransferContent('');
      setCurrentTransactionId('');
      setTransactionStatus('pending');

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }

      const response = await apiClient.post('/payments/create-qr', {
        vnp_Amount: Number(qrForm.amount),
        vnp_OrderInfo: qrForm.orderInfo || `Thanh toan hoc phi ${new Date().toLocaleDateString('vi-VN')}`,
        user: user?.id,
        registrationId: selectedRegistrationForQr || undefined,
      });

      const qrUrl = response?.data?.paymentUrl || response?.paymentUrl || '';
      const transferContent = response?.data?.transferContent || '';
      const transactionId = response?.data?.transactionId || '';

      if (qrUrl) {
        setPaymentQrUrl(qrUrl);
        setPaymentTransferContent(transferContent);
        setCurrentTransactionId(transactionId);
        startPollingTransaction(transactionId);
      } else {
        alert('Đã tạo QR nhưng không đọc được đường dẫn thanh toán.');
      }
    } catch (error) {
      console.error(error);
      alert(error.message || 'Tạo QR thanh toán thất bại');
    } finally {
      setCreatingQr(false);
    }
  };

  const handleConfirmTransaction = async (transactionId) => {
    try {
      await apiClient.patch(`/payments/transactions/${transactionId}/confirm`, {});
      if (currentTransactionId === transactionId) {
        setTransactionStatus('completed');
      }
      await loadData();
      alert('Đã xác nhận giao dịch thành công');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Xác nhận giao dịch thất bại');
    }
  };

  const canCollect = ['ADMIN', 'CONSULTANT'].includes(user?.role);
  const isStudent = user?.role === 'STUDENT';

  const columns = [
    { key: 'title', title: 'Mã GD', dataIndex: '_id' },
    { key: 'amount', title: 'Số tiền', dataIndex: 'amount', render: (val) => formatCurrency(val) },
    {
      key: 'paidAt',
      title: 'Ngày thanh toán',
      dataIndex: 'paidAt',
      render: (val) => (val ? new Date(val).toLocaleDateString('vi-VN') : 'Chưa có'),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      dataIndex: 'method',
      render: () => <StatusBadge status="paid" label="Đã thu" />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (_, row) => (
        canCollect ? (
          <button
            type="button"
            onClick={() => handleDeletePayment(row._id)}
            className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Xóa
          </button>
        ) : null
      ),
    },
  ];

  const scheduleColumns = [
    { key: 'courseName', title: 'Khoá học', dataIndex: 'courseName' },
    { key: 'totalFee', title: 'Tổng phí', dataIndex: 'totalFee', render: (val) => formatCurrency(val) },
    { key: 'paidAmount', title: 'Đã đóng', dataIndex: 'paidAmount', render: (val) => formatCurrency(val) },
    {
      key: 'remaining',
      title: 'Còn lại',
      dataIndex: 'remaining',
      render: (val, row) => (
        <span className={row.isOverdue ? 'font-semibold text-red-600' : 'text-slate-800'}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'dueDate',
      title: 'Hạn thanh toán',
      dataIndex: 'dueDate',
      render: (val, row) => {
        if (!val) return 'Chưa có';
        return (
          <span className={row.isOverdue ? 'font-semibold text-red-600' : 'text-slate-700'}>
            {new Date(val).toLocaleDateString('vi-VN')}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Tuition / Wallet"
          description="Xem tổng phí, đã đóng, công nợ còn lại và lịch thanh toán"
        />

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs font-semibold text-slate-600">Total Fee</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(tuitionInfo?.totalFee || 0)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">Paid</p>
                <p className="mt-1 text-base font-semibold text-emerald-700">{formatCurrency(tuitionInfo?.paidAmount || 0)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">Remaining</p>
                <p className={`mt-1 text-base font-semibold ${tuitionInfo?.isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                  {formatCurrency(tuitionInfo?.remaining || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">Due Date</p>
                <p className={`mt-1 text-base font-semibold ${tuitionInfo?.isOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                  {tuitionInfo?.dueDate ? new Date(tuitionInfo.dueDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                </p>
              </div>
            </div>

            {aiSuggestion && (
              <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
                <p className="font-semibold">AI đề xuất</p>
                <p>{aiSuggestion.message}</p>
              </div>
            )}

            <DataTable columns={scheduleColumns} data={tuitionInfo?.items || []} />
          </>
        )}
      </div>

      {isStudent && (
        <>
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
            <SectionHeader title="Thanh toán qua QR" description="Tạo link VNPay để thanh toán học phí" />
            <form onSubmit={handleCreateQr} className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={selectedRegistrationForQr}
                onChange={(e) => setSelectedRegistrationForQr(e.target.value)}
              >
                <option value="">-- Chọn khóa học (khuyến nghị) --</option>
                {(tuitionInfo?.items || []).map((item) => (
                  <option key={item.registrationId} value={item.registrationId}>
                    [{item.courseCode || 'N/A'}] [{item.courseCode || 'N/A'}] {item.courseName} - Còn nợ {formatCurrency(item.remaining)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1000"
                placeholder="Số tiền cần thanh toán"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={qrForm.amount}
                onChange={(e) => setQrForm((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
              <input
                placeholder="Nội dung thanh toán"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={qrForm.orderInfo}
                onChange={(e) => setQrForm((prev) => ({ ...prev, orderInfo: e.target.value }))}
              />
              <button
                type="submit"
                disabled={creatingQr}
                className="md:col-span-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {creatingQr ? 'Đang tạo QR...' : 'Tạo QR thanh toán'}
              </button>
            </form>

            {paymentQrUrl && (
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm">
                <p className="font-semibold text-indigo-900">Link thanh toán đã tạo</p>
                <a href={paymentQrUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-indigo-700 underline">
                  {paymentQrUrl}
                </a>
                {paymentTransferContent && (
                  <p className="mt-2 text-xs text-slate-700">
                    Nội dung chuyển khoản (bắt buộc đúng):
                    <span className="ml-1 rounded bg-white px-2 py-1 font-semibold text-indigo-700">{paymentTransferContent}</span>
                  </p>
                )}
                {currentTransactionId && (
                  <p className="mt-2 text-xs text-slate-700">
                    Trạng thái giao dịch:
                    <span className={`ml-1 rounded px-2 py-1 font-semibold ${transactionStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {transactionStatus === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                    </span>
                  </p>
                )}
                <div className="mt-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentQrUrl)}`}
                    alt="QR thanh toán"
                    className="h-40 w-40 rounded-lg border border-slate-200 bg-white p-2"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
            <SectionHeader title="Gia hạn hạn thanh toán" description="Học viên có thể xin gia hạn hạn đóng phí" />
            <form onSubmit={handleStudentExtend} className="grid gap-3 md:grid-cols-2">
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={studentExtendForm.registrationId}
              onChange={(e) => setStudentExtendForm((prev) => ({ ...prev, registrationId: e.target.value }))}
              required
            >
              <option value="">-- Chọn khóa học --</option>
              {(tuitionInfo?.items || []).map((item) => (
                <option key={item.registrationId} value={item.registrationId}>
                  [{item.courseCode || 'N/A'}] {item.courseName}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="30"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={studentExtendForm.extendedDays}
              onChange={(e) => setStudentExtendForm((prev) => ({ ...prev, extendedDays: e.target.value }))}
              placeholder="Số ngày gia hạn"
              required
            />
            <input
              type="number"
              min="0"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={studentExtendForm.scheduleIndex}
              onChange={(e) => setStudentExtendForm((prev) => ({ ...prev, scheduleIndex: e.target.value }))}
              placeholder="Index đợt cần gia hạn (0,1,2...)"
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={studentExtendForm.reason}
              onChange={(e) => setStudentExtendForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Lý do gia hạn"
            />
            <button
              type="submit"
              disabled={dueDateSubmitting}
              className="md:col-span-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {dueDateSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu gia hạn'}
            </button>
          </form>
        </div>
        </>
      )}

      {canCollect && (
        <>
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
            <SectionHeader title="Chỉnh / Add hạn thanh toán" description="Admin/Sale chỉnh hạn từng đợt hoặc thêm đợt mới" />
            <form onSubmit={handleAdminUpsertDueDate} className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.registrationId}
                onChange={(e) => setAdminDueDateForm((prev) => ({ ...prev, registrationId: e.target.value }))}
                required
              >
                <option value="">-- Chọn khóa học --</option>
                {(tuitionInfo?.items || []).map((item) => (
                  <option key={item.registrationId} value={item.registrationId}>
                    {item.studentName ? `${item.studentName} - ` : ''}[{item.courseCode || 'N/A'}] {item.courseName}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.dueDate}
                onChange={(e) => setAdminDueDateForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                required
              />
              <input
                type="number"
                min="0"
                placeholder="Index đợt (để trống = add mới)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.scheduleIndex}
                onChange={(e) => setAdminDueDateForm((prev) => ({ ...prev, scheduleIndex: e.target.value }))}
              />
              <input
                placeholder="Tên đợt"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.name}
                onChange={(e) => setAdminDueDateForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Số tiền đợt"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.amount}
                onChange={(e) => setAdminDueDateForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
              <input
                placeholder="Ghi chú"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.note}
                onChange={(e) => setAdminDueDateForm((prev) => ({ ...prev, note: e.target.value }))}
              />
              <button
                type="submit"
                disabled={dueDateSubmitting}
                className="md:col-span-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                {dueDateSubmitting ? 'Đang cập nhật...' : 'Lưu hạn thanh toán'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
            <SectionHeader title="Nhập giao dịch học phí" description="Admin/Sale ghi nhận thu tiền" />
            <form onSubmit={handleCreatePayment} className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={paymentForm.registrationId}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, registrationId: e.target.value }))}
                required
              >
                <option value="">-- Chọn hồ sơ/khóa học --</option>
                {(tuitionInfo?.items || []).map((item) => (
                  <option key={item.registrationId} value={item.registrationId}>
                    {item.studentName ? `${item.studentName} - ` : ''}[{item.courseCode || 'N/A'}] [{item.courseCode || 'N/A'}] {item.courseName} - Còn nợ {formatCurrency(item.remaining)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Số tiền thu"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
              >
                <option value="TRANSFER">Chuyển khoản</option>
                <option value="CASH">Tiền mặt</option>
                <option value="ONLINE">Online</option>
              </select>
              <input
                placeholder="Ghi chú"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={paymentForm.note}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
              />
              <button
                type="submit"
                className="md:col-span-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : 'Ghi nhận thanh toán'}
              </button>
            </form>
          </div>
        </>
      )}

      {canCollect && (
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Xác nhận giao dịch SePay" description="Danh sách giao dịch đang chờ xác nhận" />
          {transactions.filter((t) => t.status !== 'completed').length === 0 ? (
            <div className="py-4 text-sm text-slate-500">Không có giao dịch chờ xác nhận.</div>
          ) : (
            <div className="space-y-2 text-sm">
              {transactions.filter((t) => t.status !== 'completed').map((t) => (
                <div key={t._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="font-medium text-slate-900">{formatCurrency(t.amount)}</p>
                    <p className="text-xs text-slate-500">{t.transferContent} · {new Date(t.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConfirmTransaction(t._id)}
                    className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Xác nhận
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader title="Lịch sử giao dịch" description="Các lần thanh toán đã ghi nhận" />
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-slate-500">Chưa có giao dịch nào</div>
        ) : (
          <DataTable columns={columns} data={payments} />
        )}
      </div>
    </div>
  );
};

export default Payments;

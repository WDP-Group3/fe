import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';
import { useAuthContext } from '../context/AuthContext';

const Payments = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [tuitionInfo, setTuitionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dueDateSubmitting, setDueDateSubmitting] = useState(false);
  const [showScheduleList, setShowScheduleList] = useState(true);
  const [expandedSchedules, setExpandedSchedules] = useState({});


  const [LEARNERExtendForm, setLEARNERExtendForm] = useState({
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

  const [notifyForm, setNotifyForm] = useState({
    userId: '',
    registrationId: '',
    scheduleIndex: '',
    message: '',
  });
  const [notifySubmitting, setNotifySubmitting] = useState(false);

  const [qrForm, setQrForm] = useState({
    amount: '',
  });
  const [creatingQr, setCreatingQr] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [paymentTransferContent, setPaymentTransferContent] = useState('');
  const [selectedRegistrationForQr, setSelectedRegistrationForQr] = useState('');
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState('');
  const [currentTransactionId, setCurrentTransactionId] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('idle');
  const [transactions, setTransactions] = useState([]);
  const pollRef = useRef(null);
  const pendingPollRef = useRef(null);
  const autoQrCreatedRef = useRef(false);
  const incomingRegistrationIdRef = useRef('');

  const canCollect = ['ADMIN', 'CONSULTANT'].includes(user?.role);
  const isLEARNER = user?.role === 'LEARNER';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const incomingRegistration = location.state?.registration;
    if (!incomingRegistration) return;

    const incomingId = String(incomingRegistration._id || incomingRegistration.registrationId || '');
    setSelectedRegistrationForQr(incomingId);
    incomingRegistrationIdRef.current = incomingId;
    autoQrCreatedRef.current = false;
  }, [location.state]);

  useEffect(() => {
    if (!isLEARNER) return undefined;

    if (pendingPollRef.current) {
      clearInterval(pendingPollRef.current);
    }

    pendingPollRef.current = setInterval(async () => {
      try {
        const response = await apiClient.get('/payments/transactions?status=pending');
        const pending = response?.data || [];
        const currentPending = transactions.filter((t) => t.status !== 'completed');

        if (pending.length !== currentPending.length) {
          await loadData();
        }
      } catch (error) {
        // ignore polling error
      }
    }, 8000);

    return () => {
      if (pendingPollRef.current) {
        clearInterval(pendingPollRef.current);
        pendingPollRef.current = null;
      }
    };
  }, [isLEARNER, transactions]);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
      if (pendingPollRef.current) {
        clearInterval(pendingPollRef.current);
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

        const incomingRegistrationId = location.state?.registration?._id || location.state?.registration?.registrationId || '';
        const defaultRegId = incomingRegistrationId || info?.items?.[0]?.registrationId || '';
        setLEARNERExtendForm((prev) => ({ ...prev, registrationId: prev.registrationId || defaultRegId }));
        setAdminDueDateForm((prev) => ({ ...prev, registrationId: prev.registrationId || defaultRegId }));

        if (incomingRegistrationId) {
          setSelectedRegistrationForQr(defaultRegId);

          const target = (info?.items || []).find((item) => item.registrationId === defaultRegId);
          if (target) {
            const schedule = target.paymentSchedule || [];
            if (schedule.length > 0) {
              setSelectedScheduleIndex('0');
              setQrForm((prev) => ({ ...prev, amount: String(schedule[0]?.amount || '') }));
            }
          }
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


  const handleLEARNERExtend = async (e) => {
    e.preventDefault();
    if (!LEARNERExtendForm.registrationId) {
      alert('Vui lòng chọn hồ sơ cần gia hạn');
      return;
    }

    try {
      setDueDateSubmitting(true);
      await apiClient.post('/payments/extend-due-date', {
        registrationId: LEARNERExtendForm.registrationId,
        scheduleIndex: Number(LEARNERExtendForm.scheduleIndex),
        extendedDays: Number(LEARNERExtendForm.extendedDays),
        reason: LEARNERExtendForm.reason,
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

  const handleQuickExtend = async (registrationId, scheduleIndex) => {
    const days = window.prompt('Nhập số ngày gia hạn (1-30):', '7');
    if (!days) return;

    const parsedDays = Math.max(1, Math.min(Number(days) || 0, 30));
    if (!parsedDays) {
      alert('Số ngày không hợp lệ');
      return;
    }

    try {
      setDueDateSubmitting(true);
      await apiClient.post('/payments/upsert-due-date', {
        registrationId,
        scheduleIndex: Number(scheduleIndex),
        dueDate: new Date(Date.now() + parsedDays * 24 * 60 * 60 * 1000).toISOString(),
        note: `Admin gia hạn ${parsedDays} ngày`,
      });
      await loadData();
      alert('Đã gia hạn hạn thanh toán');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Gia hạn thất bại');
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

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!notifyForm.userId || !notifyForm.message.trim()) {
      alert('Vui lòng nhập nội dung thông báo');
      return;
    }

    try {
      setNotifySubmitting(true);
      await apiClient.post('/notifications', {
        type: 'OTHER',
        title: 'Nhắc đóng học phí',
        message: notifyForm.message.trim(),
        expirationDays: 7,
        userId: notifyForm.userId,
      });

      setNotifyForm({ userId: '', registrationId: '', scheduleIndex: '', message: '' });
      alert('Đã gửi thông báo đến học viên');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Gửi thông báo thất bại');
    } finally {
      setNotifySubmitting(false);
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
          alert('Thanh toán đã được xác nhận. Hệ thống đã cập nhật học phí và tự động gán lớp (nếu có lớp OPEN).');
        }
      } catch (e) {
        // ignore single polling errors
      }
    }, 5000);
  };

  const handleCreateQr = async (e) => {
    e.preventDefault();

    if (!selectedRegistrationForQr || selectedScheduleIndex === '') {
      alert('Vui lòng chọn khóa học và đợt thanh toán');
      return;
    }

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
        vnp_OrderInfo: `Thanh toan hoc phi ${new Date().toLocaleDateString('vi-VN')}`,
        user: user?._id || user?.id,
        registrationId: selectedRegistrationForQr || undefined,
        scheduleIndex: selectedScheduleIndex !== '' ? Number(selectedScheduleIndex) : undefined,
      });

      const qrUrl = response?.data?.paymentUrl || response?.paymentUrl || '';
      const transferContent = response?.data?.transferContent || '';
      const transactionId = response?.data?.transactionId || '';

      if (qrUrl) {
        setPaymentQrUrl(qrUrl);
        setPaymentTransferContent(transferContent);
        setCurrentTransactionId(transactionId);
        startPollingTransaction(transactionId);

        const selectedItem = (tuitionInfo?.items || []).find(
          (item) => item.registrationId === selectedRegistrationForQr,
        );
        const schedule = selectedItem?.paymentSchedule || [];
        const scheduleItem = schedule[Number(selectedScheduleIndex)] || null;

        navigate('/portal/payments/qr', {
          state: {
            paymentUrl: qrUrl,
            transferContent,
            transactionId,
            amount: Number(qrForm.amount),
            courseName: selectedItem?.courseName || '',
            courseCode: selectedItem?.courseCode || '',
            scheduleName: scheduleItem?.name || `Đợt ${Number(selectedScheduleIndex) + 1}`,
            scheduleAmount: scheduleItem?.amount || Number(qrForm.amount),
            scheduleNote: scheduleItem?.note || '',
          },
        });
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

  // Auto-create QR for installment 1 when navigating from course registration
  useEffect(() => {
    const incomingId = incomingRegistrationIdRef.current;
    if (!incomingId) return;
    if (!tuitionInfo) return;
    if (creatingQr) return;
    if (autoQrCreatedRef.current) return;

    // Must be installment 1 (index 0)
    if (String(selectedRegistrationForQr || '') !== String(incomingId)) return;
    if (String(selectedScheduleIndex) !== '0') return;
    if (!qrForm.amount || Number(qrForm.amount) <= 0) return;

    // Avoid creating another QR if we already have one in state
    if (paymentQrUrl && currentTransactionId) {
      autoQrCreatedRef.current = true;
      return;
    }

    autoQrCreatedRef.current = true;
    // simulate a form submit without needing the event object
    handleCreateQr({ preventDefault: () => {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuitionInfo, selectedRegistrationForQr, selectedScheduleIndex, qrForm.amount]);

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
    { key: 'learnerName', title: 'Học viên', dataIndex: 'learnerName', render: (val) => val || '—' },
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
      key: 'detailToggle',
      title: 'Chi tiết',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setExpandedSchedules((prev) => ({
            ...prev,
            [row.registrationId]: !prev[row.registrationId],
          }))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
        >
          {expandedSchedules[row.registrationId] ? '-' : '+'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="HỌC PHÍ"
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
                <p className="text-xs font-semibold text-slate-600">TỔNG PHÍ</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{formatCurrency(tuitionInfo?.totalFee || 0)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">ĐÃ TRẢ</p>
                <p className="mt-1 text-base font-semibold text-emerald-700">{formatCurrency(tuitionInfo?.paidAmount || 0)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">DƯ NỢ</p>
                <p className={`mt-1 text-base font-semibold ${tuitionInfo?.isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                  {formatCurrency(tuitionInfo?.remaining || 0)}
                </p>
              </div>
             
            </div>

            <div className="mb-2 flex items-center justify-between text-sm">
              <p className="font-semibold text-slate-700">Danh sách khóa học</p>
              <button
                type="button"
                onClick={() => setShowScheduleList((prev) => !prev)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                {showScheduleList ? '-' : '+'}
              </button>
            </div>

            {showScheduleList && (
              <div className="space-y-3">
                <DataTable columns={scheduleColumns} data={tuitionInfo?.items || []} />
                {(tuitionInfo?.items || []).filter((item) => expandedSchedules[item.registrationId]).map((item) => {
                  const schedule = item.paymentSchedule || [];
                  const paidAmount = Number(item.paidAmount || 0);
                  let accumulated = 0;

                  return (
                    <div key={`detail-${item.registrationId}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-500">Thời gian khóa học</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.courseStartDate ? new Date(item.courseStartDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                            {' '}→{' '}
                            {item.courseEndDate ? new Date(item.courseEndDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-500">Học viên</p>
                          <p className="text-sm font-semibold text-slate-900">{item.learnerName || '—'}</p>
                        </div>
                      </div>

                      {schedule.length === 0 ? (
                        <p className="mt-3 text-xs text-slate-500">Chưa có lịch đóng phí.</p>
                      ) : (
                        <div className="mt-3 grid gap-2">
                          {schedule.map((scheduleItem, idx) => {
                            const installmentAmount = Number(scheduleItem?.amount || 0);
                            const paidForInstallment = Math.min(Math.max(paidAmount - accumulated, 0), installmentAmount);
                            const remainingForInstallment = Math.max(installmentAmount - paidForInstallment, 0);
                            const isPaid = remainingForInstallment === 0;

                            accumulated += installmentAmount;

                            return (
                              <div key={`${item.registrationId}-schedule-${idx}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                                <div>
                                  <p className="font-medium text-slate-900">{scheduleItem?.name || `Đợt ${idx + 1}`}</p>
                                  <p className="text-xs text-slate-500">
                                    Hạn nộp: {scheduleItem?.dueDate ? new Date(scheduleItem.dueDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                                  </p>
                                  {scheduleItem?.note && (
                                    <p className="text-xs text-slate-500">Ghi chú: {scheduleItem.note}</p>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-right">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(installmentAmount)}</p>
                                    <p className="text-xs text-slate-500">Đã đóng: {formatCurrency(paidForInstallment)}</p>
                                    <p className="text-xs text-slate-500">Còn lại: {formatCurrency(remainingForInstallment)}</p>
                                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {isPaid ? 'Đã đóng' : 'Chưa đóng'}
                                    </span>
                                  </div>
                                  {!isPaid && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleQuickExtend(item.registrationId, idx)}
                                        className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                      >
                                        Gia hạn
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNotifyForm({
                                            userId: item.learnerId,
                                            registrationId: item.registrationId,
                                            scheduleIndex: idx,
                                            message: `Nhắc đóng ${scheduleItem?.name || `Đợt ${idx + 1}`} cho khóa ${item.courseName}. Còn thiếu ${formatCurrency(remainingForInstallment)}.`,
                                          });
                                        }}
                                        className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                                      >
                                        Thông báo
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          <form onSubmit={handleSendNotification} className="mt-3 grid gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs">
                            <p className="text-xs font-semibold text-indigo-700">Gửi thông báo nhắc đóng</p>
                            <textarea
                              rows={2}
                              placeholder="Nội dung thông báo"
                              className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-xs"
                              value={notifyForm.registrationId === item.registrationId ? notifyForm.message : ''}
                              onChange={(e) => setNotifyForm((prev) => ({
                                ...prev,
                                userId: item.learnerId,
                                registrationId: item.registrationId,
                                message: e.target.value,
                              }))}
                            />
                            <button
                              type="submit"
                              disabled={notifySubmitting || notifyForm.registrationId !== item.registrationId}
                              className="w-full rounded-full bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              {notifySubmitting ? 'Đang gửi...' : 'Gửi thông báo'}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {isLEARNER && (
        <>
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
            <SectionHeader title="Thanh toán qua QR" description="Chọn khóa học và đợt đóng phí cố định" />
            <form onSubmit={handleCreateQr} className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={selectedRegistrationForQr}
                onChange={(e) => {
                  setSelectedRegistrationForQr(e.target.value);
                  setSelectedScheduleIndex('');
                  setQrForm((prev) => ({ ...prev, amount: '' }));
                }}
              >
                <option value="">-- Chọn khóa học --</option>
                {(tuitionInfo?.items || []).map((item) => (
                  <option key={item.registrationId} value={item.registrationId}>
                    [{item.courseCode || 'N/A'}] {item.courseName} - Còn nợ {formatCurrency(item.remaining)}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={selectedScheduleIndex}
                onChange={(e) => {
                  const index = e.target.value;
                  setSelectedScheduleIndex(index);

                  const selectedItem = (tuitionInfo?.items || []).find(
                    (item) => item.registrationId === selectedRegistrationForQr,
                  );
                  const schedule = selectedItem?.paymentSchedule || [];
                  const scheduleItem = schedule[Number(index)];
                  const amount = scheduleItem?.amount ? String(scheduleItem.amount) : '';
                  setQrForm((prev) => ({ ...prev, amount }));
                }}
                disabled={!selectedRegistrationForQr}
              >
                <option value="">-- Chọn đợt thanh toán --</option>
                {(() => {
                  const selectedItem = (tuitionInfo?.items || []).find(
                    (item) => item.registrationId === selectedRegistrationForQr,
                  );
                  const schedule = selectedItem?.paymentSchedule || [];
                  const paidAmount = Number(selectedItem?.paidAmount || 0);

                  let accumulated = 0;
                  const unpaidItems = schedule.filter((scheduleItem) => {
                    accumulated += Number(scheduleItem?.amount || 0);
                    return paidAmount < accumulated;
                  });

                  if (unpaidItems.length === 0) {
                    return (
                      <option value="" disabled>
                        Đã hoàn tất thanh toán
                      </option>
                    );
                  }

                  return unpaidItems.map((scheduleItem) => {
                    const idx = schedule.indexOf(scheduleItem);
                    return (
                      <option key={`${selectedRegistrationForQr}-${idx}`} value={idx}>
                        {scheduleItem?.name || `Đợt ${idx + 1}`} - {formatCurrency(scheduleItem?.amount || 0)}
                      </option>
                    );
                  });
                })()}
              </select>
              <input
                type="number"
                min="1000"
                placeholder="Số tiền theo đợt"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={qrForm.amount}
                onChange={(e) => setQrForm((prev) => ({ ...prev, amount: e.target.value }))}
                required
                readOnly
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
            <form onSubmit={handleLEARNERExtend} className="grid gap-3 md:grid-cols-2">
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={LEARNERExtendForm.registrationId}
              onChange={(e) => setLEARNERExtendForm((prev) => ({ ...prev, registrationId: e.target.value }))}
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
              value={LEARNERExtendForm.extendedDays}
              onChange={(e) => setLEARNERExtendForm((prev) => ({ ...prev, extendedDays: e.target.value }))}
              placeholder="Số ngày gia hạn"
              required
            />
            <input
              type="number"
              min="0"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={LEARNERExtendForm.scheduleIndex}
              onChange={(e) => setLEARNERExtendForm((prev) => ({ ...prev, scheduleIndex: e.target.value }))}
              placeholder="Index đợt cần gia hạn (0,1,2...)"
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={LEARNERExtendForm.reason}
              onChange={(e) => setLEARNERExtendForm((prev) => ({ ...prev, reason: e.target.value }))}
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
            <SectionHeader title="Gia Hạn Thanh Toán Học Phí" description="Admin/Sale chỉnh hạn từng đợt hoặc thêm đợt mới" />
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
                    {item.learnerName ? `${item.learnerName} - ` : ''}[{item.courseCode || 'N/A'}] {item.courseName}
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

import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import { formatCurrency } from '../utils/formatters';
import apiClient from '../services/apiClient';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

const SEPAY_BANK_CODE = import.meta.env.VITE_SEPAY_BANK_CODE || '';
const SEPAY_BANK_ACCOUNT = import.meta.env.VITE_SEPAY_BANK_ACCOUNT || '';

const PaymentQr = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const { showToast } = useToast();
  const redirectRef = useRef(false);
  const [isPaid, setIsPaid] = useState(false);
  const [txInfo, setTxInfo] = useState({
    paymentUrl: null,
    transferContent: null,
    transactionId: null,
    amount: null,
    courseName: null,
    courseCode: null,
    scheduleName: null,
    scheduleAmount: null,
    scheduleNote: null,
  });
  const [loading, setLoading] = useState(false);

  const state = location.state || {};

  // Init từ navigate state
  useEffect(() => {
    if (state.paymentUrl) {
      setTxInfo({
        paymentUrl: state.paymentUrl,
        transferContent: state.transferContent,
        transactionId: state.transactionId,
        amount: state.amount,
        courseName: state.courseName,
        courseCode: state.courseCode,
        scheduleName: state.scheduleName,
        scheduleAmount: state.scheduleAmount,
        scheduleNote: state.scheduleNote,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.paymentUrl]);

  // Fetch transaction info khi refresh page (không có state)
  useEffect(() => {
    const txId = state.transactionId;
    if (!txId) return;
    if (state.paymentUrl) return; // đã có state

    const fetchTxInfo = async () => {
      setLoading(true);
      try {
        const txRes = await apiClient.get(`/payments/transaction-status/${txId}`);
        console.log('[PaymentQr] Fetch tx:', txRes);
        if (txRes?.data) {
          const tx = txRes.data;

          // Nếu transaction đã completed khi load trang → redirect luôn (user có thể vừa thanh toán xong)
          if (tx.paymentStatus === 'completed' && !redirectRef.current) {
            console.log('[PaymentQr] Transaction already completed on load → redirect');
            handlePaidSuccess();
            return;
          }

          // Reconstruct QR URL từ transaction data
          const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(SEPAY_BANK_ACCOUNT)}&bank=${encodeURIComponent(SEPAY_BANK_CODE)}&amount=${encodeURIComponent(tx.amount || 0)}&des=${encodeURIComponent(tx.transferContent || '')}`;

          setTxInfo((prev) => ({
            ...prev,
            paymentUrl: qrUrl,
            transferContent: tx.transferContent,
            transactionId: txId,
            amount: tx.amount,
          }));

          // Fetch registration để lấy course name
          if (tx.registrationId) {
            const regRes = await apiClient.get(`/registrations/${tx.registrationId}`);
            console.log('[PaymentQr] Fetch reg:', regRes);
            if (regRes?.data) {
              const course = regRes.data.batchId?.courseId || regRes.data.courseId;
              setTxInfo((prev) => ({
                ...prev,
                courseName: course?.name || 'Khóa học',
                courseCode: course?.code || '',
              }));
            }
          }
        }
      } catch (err) {
        console.error('[PaymentQr] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTxInfo();
  }, [state.transactionId, state.paymentUrl]);

  const handlePaidSuccess = useCallback(() => {
    if (redirectRef.current) return;
    redirectRef.current = true;
    showToast('Thanh toán thành công!', 'success');
    setIsPaid(true);
    setTimeout(() => {
      navigate('/portal/payments', { replace: true });
    }, 1200);
  }, [navigate, showToast]);

  // Socket listener - redirect khi thanh toán thành công
  useEffect(() => {
    if (!socket) return;

    const handlePaymentSuccess = (data) => {
      console.log('[PaymentQr] Socket payment-success:', data);
      handlePaidSuccess();
    };

    socket.on('payment-success', handlePaymentSuccess);
    return () => socket.off('payment-success', handlePaymentSuccess);
  }, [socket, handlePaidSuccess]);

  // Polling kiểm tra trạng thái (fallback)
  useEffect(() => {
    const txId = txInfo.transactionId || state.transactionId;
    if (!txId || isPaid) return;

    const checkStatus = async () => {
      try {
        const res = await apiClient.get(`/payments/transaction-status/${txId}`);
        console.log('[PaymentQr] Poll:', res);
        if (res?.data?.paymentStatus === 'completed') {
          handlePaidSuccess();
        }
      } catch (err) {
        console.error('[PaymentQr] Poll error:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [txInfo.transactionId, state.transactionId, isPaid, handlePaidSuccess]);


  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-slate-500">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!txInfo.paymentUrl) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Thanh toán qua QR" description="Không tìm thấy thông tin QR" />
          <p className="text-sm text-slate-600">Vui lòng quay lại trang học phí để tạo QR mới.</p>
          <Link to="/portal/payments" className="mt-4 inline-flex rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            Quay lại học phí
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isPaid && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-lg font-semibold text-green-700">✓ Thanh toán thành công!</p>
          <p className="text-sm text-green-600">Đang chuyển về trang học phí...</p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="QR chuyển khoản học phí"
          description={isPaid ? 'Đã thanh toán' : 'Quét mã để thanh toán đúng nội dung'}
        />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <img src={txInfo.paymentUrl} alt="QR thanh toán" className="mx-auto h-60 w-60" />
          </div>

          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Nội dung chuyển khoản (bắt buộc đúng)</p>
              <p className="mt-2 inline-flex rounded-lg bg-white px-3 py-2 font-semibold text-indigo-700">
                {txInfo.transferContent || '—'}
              </p>
              {txInfo.transactionId && (
                <p className="mt-2 text-xs text-slate-500">Mã giao dịch: {txInfo.transactionId}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">Thông tin khóa học</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {txInfo.courseCode ? `[${txInfo.courseCode}] ` : ''}{txInfo.courseName || 'Khóa học'}
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">Đợt thanh toán</p>
                  <p className="text-sm font-semibold text-slate-900">{txInfo.scheduleName || '—'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">Số tiền đợt</p>
                  <p className="text-sm font-semibold text-emerald-700">
                    {formatCurrency(txInfo.scheduleAmount || txInfo.amount || 0)}
                  </p>
                </div>
              </div>
              {txInfo.scheduleNote && (
                <p className="mt-3 text-xs text-slate-500">Ghi chú: {txInfo.scheduleNote}</p>
              )}
            </div>

            <Link to="/portal/payments" className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Quay lại học phí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentQr;

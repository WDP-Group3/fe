import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import { formatCurrency } from '../utils/formatters';
import useApi from '../hooks/useApi';

const PaymentQr = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchApi } = useApi();
  const [status, setStatus] = useState('pending');
  const [countdown, setCountdown] = useState(30);

  const state = location.state || {};

  const {
    paymentUrl,
    transferContent,
    transactionId,
    amount,
    courseName,
    courseCode,
    scheduleName,
    scheduleAmount,
    scheduleNote,
  } = state;

  // Polling kiểm tra trạng thái thanh toán
  useEffect(() => {
    if (!transactionId) return;

    const checkStatus = async () => {
      const response = await fetchApi(`/api/payments/transaction-status/${transactionId}`, 'GET');
      if (response?.status === 'success' && response?.data?.paymentStatus === 'completed') {
        setStatus('completed');
        // Redirect về trang học phí sau 2 giây
        setTimeout(() => {
          navigate('/portal/payments', { replace: true });
        }, 2000);
      }
    };

    // Kiểm tra ngay lập tức
    checkStatus();

    // Poll mỗi 5 giây
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [transactionId, fetchApi, navigate]);

  // Countdown hiển thị
  useEffect(() => {
    if (status === 'completed') return;
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, status]);

  if (!paymentUrl) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Thanh toán qua QR" description="Không tìm thấy thông tin QR" />
          <p className="text-sm text-slate-600">Vui lòng quay lại trang học phí để tạo QR mới.</p>
          <Link
            to="/portal/payments"
            className="mt-4 inline-flex rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Quay lại học phí
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {status === 'completed' && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="text-lg font-semibold text-green-700">✓ Thanh toán thành công!</p>
          <p className="text-sm text-green-600">Đang chuyển về trang học phí...</p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="QR chuyển khoản học phí"
          description={status === 'completed' ? 'Đã thanh toán' : 'Quét mã để thanh toán đúng nội dung'}
        />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <img
              src={paymentUrl}
              alt="QR thanh toán"
              className="mx-auto h-60 w-60"
            />
          </div>

          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {status !== 'completed' && (
                <p className="mb-2 text-xs text-slate-500">
                  Tự động kiểm tra sau {countdown}s...
                </p>
              )}
              <p className="text-xs font-semibold text-slate-500">Nội dung chuyển khoản (bắt buộc đúng)</p>
              <p className="mt-2 inline-flex rounded-lg bg-white px-3 py-2 font-semibold text-indigo-700">
                {transferContent}
              </p>
              {transactionId && (
                <p className="mt-2 text-xs text-slate-500">Mã giao dịch: {transactionId}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">Thông tin khóa học</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {courseCode ? `[${courseCode}] ` : ''}{courseName || 'Khóa học'}
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">Đợt thanh toán</p>
                  <p className="text-sm font-semibold text-slate-900">{scheduleName || '—'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">Số tiền đợt</p>
                  <p className="text-sm font-semibold text-emerald-700">
                    {formatCurrency(scheduleAmount || amount || 0)}
                  </p>
                </div>
              </div>
              {scheduleNote && (
                <p className="mt-3 text-xs text-slate-500">Ghi chú: {scheduleNote}</p>
              )}
            </div>

            <Link
              to="/portal/payments"
              className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Quay lại học phí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentQr;

import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { SectionHeader, StatCard } from '../components/ui';
import { formatCurrency } from '../utils/formatters';

const learnerDashboard = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (user?.role !== 'learner') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [registrationRes, paymentRes, transactionRes] = await Promise.all([
          apiClient.get('/registrations'),
          apiClient.get('/payments'),
          apiClient.get('/payments/transactions'),
        ]);

        if (registrationRes.status === 'success') {
          setRegistrations(registrationRes.data || []);
        }

        if (paymentRes.status === 'success') {
          setPayments(paymentRes.data || []);
        }

        if (transactionRes.status === 'success') {
          setTransactions(transactionRes.data || []);
        }
      } catch (error) {
        console.error('Load learner dashboard data error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.role]);

  const stats = useMemo(() => {
    const totalCourses = registrations.length;
    const studyingCourses = registrations.filter((r) => r.status === 'STUDYING').length;
    const completedCourses = registrations.filter((r) => r.status === 'COMPLETED').length;
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return { totalCourses, studyingCourses, completedCourses, totalPaid };
  }, [registrations, payments]);

  if (user?.role !== 'learner') {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Trang này dành cho học viên.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="learner Dashboard"
          description="Theo dõi khóa học đã tham gia và lịch sử thanh toán của bạn"
        />

        {loading ? (
          <div className="py-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Đã đăng ký" value={stats.totalCourses} />
              <StatCard title="Đang học" value={stats.studyingCourses} />
              <StatCard title="Đã hoàn thành" value={stats.completedCourses} />
              <StatCard title="Đã thanh toán" value={formatCurrency(stats.totalPaid)} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 p-4">
                <h4 className="text-sm font-semibold text-slate-900">Khóa học đã tham gia</h4>
                {registrations.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Bạn chưa tham gia khóa học nào.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {registrations.map((r) => (
                      <div key={r._id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <p className="font-medium text-slate-900">
                          {r?.batchId?.courseId?.name || r?.batchId?.courseId?.code || 'Khóa học'}
                        </p>
                        <p className="text-xs text-slate-500">{r?.batchId?.location || '—'} · {r?.status || 'NEW'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 p-4">
                <h4 className="text-sm font-semibold text-slate-900">Lịch sử giao dịch</h4>
                {transactions.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Chưa có giao dịch nào.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {transactions.slice(0, 10).map((t) => (
                      <div key={t._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">{formatCurrency(t?.amount || 0)}</p>
                          <p className="text-xs text-slate-500">{t?.transferContent || '—'}</p>
                          <p className="text-xs text-slate-500">
                            {t?.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : '—'}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${t?.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {t?.status === 'completed' ? 'Đã thanh toán' : 'Chờ xác nhận'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default learnerDashboard;

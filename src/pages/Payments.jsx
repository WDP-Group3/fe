import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/formatters';

const Payments = () => {
  const { user } = useAuthContext();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/payments');
      if (response.status === 'success') {
        // Map backend payment format to frontend format
        const mappedPayments = (response.data || []).map((payment, index) => ({
          id: payment._id || `PM-${index + 1}`,
          title: `Đợt ${index + 1}`,
          amount: payment.amount || 0,
          due: payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('vi-VN') : 'Chưa có',
          status: payment.method ? 'paid' : 'pending',
        }));
        setPayments(mappedPayments);
      }
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'title', title: 'Đợt thu', dataIndex: 'title' },
    { key: 'amount', title: 'Số tiền', dataIndex: 'amount', render: (val) => formatCurrency(val) },
    { key: 'due', title: 'Hạn thanh toán', dataIndex: 'due' },
    { key: 'status', title: 'Trạng thái', dataIndex: 'status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Quản lý học phí & công nợ"
          description="Chia đợt, kiểm soát công nợ, nhắc phí tự động"
          action={<button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Tạo phiếu thu</button>}
        />
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p>Chưa có giao dịch nào</p>
          </div>
        ) : (
          <DataTable columns={columns} data={payments} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Tự động nhắc phí" description="SMS / Email / App notification" />
          <div className="space-y-3 text-sm text-slate-700">
            <p>• Sau đóng đợt 1 → nhắc đợt 2 sau 1 tháng.</p>
            <p>• Trước hạn 5 ngày → nhắc học viên + staff phụ trách.</p>
            <p>• Log thanh toán, log huỷ hồ sơ lưu trên Audit.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Nhập giao dịch" description="Sale / Staff nhập, Admin duyệt" />
          <form className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Mã giao dịch</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" placeholder="VD: PM-02" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Số tiền</label>
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" placeholder="3.800.000" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phương thức</label>
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none">
                  <option>Chuyển khoản</option>
                  <option>Tiền mặt</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              onClick={() => {
                // Cần call đến BE để ghi nhận giao dịch học phí
              }}
            >
              Lưu giao dịch
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Payments;


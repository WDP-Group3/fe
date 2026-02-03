import { useState, useEffect } from 'react';
import SectionHeader from '../../components/ui/SectionHeader';
import apiClient from '../../services/apiClient';

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await apiClient.get('/reports/stats');
            if (response.status === 'success') {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading reports...</div>;

    return (
        <div className="space-y-6">
            <SectionHeader title="Báo cáo thống kê" description="Tổng quan hiệu quả kinh doanh và đào tạo" />

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Học viên Active</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stats?.students || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Số lượng đăng ký</p>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">{stats?.registration || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Doanh thu ước tính</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.revenue || 0)}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Tỷ lệ đậu</p>
                    <p className="mt-2 text-3xl font-bold text-orange-500">{stats?.passRate || 0}%</p>
                </div>
            </div>

            {/* Simple Chart Visualization */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-semibold text-slate-900">Biểu đồ tỷ lệ đậu (Pass Rate)</h3>
                <div className="flex h-64 items-end space-x-8 border-b border-slate-200 pb-4">
                    {/* Mock columns for chart effect since we don't have historical data aggregated by month yet */}
                    <div className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-lg bg-indigo-100 duration-500 hover:bg-indigo-200" style={{ height: '40%' }}></div>
                        <span className="text-xs text-slate-500">Quý 1</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-lg bg-indigo-100 duration-500 hover:bg-indigo-200" style={{ height: '65%' }}></div>
                        <span className="text-xs text-slate-500">Quý 2</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-lg bg-indigo-300 duration-500 hover:bg-indigo-400" style={{ height: `${stats?.passRate || 0}%` }}></div>
                        <span className="text-xs font-semibold text-indigo-600">Hiện tại ({stats?.passRate}%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;

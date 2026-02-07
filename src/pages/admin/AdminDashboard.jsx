import { SectionHeader } from '../../components/ui';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import { useState, useEffect } from 'react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalRevenue: 0, // Mock or Real
        newRegistrations: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock load stats or fetch real if APIs exist
        const loadStats = async () => {
            try {
                // Fetch users count
                const usersRes = await apiClient.get('/users/stats');
                // Fetch courses count if available 
                // For now mocking some parts
                setStats({
                    totalUsers: usersRes.data?.totalUsers || 0,
                    totalCourses: 12,
                    totalRevenue: 150000000,
                    newRegistrations: 5
                });
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    // Simple CSS Bar Chart Component since we want "đúng chuẩn" but maybe no lib installed yet.
    // I'll create a simple visual representation using CSS.

    return (
        <div className="space-y-6">
            <SectionHeader title="Tổng quan" description="Thống kê hoạt động hệ thống" />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Tổng người đùng</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
                    <div className="mt-2 flex items-center text-sm text-green-600">
                        <span>↑ 12%</span>
                        <span className="ml-2 text-slate-400">so với tháng trước</span>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Tổng khóa học</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalCourses}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Doanh thu (Ước tính)</p>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Đăng ký mới</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stats.newRegistrations}</p>
                    <div className="mt-2 flex items-center text-sm text-green-600">
                        <span>↑ 2</span>
                        <span className="ml-2 text-slate-400">hôm nay</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Revenue Chart */}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="mb-6 text-lg font-bold text-slate-900">Biểu đồ doanh thu năm 2024</h3>
                    <div className="flex h-64 items-end justify-between gap-2">
                        {[35, 45, 30, 60, 75, 50, 65, 80, 70, 85, 90, 95].map((h, i) => (
                            <div key={i} className="group relative flex w-full flex-col items-center gap-2">
                                <div
                                    className="w-full rounded-t-lg bg-indigo-100 transition-all group-hover:bg-indigo-500"
                                    style={{ height: `${h}%` }}
                                ></div>
                                <span className="text-xs font-medium text-slate-500">T{i + 1}</span>
                                {/* Tooltip */}
                                <div className="absolute -top-10 hidden rounded-lg bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:flex group-hover:opacity-100">
                                    {h}tr
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Distribution Chart */}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="mb-6 text-lg font-bold text-slate-900">Phân bố người dùng</h3>
                    <div className="flex h-64 items-center justify-center">
                        {/* Simple pie chart css or just a list for now if no lib */}
                        <div className="flex gap-8">
                            <div className="text-center">
                                <div className="mx-auto mb-2 h-20 w-20 rounded-full border-4 border-green-500 bg-green-50 flex items-center justify-center text-xl font-bold text-green-700">65%</div>
                                <span className="text-sm font-medium text-slate-600">Học viên</span>
                            </div>
                            <div className="text-center">
                                <div className="mx-auto mb-2 h-20 w-20 rounded-full border-4 border-blue-500 bg-blue-50 flex items-center justify-center text-xl font-bold text-blue-700">25%</div>
                                <span className="text-sm font-medium text-slate-600">Giáo viên</span>
                            </div>
                            <div className="text-center">
                                <div className="mx-auto mb-2 h-20 w-20 rounded-full border-4 border-purple-500 bg-purple-50 flex items-center justify-center text-xl font-bold text-purple-700">10%</div>
                                <span className="text-sm font-medium text-slate-600">Tư vấn</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

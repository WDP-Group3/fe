import { useState, useEffect, useCallback } from 'react';
import SectionHeader from '../../components/ui/SectionHeader';
import Modal from '../../components/ui/Modal';
import apiClient from '../../services/apiClient';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0);

const fmtShort = (n) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n;
};

const MONTH_LABELS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const METHOD_LABELS = { CASH: 'Tiền mặt', TRANSFER: 'Chuyển khoản', ONLINE: 'Trực tuyến' };
const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color = 'text-slate-900', icon }) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            {icon && <span className="text-2xl">{icon}</span>}
        </div>
        <p className={`text-2xl font-bold ${color} leading-tight`}>{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
);

// ── Custom Tooltip for Bar Chart ──────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div className="rounded-xl bg-slate-900 px-3 py-2 text-white text-sm shadow-lg">
                <p className="font-semibold mb-1">{MONTH_LABELS[label - 1]}</p>
                <p>DT: {fmt(payload[0]?.value)}</p>
                {payload[1] && <p>ĐK: {payload[1]?.value} học viên</p>}
            </div>
        );
    }
    return null;
};

// ── Main Component ────────────────────────────────────────────────────────────
const Reports = () => {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [loading, setLoading] = useState(true);

    const [revenueData, setRevenueData] = useState([]);
    const [regData, setRegData] = useState([]);
    const [methodData, setMethodData] = useState([]);
    const [topCourses, setTopCourses] = useState([]);
    const [debt, setDebt] = useState({ totalDue: 0, totalPaid: 0, totalDebt: 0 });
    const [recentTx, setRecentTx] = useState([]);
    const [selectedTx, setSelectedTx] = useState(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [revRes, regRes, methodRes, topRes, debtRes, txRes] = await Promise.all([
                apiClient.get(`/reports/revenue-by-month?year=${year}`),
                apiClient.get(`/reports/registration-stats?year=${year}`),
                apiClient.get(`/reports/payment-method-stats?year=${year}`),
                apiClient.get(`/reports/top-courses?year=${year}`),
                apiClient.get(`/reports/debt-summary?year=${year}`),
                apiClient.get(`/reports/recent-transactions?limit=10&year=${year}`),
            ]);

            // Merge revenue + reg into one dataset for combined chart
            const rev = revRes.data || [];
            const reg = regRes.data || [];
            const merged = rev.map((r, i) => ({
                month: r.month,
                revenue: r.revenue,
                registrations: reg[i]?.count || 0,
            }));

            setRevenueData(merged);
            setRegData(reg);
            setMethodData((methodRes.data || []).map(m => ({
                name: METHOD_LABELS[m.method] || m.method,
                value: m.total,
                count: m.count,
            })));
            setTopCourses(topRes.data || []);
            setDebt(debtRes.data || { totalDue: 0, totalPaid: 0, totalDebt: 0 });
            setRecentTx(txRes.data || []);
        } catch (err) {
            console.error('Error fetching report data:', err);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const totalRevenue = revenueData.reduce((s, r) => s + r.revenue, 0);
    const totalReg = regData.reduce((s, r) => s + r.count, 0);

    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <SectionHeader
                    title="Báo cáo tài chính"
                    description="Thống kê doanh thu, công nợ và hoạt động kinh doanh"
                />
                <select
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {yearOptions.map(y => <option key={y} value={y}>Năm {y}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="flex h-60 items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
            ) : (
                <>
                    {/* ── KPI Cards ── */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            label="Tổng doanh thu"
                            value={fmt(totalRevenue)}
                            sub={`Năm ${year}`}
                            color="text-indigo-600"
                            icon="💰"
                        />
                        <KpiCard
                            label="Đã thu"
                            value={fmt(debt.totalPaid)}
                            sub="Tổng tiền đã nhận"
                            color="text-green-600"
                            icon="✅"
                        />
                        <KpiCard
                            label="Học phí chưa thu"
                            value={fmt(debt.totalDebt)}
                            sub="Chưa thanh toán"
                            color={debt.totalDebt > 0 ? 'text-red-500' : 'text-slate-900'}
                            icon="⚠️"
                        />
                        <KpiCard
                            label="Số đăng ký"
                            value={totalReg.toLocaleString('vi-VN')}
                            sub={`Trong năm ${year}`}
                            color="text-blue-600"
                            icon="📋"
                        />
                    </div>

                    {/* ── Charts Row ── */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Bar Chart */}
                        <div className="lg:col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                            <h3 className="mb-1 text-lg font-bold text-slate-900">Doanh thu theo tháng – {year}</h3>
                            <p className="mb-4 text-sm text-slate-400">Đơn vị: VNĐ</p>
                            {revenueData.every(r => r.revenue === 0) ? (
                                <div className="flex h-52 items-center justify-center text-slate-400 text-sm">
                                    Không có dữ liệu doanh thu cho năm {year}
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="month"
                                            tickFormatter={m => MONTH_LABELS[m - 1]}
                                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={fmtShort}
                                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={48}
                                        />
                                        <Tooltip content={<RevenueTooltip />} />
                                        <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Pie Chart */}
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                            <h3 className="mb-1 text-lg font-bold text-slate-900">Phương thức thanh toán</h3>
                            <p className="mb-4 text-sm text-slate-400">Theo tổng giá trị</p>
                            {methodData.length === 0 ? (
                                <div className="flex h-52 items-center justify-center text-slate-400 text-sm">
                                    Chưa có giao dịch
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={methodData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {methodData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend
                                            formatter={(val) => <span className="text-xs text-slate-600">{val}</span>}
                                        />
                                        <Tooltip formatter={(val) => fmt(val)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* ── Top Courses Table ── */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">Top 5 khóa học theo doanh thu – {year}</h3>
                        {topCourses.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-400">Chưa có dữ liệu</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-3 text-left font-semibold text-slate-500">#</th>
                                            <th className="py-3 text-left font-semibold text-slate-500">Khóa học</th>
                                            <th className="py-3 text-left font-semibold text-slate-500">Mã</th>
                                            <th className="py-3 text-right font-semibold text-slate-500">Doanh thu</th>
                                            <th className="py-3 text-right font-semibold text-slate-500">Học viên</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topCourses.map((c, i) => (
                                            <tr key={c._id} className="border-b border-slate-50 hover:bg-indigo-50/50 transition-colors">
                                                <td className="py-3 text-slate-400">
                                                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                                                        ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                            i === 1 ? 'bg-slate-100 text-slate-600' :
                                                                i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-medium text-slate-800">{c.name || '—'}</td>
                                                <td className="py-3 text-slate-500">{c.code || '—'}</td>
                                                <td className="py-3 text-right font-semibold text-indigo-600">{fmt(c.revenue)}</td>
                                                <td className="py-3 text-right text-slate-700">{c.learnerCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── Recent Transactions Table ── */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">Giao dịch gần đây – {year}</h3>
                        {recentTx.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-400">Chưa có giao dịch nào</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="py-3 text-left font-semibold text-slate-500">Ngày</th>
                                            <th className="py-3 text-left font-semibold text-slate-500">Học viên</th>
                                            <th className="py-3 text-left font-semibold text-slate-500">Khóa học</th>
                                            <th className="py-3 text-left font-semibold text-slate-500">Mã GD</th>
                                            <th className="py-3 text-right font-semibold text-slate-500">Số tiền</th>
                                            <th className="py-3 text-center font-semibold text-slate-500">Phương thức</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTx.map((tx) => {
                                            // Trích xuất mã giao dịch từ note (SePay ghi "SePay auto webhook - HP-xxx")
                                            const txCode = tx.note
                                                ? tx.note.replace('SePay auto webhook - ', '').trim()
                                                : null;
                                            return (
                                                <tr 
                                                    key={tx._id} 
                                                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedTx({ ...tx, txCode })}
                                                >
                                                    <td className="py-3 text-slate-500 whitespace-nowrap">
                                                        {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString('vi-VN') : '—'}
                                                    </td>
                                                    <td className="py-3">
                                                        {tx.learnerName?.trim() ? (
                                                            <>
                                                                <p className="font-medium text-slate-800">{tx.learnerName}</p>
                                                                <p className="text-xs text-slate-400">{tx.learnerEmail || ''}</p>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Không xác định</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-slate-600">
                                                        {tx.courseName || <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="py-3">
                                                        {txCode ? (
                                                            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                                {txCode}
                                                            </span>
                                                        ) : <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="py-3 text-right font-semibold text-green-600">{fmt(tx.amount)}</td>
                                                    <td className="py-3 text-center">
                                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium
                                                            ${tx.method === 'CASH' ? 'bg-green-100 text-green-700' :
                                                                tx.method === 'TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-purple-100 text-purple-700'}`}>
                                                            {METHOD_LABELS[tx.method] || tx.method}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal Chi tiết giao dịch */}
            <Modal
                isOpen={!!selectedTx}
                onClose={() => setSelectedTx(null)}
                title="Chi tiết giao dịch"
                size="md"
            >
                {selectedTx && (
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                            <span className="text-slate-500">Mã giao dịch</span>
                            <span className="font-mono text-slate-800 font-medium">
                                {selectedTx.txCode || '—'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                            <span className="text-slate-500">Ngày thanh toán</span>
                            <span className="text-slate-800 font-medium">
                                {selectedTx.paidAt ? new Date(selectedTx.paidAt).toLocaleString('vi-VN') : '—'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                            <span className="text-slate-500">Học viên</span>
                            <span className="text-slate-800 font-medium">{selectedTx.learnerName?.trim() || 'Không xác định'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                            <span className="text-slate-500">Email</span>
                            <span className="text-slate-800 font-medium">{selectedTx.learnerEmail || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                            <span className="text-slate-500">Khóa học</span>
                            <span className="text-slate-800 font-medium">{selectedTx.courseName || '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                            <span className="text-slate-500">Số tiền gốc ghi nhận</span>
                            <span className="text-slate-800 font-medium">{fmt(selectedTx.amount)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-3">
                            <span className="text-slate-500">Phương thức</span>
                            <span className="text-slate-800 font-medium">
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium
                                    ${selectedTx.method === 'CASH' ? 'bg-green-100 text-green-700' :
                                        selectedTx.method === 'TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                            'bg-purple-100 text-purple-700'}`}>
                                    {METHOD_LABELS[selectedTx.method] || selectedTx.method}
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Reports;

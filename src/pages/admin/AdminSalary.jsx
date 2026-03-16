import { useState, useEffect, useMemo } from 'react';
import SectionHeader from '../../components/ui/SectionHeader';
import DataTable from '../../components/ui/DataTable';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import Pagination from '../../components/common/Pagination';

const fmt = (n) => formatCurrency(n || 0);

const KpiCard = ({ label, value, sub, color = 'text-slate-900' }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const AdminSalary = () => {
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState([]);
  const [config, setConfig] = useState(null);
  const [courses, setCourses] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  // Filters
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    role: '', // '', 'INSTRUCTOR', 'CONSULTANT'
    search: '',
    courseId: '',
  });

  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [overrideForm, setOverrideForm] = useState({
    salaryHourlyRate: '',
    commissionOverrides: [],
  });

  // Config form
  const [configForm, setConfigForm] = useState({
    instructorHourlyRate: 80000,
    courseCommissions: [],
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    note: '',
  });

  useEffect(() => {
    loadData();
  }, [filters.month, filters.year, filters.role, filters.search, filters.courseId, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        month: filters.month,
        year: filters.year,
        role: filters.role || '',
        search: filters.search || '',
        courseId: filters.courseId || '',
        page: currentPage,
        limit: 10
      });

      const [summaryRes, configRes, coursesRes] = await Promise.all([
        apiClient.get(`/salary/monthly-summary?${query.toString()}`),
        apiClient.get('/salary/config'),
        apiClient.get('/salary/courses'),
      ]);

      setSalaryData(summaryRes?.data?.data?.users || []);
      if (summaryRes?.data?.data?.pagination) {
        setPagination({
          total: summaryRes.data.data.pagination.total,
          totalPages: summaryRes.data.data.pagination.pages
        });
      }
      setConfig(configRes?.data?.data || null);
      setCourses(coursesRes?.data?.data || []);
    } catch (error) {
      console.error('Error loading salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const data = salaryData;
    const instructors = data.filter(u => u.role === 'INSTRUCTOR');
    const consultants = data.filter(u => u.role === 'CONSULTANT');

    const totalSalary = data.reduce((sum, u) => sum + (u.totalSalary || 0), 0);
    const totalHours = data.reduce((sum, u) => sum + (u.totalTeachingHours || 0), 0);
    const totalCommission = data.reduce((sum, u) => sum + (u.totalCommission || 0), 0);
    const totalDocuments = data.reduce((sum, u) => sum + (u.totalDocuments || 0), 0);

    return {
      totalSalary,
      totalHours,
      totalCommission,
      totalDocuments,
      instructorCount: instructors.length,
      consultantCount: consultants.length,
    };
  }, [salaryData]);

  const handleOpenConfig = () => {
    if (config) {
      setConfigForm({
        instructorHourlyRate: config.instructorHourlyRate || 80000,
        courseCommissions: config.courseCommissions || [],
        effectiveFrom: config.effectiveFrom ? config.effectiveFrom.split('T')[0] : '',
        effectiveTo: config.effectiveTo ? config.effectiveTo.split('T')[0] : '',
        note: config.note || '',
      });
    }
    setShowConfigModal(true);
  };

  const handleOpenOverride = async (user) => {
    setSelectedUser(user);
    setShowOverrideModal(true);
    try {
      const res = await apiClient.get(`/salary/users/${user._id || user.userId}/override`);
      const data = res?.data?.data;
      setOverrideForm({
        salaryHourlyRate: data?.salaryHourlyRate ?? '',
        commissionOverrides: data?.commissionOverrides || [],
      });
    } catch (error) {
      alert('Không tải được cấu hình lương cá nhân');
    }
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      const payload = {
        salaryHourlyRate: overrideForm.salaryHourlyRate === '' ? null : Number(overrideForm.salaryHourlyRate),
        commissionOverrides: overrideForm.commissionOverrides.map(c => ({
          courseId: c.courseId?._id || c.courseId,
          commissionAmount: Number(c.commissionAmount || 0),
        })),
      };
      await apiClient.put(`/salary/users/${selectedUser._id || selectedUser.userId}/override`, payload);
      setShowOverrideModal(false);
      await loadData();
      alert('Đã cập nhật lương cá nhân');
    } catch (error) {
      alert(error.message || 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const updateOverrideCommission = (courseId, value) => {
    setOverrideForm(prev => {
      const exists = prev.commissionOverrides.find(c => (c.courseId?._id || c.courseId) === courseId);
      if (exists) {
        return {
          ...prev,
          commissionOverrides: prev.commissionOverrides.map(c =>
            (c.courseId?._id || c.courseId) === courseId
              ? { ...c, commissionAmount: value }
              : c
          ),
        };
      }
      return {
        ...prev,
        commissionOverrides: [...prev.commissionOverrides, { courseId, commissionAmount: value }],
      };
    });
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...configForm,
        courseCommissions: configForm.courseCommissions.map(c => ({
          courseId: c.courseId,
          commissionAmount: Number(c.commissionAmount),
        })),
      };

      if (config?._id) {
        await apiClient.put(`/salary/config/${config._id}`, payload);
      } else {
        await apiClient.post('/salary/config', payload);
      }

      await loadData();
      setShowConfigModal(false);
      alert('Đã lưu cấu hình');
    } catch (error) {
      alert(error.message || 'Lưu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (user) => {
    setSelectedUser(user);
    setDetailLoading(true);
    setShowDetailModal(true);

    try {
      const query = new URLSearchParams({
        month: filters.month,
        year: filters.year,
        userId: user._id || user.userId,
        courseId: filters.courseId || ''
      });
      const res = await apiClient.get(`/salary/detail?${query.toString()}`);
      setDetailData(res?.data?.data || null);
    } catch (error) {
      console.error('Error loading detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = async (userId) => {
    try {
      const params = new URLSearchParams({
        month: filters.month,
        year: filters.year,
        courseId: filters.courseId || '',
        userId
      });
      const response = await apiClient.get(`/salary/export?${params}`, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `luong_${filters.month}_${filters.year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Xuất file thất bại');
    }
  };

  const updateCommission = (courseId, field, value) => {
    setConfigForm(prev => ({
      ...prev,
      courseCommissions: prev.courseCommissions.map(c =>
        c.courseId === courseId ? { ...c, [field]: value } : c
      ),
    }));
  };

  const addCommission = (courseId) => {
    if (configForm.courseCommissions.find(c => c.courseId === courseId)) return;
    setConfigForm(prev => ({
      ...prev,
      courseCommissions: [...prev.courseCommissions, { courseId, commissionAmount: 0 }],
    }));
  };

  const removeCommission = (courseId) => {
    setConfigForm(prev => ({
      ...prev,
      courseCommissions: prev.courseCommissions.filter(c => c.courseId !== courseId),
    }));
  };

  const columns = [
    {
      key: 'userName',
      title: 'Nhân viên',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-900">{row.fullName || row.userName || '—'}</p>
          <p className="text-xs text-slate-500">{row.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Tư vấn'}</p>
        </div>
      ),
    },
    {
      key: 'totalTeachingSessions',
      title: 'Số buổi dạy',
      render: (_, row) => row.totalTeachingSessions || 0,
    },
    {
      key: 'totalTeachingHours',
      title: 'Giờ dạy',
      render: (_, row) => row.totalTeachingHours || 0,
    },
    {
      key: 'totalDocuments',
      title: 'Số hồ sơ',
      render: (_, row) => row.totalDocuments || 0,
    },
    {
      key: 'hourlyRate',
      title: 'Lương/giờ',
      render: (_, row) => fmt(row.hourlyRate || 0),
    },
    {
      key: 'teachingSalary',
      title: 'Lương giờ',
      render: (_, row) => <span className="font-medium">{fmt(row.teachingSalary || 0)}</span>,
    },
    {
      key: 'totalCommission',
      title: 'Hoa hồng',
      render: (_, row) => <span className="text-indigo-600 font-medium">{fmt(row.totalCommission || 0)}</span>,
    },
    {
      key: 'totalSalary',
      title: 'Tổng lương',
      render: (_, row) => <span className="font-bold text-emerald-600">{fmt(row.totalSalary || 0)}</span>,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (_, row) => (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleViewDetail(row)}
            className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
          >
            Chi tiết
          </button>
          <button
            onClick={() => handleOpenOverride(row)}
            className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
          >
            Chỉnh lương
          </button>
          <button
            onClick={() => handleExport(row._id || row.userId)}
            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Xuất CSV
          </button>
        </div>
      ),
    },
  ];

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="QUẢN LÝ LƯƠNG"
        description="Quản lý lương và hoa hồng cho giảng viên và tư vấn viên"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tổng lương" value={fmt(stats.totalSalary)} sub="Tháng này" color="text-emerald-600" />
        <KpiCard label="Tổng giờ dạy" value={stats.totalHours} sub="Giảng viên" />
        <KpiCard label="Tổng hồ sơ" value={stats.totalDocuments} sub="Tư vấn viên" color="text-indigo-600" />
        <KpiCard
          label="Nhân viên"
          value={stats.instructorCount + stats.consultantCount}
          sub={`${stats.instructorCount} GV, ${stats.consultantCount} TV`}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.month}
            onChange={(e) => setFilters(f => ({ ...f, month: Number(e.target.value) }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={filters.year}
            onChange={(e) => setFilters(f => ({ ...f, year: Number(e.target.value) }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={filters.role}
            onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            <option value="INSTRUCTOR">Giảng viên</option>
            <option value="CONSULTANT">Tư vấn viên</option>
          </select>

          <select
            value={filters.courseId}
            onChange={(e) => setFilters(f => ({ ...f, courseId: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tất cả khóa học</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.name} ({course.code})</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Tìm tên..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="flex-1 min-w-[150px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />

          <button
            onClick={() => setFilters({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), role: '', search: '', courseId: '' })}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            Xóa lọc
          </button>

          <button
            onClick={handleOpenConfig}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Cấu hình lương
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={salaryData} />
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Cấu hình lương</h3>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lương/giờ (VNĐ)</label>
                  <input
                    type="number"
                    value={configForm.instructorHourlyRate}
                    onChange={(e) => setConfigForm(f => ({ ...f, instructorHourlyRate: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hiệu lực</label>
                  <input
                    type="date"
                    value={configForm.effectiveFrom}
                    onChange={(e) => setConfigForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hoa hồng theo khóa học</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {courses.map(course => {
                    const commission = configForm.courseCommissions.find(c => c.courseId === course._id);
                    return (
                      <div key={course._id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <span className="flex-1 text-sm">{course.name} ({course.code})</span>
                        <input
                          type="number"
                          placeholder="Số tiền"
                          value={commission?.commissionAmount || ''}
                          onChange={(e) => updateCommission(course._id, 'commissionAmount', e.target.value)}
                          className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => commission ? removeCommission(course._id) : addCommission(course._id)}
                          className={`px-2 py-1 text-xs rounded ${commission ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                        >
                          {commission ? 'Xóa' : 'Thêm'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  value={configForm.note}
                  onChange={(e) => setConfigForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
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

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Chi tiết lương</h3>
            <p className="text-sm text-slate-600 mb-4">
              {selectedUser.fullName || selectedUser.userName} - {selectedUser.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Tư vấn viên'}
            </p>

            {detailLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : detailData ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-xs text-slate-500">Lương giờ</p>
                    <p className="text-lg font-bold">{fmt(detailData.teachingSalary || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Hoa hồng</p>
                    <p className="text-lg font-bold text-indigo-600">{fmt(detailData.totalCommission || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tổng lương</p>
                    <p className="text-lg font-bold text-emerald-600">{fmt(detailData.totalSalary || 0)}</p>
                  </div>
                </div>

                {/* Teaching Details */}
                {detailData.teachingDetails?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Chi tiết giờ dạy</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {detailData.teachingDetails.map((t, idx) => (
                        <div key={idx} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                          <span>{new Date(t.date).toLocaleDateString('vi-VN')} - Ca {t.timeSlot} - {t.learnerName}</span>
                          <span className="font-medium">{fmt(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commission Details */}
                {detailData.commissionDetails?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Chi tiết hoa hồng</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {detailData.commissionDetails.map((c, idx) => (
                        <div key={idx} className="flex justify-between text-sm p-2 bg-indigo-50 rounded">
                          <span>{c.courseName} - {c.learnerName}</span>
                          <span className="font-medium text-indigo-600">{fmt(c.commission)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">Không có dữ liệu</p>
            )}

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Chỉnh lương cá nhân</h3>
            <p className="text-sm text-slate-600 mb-4">
              {selectedUser.fullName || selectedUser.userName} - {selectedUser.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Tư vấn viên'}
            </p>

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lương/giờ (để trống = dùng cấu hình chung)</label>
                <input
                  type="number"
                  value={overrideForm.salaryHourlyRate}
                  onChange={(e) => setOverrideForm(f => ({ ...f, salaryHourlyRate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hoa hồng theo khóa học</label>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {courses.map(course => {
                    const ov = overrideForm.commissionOverrides.find(c => (c.courseId?._id || c.courseId) === course._id);
                    return (
                      <div key={course._id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <span className="flex-1 text-sm">{course.name} ({course.code})</span>
                        <input
                          type="number"
                          placeholder="Số tiền"
                          value={ov?.commissionAmount ?? ''}
                          onChange={(e) => updateOverrideCommission(course._id, e.target.value)}
                          className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">Nếu để trống hoa hồng, hệ thống sẽ dùng cấu hình chung.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
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
    </div>
  );
};

export default AdminSalary;

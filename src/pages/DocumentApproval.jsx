import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/apiClient';
import { Button, DataTable, SectionHeader, StatusBadge } from '../components/ui';
import ConfirmDialog from '../components/common/ConfirmDialog';

const mapDocStatus = (status) => {
  if (status === 'APPROVED') return { badge: 'done', label: 'Đã duyệt' };
  if (status === 'REJECTED') return { badge: 'canceled', label: 'Từ chối' };
  return { badge: 'pending', label: 'Chờ duyệt' };
};

const DocumentApproval = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: async () => {},
  });

  const loadDocs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/documents/review?status=${statusFilter}`);
      if (response.status === 'success') {
        setDocs(response.data || []);
      } else {
        setDocs([]);
      }
    } catch (err) {
      console.error('Load documents for review error:', err);
      showToast(err?.message || 'Không thể tải danh sách hồ sơ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleUpdateStatus = (doc, nextStatus) => {
    const studentName = doc?.registrationId?.studentId?.fullName || 'Học viên';
    const cccd = doc?.cccdNumber ? ` (CCCD: ${doc.cccdNumber})` : '';
    const isApprove = nextStatus === 'APPROVED';

    setConfirmDialog({
      isOpen: true,
      title: isApprove ? 'Duyệt hồ sơ' : 'Từ chối hồ sơ',
      message: `${isApprove ? 'Duyệt' : 'Từ chối'} hồ sơ của "${studentName}"${cccd}?`,
      type: isApprove ? 'default' : 'danger',
      onConfirm: async () => {
        try {
          await apiClient.patch(`/documents/${doc._id}/status`, { status: nextStatus });
          showToast(isApprove ? 'Đã duyệt hồ sơ' : 'Đã từ chối hồ sơ', 'success');
          await loadDocs();
        } catch (err) {
          showToast(err?.message || 'Cập nhật trạng thái thất bại', 'error');
          throw err;
        }
      },
    });
  };

  const rows = useMemo(() => {
    return (docs || []).map((d, idx) => {
      const reg = d.registrationId || {};
      const student = reg.studentId || {};
      const batch = reg.batchId || {};
      const course = batch.courseId || {};

      const statusInfo = mapDocStatus(d.status);

      const locationText = Array.isArray(batch.location) ? batch.location.join(', ') : batch.location;
      const courseText = [course.code, course.name].filter(Boolean).join(' - ') || '—';
      const batchText = [courseText, locationText].filter(Boolean).join(' · ') || '—';

      return {
        key: d._id || idx,
        student: student.fullName || '—',
        contact: [student.phone, student.email].filter(Boolean).join(' · ') || '—',
        batch: batchText,
        method: reg.registerMethod === 'CONSULTANT' ? 'Sale' : 'Admin',
        cccd: d.cccdNumber || '—',
        status: <StatusBadge status={statusInfo.badge} label={statusInfo.label} />,
        files: (
          <div className="flex flex-wrap gap-2">
            {d.cccdImage && (
              <a className="text-xs font-semibold text-indigo-700 hover:underline" href={d.cccdImage} target="_blank" rel="noreferrer">
                CCCD
              </a>
            )}
            {d.healthCertificate && (
              <a className="text-xs font-semibold text-indigo-700 hover:underline" href={d.healthCertificate} target="_blank" rel="noreferrer">
                Khám SK
              </a>
            )}
            {d.photo && (
              <a className="text-xs font-semibold text-indigo-700 hover:underline" href={d.photo} target="_blank" rel="noreferrer">
                Ảnh 3x4
              </a>
            )}
            {!d.cccdImage && !d.healthCertificate && !d.photo ? <span className="text-xs text-slate-500">—</span> : null}
          </div>
        ),
        action: (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleUpdateStatus(d, 'APPROVED')} disabled={d.status === 'APPROVED'}>
              Duyệt
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(d, 'REJECTED')} disabled={d.status === 'REJECTED'}>
              Từ chối
            </Button>
          </div>
        ),
      };
    });
  }, [docs]);

  const columns = [
    { key: 'student', title: 'Học viên', dataIndex: 'student' },
    { key: 'contact', title: 'Liên hệ', dataIndex: 'contact' },
    { key: 'batch', title: 'Khóa/Lớp', dataIndex: 'batch' },
    { key: 'method', title: 'Phụ trách', dataIndex: 'method' },
    { key: 'cccd', title: 'Số CCCD', dataIndex: 'cccd' },
    { key: 'files', title: 'Giấy tờ', dataIndex: 'files' },
    { key: 'status', title: 'Trạng thái', dataIndex: 'status' },
    { key: 'action', title: '', dataIndex: 'action' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Phê duyệt hồ sơ"
          description={`Duyệt giấy tờ học viên · Quyền: ${user?.role || '—'}`}
          action={
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              >
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
              <Button variant="outline" onClick={loadDocs}>
                Làm mới
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">Không có hồ sơ phù hợp.</div>
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default DocumentApproval;


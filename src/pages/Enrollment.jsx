import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import { docs, enrollmentSteps } from '../data/mockData';

const Enrollment = () => {
  const docColumns = [
    { key: 'name', title: 'Hồ sơ', dataIndex: 'name' },
    { key: 'status', title: 'Trạng thái', dataIndex: 'status', render: (val) => <StatusBadge status={val} /> },
    { key: 'owner', title: 'Phụ trách', dataIndex: 'owner' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Quy trình hồ sơ"
          description="Chuẩn hóa đăng ký – duyệt hồ sơ – nộp Sở"
          action={
            <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              Tạo hồ sơ mới
            </button>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {enrollmentSteps.map((step) => (
            <div key={step.id} className="rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-indigo-600">{step.owner}</p>
                <StatusBadge status={step.status} />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="text-xs text-slate-600">{step.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader
            title="Tài liệu cần thiết"
            description="Học viên upload, staff kiểm tra và duyệt"
            action={<button className="text-sm font-semibold text-indigo-700">Gửi link upload</button>}
          />
          <DataTable columns={docColumns} data={docs} />
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader
            title="Luật huỷ hồ sơ"
            description="Tự động cảnh báo sau thời gian quá hạn"
          />
          <div className="space-y-3 text-sm text-slate-700">
            <p>• Đóng học phí chậm: có đơn gia hạn 1 tháng → quá hạn → huỷ hồ sơ.</p>
            <p>• Không đơn: 7 ngày không liên lạc → huỷ hồ sơ.</p>
            <p>• Không huỷ trước 24h lịch học → mất quyền lợi buổi học.</p>
            <p>• Mọi thay đổi nghiệp vụ cần quyền Staff hoặc Admin.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;


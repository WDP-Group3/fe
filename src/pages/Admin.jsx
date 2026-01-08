import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import { users } from '../data/mockData';

const Admin = () => {
  const columns = [
    { key: 'name', title: 'Tên', dataIndex: 'name' },
    { key: 'role', title: 'Vai trò', dataIndex: 'role' },
    { key: 'assignedTo', title: 'Phân công', dataIndex: 'assignedTo' },
    { key: 'status', title: 'Trạng thái', dataIndex: 'status', render: (val) => <StatusBadge status="done" label={val} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Quản trị & phân quyền"
          description="Admin toàn quyền hệ thống, Staff chỉ xem phạm vi được phân"
          action={<button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Tạo user</button>}
        />
        <DataTable columns={columns} data={users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Quyền chỉnh sửa profile" />
          <div className="space-y-2 text-sm text-slate-700">
            <p>• Student: chỉnh profile của chính mình.</p>
            <p>• Instructor: chỉnh profile của chính mình.</p>
            <p>• Sale/Staff: chỉnh profile của mình & học viên được phân công.</p>
            <p>• Admin: chỉnh tất cả profile, phân quyền, khoá/mở tài khoản.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Cấu hình hệ thống" description="Course, học phí, lịch học, câu hỏi thi" />
          <form className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Tên trung tâm</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" placeholder="DriveCenter" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Kênh thông báo mặc định</label>
                <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none">
                  <option>SMS + App</option>
                  <option>Email</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Vùng hoạt động</label>
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" placeholder="TP. HCM" />
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              onClick={() => {
                // Cần call đến BE để lưu cấu hình hệ thống
              }}
            >
              Lưu cấu hình
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Admin;


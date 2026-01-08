import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';

const Exams = () => {
  const topics = [
    { name: 'Biển báo', progress: '88%', attempts: 12 },
    { name: 'Quy tắc', progress: '72%', attempts: 9 },
    { name: 'Sa hình', progress: '64%', attempts: 6 },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Thi thử lý thuyết"
          description="600 câu Bộ GTVT · Thi ngẫu nhiên / theo chủ đề"
          action={<button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Bắt đầu đề ngẫu nhiên</button>}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {topics.map((topic) => (
            <div key={topic.name} className="rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{topic.name}</p>
                <StatusBadge status="doing" label="Luyện tập" />
              </div>
              <p className="text-3xl font-bold text-indigo-700">{topic.progress}</p>
              <p className="text-xs text-slate-500">{topic.attempts} lần luyện gần nhất</p>
              <button className="mt-3 w-full rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                Thi theo chủ đề
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Lịch sử thi thử"
          description="Lưu kết quả, thống kê câu sai để ôn tập"
        />
        <div className="space-y-3">
          {[35, 34, 33].map((score, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Đề ngẫu nhiên #{201 + idx}</p>
                <p className="text-xs text-slate-500">18h ngày 07/01/2026</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-indigo-700">{score}/35</p>
                <button className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-800">
                  Xem câu sai
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Exams;


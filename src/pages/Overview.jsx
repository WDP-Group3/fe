import { Link } from 'react-router-dom';
import { Carousel, Button } from '../components/ui';
import StatCard from '../components/ui/StatCard';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import ProgressBar from '../components/ui/ProgressBar';
import { adminMetrics, paymentSchedule, sessions } from '../data/mockData';
import { formatCurrency } from '../utils/formatters';

const Overview = () => {
  // Banner carousel data
  const banners = [
    {
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=400&fit=crop',
      title: 'Chương trình khuyến mãi tháng 2',
      description: 'Giảm 10% học phí cho học viên đăng ký trước 15/02',
      button: { label: 'Xem chi tiết', onClick: () => window.location.href = '/portal/courses' },
    },
    {
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=400&fit=crop',
      title: 'Lịch khai giảng mới',
      description: 'Khai giảng khóa B2 vào 20/02 - Đăng ký ngay để nhận ưu đãi',
      button: { label: 'Đăng ký ngay', onClick: () => window.location.href = '/portal/enrollment' },
    },
    {
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop',
      title: 'Thi thử miễn phí không giới hạn',
      description: 'Luyện tập với 600 câu hỏi mới nhất từ Bộ GTVT',
      button: { label: 'Bắt đầu thi thử', onClick: () => window.location.href = '/portal/exams' },
    },
    {
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&h=400&fit=crop',
      title: 'Hỗ trợ học phí linh hoạt',
      description: 'Chia đợt thanh toán, hỗ trợ công nợ cho học viên',
      button: { label: 'Xem thêm', onClick: () => window.location.href = '/portal/payments' },
    },
  ];

  // Icons for StatCards
  const studentIcon = (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const invoiceIcon = (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const examIcon = (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );

  const cancelIcon = (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const paymentColumns = [
    { key: 'title', title: 'Đợt', dataIndex: 'title' },
    { key: 'amount', title: 'Số tiền', dataIndex: 'amount', render: (val) => formatCurrency(val) },
    { key: 'due', title: 'Hạn', dataIndex: 'due' },
    { key: 'status', title: 'Trạng thái', dataIndex: 'status', render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="space-y-8">
      {/* Banner Carousel */}
      <div className="overflow-hidden rounded-3xl">
        <Carousel items={banners} autoPlay interval={2000} showDots showArrows />
      </div>

      {/* Stats Section with Images */}
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-indigo-50/30 to-white p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Tổng quan vận hành"
          description="Theo dõi tiến độ học viên, lịch học và công nợ"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Học viên đang học" 
            value={adminMetrics.activeStudents} 
            delta="+12 tuần này"
            icon={studentIcon}
          />
          <StatCard 
            title="Hóa đơn chưa thanh toán" 
            value={adminMetrics.unpaidInvoices} 
            delta="Nhắc tự động qua SMS"
            icon={invoiceIcon}
          />
          <StatCard 
            title="Lịch sát hạch sắp tới" 
            value={adminMetrics.upcomingExams} 
            delta="Đủ buổi + đậu thi thử"
            icon={examIcon}
          />
          <StatCard 
            title="Lịch huỷ gần đây" 
            value={adminMetrics.canceledBookings} 
            delta="Nhắc 24h trước lịch"
            icon={cancelIcon}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        {/* Payment Section with Image */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-emerald-50/20 to-white p-6 shadow-sm backdrop-blur">
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-emerald-100/50 blur-3xl" />
          <SectionHeader
            title="Thanh toán theo đợt"
            description="Chia đợt, nhắc phí tự động, staff xác nhận giao dịch"
            action={
              <Button variant="outline" size="sm">
                Tạo phiếu thu
              </Button>
            }
          />
          <div className="relative z-10 mt-4">
            <DataTable columns={paymentColumns} data={paymentSchedule} />
          </div>
        </div>

        {/* Schedule Section with Images */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-indigo-50/20 to-white p-6 shadow-sm backdrop-blur">
          <div className="absolute left-0 bottom-0 h-32 w-32 translate-y-8 -translate-x-8 rounded-full bg-indigo-100/50 blur-3xl" />
          <SectionHeader
            title="Lịch học sắp tới"
            description="Tránh trùng lịch giáo viên, xe, học viên"
            action={
              <Link to="/portal/schedule">
                <Button variant="outline" size="sm">
                  Xem lịch
                </Button>
              </Link>
            }
          />
          <div className="relative z-10 mt-4 space-y-4">
            {sessions.slice(0, 4).map((item) => (
              <div 
                key={item.id} 
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white/80 p-4 backdrop-blur transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-gradient-to-br from-indigo-100/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-sm">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.type}</p>
                    <p className="text-xs text-slate-500">
                      {item.date} · {item.time}
                    </p>
                    <p className="text-xs text-slate-500">{item.instructor} · {item.location}</p>
                  </div>
                  <StatusBadge status="doing" label="Đủ xe + GV" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Section with Visual Elements */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-sky-50/30 to-white p-6 shadow-sm backdrop-blur">
        <div className="absolute right-0 top-0 h-40 w-40 -translate-y-12 translate-x-12 rounded-full bg-sky-100/50 blur-3xl" />
        <SectionHeader
          title="Tiến độ hồ sơ"
          description="Học viên và staff cùng xem trạng thái"
          action={<span className="text-sm text-slate-500">Cập nhật 08/01/2026</span>}
        />
        <div className="relative z-10 mt-4 grid gap-4 md:grid-cols-3">
          {[
            { 
              title: 'Học viên đủ hồ sơ', 
              value: 76,
              icon: '✅',
              color: 'emerald',
              image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
            },
            { 
              title: 'Chờ khám sức khoẻ', 
              value: 18,
              icon: '⏳',
              color: 'amber',
              image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
            },
            { 
              title: 'Chưa liên lạc >7 ngày', 
              value: 6,
              icon: '⚠️',
              color: 'rose',
              image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
            },
          ].map((item) => (
            <div 
              key={item.title} 
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-5 transition-opacity group-hover:opacity-10"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="relative flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className={`text-2xl font-bold ${
                      item.color === 'emerald' ? 'text-emerald-700' :
                      item.color === 'amber' ? 'text-amber-700' :
                      'text-rose-700'
                    }`}>
                      {item.value}
                    </span>
                    <div className="flex-1">
                      <ProgressBar value={item.value} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions with Images */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Khóa học',
            description: 'Xem danh sách khóa học',
            image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
            link: '/portal/courses',
            gradient: 'from-indigo-600/80',
          },
          {
            title: 'Đăng ký',
            description: 'Quản lý hồ sơ đăng ký',
            image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
            link: '/portal/enrollment',
            gradient: 'from-emerald-600/80',
          },
          {
            title: 'Học phí',
            description: 'Theo dõi thanh toán',
            image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
            link: '/portal/payments',
            gradient: 'from-amber-600/80',
          },
          {
            title: 'Thi thử',
            description: 'Luyện tập 600 câu',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
            link: '/portal/exams',
            gradient: 'from-sky-600/80',
          },
        ].map((action) => (
          <Link
            key={action.title}
            to={action.link}
            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:scale-105 hover:shadow-lg"
          >
            <div className="relative h-32 overflow-hidden">
              <img
                src={action.image}
                alt={action.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${action.gradient} to-transparent`} />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-slate-900">{action.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Overview;


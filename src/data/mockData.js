// Mock data for UI demonstration only
export const courses = [
  {
    id: 'A1',
    name: 'Hạng A1 - Xe máy',
    price: 1200000,
    installments: ['Đợt 1: 700.000', 'Đợt 2: 500.000'],
    startDates: ['12/02', '26/02', '12/03'],
    duration: '2 tuần lý thuyết · 2 tuần thực hành',
    perks: ['Hỗ trợ học online', 'Thi thử không giới hạn', 'Nhắc lịch qua SMS'],
  },
  {
    id: 'B1',
    name: 'Hạng B1 - Số tự động',
    price: 9800000,
    installments: ['Đợt 1: 5.000.000', 'Đợt 2: 3.800.000', 'Phụ phí hồ sơ 1.000.000'],
    startDates: ['18/02', '04/03', '18/03'],
    duration: '4 tuần lý thuyết · 8 tuần thực hành',
    perks: ['Xe tập lái điều hòa', 'Giáo viên theo khung giờ linh hoạt', 'Hỗ trợ công nợ'],
  },
  {
    id: 'B2',
    name: 'Hạng B2 - Số sàn',
    price: 11500000,
    installments: ['Đợt 1: 6.000.000', 'Đợt 2: 4.500.000', 'Phụ phí hồ sơ 1.000.000'],
    startDates: ['28/02', '14/03', '28/03'],
    duration: '4 tuần lý thuyết · 10 tuần thực hành',
    perks: ['Chống trùng lịch xe + giáo viên', 'Lộ trình sát hạch chuẩn Sở', 'Nhắc phí tự động'],
  },
];

export const enrollmentSteps = [
  { id: 1, title: 'Đăng ký', status: 'done', owner: 'Học viên', note: 'Đã nhập thông tin & upload hồ sơ' },
  { id: 2, title: 'Duyệt hồ sơ', status: 'doing', owner: 'Staff', note: 'Chờ kiểm tra CMND + giấy khám sức khoẻ' },
  { id: 3, title: 'Nộp Sở', status: 'idle', owner: 'Staff', note: 'Hồ sơ đủ, lên danh sách nộp Sở' },
  { id: 4, title: 'Lịch học', status: 'idle', owner: 'Học viên', note: 'Đặt lịch thực hành sau khi đóng đợt 1' },
  { id: 5, title: 'Thi thử', status: 'idle', owner: 'Học viên', note: 'Thi thử 3 đề, đạt >= 32/35' },
  { id: 6, title: 'Sát hạch', status: 'idle', owner: 'Học viên', note: 'Đủ điểm và đủ buổi, xếp lịch sát hạch' },
];

export const paymentSchedule = [
  { id: 'PM-01', title: 'Đợt 1 - Giữ chỗ', amount: 5000000, due: '15/02/2026', status: 'paid' },
  { id: 'PM-02', title: 'Đợt 2 - Trước thực hành', amount: 3800000, due: '10/03/2026', status: 'pending' },
  { id: 'PM-03', title: 'Phụ phí hồ sơ', amount: 1000000, due: '10/03/2026', status: 'pending' },
];

export const sessions = [
  { id: 'S-101', date: '18/02', time: '18:00 - 20:00', instructor: 'Nguyễn Minh Trí', location: 'Bãi tập Thủ Đức', type: 'Lý thuyết' },
  { id: 'S-102', date: '20/02', time: '18:00 - 20:00', instructor: 'Nguyễn Minh Trí', location: 'Online', type: 'Thi thử' },
  { id: 'S-201', date: '23/02', time: '07:00 - 09:00', instructor: 'Lê Quang Huy', location: 'Bãi tập Quận 9', type: 'Thực hành' },
  { id: 'S-202', date: '25/02', time: '09:00 - 11:00', instructor: 'Lê Quang Huy', location: 'Bãi tập Quận 9', type: 'Thực hành' },
];

export const notifications = [
  { id: 'N-01', title: 'Nhắc đóng học phí đợt 2', audience: 'Học viên', channel: 'SMS + App', time: 'Trước hạn 5 ngày' },
  { id: 'N-02', title: 'Thông báo lịch học mai', audience: 'Học viên', channel: 'App push', time: '18h ngày hôm trước' },
  { id: 'N-03', title: 'Cảnh báo hồ sơ quá hạn', audience: 'Staff + Admin', channel: 'Email', time: 'Mỗi sáng 08h' },
];

export const users = [
  { name: 'Lê Văn Nam', role: 'Student', assignedTo: 'Staff Hoa', status: 'active' },
  { name: 'Trần Thị Hoa', role: 'Staff', assignedTo: 'Team Q1', status: 'active' },
  { name: 'Nguyễn Minh Trí', role: 'Instructor', assignedTo: 'Bãi tập Thủ Đức', status: 'active' },
];

export const adminMetrics = {
  activeStudents: 180,
  unpaidInvoices: 24,
  upcomingExams: 12,
  canceledBookings: 4,
  staffProductivity: 87,
};

export const docs = [
  { name: 'CMND/CCCD', status: 'done', owner: 'Student' },
  { name: 'Khám sức khoẻ', status: 'doing', owner: 'Student' },
  { name: 'Đơn xin dự thi', status: 'idle', owner: 'Staff' },
];


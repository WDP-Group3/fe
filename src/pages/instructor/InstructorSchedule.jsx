import React, { useState, useEffect } from 'react';
import { SectionHeader, Button, Loading, Modal } from '../../components/ui';
import WeekScheduler from '../../components/scheduler/WeekScheduler';
import apiClient from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

const SLOTS = [
  { id: 1, label: 'Ca 1 (07:00 - 09:00)', startHour: 7 },
  { id: 2, label: 'Ca 2 (09:00 - 11:00)', startHour: 9 },
  { id: 3, label: 'Ca 3 (13:00 - 15:00)', startHour: 13 },
  { id: 4, label: 'Ca 4 (15:00 - 17:00)', startHour: 15 },
];

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const InstructorSchedule = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  
  // [NEW] Modal chi tiết học viên
  const [studentDetailModal, setStudentDetailModal] = useState({ isOpen: false, data: null });

  useEffect(() => { fetchSchedule(); }, [currentMonday]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const sunday = new Date(currentMonday);
      sunday.setDate(currentMonday.getDate() + 6);
      const startDateISO = new Date(currentMonday.setHours(0, 0, 0, 0)).toISOString();
      const endDateISO = new Date(sunday.setHours(23, 59, 59, 999)).toISOString();
      const res = await apiClient.get(`/schedule/instructor?startDate=${startDateISO}&endDate=${endDateISO}`);
      if (res.status === 'success') {
        setSchedules((res.data || []).map(item => ({ ...item, timeSlot: Number(item.timeSlot) })));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleSlotClick = async (date, slotId, existingData) => {
    const now = new Date();
    const currentSlot = SLOTS.find(s => s.id === Number(slotId));
    const checkDate = new Date(date);
    if (currentSlot) checkDate.setHours(currentSlot.startHour, 0, 0, 0);

    // 1. CHẶN THAO TÁC QUÁ KHỨ (NẾU CHƯA CÓ LỊCH)
    if (checkDate < now && !existingData) {
      showToast('Thời gian này đã qua, không thể thao tác!', 'error'); return;
    }

    // 2. GIỚI HẠN TUẦN
    const nextWeekSunday = getMonday(now);
    nextWeekSunday.setDate(nextWeekSunday.getDate() + 13);
    nextWeekSunday.setHours(23, 59, 59, 999);
    if (new Date(date) > nextWeekSunday) {
      showToast('Chỉ được thao tác trong tuần này và tuần sau', 'error'); return;
    }

    // 3. TẠO DATE STRING
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateString = `${y}-${m}-${d}`;

    // --- LUỒNG 1: CÓ LỊCH HỌC -> MỞ MODAL CHI TIẾT HỌC VIÊN ---
    if ((existingData?.category === 'BOOKED' || existingData?.category === 'TEACHING')) {
      setStudentDetailModal({ isOpen: true, data: existingData });
      return;
    }

    // --- LUỒNG 2: BÁO BẬN ---
    if (checkDate < now) { showToast('Không thể báo bận quá khứ', 'error'); return; }
    if (existingData?.category === 'BOOKED') { showToast('Lịch đã có người đặt', 'info'); return; }

    try {
      const res = await apiClient.post('/schedule/busy', { date: dateString, timeSlot: slotId });
      showToast(res.message, 'success'); fetchSchedule();
    } catch (error) { showToast(error.message, 'error'); }
  };

  // HÀM XỬ LÝ ĐIỂM DANH (Được gọi từ Modal)
  const processAttendance = async (attendanceType) => {
    const { data } = studentDetailModal;
    if (!data) return;

    // Check giờ
    const currentSlot = SLOTS.find(s => s.id === Number(data.timeSlot));
    const checkDate = new Date(data.date);
    if (currentSlot) checkDate.setHours(currentSlot.startHour, 0, 0, 0);
    
    if (checkDate > new Date()) {
        showToast('Chưa đến giờ học, không thể điểm danh sớm!', 'error');
        return;
    }

    try {
      await apiClient.patch(`/bookings/${data._id}/attendance`, {
        attendance: attendanceType,
        instructorNote: attendanceType === 'PRESENT' ? "Tham gia tốt" : "Học viên vắng mặt"
      });
      showToast('Cập nhật điểm danh thành công', 'success'); 
      fetchSchedule();
      setStudentDetailModal({ isOpen: false, data: null });
    } catch (e) { showToast(e.message, 'error'); }
  };

  const groupedSchedules = schedules
    .filter(s => s.category === 'BOOKED' || s.category === 'TEACHING')
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.timeSlot - b.timeSlot)
    .reduce((acc, curr) => {
      const dateKey = new Date(curr.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(curr);
      return acc;
    }, {});

  return (
    <div className="space-y-10">
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <SectionHeader title="Quản Lý Lịch Dạy" description="Click ô xanh để xem thông tin & điểm danh, ô trống báo bận" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonday(getMonday(new Date(currentMonday.setDate(currentMonday.getDate() - 7))))}>Tuần trước</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonday(getMonday(new Date()))}>Hiện tại</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonday(getMonday(new Date(currentMonday.setDate(currentMonday.getDate() + 7))))}>Tuần sau</Button>
          </div>
        </div>
        
        <div className="flex gap-4 text-[11px] mb-4 bg-slate-50 p-3 rounded-lg border font-bold uppercase">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border"></div> Trống</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 border"></div> Báo Bận</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-100 border"></div> Có Lịch dạy</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-50 opacity-40 border"></div> Quá hạn</div>
        </div>

        {loading ? <Loading /> : <WeekScheduler startDate={currentMonday} scheduleData={schedules} onSlotClick={handleSlotClick} userRole="INSTRUCTOR" />}
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 border-l-4 border-indigo-500 pl-3">Chi Tiết Các Buổi Dạy</h3>
        {Object.keys(groupedSchedules).length === 0 ? (
          <div className="text-center text-slate-400 py-10 bg-white rounded-xl border border-dashed">Chưa có lịch dạy nào trong tuần này</div>
        ) : (
          Object.entries(groupedSchedules).map(([dateLabel, items]) => (
            <div key={dateLabel} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700 uppercase text-sm">{dateLabel}</span>
                <span className="text-xs font-medium bg-white px-2 py-1 rounded border text-slate-500">{items.length} ca</span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4 w-full md:w-1/4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100">{item.timeSlot}</div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Ca {item.timeSlot}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase inline-block mt-1 ${item.type === 'THEORY' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{item.type || 'Thực hành'}</span>
                      </div>
                    </div>
                    <div className="flex-1 border-l border-slate-100 pl-0 md:pl-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Học viên</p>
                      <p className="font-semibold text-slate-800 text-sm">{item.studentId?.fullName || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{item.studentId?.phone}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : item.status === 'ABSENT' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {item.status === 'COMPLETED' ? 'Đã dạy' : item.status === 'ABSENT' ? 'Vắng mặt' : 'Chờ dạy'}
                      </div>
                      <Button size="sm" variant={item.status === 'BOOKED' ? 'primary' : 'ghost'} onClick={() => setStudentDetailModal({ isOpen: true, data: item })}>
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* [NEW] MODAL CHI TIẾT HỌC VIÊN + ĐIỂM DANH */}
      <Modal isOpen={studentDetailModal.isOpen} onClose={() => setStudentDetailModal({ ...studentDetailModal, isOpen: false })} title="Thông tin học viên">
        {studentDetailModal.data && (
           <div className="p-4 space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">🎓</div>
                 <div>
                    <p className="text-sm text-slate-500 font-bold uppercase">Học viên</p>
                    <p className="text-lg font-bold text-slate-800">{studentDetailModal.data.studentId?.fullName}</p>
                    <p className="text-sm text-blue-600 font-medium">{studentDetailModal.data.studentId?.phone}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Thời gian</p>
                    <p className="font-bold text-slate-800">{new Date(studentDetailModal.data.date).toLocaleDateString('vi-VN')} - Ca {studentDetailModal.data.timeSlot}</p>
                </div>
                 <div className="bg-white border rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase">Trạng thái</p>
                    <p className={`font-bold ${studentDetailModal.data.status === 'COMPLETED' ? 'text-emerald-600' : studentDetailModal.data.status === 'ABSENT' ? 'text-red-600' : 'text-amber-600'}`}>
                        {studentDetailModal.data.status === 'COMPLETED' ? 'ĐÃ DẠY' : studentDetailModal.data.status === 'ABSENT' ? 'VẮNG MẶT' : 'CHỜ DẠY'}
                    </p>
                </div>
              </div>

              <div className="pt-4 border-t flex gap-3">
                 <Button className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-red-200" variant="outline" onClick={() => processAttendance('ABSENT')}>
                    Vắng mặt
                 </Button>
                 <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => processAttendance('PRESENT')}>
                    Có mặt
                 </Button>
              </div>
           </div>
        )}
      </Modal>
    </div>
  );
};

export default InstructorSchedule;
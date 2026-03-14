import React from 'react';
import { formatDate } from '../../utils/formatters';

// Ca học: 1(7-8), 2(8-9), 3(9-10), 4(10-11), 5(11-12), 6(13-14), 7(14-15), 8(15-16), 9(16-17), 10(17-18)
// Nghỉ trưa: 12h-13h (giữa ca 5 và ca 6)
const SLOTS = [
  { id: 1, label: 'Ca 1 (07:00 - 08:00)', startHour: 7, isBreak: false },
  { id: 2, label: 'Ca 2 (08:00 - 09:00)', startHour: 8, isBreak: false },
  { id: 3, label: 'Ca 3 (09:00 - 10:00)', startHour: 9, isBreak: false },
  { id: 4, label: 'Ca 4 (10:00 - 11:00)', startHour: 10, isBreak: false },
  { id: 5, label: 'Ca 5 (11:00 - 12:00)', startHour: 11, isBreak: false },
  { id: 'BREAK', label: 'Nghỉ trưa (12:00 - 13:00)', startHour: 12, isBreak: true },
  { id: 6, label: 'Ca 6 (13:00 - 14:00)', startHour: 13, isBreak: false },
  { id: 7, label: 'Ca 7 (14:00 - 15:00)', startHour: 14, isBreak: false },
  { id: 8, label: 'Ca 8 (15:00 - 16:00)', startHour: 15, isBreak: false },
  { id: 9, label: 'Ca 9 (16:00 - 17:00)', startHour: 16, isBreak: false },
  { id: 10, label: 'Ca 10 (17:00 - 18:00)', startHour: 17, isBreak: false },
];

const WeekScheduler = ({ startDate, scheduleData = [], onSlotClick, userRole = 'STUDENT' }) => {
  const getSlotData = (dayIndex, slotId) => {
    // Skip if it's a break slot
    if (slotId === 'BREAK') return null;
    
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + dayIndex);
    const dateStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
    
    return scheduleData.find(s => {
      const sDate = new Date(s.date);
      const sDateStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
      return sDateStr === dateStr && Number(s.timeSlot) === Number(slotId);
    });
  };

  const handleSlotClickWrapper = (date, slotId, data) => {
    // Don't allow clicking on break slots
    if (slotId === 'BREAK') return;
    // Don't allow clicking on holiday slots
    if (data?.category === 'HOLIDAY') return;
    if (onSlotClick) {
      onSlotClick(date, slotId, data);
    }
  };

  // Màu sắc theo trạng thái:
  // - Trống: TRẮNG + viền dashed xám
  // - Nghỉ trưa: XÁM NHẠT
  // - Nghỉ lễ: TÍM ĐẬM
  // - Báo bận (thầy bận): XÁM ĐẬM
  // - Hoàn thành (đã điểm danh): XANH LÁ ĐẬM
  // - Vắng mặt: ĐỎ ĐẬM
  // - Đã hủy: XÁM NHẠT
  // - Chờ đặt (BOOKED): XANH DƯƠNG NHẠT
  // - Quá hạn: XÁM NHẠT

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className="w-full min-w-[850px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="p-3 border text-left w-32 text-slate-500 font-medium">Ca / Ngày</th>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
              const d = new Date(startDate); d.setDate(startDate.getDate() + index);
              return <th key={day} className="p-3 border text-center font-bold text-slate-700">{day}<br/><span className="text-[11px] font-normal text-slate-400">{formatDate(d)}</span></th>;
            })}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map((slot) => (
            <tr key={slot.id}>
              <td className="p-3 border font-medium bg-slate-50 text-slate-600 text-xs">{slot.label}</td>
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                const data = getSlotData(dayIndex, slot.id);
                const cellDate = new Date(startDate); 
                cellDate.setDate(startDate.getDate() + dayIndex); 
                cellDate.setHours(slot.startHour, 0, 0, 0);
                
                const now = new Date();
                const isPast = cellDate < now;
                
                let cellClass = "h-24 min-w-[120px] p-1 border text-center transition-all";
                let content = <span className="text-slate-200">-</span>;

                // Xử lý ca nghỉ trưa
                if (slot.isBreak) {
                  cellClass += " bg-slate-100 cursor-not-allowed";
                  content = (
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Nghỉ trưa</span>
                      <span className="text-slate-300 text-[9px]">12:00 - 13:00</span>
                    </div>
                  );
                } else if (data) {
                  if (data.category === 'HOLIDAY') {
                    // Ngày nghỉ lễ - TÍM đậm
                    cellClass += " bg-purple-600 cursor-not-allowed";
                    content = (
                      <div className="flex flex-col items-center justify-center h-full px-1">
                        <span className="text-white font-extrabold text-[9px] uppercase tracking-tight">Nghỉ lễ</span>
                        <span className="text-white font-bold text-[10px] truncate w-full text-center leading-tight mt-1">{data.title || 'Lịch nghỉ'}</span>
                      </div>
                    );
                  } else if (data.category === 'BUSY') {
                    // Giáo viên báo bận - XÁM ĐẬM (thầy bận)
                    cellClass += " bg-slate-500 cursor-not-allowed";
                    content = (
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-white font-extrabold text-[10px] uppercase tracking-tighter">Bận</span>
                      </div>
                    );
                  } else if (data.status === 'COMPLETED') {
                    // Điểm danh có mặt - XANH LÁ ĐẬM (thành công)
                    cellClass += " bg-emerald-500 cursor-pointer";
                    content = (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase bg-white/20 text-white">Hoàn thành</span>
                        <span className="text-white font-bold text-[12px] truncate w-full">{userRole === 'INSTRUCTOR' ? (data.studentId?.fullName || "Học viên") : (data.isMyBooking ? "Của bạn" : "Đã đặt")}</span>
                      </div>
                    );
                  } else if (data.status === 'ABSENT') {
                    // Điểm danh vắng - ĐỎ ĐẬM (thất bại)
                    cellClass += " bg-red-500 cursor-pointer";
                    content = (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase bg-white/20 text-white">Vắng</span>
                        <span className="text-white font-bold text-[12px] truncate w-full">{userRole === 'INSTRUCTOR' ? (data.studentId?.fullName || "Học viên") : (data.isMyBooking ? "Của bạn" : "Đã đặt")}</span>
                      </div>
                    );
                  } else if (data.status === 'CANCELLED') {
                    // Đã hủy - XÁM NHẠT
                    cellClass += " bg-slate-300 cursor-not-allowed";
                    content = (
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-white font-extrabold text-[10px] uppercase tracking-tighter">Đã hủy</span>
                      </div>
                    );
                  } else {
                    // Trạng thái chờ (BOOKED) - XANH DƯƠNG NHẠT (chờ xử lý)
                    const typeColors = {
                      'THEORY': { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', labelBg: 'bg-violet-200' },
                      'MOCK_TEST': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', labelBg: 'bg-amber-200' },
                      'PRACTICE': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', labelBg: 'bg-blue-200' }
                    };
                    const colors = typeColors[data.type] || typeColors.PRACTICE;
                    cellClass += ` ${colors.bg} cursor-pointer border ${colors.border}`;
                    content = (
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${colors.labelBg} ${colors.text}`}>{data.type || 'PRACTICE'}</span>
                        <span className={`font-bold text-[12px] truncate w-full ${colors.text}`}>{userRole === 'INSTRUCTOR' ? (data.studentId?.fullName || "Học viên") : (data.isMyBooking ? "Của bạn" : "Đã đặt")}</span>
                        {userRole === 'INSTRUCTOR' && (
                          <span className="text-[10px] font-bold text-amber-600">
                            Chờ dạy
                          </span>
                        )}
                      </div>
                    );
                  }
                } else if (isPast) {
                  // Ca quá hạn - XÁM NHẠT
                  cellClass += " bg-slate-100 cursor-not-allowed";
                  content = <span className="text-slate-400 font-bold text-[11px] italic">Quá hạn</span>;
                } else {
                  // Ca trống - TRẮNG với viền dashed
                  cellClass += " bg-white hover:bg-blue-50 cursor-pointer border-dashed border-slate-300";
                }

                return <td key={dayIndex} className={cellClass} onClick={() => handleSlotClickWrapper(cellDate, slot.id, data)}>{content}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeekScheduler;

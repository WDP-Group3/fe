import React from 'react';
import { formatDate } from '../../utils/formatters';

const SLOTS = [
  { id: 1, label: 'Ca 1 (07:00 - 08:00)', startHour: 7, startMinute: 0 },
  { id: 2, label: 'Ca 2 (08:30 - 09:30)', startHour: 8, startMinute: 30 },
  { id: 3, label: 'Ca 3 (10:00 - 11:00)', startHour: 10, startMinute: 0 },
  { id: 4, label: 'Ca 4 (11:30 - 12:30)', startHour: 11, startMinute: 30 },
  { id: 5, label: 'Ca 5 (13:00 - 14:00)', startHour: 13, startMinute: 0 },
  { id: 6, label: 'Ca 6 (14:30 - 15:30)', startHour: 14, startMinute: 30 },
  { id: 7, label: 'Ca 7 (16:00 - 17:00)', startHour: 16, startMinute: 0 },
  { id: 8, label: 'Ca 8 (17:30 - 18:30)', startHour: 17, startMinute: 30 },
  { id: 9, label: 'Ca 9 (19:00 - 20:00)', startHour: 19, startMinute: 0 },
  { id: 10, label: 'Ca 10 (20:30 - 21:30)', startHour: 20, startMinute: 30 },
];

const WeekScheduler = ({ startDate, scheduleData = [], onSlotClick, userRole = 'STUDENT' }) => {
  const getSlotData = (dayIndex, slotId) => {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + dayIndex);
    const dateStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
    
    return scheduleData.find(s => {
      const sDate = new Date(s.date);
      const sDateStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
      return sDateStr === dateStr && Number(s.timeSlot) === Number(slotId);
    });
  };

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
                cellDate.setHours(slot.startHour, slot.startMinute, 0, 0);
                
                const now = new Date();
                const isPast = cellDate < now;
                
                let cellClass = "h-24 min-w-[120px] p-1 border text-center transition-all";
                let content = <span className="text-slate-200">-</span>;

                if (data) {
                  if (data.category === 'BUSY') {
                    // Giáo viên báo bận - CAM NHẠT + IN ĐẠM
                    cellClass += " bg-orange-100 cursor-pointer";
                    content = (
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-orange-700 font-extrabold text-[10px] uppercase tracking-tighter">BÁO BẬN</span>
                      </div>
                    );
                  } else if (data.status === 'COMPLETED') {
                    // Điểm danh có mặt - XANH LÁ NHẠT
                    cellClass += " bg-green-100 cursor-pointer";
                    content = (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase bg-green-200 text-green-700">Đã hoàn thành</span>
                        <span className="text-green-800 font-bold text-[12px] truncate w-full">{userRole === 'INSTRUCTOR' ? (data.studentId?.fullName || "Học viên") : (data.isMyBooking ? "Của bạn" : "Đã đặt")}</span>
                      </div>
                    );
                  } else if (data.status === 'ABSENT') {
                    // Điểm danh vắng - ĐỎ NHẠT
                    cellClass += " bg-red-100 cursor-pointer";
                    content = (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase bg-red-200 text-red-700">Vắng mặt</span>
                        <span className="text-red-800 font-bold text-[12px] truncate w-full">{userRole === 'INSTRUCTOR' ? (data.studentId?.fullName || "Học viên") : (data.isMyBooking ? "Của bạn" : "Đã đặt")}</span>
                      </div>
                    );
                  } else {
                    const typeLabels = { 'THEORY': 'bg-purple-100 text-purple-600', 'MOCK_TEST': 'bg-orange-100 text-orange-600', 'PRACTICE': 'bg-indigo-100 text-indigo-600' };
                    cellClass += ` ${data.type === 'THEORY' ? 'bg-purple-50' : 'bg-indigo-50'} cursor-pointer`;
                    content = (
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${typeLabels[data.type] || typeLabels.PRACTICE}`}>{data.type || 'PRACTICE'}</span>
                        <span className="text-indigo-700 font-bold text-[12px] truncate w-full">{userRole === 'INSTRUCTOR' ? (data.studentId?.fullName || "Học viên") : (data.isMyBooking ? "Của bạn" : "Đã đặt")}</span>
                        {userRole === 'INSTRUCTOR' && (
                          <span className={`text-[10px] font-bold ${data.status === 'COMPLETED' ? 'text-emerald-600' : (data.status === 'ABSENT' ? 'text-red-500' : 'text-amber-600')}`}>
                            {data.status === 'COMPLETED' ? '✓ Đã dạy' : (data.status === 'ABSENT' ? '✕ Vắng' : 'Chờ dạy')}
                          </span>
                        )}
                      </div>
                    );
                  }
                } else if (isPast) {
                  // Ca quá hạn - CAM NHẠT + IN ĐẠM
                  cellClass += " bg-orange-50 opacity-60 cursor-not-allowed";
                  content = <span className="text-orange-600 font-bold text-[11px] italic">Quá hạn</span>;
                } else {
                  cellClass += " hover:bg-blue-50 cursor-pointer border-dashed";
                }

                return <td key={dayIndex} className={cellClass} onClick={() => onSlotClick(cellDate, slot.id, data)}>{content}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeekScheduler;
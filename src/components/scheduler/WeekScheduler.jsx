import React from 'react';
import { formatDate } from '../../utils/formatters';

const SLOTS = [
  { id: 1, label: 'Ca 1 (07:00 - 09:00)', startHour: 7 },
  { id: 2, label: 'Ca 2 (09:00 - 11:00)', startHour: 9 },
  { id: 3, label: 'Ca 3 (13:00 - 15:00)', startHour: 13 },
  { id: 4, label: 'Ca 4 (15:00 - 17:00)', startHour: 15 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeekScheduler = ({ 
  startDate, 
  scheduleData = [], 
  onSlotClick, 
  userRole = 'STUDENT' 
}) => {
  
  if (!startDate) return <div className="p-8 text-center text-slate-400">Đang khởi tạo lịch...</div>;

  const getSlotData = (dayIndex, slotId) => {
    try {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + dayIndex);
      const year = currentDay.getFullYear();
      const month = String(currentDay.getMonth() + 1).padStart(2, '0');
      const day = String(currentDay.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      return scheduleData.find(s => {
        const sDateObj = new Date(s.date);
        const sYear = sDateObj.getUTCFullYear();
        const sMonth = String(sDateObj.getUTCMonth() + 1).padStart(2, '0');
        const sDay = String(sDateObj.getUTCDate()).padStart(2, '0');
        const sDateStr = `${sYear}-${sMonth}-${sDay}`;
        return sDateStr === dateStr && Number(s.timeSlot) === Number(slotId);
      });
    } catch (e) { return null; }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className="w-full min-w-[850px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="p-3 border text-left w-32 text-slate-500 font-medium">Ca / Ngày</th>
            {DAYS.map((day, index) => {
              const d = new Date(startDate);
              d.setDate(startDate.getDate() + index);
              return (
                <th key={day} className="p-3 border text-center min-w-[110px]">
                  <div className="font-bold text-slate-700">{day}</div>
                  <div className="text-[11px] text-slate-400 font-normal">{formatDate(d)}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map((slot) => (
            <tr key={slot.id}>
              <td className="p-3 border font-medium bg-slate-50 text-slate-600 text-xs">{slot.label}</td>
              {DAYS.map((_, dayIndex) => {
                const data = getSlotData(dayIndex, slot.id);
                const cellDate = new Date(startDate);
                cellDate.setDate(startDate.getDate() + dayIndex);
                cellDate.setHours(slot.startHour, 0, 0, 0);
                const now = new Date();
                const isPast = cellDate < now;

                let cellClass = "transition-all duration-200";
                let content = <span className="text-slate-200 text-xs">-</span>;
                let canClick = true;

                if (data) {
                  if (data.category === 'BOOKED' || data.category === 'TEACHING' || data.status) {
                    const isMine = data.isMyBooking;
                    
                    // --- ĐOẠN FIX LỖI HIỂN THỊ ---
                    const typeLabels = {
                      'THEORY': { label: 'LÝ THUYẾT', color: 'bg-purple-100 text-purple-600', border: 'border-purple-200', cellBg: 'bg-purple-50' },
                      'MOCK_TEST': { label: 'THI THỬ', color: 'bg-orange-100 text-orange-600', border: 'border-orange-200', cellBg: 'bg-orange-50' },
                      'NIGHT_DRIVING': { label: 'LÁI ĐÊM', color: 'bg-slate-800 text-white', border: 'border-slate-900', cellBg: 'bg-slate-100' },
                      'PRACTICE': { label: 'THỰC HÀNH', color: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-200', cellBg: 'bg-indigo-50' }
                    };
                    const currentType = typeLabels[data.type] || typeLabels['PRACTICE'];

                    let statusText = "Chờ dạy";
                    let statusColor = "text-amber-600"; 
                    if (data.status === 'COMPLETED') {
                        statusText = "✓ Đã dạy";
                        statusColor = "text-emerald-600";
                    } else if (data.status === 'ABSENT') {
                        statusText = "✕ Vắng mặt";
                        statusColor = "text-red-500";
                    }

                    // Sử dụng cellBg từ config để đổi màu cả ô
                    cellClass = `cursor-pointer hover:shadow-inner ${currentType.cellBg}`;
                    
                    content = (
                      <div className="flex flex-col items-center justify-center px-1 space-y-1.5">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${currentType.color} border ${currentType.border}`}>
                          {currentType.label}
                        </span>
                        <span className="text-slate-900 font-bold truncate w-full text-center text-[12px] leading-tight">
                          {userRole === 'INSTRUCTOR' ? (data.studentId?.fullName || "Học viên") : (isMine ? "Lịch của bạn" : "Đã có lịch")}
                        </span>
                        {userRole === 'INSTRUCTOR' && (
                          <span className={`text-[10px] font-extrabold ${statusColor}`}>
                            {statusText}
                          </span>
                        )}
                      </div>
                    );
                    canClick = userRole === 'INSTRUCTOR'; 
                  } 
                  else if (data.category === 'BUSY') {
                    cellClass = "bg-slate-100 border-slate-200 cursor-pointer opacity-80";
                    content = <span className="text-slate-500 font-bold text-[10px] uppercase text-center w-full">Bận</span>;
                    canClick = userRole === 'INSTRUCTOR'; 
                  }
                } 
                else if (isPast) {
                  cellClass = "bg-slate-50 opacity-40 cursor-not-allowed";
                  content = <span className="text-slate-300 text-[11px] italic">Hết hạn</span>;
                  canClick = false;
                } 
                else {
                  cellClass = "hover:bg-blue-50 cursor-pointer border-dashed border-slate-200 hover:border-indigo-300";
                  canClick = true;
                }

                return (
                  <td 
                    key={dayIndex} 
                    className={`p-1 border text-center h-28 min-w-[120px] select-none transition-colors ${cellClass}`}
                    onClick={() => canClick && onSlotClick(cellDate, slot.id, data)}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeekScheduler;
import React, { useState, useEffect } from 'react';
import { SectionHeader, Button, Loading, DataTable } from '../../components/ui';
import WeekScheduler from '../../components/scheduler/WeekScheduler';
import apiClient from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

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

  useEffect(() => {
    fetchSchedule();
  }, [currentMonday]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const sunday = new Date(currentMonday);
      sunday.setDate(currentMonday.getDate() + 6);
      const startDateISO = new Date(currentMonday.setHours(0,0,0,0)).toISOString();
      const endDateISO = new Date(sunday.setHours(23,59,59,999)).toISOString();

      const res = await apiClient.get(`/schedule/instructor?startDate=${startDateISO}&endDate=${endDateISO}`);
      if (res.status === 'success') {
        const normalizedData = (res.data || []).map(item => ({
          ...item,
          timeSlot: Number(item.timeSlot)
        }));
        setSchedules(normalizedData);
      }
    } catch (error) {
      console.error("Lỗi tải lịch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = async (date, slotId, existingData) => {
    const now = new Date();
    const isPastOrPresent = new Date(date) <= now;

    // --- LUỒNG 1: ĐIỂM DANH (Cho ô màu xanh trong quá khứ/hiện tại) ---
    if ((existingData?.category === 'BOOKED' || existingData?.category === 'TEACHING') && isPastOrPresent) {
      if (existingData.status === 'COMPLETED' || existingData.status === 'ABSENT') {
        showToast('Buổi này đã điểm danh rồi', 'info');
        return;
      }

      const attend = window.confirm(`Điểm danh học viên: ${existingData.studentId?.fullName || 'Học viên'}\n\nOK: CÓ MẶT\nCancel: VẮNG MẶT`);
      const statusUpdate = attend ? 'PRESENT' : 'ABSENT';

      try {
        const res = await apiClient.patch(`/bookings/${existingData._id}/attendance`, {
          attendance: statusUpdate,
          instructorNote: attend ? "Tham gia tốt" : "Học viên vắng mặt"
        });
        if (res.status === 'success') {
          showToast(attend ? 'Đã báo có mặt' : 'Đã báo vắng', 'success');
          fetchSchedule();
        }
      } catch (e) { showToast(e.message, 'error'); }
      return;
    }

    // --- LUỒNG 2: BÁO BẬN/HỦY BẬN (Cho ô trống hoặc ô màu xám) ---
    if (existingData?.category === 'BOOKED' || existingData?.category === 'TEACHING') {
      showToast('Lịch đã có học viên đặt, không thể sửa', 'info');
      return;
    }

    try {
      const res = await apiClient.post('/schedule/busy', { 
        date: date.toISOString(), 
        timeSlot: slotId 
      });
      if (res.status === 'success') {
        showToast(res.message, 'success');
        fetchSchedule();
      }
    } catch (error) { showToast(error.message, 'error'); }
  };

  const changeWeek = (offset) => {
    const newDate = new Date(currentMonday);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentMonday(newDate);
  };

  // Cấu hình bảng danh sách lịch dạy phía dưới
  const columns = [
    { key: 'date', title: 'Ngày', render: (_, r) => new Date(r.date).toLocaleDateString('vi-VN') },
    { key: 'time', title: 'Ca', render: (_, r) => `Ca ${r.timeSlot}` },
    { 
      key: 'type', 
      title: 'Loại bài học', 
      render: (_, r) => {
        const types = {
          'PRACTICE': { label: 'Thực hành', class: 'bg-blue-100 text-blue-700' },
          'THEORY': { label: 'Lý thuyết', class: 'bg-purple-100 text-purple-700' },
          'MOCK_TEST': { label: 'Thi thử', class: 'bg-orange-100 text-orange-700' }
        };
        const type = types[r.type] || types['PRACTICE'];
        return <span className={`px-2 py-1 rounded-md text-xs font-bold ${type.class}`}>{type.label}</span>;
      }
    },,
    { key: 'student', title: 'Học viên', render: (_, r) => r.studentId?.fullName || 'N/A' },
    { 
      key: 'status', 
      title: 'Trạng thái', 
      render: (_, r) => (
        <span className={`font-bold ${r.status === 'COMPLETED' ? 'text-emerald-600' : (r.status === 'ABSENT' ? 'text-red-500' : 'text-blue-500')}`}>
          {r.status === 'COMPLETED' ? 'Hoàn thành' : (r.status === 'ABSENT' ? 'Vắng mặt' : 'Chờ dạy')}
        </span>
      )
    },
    { 
      key: 'rating', 
      title: 'Học viên đánh giá', 
      render: (_, r) => (
        r.rating ? <span className="text-yellow-500 font-bold">⭐ {r.rating}</span> : <span className="text-slate-300 italic text-xs">Chưa có</span>
      )
    }
  ];

  return (
    <div className="space-y-10">
      {/* PHẦN 1: TƯƠNG TÁC LỊCH (ĐIỂM DANH & BÁO BẬN) */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <SectionHeader title="Quản Lý Lịch Dạy" description="Báo bận vào ô trống hoặc Click ô xanh để điểm danh" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => changeWeek(-1)}>Tuần trước</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonday(getMonday(new Date()))}>Hiện tại</Button>
            <Button variant="outline" size="sm" onClick={() => changeWeek(1)}>Tuần sau</Button>
          </div>
        </div>
        
        <div className="flex gap-4 text-[11px] mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-slate-300"></div> Trống</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 border border-slate-300"></div> Báo Bận</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-100 border border-indigo-200"></div> Có Lịch (Điểm danh)</div>
        </div>

        {loading ? <Loading /> : (
          <WeekScheduler 
            startDate={currentMonday} 
            scheduleData={schedules} 
            onSlotClick={handleSlotClick} 
            userRole="INSTRUCTOR" 
          />
        )}
      </div>

      {/* PHẦN 2: DANH SÁCH LỊCH DẠY & ĐÁNH GIÁ (GÓP Ý CỦA TUẤN) */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <SectionHeader title="Chi Tiết Buổi Dạy" description="Thống kê trạng thái điểm danh và nhận xét từ học viên" />
        <DataTable 
          columns={columns} 
          data={schedules.filter(s => s.category === 'BOOKED' || s.category === 'TEACHING')} 
        />
      </div>
    </div>
  );
};

export default InstructorSchedule;
import React, { useState, useEffect } from 'react';
import { SectionHeader, Select, Button, Loading, Modal, DataTable, ConfirmDialog } from '../components/ui';
import { SocialIcons } from '../components/common';
import WeekScheduler from '../components/scheduler/WeekScheduler';
import apiClient from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuthContext } from '../context/AuthContext';

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(date.setDate(diff));
};

const Schedule = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [instructorSchedules, setInstructorSchedules] = useState([]);
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  
  const [confirmBookingModal, setConfirmBookingModal] = useState({ 
    isOpen: false, 
    data: null,
    type: 'PRACTICE' 
  });
  
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, bookingId: null, rating: 5, comment: '' });

  const consultantInfo = {
    name: 'Ngô Trần Minh Hòa',
    zalo: 'https://zalo.me/0966881862',
    facebook: 'https://www.facebook.com/minhhoa.ngotran/',
    gmail: 'ntmh18062004@gmail.com',
  };

  useEffect(() => {
    fetchInstructors();
    loadMySessions();
  }, []);

  useEffect(() => {
    if (selectedInstructor) fetchInstructorSchedule();
  }, [selectedInstructor, currentMonday]);

  const fetchInstructors = async () => {
    const res = await apiClient.get('/users?role=INSTRUCTOR');
    if (res.status === 'success') {
      setInstructors(res.data.map(u => ({ value: u._id, label: u.fullName })));
    }
  };

  const fetchInstructorSchedule = async () => {
    setLoading(true);
    try {
      const sunday = new Date(currentMonday);
      sunday.setDate(currentMonday.getDate() + 6);
      const startDateISO = new Date(currentMonday.setHours(0,0,0,0)).toISOString();
      const endDateISO = new Date(sunday.setHours(23,59,59,999)).toISOString();
      const res = await apiClient.get(`/schedule?instructorId=${selectedInstructor}&startDate=${startDateISO}&endDate=${endDateISO}`);
      if (res.status === 'success') {
        setInstructorSchedules((res.data || []).map(i => ({ ...i, timeSlot: Number(i.timeSlot) })));
      }
    } finally { setLoading(false); }
  };

  const loadMySessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await apiClient.get(`/bookings${user?.id ? `?studentId=${user.id}` : ''}`);
      if (res.status === 'success') setMySessions(res.data);
    } finally { setLoadingSessions(false); }
  };

  const handleBooking = async () => {
    try {
      const { date, slotId, instructorId } = confirmBookingModal.data;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      await apiClient.post('/bookings', { 
        instructorId, 
        date: dateString, 
        timeSlot: slotId,
        type: confirmBookingModal.type 
      });
      
      showToast('Đặt lịch thành công!', 'success');
      setConfirmBookingModal({ isOpen: false, data: null, type: 'PRACTICE' });
      fetchInstructorSchedule();
      loadMySessions();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy lịch này?")) return;
    try {
      const response = await apiClient.put(`/bookings/${id}`, { status: 'CANCELLED' });
      if (response.status === 'success') {
        showToast('Hủy lịch thành công', 'success');
        loadMySessions();
      }
    } catch (error) { showToast(error.message, 'error'); }
  };

  const handleFeedback = async () => {
    try {
      await apiClient.patch(`/bookings/${feedbackModal.bookingId}/feedback`, {
        rating: feedbackModal.rating,
        studentFeedback: feedbackModal.comment
      });
      showToast('Cảm ơn bạn đã đánh giá!', 'success');
      setFeedbackModal({ ...feedbackModal, isOpen: false });
      loadMySessions();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const columns = [
    { key: 'date', title: 'Ngày', render: (_, r) => new Date(r.date).toLocaleDateString('vi-VN') },
    { key: 'time', title: 'Giờ', render: (_, r) => `Ca ${r.timeSlot}` },
    { 
      key: 'type', 
      title: 'Loại', 
      render: (_, r) => {
        const typeMap = {
          'THEORY': 'Lý thuyết',
          'PRACTICE': 'Thực hành',
          'MOCK_TEST': 'Thi thử',
          'NIGHT_DRIVING': 'Lái đêm'
        };
        return (
          <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded uppercase text-slate-600">
            {typeMap[r.type] || 'Thực hành'}
          </span>
        );
      }
    },
    { key: 'instructor', title: 'Giáo viên', render: (_, r) => r.instructorId?.fullName },
    { key: 'status', title: 'Trạng thái', render: (_, r) => (
      <span className={`font-bold ${r.status === 'COMPLETED' ? 'text-emerald-600' : (r.status === 'ABSENT' ? 'text-red-500' : (r.status === 'CANCELLED' ? 'text-slate-400' : 'text-blue-500'))}`}>
        {r.status === 'COMPLETED' ? 'Hoàn thành' : (r.status === 'ABSENT' ? 'Vắng mặt' : (r.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ học'))}
      </span>
    )},
    { key: 'action', title: 'Thao tác', render: (_, r) => (
      <div className="flex gap-2">
        {r.status === 'BOOKED' && (
          <Button size="sm" variant="outline" onClick={() => handleCancel(r._id)}>Hủy lịch</Button>
        )}
        {r.status === 'COMPLETED' && !r.rating && (
          <Button size="sm" className="bg-yellow-500 text-white border-none" onClick={() => setFeedbackModal({ isOpen: true, bookingId: r._id, rating: 5, comment: '' })}>Đánh giá</Button>
        )}
        {r.rating && <span className="text-yellow-500 font-bold">⭐ {r.rating}</span>}
      </div>
    )}
  ];

  return (
    <div className="space-y-10">
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <SectionHeader title="Đặt lịch học mới" description="Chọn giáo viên và thời gian tập lái" />
        <div className="max-w-xs my-4">
          <Select label="Chọn Giáo Viên" options={instructors} value={selectedInstructor} onChange={(e) => setSelectedInstructor(e.target.value)} />
        </div>
        {selectedInstructor && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <div className="flex gap-4 font-medium"><span className="flex items-center gap-1"><div className="w-3 h-3 bg-white border"></div> Trống</span><span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 border"></div> Đã có lịch</span></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setCurrentMonday(getMonday(new Date(currentMonday.setDate(currentMonday.getDate() - 7))))}>Tuần trước</Button>
                <Button size="sm" variant="outline" onClick={() => setCurrentMonday(getMonday(new Date(currentMonday.setDate(currentMonday.getDate() + 7))))}>Tuần sau</Button>
              </div>
            </div>
            {loading ? <Loading /> : (
              <WeekScheduler 
                startDate={currentMonday} 
                scheduleData={instructorSchedules} 
                userRole="STUDENT" 
                onSlotClick={(date, slotId, data) => !data && setConfirmBookingModal({ 
                  isOpen: true, 
                  data: { date, slotId, instructorId: selectedInstructor },
                  type: 'PRACTICE'
                })} 
              />
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <SectionHeader title="Lịch học của tôi" description="Danh sách các buổi học và trạng thái đánh giá" />
        {loadingSessions ? <Loading /> : <DataTable columns={columns} data={mySessions} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
          <SectionHeader title="Liên hệ tư vấn viên" />
          <div className="flex items-center justify-between">
            <div><p className="text-lg font-semibold text-slate-900">{consultantInfo.name}</p><p className="text-sm text-slate-600">Tư vấn viên hỗ trợ 24/7</p></div>
            <SocialIcons zalo={consultantInfo.zalo} facebook={consultantInfo.facebook} gmail={consultantInfo.gmail} size="lg" />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <SectionHeader title="Quy định lịch học" />
          <div className="space-y-3 text-sm text-slate-700 font-medium">
            <p>• Không huỷ/hoãn trước 24h → mất quyền lợi buổi học.</p>
            <p>• Ghi log huỷ lịch, log đổi xe / giáo viên.</p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={confirmBookingModal.isOpen}
        onClose={() => setConfirmBookingModal({ ...confirmBookingModal, isOpen: false })}
        title="Xác nhận đặt lịch"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setConfirmBookingModal({ ...confirmBookingModal, isOpen: false })}>Hủy</Button>
            <Button variant="primary" onClick={handleBooking}>Xác nhận</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
             <p className="text-sm font-bold text-indigo-800 mb-3 text-center uppercase">Chọn nội dung buổi học</p>
             <div className="grid grid-cols-2 gap-3">
               {[
                 { id: 'PRACTICE', label: '🚗 Thực hành' },
                 { id: 'THEORY', label: '📖 Lý thuyết' },
                 { id: 'MOCK_TEST', label: '📝 Thi thử' },
                 { id: 'NIGHT_DRIVING', label: '🌙 Lái đêm' }
               ].map((item) => (
                 <button
                   key={item.id}
                   onClick={() => setConfirmBookingModal({ ...confirmBookingModal, type: item.id })}
                   className={`p-3 rounded-lg text-xs font-bold border transition-all ${
                     confirmBookingModal.type === item.id 
                     ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' 
                     : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                   }`}
                 >
                   {item.label}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })} title="Đánh giá chất lượng dạy">
        <div className="space-y-4 p-4">
          <div className="flex gap-2 text-3xl justify-center">
            {[1,2,3,4,5].map(s => <button key={s} onClick={() => setFeedbackModal({...feedbackModal, rating: s})} className={feedbackModal.rating >= s ? 'text-yellow-400' : 'text-slate-200'}>★</button>)}
          </div>
          <textarea className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500" rows="3" placeholder="Nhận xét của bạn..." value={feedbackModal.comment} onChange={e => setFeedbackModal({...feedbackModal, comment: e.target.value})} />
          <Button className="w-full" onClick={handleFeedback}>Gửi đánh giá</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Schedule;

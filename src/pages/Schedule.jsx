import React, { useState, useEffect } from 'react';
import { SectionHeader, Select, Button, Loading, Modal } from '../components/ui';
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
  
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  
  const [instructorSchedules, setInstructorSchedules] = useState([]);
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [mySessions, setMySessions] = useState([]);

  // [MỚI] Thông tin khóa học đã đăng ký và số giờ thực hành còn lại
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({}); // { courseId: { required: 10, completed: 5, remaining: 5 } }

  // [MỚI] Trạng thái mở đăng ký tuần sau
  const [bookingStatus, setBookingStatus] = useState({ isNextWeekOpen: false, message: '' });

  // Modals
  const [confirmBookingModal, setConfirmBookingModal] = useState({ isOpen: false, data: null, type: 'PRACTICE' });
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, bookingId: null, rating: 5, comment: '' });
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });

  const consultantInfo = {
    name: 'Ngô Trần Minh Hòa',
    zalo: 'https://zalo.me/0966881862',
    facebook: 'https://www.facebook.com/minhhoa.ngotran/',
    gmail: 'ntmh18062004@gmail.com',
  };

  useEffect(() => { 
    fetchLocations(); 
    loadMySessions(); 
    fetchBookingStatus();
    fetchEnrolledCourses();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      setSelectedCourse('');
      setSelectedInstructor('');
      setInstructors([]);
      setInstructorSchedules([]);
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedLocation && selectedCourse) {
      fetchInstructorsByLocation(selectedLocation, selectedCourse);
      setSelectedInstructor('');
      setInstructorSchedules([]);
    } else {
      setInstructors([]);
      setSelectedInstructor('');
      setInstructorSchedules([]);
    }
  }, [selectedLocation, selectedCourse]);

  useEffect(() => {
    if (selectedInstructor) fetchInstructorSchedule();
  }, [selectedInstructor, currentMonday]);

  // [MỚI] Lấy danh sách khóa học đã đăng ký và tiến độ học tập
  const fetchEnrolledCourses = async () => {
    try {
      const res = await apiClient.get('/registrations/my-courses');
      if (res.status === 'success') {
        setEnrolledCourses(res.data.courses || []);
        setCourseProgress(res.data.progress || {});
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    }
  };

  // API Calls
  const fetchLocations = async () => {
    try {
      const res = await apiClient.get('/users/locations'); 
      if (res.status === 'success') setLocations(res.data.map(loc => ({ value: loc, label: loc })));
    } catch (error) { console.error(error); }
  };

  const fetchInstructorsByLocation = async (loc, courseId) => {
    try {
      const params = new URLSearchParams({ location: loc });
      if (courseId) params.set('courseId', courseId);
      const res = await apiClient.get(`/users/instructors?${params.toString()}`);
      if (res.status === 'success') setInstructors(res.data.map(u => ({ value: u._id, label: u.fullName })));
    } catch (error) { console.error(error); }
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
      // Lấy toàn bộ lịch, sau đó sẽ filter ở Frontend
      const res = await apiClient.get(`/bookings${user?.id ? `?studentId=${user.id}` : ''}`);
      if (res.status === 'success') setMySessions(res.data);
    } finally { setLoadingSessions(false); }
  };

  // [MỚI] Lấy trạng thái mở đăng ký tuần sau (18:30 thứ 6)
  const fetchBookingStatus = async () => {
    try {
      const res = await apiClient.get('/bookings/status');
      if (res.status === 'success') {
        setBookingStatus({
          isNextWeekOpen: res.data.isNextWeekOpen,
          message: res.data.message
        });
      }
    } catch (error) {
      console.error('Error fetching booking status:', error);
    }
  };

  // Handlers
  // [MỚI] Helper: Kiểm tra xem ngày có phải tuần sau không
  const isNextWeek = (date) => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilSunday = 0 - currentDay + (currentDay === 0 ? 0 : 7);
    const thisSunday = new Date(today);
    thisSunday.setDate(today.getDate() + daysUntilSunday);
    thisSunday.setHours(23, 59, 59, 999);
    return new Date(date) > thisSunday;
  };

  const handleSlotClick = (date, slotId, data) => {
    // [MỚI] Kiểm tra nếu ca đã trôi qua (trước thời điểm hiện tại) - không cho đăng ký
    const now = new Date();
    const slotDate = new Date(date);
    
    // Thời gian bắt đầu ca học
    const SLOT_START_HOURS = { 
      "1": 7, "2": 8.5, "3": 10, "4": 11.5, 
      "5": 13, "6": 14.5, "7": 16, "8": 17.5, 
      "9": 19, "10": 20.5 
    };
    const startHour = SLOT_START_HOURS[slotId] || 7;
    slotDate.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);
    
    // Nếu ca đã bắt đầu (quá khứ) - không cho đăng ký
    if (slotDate < now) {
      showToast('Ca học này đã diễn ra, không thể đăng ký.', 'warning');
      return;
    }

    // [MỚI] Kiểm tra nếu là tuần sau nhưng chưa mở đăng ký
    if (!data && isNextWeek(date) && !bookingStatus.isNextWeekOpen) {
      showToast(bookingStatus.message || 'Chưa đến giờ mở đăng ký tuần sau', 'warning');
      return;
    }

    // [MỚI] Kiểm tra nếu đã đủ giờ học thì không cho đăng ký
    const progress = courseProgress[selectedCourse] || {};
    if (progress.remaining !== undefined && progress.remaining <= 0) {
      showToast(`Bạn đã hoàn thành đủ ${progress.required} giờ thực hành cho khóa này. Không thể đăng ký thêm.`, 'warning');
      return;
    }

    if (data) {
      setDetailModal({ isOpen: true, data: data });
    } else {
      setConfirmBookingModal({ 
        isOpen: true, 
        data: { date, slotId, instructorId: selectedInstructor, courseId: selectedCourse },
        type: 'PRACTICE'
      });
    }
  };

  const handleBooking = async () => {
    try {
      const { date, slotId, instructorId, courseId } = confirmBookingModal.data;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      await apiClient.post('/bookings', { 
        instructorId, date: dateString, timeSlot: slotId, type: confirmBookingModal.type, courseId 
      });
      showToast('Đặt lịch thành công!', 'success');
      setConfirmBookingModal({ isOpen: false, data: null, type: 'PRACTICE' });
      fetchInstructorSchedule();
      loadMySessions();
      fetchEnrolledCourses(); // Cập nhật lại tiến độ
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleCancel = async (id, date, timeSlot) => {
    // Check if cancellation is within 12 hours of the session
    const sessionDateTime = new Date(date);
    const SLOT_START_HOURS = { 
      "1": 7, "2": 8.5, "3": 10, "4": 11.5, 
      "5": 13, "6": 14.5, "7": 16, "8": 17.5, 
      "9": 19, "10": 20.5 
    };
    const startHour = SLOT_START_HOURS[timeSlot] || 7;
    sessionDateTime.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);
    
    const now = new Date();
    const hoursUntilSession = (sessionDateTime - now) / (1000 * 60 * 60);
    
    // If less than 12 hours until session, show warning about losing the hour
    if (hoursUntilSession > 0 && hoursUntilSession < 12) {
      const confirmMessage = "⚠️ Cảnh báo: Bạn đang hủy ca học trong vòng 12 giờ trước giờ học.\n\nNếu hủy, bạn sẽ MẤT 1 giờ thực hành (không được hoàn lại).\n\nBạn có chắc chắn muốn hủy không?";
      if (!window.confirm(confirmMessage)) return;
    } else {
      if (!window.confirm("Bạn có chắc chắn muốn hủy lịch này?")) return;
    }
    
    try {
      const response = await apiClient.put(`/bookings/${id}`, { status: 'CANCELLED' });
      if (response.status === 'success') {
        // Check if this was a late cancellation (within 12 hours)
        if (hoursUntilSession > 0 && hoursUntilSession < 12) {
          showToast('Đã hủy lịch. Lưu ý: Bạn đã mất 1 giờ thực hành vì hủy trong vòng 12 giờ.', 'warning');
        } else {
          showToast('Hủy lịch thành công', 'success');
        }
        loadMySessions();
        fetchEnrolledCourses();
        if (selectedInstructor) fetchInstructorSchedule();
        setDetailModal({ isOpen: false, data: null });
      }
    } catch (error) { showToast(error.message, 'error'); }
  };

  const handleFeedback = async () => {
    try {
      await apiClient.patch(`/bookings/${feedbackModal.bookingId}/feedback`, {
        rating: feedbackModal.rating, studentFeedback: feedbackModal.comment
      });
      showToast('Cảm ơn bạn đã đánh giá!', 'success');
      setFeedbackModal({ ...feedbackModal, isOpen: false });
      loadMySessions();
    } catch (e) { showToast(e.message, 'error'); }
  };

  // --- LOGIC MỚI: CHỈ HIỂN THỊ LỊCH CỦA TUẦN ĐANG CHỌN ---
  
  // 1. Tính toán ngày bắt đầu và kết thúc của tuần hiện tại (dựa trên currentMonday)
  const startOfWeek = new Date(currentMonday);
  startOfWeek.setHours(0,0,0,0);
  
  const endOfWeek = new Date(currentMonday);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23,59,59,999);

  // 2. Lọc danh sách My Sessions
  const filteredSessions = mySessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
  });

  // 3. Gom nhóm kết quả đã lọc
  const groupedSessions = filteredSessions
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((acc, curr) => {
      const dateKey = new Date(curr.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(curr);
      return acc;
    }, {});

  return (
    <div className="space-y-10">
      {/* [MỚI] Banner thông báo trạng thái đăng ký tuần sau */}
      {!bookingStatus.isNextWeekOpen && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="text-amber-500 text-xl">⏰</div>
          <div>
            <p className="font-bold text-amber-800">Chưa mở đăng ký tuần sau</p>
            <p className="text-sm text-amber-700 mt-1">
              Bạn sẽ có thể đăng ký lịch tuần sau vào lúc <span className="font-bold">18:30 (6:30 tối) thứ 6</span>. 
              Vui lòng đăng ký lịch tuần này hoặc chờ đến thứ 6.
            </p>
          </div>
        </div>
      )}

      {/* Chỉ hiện thời gian cần hoàn thành của từng khóa học viên đã đăng ký (1 card/khóa, giờ = ca đã điểm danh) */}
      {enrolledCourses.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <SectionHeader
            title="Tiến độ học tập"
            description="Số giờ cần hoàn thành theo khóa đã đăng ký. Giờ đã hoàn thành = tổng ca học đã được điểm danh."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {enrolledCourses.map((course) => {
              const progress = courseProgress[course._id] || {};
              const required = progress.required || 0;
              const completed = progress.completed || 0;
              const remaining = progress.remaining ?? Math.max(0, required - completed);
              const percentage = required > 0 ? Math.round((completed / required) * 100) : 0;
              const isCompleted = required > 0 && remaining === 0;

              return (
                <div key={course._id} className={`p-4 rounded-xl border ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{course.name || course.code}</h4>
                      <p className="text-xs text-slate-500">{course.code}</p>
                    </div>
                    {isCompleted && (
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                        Hoàn thành
                      </span>
                    )}
                  </div>
                  {required > 0 ? (
                    <>
                      <div className="mt-3">
                        <p className="text-xs text-slate-600 mb-1">
                          Cần hoàn thành: <strong>{required} giờ</strong>
                        </p>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">Đã điểm danh: <strong>{completed} giờ</strong></span>
                          <span className="text-slate-500">{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      {!isCompleted && (
                        <p className="text-xs text-slate-500 mt-2">
                          Còn <strong className="text-indigo-600">{remaining} giờ</strong> có thể đăng ký học
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 mt-2">Không giới hạn số giờ thực hành</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <SectionHeader title="Đặt lịch học mới" description="Chọn khu vực → khóa học đã đăng ký → giáo viên dạy khóa đó tại khu vực đó" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 max-w-4xl">
          <Select label="1. Chọn Khu Vực" options={locations} value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} placeholder="-- Chọn khu vực --" />
          <Select 
            label="2. Chọn Khóa Học" 
            options={enrolledCourses.map(c => ({ value: c._id, label: c.name || c.code }))} 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)} 
            disabled={!selectedLocation || enrolledCourses.length === 0} 
            placeholder={!selectedLocation ? "Vui lòng chọn khu vực trước" : enrolledCourses.length === 0 ? "Bạn chưa đăng ký khóa nào" : "-- Chọn khóa học --"} 
          />
          <Select 
            label="3. Chọn Giáo Viên" 
            options={instructors} 
            value={selectedInstructor} 
            onChange={(e) => setSelectedInstructor(e.target.value)} 
            disabled={!selectedLocation || !selectedCourse} 
            placeholder={!selectedLocation ? "Vui lòng chọn khu vực trước" : !selectedCourse ? "Vui lòng chọn khóa học trước" : "-- Chọn giáo viên --"} 
          />
        </div>

        {selectedInstructor && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <div className="flex gap-4 font-medium">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-white border"></div> Trống</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 border"></div> Đã có lịch</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setCurrentMonday(getMonday(new Date(currentMonday.setDate(currentMonday.getDate() - 7))))}>Tuần trước</Button>
                <Button size="sm" variant="outline" onClick={() => setCurrentMonday(getMonday(new Date()))}>Hiện tại</Button>
                <Button size="sm" variant="outline" onClick={() => setCurrentMonday(getMonday(new Date(currentMonday.setDate(currentMonday.getDate() + 7))))}>Tuần sau</Button>
              </div>
            </div>
            {loading ? <Loading /> : <WeekScheduler startDate={currentMonday} scheduleData={instructorSchedules} userRole="STUDENT" onSlotClick={handleSlotClick} />}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end border-l-4 border-indigo-500 pl-3">
            <h3 className="text-xl font-bold text-slate-800">Lịch Học Của Tôi</h3>
            {/* Hiển thị tuần đang xem để user dễ nhận biết */}
            <span className="text-sm text-slate-500 font-medium">
                Tuần: {startOfWeek.toLocaleDateString('vi-VN')} - {endOfWeek.toLocaleDateString('vi-VN')}
            </span>
        </div>

        {loadingSessions ? <Loading /> : Object.keys(groupedSessions).length === 0 ? (
          <div className="text-center text-slate-400 py-10 bg-white rounded-xl border border-dashed">
            Không có lịch học nào trong tuần này.
            {!selectedInstructor && <div className="mt-2 text-xs">Lưu ý: Bạn có thể đổi tuần ở nút "Tuần trước/Tuần sau" phía trên để xem lịch sử hoặc tương lai.</div>}
          </div>
        ) : (
          Object.entries(groupedSessions).map(([dateLabel, items]) => (
            <div key={dateLabel} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700 uppercase text-sm">{dateLabel}</span>
                <span className="text-xs font-medium bg-white px-2 py-1 rounded border text-slate-500">{items.length} buổi</span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">{item.timeSlot}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Ca {item.timeSlot}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.type === 'THEORY' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{item.type === 'THEORY' ? 'Lý thuyết' : 'Thực hành'}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 uppercase font-bold">Giáo viên</p>
                      <p className="font-semibold text-slate-800">{item.instructorId?.fullName}</p>
                      <p className="text-xs text-slate-500">{item.instructorId?.phone}</p>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : item.status === 'ABSENT' ? 'bg-red-100 text-red-700' : item.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status === 'COMPLETED' ? 'Hoàn thành' : (item.status === 'ABSENT' ? 'Vắng' : (item.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ học'))}
                      </div>
                      {item.status === 'BOOKED' && <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50 hover:border-red-200" onClick={() => handleCancel(item._id, item.date, item.timeSlot)}>Hủy</Button>}
                      {item.status === 'COMPLETED' && !item.rating && <Button size="sm" className="bg-yellow-500 text-white border-none" onClick={() => setFeedbackModal({ isOpen: true, bookingId: item._id, rating: 5, comment: '' })}>Đánh giá</Button>}
                      {item.rating && <span className="text-yellow-500 font-bold">⭐ {item.rating}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
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
            <p>• Đặt lịch/Hủy lịch phải trước ít nhất 12 giờ.</p>
            <p>• Vắng mặt không lý do sẽ mất buổi học.</p>
          </div>
        </div>
      </div>

      <Modal isOpen={confirmBookingModal.isOpen} onClose={() => setConfirmBookingModal({ ...confirmBookingModal, isOpen: false })} title="Xác nhận đặt lịch">
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
             <p className="text-sm font-bold text-indigo-800 mb-3 text-center uppercase">Chọn nội dung buổi học</p>
             <div className="grid grid-cols-1 gap-3">
               <button 
                 onClick={() => setConfirmBookingModal({ ...confirmBookingModal, type: 'PRACTICE' })} 
                 className={`p-3 rounded-lg text-xs font-bold border transition-all ${confirmBookingModal.type === 'PRACTICE' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
               >
                 🚗 Thực hành
               </button>
             </div>
             <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setConfirmBookingModal({ ...confirmBookingModal, isOpen: false })}>Hủy</Button>
                <Button onClick={handleBooking}>Xác nhận</Button>
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

      <Modal isOpen={detailModal.isOpen} onClose={() => setDetailModal({ ...detailModal, isOpen: false })} title="Thông tin buổi học">
        {detailModal.data && (
          <div className="p-4 space-y-4">
             <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">👨‍🏫</div>
                <div>
                   <p className="text-sm text-slate-500 font-bold uppercase">Giảng viên</p>
                   <p className="text-lg font-bold text-slate-800">Tên :{detailModal.data.instructorId?.fullName}</p>
                   <p className="text-sm text-indigo-600 font-medium">SĐT :{detailModal.data.instructorId?.phone}</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white border rounded-lg text-center">
                   <p className="text-xs text-slate-400 font-bold">Ca Học</p>
                   <p className="text-xl font-bold text-slate-800">{detailModal.data.timeSlot}</p>
                </div>
                <div className="p-3 bg-white border rounded-lg text-center">
                   <p className="text-xs text-slate-400 font-bold">Loại</p>
                   <p className="text-sm font-bold text-slate-800 uppercase">{detailModal.data.type || 'Thực hành'}</p>
                </div>
             </div>
             {detailModal.data.status === 'BOOKED' && (
                <Button className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-red-200" variant="outline" onClick={() => handleCancel(detailModal.data._id, detailModal.data.date, detailModal.data.timeSlot)}>Hủy lịch học này</Button>
             )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Schedule;
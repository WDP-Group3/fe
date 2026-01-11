import { useState, useEffect } from 'react';
import { useModal } from '../hooks';
import { useToast } from '../context/ToastContext';
import { Button, Modal, Input, Select, DatePicker } from '../components/ui';
import { SocialIcons } from '../components/common';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import { FormGroup, FormRow } from '../components/forms';
import apiClient from '../services/apiClient';
import { useAuthContext } from '../context/AuthContext';

const Schedule = () => {
  const { user } = useAuthContext();
  const { isOpen, open, close } = useModal();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: '',
    instructor: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await apiClient.get(`/bookings${user?.id ? `?studentId=${user.id}` : ''}`);
      if (response.status === 'success') {
        // Map backend booking format to frontend format
        const mappedSessions = (response.data || []).map((booking) => ({
          id: booking._id,
          date: new Date(booking.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          time: booking.timeSlot || '',
          type: 'Thực hành',
          instructor: booking.instructorId?.fullName || '',
          location: booking.batchId?.location || '',
        }));
        setSessions(mappedSessions);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const columns = [
    { key: 'date', title: 'Ngày', dataIndex: 'date' },
    { key: 'time', title: 'Giờ', dataIndex: 'time' },
    { key: 'type', title: 'Loại', dataIndex: 'type' },
    { key: 'instructor', title: 'Giáo viên', dataIndex: 'instructor' },
    { key: 'location', title: 'Địa điểm', dataIndex: 'location' },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handleCancel(record.id)}>
            Hủy
          </Button>
        </div>
      ),
    },
  ];

  const handleBook = async () => {
    setLoading(true);
    try {
      // Note: Backend booking API needs batchId and instructorId
      // For now, this is a placeholder - you may need to update the backend
      const response = await apiClient.post('/bookings', {
        date: formData.date,
        timeSlot: formData.time,
        // These would need to be selected from available options
        // batchId: selectedBatchId,
        // instructorId: selectedInstructorId,
      });
      if (response.status === 'success') {
        showToast('Đặt lịch thành công', 'success');
        close();
        setFormData({ date: '', time: '', type: '', instructor: '', location: '' });
        loadSessions();
      }
    } catch (error) {
      showToast(error.message || 'Đặt lịch thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      const response = await apiClient.put(`/bookings/${id}`, { status: 'CANCELLED' });
      if (response.status === 'success') {
        showToast('Hủy lịch thành công', 'success');
        loadSessions();
      }
    } catch (error) {
      showToast(error.message || 'Hủy lịch thất bại', 'error');
    }
  };

  // Mock consultant info
  const consultantInfo = {
    name: 'Ngô Trần Minh Hòa',
    zalo: 'https://zalo.me/0966881862',
    facebook: 'https://www.facebook.com/minhhoa.ngotran/',
    gmail: 'ntmh18062004@gmail.com',
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Đặt / huỷ lịch học"
          description="Kiểm tra giáo viên & xe trống, chống trùng lịch"
          action={
            <Button variant="primary" onClick={open}>
              Đặt lịch mới
            </Button>
          }
        />
        {loadingSessions ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p>Chưa có lịch học nào</p>
          </div>
        ) : (
          <DataTable columns={columns} data={sessions} />
        )}
      </div>

      {/* Contact Consultant */}
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
        <SectionHeader
          title="Liên hệ tư vấn viên"
          description="Nhận hỗ trợ nhanh qua Zalo, Facebook hoặc Email"
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">{consultantInfo.name}</p>
            <p className="text-sm text-slate-600">Tư vấn viên hỗ trợ 24/7</p>
          </div>
          <SocialIcons
            zalo={consultantInfo.zalo}
            facebook={consultantInfo.facebook}
            gmail={consultantInfo.gmail}
            size="lg"
          />
        </div>
      </div>

      {/* Book Schedule Modal */}
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Đặt lịch học mới"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={close}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleBook} loading={loading}>
              Đặt lịch
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormRow cols={2}>
            <FormGroup label="Ngày học" required>
              <DatePicker
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </FormGroup>
            <FormGroup label="Giờ học" required>
              <Select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                options={[
                  { value: '07:00-09:00', label: '07:00 - 09:00' },
                  { value: '09:00-11:00', label: '09:00 - 11:00' },
                  { value: '14:00-16:00', label: '14:00 - 16:00' },
                  { value: '16:00-18:00', label: '16:00 - 18:00' },
                ]}
                placeholder="Chọn giờ"
              />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Loại học" required>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'Lý thuyết', label: 'Lý thuyết' },
                  { value: 'Thực hành', label: 'Thực hành' },
                  { value: 'Thi thử', label: 'Thi thử' },
                ]}
                placeholder="Chọn loại"
              />
            </FormGroup>
            <FormGroup label="Giáo viên" required>
              <Select
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                options={[
                  { value: 'Nguyễn Minh Trí', label: 'Nguyễn Minh Trí' },
                  { value: 'Lê Quang Huy', label: 'Lê Quang Huy' },
                ]}
                placeholder="Chọn giáo viên"
              />
            </FormGroup>
          </FormRow>
          <FormGroup label="Địa điểm">
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Nhập địa điểm"
            />
          </FormGroup>
        </div>
      </Modal>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Quy định lịch học" />
          <div className="space-y-3 text-sm text-slate-700">
            <p>• Không huỷ/hoãn trước 24h → mất quyền lợi buổi học.</p>
            <p>• Ứng dụng nhắc trước 24h, 3h và 1h.</p>
            <p>• Ghi log huỷ lịch, log đổi xe / giáo viên.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader title="Ghi chú buổi học" description="Instructor ghi chú, Student xem trực tiếp" />
          <div className="space-y-3">
            {sessions.slice(0, 2).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{item.type} · {item.date}</p>
                  <StatusBadge status="done" label="Điểm danh" />
                </div>
                <p className="text-xs text-slate-500">{item.instructor} · {item.location}</p>
                <textarea
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  placeholder="Instructor ghi chú buổi học..."
                />
                <button
                  type="button"
                  className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                  onClick={() => {
                    // Cần call đến BE để lưu ghi chú buổi học
                  }}
                >
                  Lưu ghi chú
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;


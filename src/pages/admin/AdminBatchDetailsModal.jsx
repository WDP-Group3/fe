import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/ui/Modal";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

const AdminBatchDetailsModal = ({ isOpen, onClose, batch, onLearnerRemoved }) => {
  const { showToast } = useToast();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState({ open: false, registrationId: null, learnerName: '' });

  useEffect(() => {
    if (isOpen && batch) {
      loadParticipants();
    }
  }, [isOpen, batch]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/registrations/batch/${batch._id}/participants`);
      setParticipants(res.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi tải danh sách học viên", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLearner = async () => {
    if (!removeConfirm.registrationId) return;
    try {
      await apiClient.patch(`/registrations/${removeConfirm.registrationId}/unassign`);
      showToast("Đã đưa học viên về danh sách chờ", "success");
      setRemoveConfirm({ open: false, registrationId: null, learnerName: '' });
      loadParticipants();
      if (onLearnerRemoved) onLearnerRemoved();
    } catch (err) {
      showToast(err.response?.data?.message || "Không thể thay đổi khi lớp đã được khai giảng", "error");
    }
  };

  const checkDocumentStatus = (doc) => {
    if (!doc) return <StatusBadge status="warning" label="Chưa có hồ sơ" />;
    const missing = [];
    if (!doc.avatar) missing.push("Ảnh 3x4");
    if (!doc.cccdImageFront) missing.push("CCCD mặt trước");
    if (!doc.cccdImageBack) missing.push("CCCD mặt sau");
    // You can add health check / medical file if needed depending on model

    if (missing.length === 0) {
      return <StatusBadge status="success" label="Đầy đủ" />;
    }
    return <div className="text-xs text-red-600 font-medium whitespace-pre-wrap">Thiếu:\n{missing.join(', ')}</div>;
  };

  if (!isOpen || !batch) return null;

  const isStarted = new Date(batch.startDate).setHours(0,0,0,0) <= new Date().setHours(0,0,0,0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết lớp học" size="xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="text-sm text-slate-500 mb-1">Tên lớp</p>
            <p className="font-medium text-slate-800">{batch.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Khóa học</p>
            <p className="font-medium text-slate-800">{batch.courseId?.code || ""}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Sĩ số</p>
            <p className="font-medium text-slate-800">
              {participants.length} / {batch.maxlearners || "?"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Khai giảng</p>
            <p className="font-medium text-slate-800">
              {new Date(batch.startDate).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-3">Danh sách học viên ({participants.length})</h3>
          
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-center">STT</th>
                    <th className="px-4 py-3">Học viên</th>
                    <th className="px-4 py-3">Liên hệ</th>
                    <th className="px-4 py-3">Hồ sơ</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                        Đang tải danh sách...
                      </td>
                    </tr>
                  ) : participants.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                        Chưa có học viên nào trong lớp này
                      </td>
                    </tr>
                  ) : (
                    participants.map((p, idx) => (
                      <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3 items-center">
                          <div className="flex items-center gap-3">
                            {p.learnerId?.avatar ? (
                              <img src={p.learnerId.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
                                {p.learnerId?.fullName?.charAt(0) || "?"}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900">{p.learnerId?.fullName}</p>
                              {p.learnerDocument?.cccdNumber && (
                                <p className="text-xs text-slate-500 mt-0.5">CCCD: {p.learnerDocument.cccdNumber}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p>{p.learnerId?.phone}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">{p.learnerId?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {checkDocumentStatus(p.learnerDocument)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isStarted ? (
                            <span className="text-slate-400 text-sm italic cursor-not-allowed" title="Không thể xóa khi lớp đã khai giảng">
                              Đã khóa
                            </span>
                          ) : (
                            <button
                              onClick={() => setRemoveConfirm({ open: true, registrationId: p._id, learnerName: p.learnerId?.fullName })}
                              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                            >
                              Xóa khỏi lớp
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={removeConfirm.open}
        onClose={() => setRemoveConfirm({ open: false, registrationId: null, learnerName: '' })}
        onConfirm={handleRemoveLearner}
        title="Xóa học viên khỏi lớp"
        message={`Bạn có chắc muốn đưa học viên "${removeConfirm.learnerName}" về danh sách chờ? Học viên sẽ không còn thuộc lớp này nữa.`}
        variant="danger"
      />
    </Modal>
  );
};

export default AdminBatchDetailsModal;

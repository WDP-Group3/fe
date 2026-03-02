import { useState, useEffect } from "react";
import { SectionHeader } from "../../components/ui";
import StatusBadge from "../../components/ui/StatusBadge";
import apiClient from "../../services/apiClient";
import { formatCurrency } from "../../utils/formatters";

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningCourse, setAssigningCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({
    studentId: "",
    batchId: "",
    status: "PROCESSING",
    paymentPlanType: "INSTALLMENT",
  });

  const [courseBatches, setCourseBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchForm, setBatchForm] = useState({
    startDate: "",
    estimatedEndDate: "",
    location: "",
    status: "OPEN",
  });

  const initialFormState = {
    code: "",
    name: "",
    estimatedCost: "0",
    description: "",
    image: "",
    estimatedDuration: "",
    location: "",
    note: "",
    feePayments: [],
    status: "Active",
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/courses");
      if (response.status === "success") {
        const mappedCourses = (response.data || []).map((course) => ({
          ...course,
          id: course.code || course._id,
          feePayments: course.feePayments || [],
          displayLocation: Array.isArray(course.location)
            ? course.location.join(", ")
            : course.location,
        }));
        setCourses(mappedCourses);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseBatches = async (courseId) => {
    try {
      setBatchLoading(true);
      const batchRes = await apiClient.get(`/batches?courseId=${courseId}`);
      setCourseBatches(batchRes?.data || []);
    } catch (batchError) {
      console.error(batchError);
      setCourseBatches([]);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        estimatedCost: Number(formData.estimatedCost),
        estimatedDuration: formData.estimatedDuration
          ? Number(formData.estimatedDuration)
          : undefined,
        location: formData.location
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        feePayments: formData.feePayments.map((p) => ({
          name: p.name,
          amount: Number(p.amount),
          note: p.note,
        })),
      };

      if (editingCourse) {
        await apiClient.put(`/courses/${editingCourse._id}`, payload);
      } else {
        await apiClient.post("/courses", payload);
      }
      setShowModal(false);
      setEditingCourse(null);
      setFormData(initialFormState);
      setCourseBatches([]);
      loadCourses();
    } catch (submitError) {
      console.error(submitError);
      alert("Failed to save course");
    }
  };

  const handleEdit = async (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code || "",
      name: course.name || "",
      estimatedCost: course.estimatedCost || 0,
      description: course.description || "",
      image: course.image || "",
      estimatedDuration: course.estimatedDuration || "",
      location: Array.isArray(course.location)
        ? course.location.join(", ")
        : course.location || "",
      note: course.note || "",
      feePayments: course.feePayments
        ? course.feePayments.map((p) => ({
            name: p.name || "",
            amount: p.amount || 0,
            note: p.note || "",
          }))
        : [],
    });

    await loadCourseBatches(course._id);

    setBatchForm({
      startDate: "",
      estimatedEndDate: "",
      location: Array.isArray(course.location)
        ? course.location[0] || ""
        : course.location || "",
      status: "OPEN",
    });

    setShowModal(true);
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!editingCourse?._id) return;

    if (!batchForm.startDate || !batchForm.estimatedEndDate || !batchForm.location) {
      alert("Vui lòng nhập đủ thông tin lớp (batch)");
      return;
    }

    try {
      setBatchLoading(true);
      await apiClient.post("/batches", {
        courseId: editingCourse._id,
        startDate: batchForm.startDate,
        estimatedEndDate: batchForm.estimatedEndDate,
        location: batchForm.location,
        status: batchForm.status,
      });

      setBatchForm((prev) => ({
        ...prev,
        startDate: "",
        estimatedEndDate: "",
      }));

      await loadCourseBatches(editingCourse._id);
      alert("Tạo lớp học thành công");
    } catch (createBatchError) {
      console.error(createBatchError);
      alert(createBatchError.message || "Tạo lớp học thất bại");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Bạn có chắc muốn xoá lớp này?")) return;

    try {
      setBatchLoading(true);
      await apiClient.delete(`/batches/${batchId}`);
      await loadCourseBatches(editingCourse._id);
    } catch (deleteBatchError) {
      console.error(deleteBatchError);
      alert(deleteBatchError.message || "Xóa lớp thất bại");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleUpdateBatchStatus = async (batchId, status) => {
    try {
      await apiClient.put(`/batches/${batchId}`, { status });
      await loadCourseBatches(editingCourse._id);
    } catch (updateBatchError) {
      console.error(updateBatchError);
      alert(updateBatchError.message || "Cập nhật trạng thái lớp thất bại");
    }
  };

  const handleOpenAssignModal = async (course) => {
    try {
      setAssigningCourse(course);
      setShowAssignModal(true);
      setAssignLoading(true);
      setAssignForm({ studentId: "", batchId: "", status: "PROCESSING", paymentPlanType: "INSTALLMENT" });

      const [studentRes, batchRes] = await Promise.all([
        apiClient.get("/users?role=STUDENT&status=ACTIVE"),
        apiClient.get(`/batches?courseId=${course._id}&status=OPEN`),
      ]);

      setStudents(studentRes?.data || []);
      setBatches(batchRes?.data || []);
    } catch (openError) {
      console.error(openError);
      alert("Không tải được danh sách học viên/lớp học");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    if (!assignForm.studentId || !assignForm.batchId) {
      alert("Vui lòng chọn học viên và lớp học");
      return;
    }

    try {
      setAssignLoading(true);
      await apiClient.post("/registrations/assign", {
        studentId: assignForm.studentId,
        batchId: assignForm.batchId,
        status: assignForm.status,
        paymentPlanType: assignForm.paymentPlanType,
        registerMethod: "CONSULTANT",
      });
      alert("Gán khóa học cho học viên thành công");
      setShowAssignModal(false);
    } catch (assignError) {
      console.error(assignError);
      alert(assignError.message || "Gán học viên thất bại");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAddPayment = () => {
    setFormData((prev) => ({
      ...prev,
      feePayments: [...prev.feePayments, { name: "", amount: 0, note: "" }],
    }));
  };

  const handleRemovePayment = (index) => {
    setFormData((prev) => ({
      ...prev,
      feePayments: prev.feePayments.filter((_, i) => i !== index),
    }));
  };

  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...formData.feePayments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setFormData((prev) => ({ ...prev, feePayments: newPayments }));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá?")) {
      try {
        await apiClient.delete(`/courses/${id}`);
        loadCourses();
      } catch (deleteError) {
        console.error(deleteError);
        alert("Failed to delete course");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Lỗi tải dữ liệu: {error}</p>
        <button
          onClick={loadCourses}
          className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Quản lý khóa học"
        description="Thêm, sửa, xóa các khóa học"
        action={
          <button
            onClick={() => {
              setEditingCourse(null);
              setFormData(initialFormState);
              setCourseBatches([]);
              setShowModal(true);
            }}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Thêm khóa học
          </button>
        }
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              {editingCourse ? "Sửa khoá học" : "Thêm khoá học mới"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Mã khoá học</label>
                  <input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tên khoá học</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Học phí (VND)</label>
                  <input
                    type="number"
                    required
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Thời lượng (tháng)</label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="VD: 3"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Địa điểm (phân cách bằng dấu phẩy)</label>
                <input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú</label>
                <textarea
                  rows="2"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="border-t pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-800">Cấu hình đợt đóng phí</label>
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Thêm đợt
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.feePayments.map((payment, index) => (
                    <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            placeholder="Tên đợt"
                            value={payment.name}
                            onChange={(e) => handlePaymentChange(index, "name", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Số tiền"
                            value={payment.amount}
                            onChange={(e) => handlePaymentChange(index, "amount", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                          />
                        </div>
                        <input
                          placeholder="Ghi chú"
                          value={payment.note}
                          onChange={(e) => handlePaymentChange(index, "note", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        />
                      </div>
                      <button type="button" onClick={() => handleRemovePayment(index)} className="text-red-500 p-2">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {editingCourse && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800">Quản lý lớp học (Batch)</h4>
                    {batchLoading && <span className="text-xs text-slate-500">Đang tải...</span>}
                  </div>

                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-4">
                    <input
                      type="date"
                      value={batchForm.startDate}
                      onChange={(e) => setBatchForm((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={batchForm.estimatedEndDate}
                      onChange={(e) => setBatchForm((prev) => ({ ...prev, estimatedEndDate: e.target.value }))}
                      className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                    />
                    <input
                      placeholder="Địa điểm lớp"
                      value={batchForm.location}
                      onChange={(e) => setBatchForm((prev) => ({ ...prev, location: e.target.value }))}
                      className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleCreateBatch}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      + Tạo lớp
                    </button>
                  </div>

                  <div className="space-y-2">
                    {courseBatches.length === 0 ? (
                      <p className="text-xs text-slate-500">Chưa có lớp nào cho khóa học này.</p>
                    ) : (
                      courseBatches.map((batch) => (
                        <div key={batch._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                          <div className="text-sm text-slate-700">
                            <p>
                              {new Date(batch.startDate).toLocaleDateString("vi-VN")} → {new Date(batch.estimatedEndDate).toLocaleDateString("vi-VN")}
                            </p>
                            <p className="text-xs text-slate-500">{batch.location}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={batch.status}
                              onChange={(e) => handleUpdateBatchStatus(batch._id, e.target.value)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                            >
                              <option value="OPEN">OPEN</option>
                              <option value="CLOSED">CLOSED</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDeleteBatch(batch._id)}
                              className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Gán khóa học cho học viên</h3>
            <p className="mt-1 text-sm text-slate-600">
              Khóa học: <span className="font-semibold">{assigningCourse?.name}</span>
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleAssignStudent}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Học viên</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={assignForm.studentId}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, studentId: e.target.value }))}
                  required
                  disabled={assignLoading}
                >
                  <option value="">-- Chọn học viên --</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.fullName} - {student.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Lớp học (Batch)</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={assignForm.batchId}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, batchId: e.target.value }))}
                  required
                  disabled={assignLoading}
                >
                  <option value="">-- Chọn lớp --</option>
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {new Date(batch.startDate).toLocaleDateString("vi-VN")} - {batch.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Trạng thái hồ sơ</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={assignForm.status}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, status: e.target.value }))}
                  disabled={assignLoading}
                >
                  <option value="NEW">NEW</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="STUDYING">STUDYING</option>
                </select>
              </div>


              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Hình thức thu học phí</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={assignForm.paymentPlanType}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, paymentPlanType: e.target.value }))}
                  disabled={assignLoading}
                >
                  <option value="INSTALLMENT">Theo đợt (theo cấu hình khóa học)</option>
                  <option value="FULL">Đóng 1 lần</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
                  disabled={assignLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
                  disabled={assignLoading}
                >
                  {assignLoading ? "Đang gán..." : "Gán học viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>Chưa có khóa học nào</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="relative rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <StatusBadge status="done" label="Mở đăng ký" />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenAssignModal(course)}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Gán học viên
                  </button>
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full"
                    title="Sửa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(course._id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                    title="Xóa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-900">{course.name}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(course.estimatedCost)}</p>
                {course.feePayments && course.feePayments.length > 0 && (
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                    {course.feePayments.length} đợt đóng
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-700 h-20 overflow-y-auto pr-1">
                {course.feePayments && course.feePayments.length > 0 ? (
                  course.feePayments.map((p, idx) => (
                    <p key={idx}>
                      • {p.name}: {formatCurrency(p.amount)} <span className="text-slate-500 text-xs">{p.note ? `(${p.note})` : ""}</span>
                    </p>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-xs">Phí nộp 1 lần</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCourses;

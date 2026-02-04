import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import SectionHeader from "../components/ui/SectionHeader";
import StatusBadge from "../components/ui/StatusBadge";
import apiClient from "../services/apiClient";
import { formatCurrency } from "../utils/formatters";

const Courses = () => {
  const { user } = useAuthContext();
  const isAdmin = user?.role === "ADMIN";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Initial form state
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
    status: 'Active',
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
      loadCourses();
    } catch (error) {
      console.error(error);
      alert("Failed to save course");
    }
  };

  const handleEdit = (course) => {
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
    setShowModal(true);
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
      } catch (error) {
        alert("Failed to delete course");
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="text-center py-8 text-red-600">
            <p>Lỗi tải dữ liệu: {error}</p>
            <button
              onClick={loadCourses}
              className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Danh sách khóa học"
          description="Công khai học phí"
          action={
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingCourse(null);
                    setFormData(initialFormState);
                    setShowModal(true);
                  }}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Thêm khóa học
                </button>
              )}
            </div>
          }
        />

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                {editingCourse ? "Sửa khoá học" : "Thêm khoá học mới"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Mã khoá học
                    </label>
                    <input
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Tên khoá học
                    </label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Học phí (VND)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.estimatedCost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedCost: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Thời lượng (tháng)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedDuration: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="VD: 3"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Địa điểm (phân cách bằng dấu phẩy)
                  </label>
                  <input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="VD: Phòng 101, Online"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Mô tả
                  </label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  ></textarea>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Ghi chú
                  </label>
                  <textarea
                    rows="2"
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  ></textarea>
                </div>

                {/* Fee Payments Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-800">
                      Cấu hình đợt đóng phí
                    </label>
                    <button
                      type="button"
                      onClick={handleAddPayment}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      + Thêm đợt
                    </button>
                  </div>

                  {formData.feePayments.length === 0 && (
                    <p className="text-sm text-slate-500 italic">
                      Chưa có đợt đóng phí nào. Mặc định sẽ đóng 1 lần.
                    </p>
                  )}

                  <div className="space-y-3">
                    {formData.feePayments.map((payment, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-200"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              placeholder="Tên đợt (VD: Đợt 1)"
                              value={payment.name}
                              onChange={(e) =>
                                handlePaymentChange(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Số tiền"
                              value={payment.amount}
                              onChange={(e) =>
                                handlePaymentChange(
                                  index,
                                  "amount",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            />
                          </div>
                          <input
                            placeholder="Ghi chú (VD: Sau 1 tháng)"
                            value={payment.note}
                            onChange={(e) =>
                              handlePaymentChange(index, "note", e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(index)}
                          className="text-red-500 p-2 hover:bg-red-50 rounded-lg"
                          title="Xóa đợt này"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Danh sách khoá học */}
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
                  <p className="text-xs font-semibold text-indigo-600">
                    {course.code}
                  </p>
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {course.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(course.estimatedCost)}
                  </p>
                  {course.feePayments && course.feePayments.length > 0 && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      {course.feePayments.length} đợt đóng
                    </span>
                  )}
                </div>

                {/* Display Fee Payments Preview */}
                <div className="mt-2 space-y-1 text-sm text-slate-700 h-20 overflow-y-auto custom-scrollbar pr-1">
                  {course.feePayments && course.feePayments.length > 0 ? (
                    course.feePayments.map((p, idx) => (
                      <p key={idx}>
                        • {p.name}: {formatCurrency(p.amount)}{" "}
                        <span className="text-slate-500 text-xs">
                          {p.note ? `(${p.note})` : ""}
                        </span>
                      </p>
                    ))
                  ) : (
                    <p className="text-slate-500 italic text-xs">
                      Phí nộp 1 lần
                    </p>
                  )}
                </div>

                <div className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                  <p className="font-semibold text-indigo-700">
                    Thời lượng:{" "}
                    {course.estimatedDuration
                      ? `${course.estimatedDuration} tháng`
                      : "Chưa cập nhật"}
                  </p>
                </div>

                {/* Locations */}
                {course.location && course.location.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {course.location.map((loc, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                )}

                {!isAdmin && (
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                      Chọn khóa
                    </button>
                    <button className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800">
                      Tư vấn
                    </button>
                  </div>
                )}
                {isAdmin && (
                  <div className="mt-4 flex gap-2 border-t pt-3">
                    <button
                      onClick={() => handleEdit(course)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Xoá
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;

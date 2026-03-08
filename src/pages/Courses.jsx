import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import StatusBadge from "../components/ui/StatusBadge";
import apiClient from "../services/apiClient";
import { formatCurrency } from "../utils/formatters";
import { Modal, Select, Button } from "../components/ui";
import { useAuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Courses = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthContext();
  const { showToast } = useToast();

  // isAdmin logic removed
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Register-from-courses modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [creatingRegistration, setCreatingRegistration] = useState(false);

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

  const openRegisterModal = async (course) => {
    if (!isAuthenticated) {
      showToast("Vui lòng đăng nhập để đăng ký khóa học", "error");
      navigate("/login");
      return;
    }

    if (user?.role !== "STUDENT") {
      showToast("Chỉ tài khoản Học viên mới có thể đăng ký khóa học", "error");
      return;
    }

    setSelectedCourse(course);
    setSelectedBatchId("");
    setIsRegisterModalOpen(true);

    try {
      setLoadingBatches(true);
      const response = await apiClient.get(
        `/batches?status=OPEN&courseId=${course?._id}`
      );
      if (response.status === "success") {
        setBatches(response.data || []);
      } else {
        setBatches([]);
      }
    } catch (e) {
      console.error("Error loading batches:", e);
      setBatches([]);
      showToast(e?.message || "Không thể tải danh sách lớp đang mở", "error");
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleCreateRegistration = async () => {
    if (!selectedBatchId) {
      showToast("Vui lòng chọn lớp (batch) để đăng ký", "error");
      return;
    }

    try {
      setCreatingRegistration(true);
      const response = await apiClient.post("/registrations", {
        batchId: selectedBatchId,
        registerMethod: "ONLINE",
      });

      if (response.status === "success") {
        showToast("Đăng ký khóa học thành công", "success");
        setIsRegisterModalOpen(false);
        navigate("/portal/enrollment");
      } else {
        showToast(response.message || "Đăng ký thất bại", "error");
      }
    } catch (e) {
      console.error("Create registration error:", e);
      showToast(e?.message || "Đăng ký thất bại", "error");
    } finally {
      setCreatingRegistration(false);
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
          action={null}
        />

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

                <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => openRegisterModal(course)}
                >
                    Chọn khóa
                  </button>
                <button
                  className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800"
                  onClick={() => navigate("/#consult-form")}
                >
                    Tư vấn
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Chọn lớp để đăng ký"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsRegisterModalOpen(false)}
              disabled={creatingRegistration}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateRegistration}
              loading={creatingRegistration}
              disabled={loadingBatches}
            >
              Xác nhận đăng ký
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Khóa học</p>
            <p className="mt-1 font-semibold text-slate-900">
              {selectedCourse?.name || "—"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Học phí:{" "}
              <span className="font-semibold text-indigo-700">
                {formatCurrency(selectedCourse?.estimatedCost || 0)}
              </span>
            </p>
          </div>

          <Select
            label="Chọn lớp (batch) đang mở"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            disabled={loadingBatches}
            placeholder={
              loadingBatches ? "Đang tải danh sách lớp..." : "Chọn lớp"
            }
            options={(batches || []).map((b) => {
              const locationLabel = b?.location || "";
              const startLabel = b?.startDate
                ? new Date(b.startDate).toLocaleDateString("vi-VN")
                : "";
              const label = [locationLabel, startLabel].filter(Boolean).join(" · ");
              return {
                value: b?._id,
                label: label || (b?._id || "Batch"),
              };
            })}
            helperText="Chỉ hiển thị các lớp có trạng thái OPEN."
          />

          {(!loadingBatches && batches.length === 0) && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
              Hiện chưa có lớp (batch) nào đang mở cho khóa học này. Vui lòng chọn khóa khác hoặc liên hệ tư vấn.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Courses;

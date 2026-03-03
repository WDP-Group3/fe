import { useState, useEffect } from "react";
import SectionHeader from "../components/ui/SectionHeader";
import StatusBadge from "../components/ui/StatusBadge";
import apiClient from "../services/apiClient";
import { formatCurrency } from "../utils/formatters";

const Courses = () => {

  // isAdmin logic removed
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Removed editing/modal states as they are not needed for user view

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
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
                {/* Course Image */}
                <div className="mt-3 overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={course.image}
                    alt={course.name}
                    className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-900">
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
                  <button className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                    Chọn khóa
                  </button>
                  <button className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800">
                    Tư vấn
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;

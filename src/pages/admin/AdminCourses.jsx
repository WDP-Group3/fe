import { useState, useEffect } from "react";
import { SectionHeader, FileUpload } from "../../components/ui";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { FormGroup } from "../../components/forms";
import StatusBadge from "../../components/ui/StatusBadge";
import apiClient from "../../services/apiClient";
import { formatCurrency } from "../../utils/formatters";
import config from "../../config";
import { useToast } from "../../context/ToastContext";
import Pagination from "../../components/common/Pagination";
import AdminBatchDetailsModal from "./AdminBatchDetailsModal";

const AdminCourses = () => {
  const [activeTab, setActiveTab] = useState("courses"); // 'courses' or 'batches'
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);

  const [courseDeleteConfirm, setCourseDeleteConfirm] = useState({
    open: false,
    id: null,
  });
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState({
    open: false,
    id: null,
  });
  const [batchModalDeleteConfirm, setBatchModalDeleteConfirm] = useState({
    open: false,
    id: null,
  });
  const [autoEnrollModalParams, setAutoEnrollModalParams] = useState({
    isOpen: false,
    batch: null,
  });
  const [viewingBatch, setViewingBatch] = useState(null);
  const [priceChangeConfirm, setPriceChangeConfirm] = useState({
    open: false,
    payload: null,
  });
  const [courseStatusConfirm, setCourseStatusConfirm] = useState({
    open: false,
    course: null,
  });

  // Filter states for batches
  const [filters, setFilters] = useState({
    courseId: "",
    status: "",
    location: "",
    search: "",
  });

  // Pagination states
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesPagination, setCoursesPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  });

  const [batchesPage, setBatchesPage] = useState(1);
  const [batchesPagination, setBatchesPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  });

  // Batch form state
  const [batchForm, setBatchForm] = useState({
    courseId: "",
    name: "",
    startDate: "",
    estimatedEndDate: "",
    location: "",
    examLocation: "",
    examLocationId: "",
    minlearners: 1,
    maxlearners: 30,
    status: "OPEN",
  });

  // Exam locations for dropdown
  const [examLocations, setExamLocations] = useState([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningBatch, setAssigningBatch] = useState(null);
  const [learners, setlearners] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({ learnerId: "" });

  const [_courseBatches, setCourseBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const initialFormState = {
    code: "",
    name: "",
    level: "", // Thêm trường hạng khoá học
    estimatedCost: "0",
    description: "",
    image: "",
    estimatedDuration: "",
    location: "",
    note: "",
    feePayments: [],
    status: "Active",
    requiredPracticeHours: 0, // Số giờ thực hành bắt buộc (mặc định 0 = không giới hạn)
  };

  const [formData, setFormData] = useState(initialFormState);
  const [imageUploading, setImageUploading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadCourses();
  }, [coursesPage]);

  useEffect(() => {
    loadExamLocations();
  }, []);

  const loadExamLocations = async () => {
    try {
      const res = await apiClient.get("/exam-locations/simple");
      if (res.status === "success") {
        setExamLocations(res.data || []);
      }
    } catch (err) {
      console.error("Error loading exam locations:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "batches") {
      loadAllBatches();
    }
  }, [activeTab, filters, batchesPage]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(
        `/courses?page=${coursesPage}&limit=${coursesPagination.limit}&status=ALL`,
      );
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
        if (response.pagination) {
          setCoursesPagination(response.pagination);
        }
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoEnroll = (batch) => {
    setAutoEnrollModalParams({ isOpen: true, batch });
  };

  const confirmAutoEnroll = async () => {
    const batch = autoEnrollModalParams.batch;
    if (!batch) return;
    try {
      const res = await apiClient.post(`/batches/${batch._id}/auto-enroll`);
      if (res.data?.success) {
        showToast(res.message || "Xếp lớp tự động thành công", "success");
        loadAllBatches();
      } else {
        showToast(res.data?.message || res.message || "Có lỗi xảy ra", "info");
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || error.message || "Lỗi xếp lớp tự động",
        "error",
      );
    } finally {
      setAutoEnrollModalParams({ isOpen: false, batch: null });
    }
  };

  const loadAllBatches = async () => {
    try {
      setLoading(true);
      let queryParams = [];
      if (filters.courseId) queryParams.push(`courseId=${filters.courseId}`);
      if (filters.status) queryParams.push(`status=${filters.status}`);
      if (filters.location)
        queryParams.push(`location=${encodeURIComponent(filters.location)}`);
      queryParams.push(`page=${batchesPage}`);
      queryParams.push(`limit=${batchesPagination.limit}`);

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await apiClient.get(`/batches${queryString}`);

      let batchData = response?.data || [];

      // Apply client-side search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        batchData = batchData.filter(
          (b) =>
            b.name?.toLowerCase().includes(searchLower) ||
            b.location?.toLowerCase().includes(searchLower) ||
            b.courseId?.name?.toLowerCase().includes(searchLower) ||
            b.courseId?.code?.toLowerCase().includes(searchLower),
        );
      }

      // Populate course info
      const batchesWithCourse = await Promise.all(
        batchData.map(async (batch) => {
          let courseInfo = batch.courseId;
          if (typeof batch.courseId === "string") {
            try {
              const courseRes = await apiClient.get(
                `/courses/${batch.courseId}`,
              );
              courseInfo = courseRes?.data || null;
            } catch (e) {
              console.error("Error loading course:", e);
            }
          }

          // learnerCount is now provided by the getAllBatches API response
          return {
            ...batch,
            courseInfo,
            learnerCount: batch.learnerCount || 0,
          };
        }),
      );

      setBatches(batchesWithCourse);
      if (response.pagination) {
        setBatchesPagination(response.pagination);
      }
    } catch (err) {
      console.error("Error loading batches:", err);
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

  const saveCourse = async (payload) => {
    try {
      if (editingCourse) {
        await apiClient.put(`/courses/${editingCourse._id}`, payload);
        showToast("Cập nhật khoá học thành công!", "success");
      } else {
        await apiClient.post("/courses", payload);
        showToast("Thêm khoá học thành công!", "success");
      }
      setShowModal(false);
      setEditingCourse(null);
      setFormData(initialFormState);
      setCourseBatches([]);
      loadCourses();
    } catch (submitError) {
      console.error(submitError);
      showToast(submitError.message || "Lỗi khi lưu khoá học", "error");
    }
  };

  const handleConfirmPriceChange = () => {
    setPriceChangeConfirm({ open: false, payload: null });
    saveCourse(priceChangeConfirm.payload);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const locationStr =
        typeof formData.location === "string"
          ? formData.location
          : Array.isArray(formData.location)
            ? formData.location.join(", ")
            : "";
      const payload = {
        ...formData,
        estimatedCost: Number(formData.estimatedCost),
        estimatedDuration: formData.estimatedDuration
          ? Number(formData.estimatedDuration)
          : undefined,
        requiredPracticeHours: Number(formData.requiredPracticeHours) || 0,
        location: locationStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        feePayments: (formData.feePayments || []).map((p) => ({
          name: p.name,
          amount: Number(p.amount),
          note: p.note,
          afterPreviousPaidDays: Number(p.afterPreviousPaidDays) || 0,
        })),
      };

      // Tự động tính lại tổng tiền từ feePayments của payload
      const calculatedCost = payload.feePayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0,
      );
      if (calculatedCost > 0) {
        payload.estimatedCost = calculatedCost;
      }

      // Kiểm tra xem có thay đổi gì không so với dữ liệu cũ
      const checkChanges = () => {
        if (!editingCourse) return true;

        return (
          payload.code !== editingCourse.code ||
          payload.name !== editingCourse.name ||
          payload.level !== editingCourse.level ||
          payload.estimatedCost !== (editingCourse.estimatedCost || 0) ||
          payload.description !== editingCourse.description ||
          payload.image !== editingCourse.image ||
          payload.estimatedDuration !==
            (editingCourse.estimatedDuration || "") ||
          payload.requiredPracticeHours !==
            (editingCourse.requiredPracticeHours || 0) ||
          JSON.stringify(payload.feePayments) !==
            JSON.stringify(
              (editingCourse.feePayments || []).map((p) => ({
                name: p.name,
                amount: Number(p.amount),
                note: p.note,
                afterPreviousPaidDays: Number(p.afterPreviousPaidDays) || 0,
              })),
            )
        );
      };

      if (editingCourse && !checkChanges()) {
        setShowModal(false);
        return;
      }

      const currentCost = editingCourse?.estimatedCost || 0;
      const isPriceChanging = payload.estimatedCost !== currentCost;

      // LUÔN hỏi xác nhận nếu giá thay đổi
      if (isPriceChanging) {
        setPriceChangeConfirm({
          open: true,
          payload: payload,
        });
        return;
      }

      saveCourse(payload);
    } catch (submitError) {
      console.error(submitError);
      showToast(submitError.message || "Lỗi khi lưu khoá học", "error");
    }
  };

  const handleEdit = async (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code || "",
      name: course.name || "",
      level: course.level || "",
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
            afterPreviousPaidDays: p.afterPreviousPaidDays ?? 30,
          }))
        : [],
      requiredPracticeHours: course.requiredPracticeHours || 0,
    });

    await loadCourseBatches(course._id);

    setBatchForm({
      courseId: course._id,
      name: "",
      startDate: "",
      estimatedEndDate: "",
      location: Array.isArray(course.location)
        ? course.location[0] || ""
        : course.location || "",
      examLocation: "",
      examLocationId: "",
      minlearners: 1,
      maxlearners: 30,
      status: "OPEN",
    });

    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!courseDeleteConfirm.id) return;
    try {
      await apiClient.delete(`/courses/${courseDeleteConfirm.id}`);
      showToast("Xoá khoá học thành công!", "success");
      loadCourses();
    } catch (deleteError) {
      console.error(deleteError);
      showToast(deleteError.message || "Lỗi khi xoá khoá học", "error");
    } finally {
      setCourseDeleteConfirm({ open: false, id: null });
    }
  };

  const handleToggleCourseStatus = async () => {
    const { course } = courseStatusConfirm;
    if (!course) return;

    const newStatus = course.status === "Active" ? "Inactive" : "Active";
    try {
      await apiClient.put(`/courses/${course._id}`, { status: newStatus });
      showToast(
        `${newStatus === "Active" ? "Hiện" : "Ẩn"} khoá học thành công!`,
        "success",
      );
      loadCourses();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Lỗi khi đổi trạng thái khoá học", "error");
    } finally {
      setCourseStatusConfirm({ open: false, course: null });
    }
  };

  // Batch CRUD operations
  const handleSubmitBatch = async (e) => {
    e.preventDefault();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(batchForm.startDate);
    const end = new Date(batchForm.estimatedEndDate);

    if (start < today && !editingBatch) {
      showToast("Ngày bắt đầu không được trong quá khứ", "error");
      return;
    }
    if (end < start) {
      showToast("Ngày kết thúc không được trước ngày bắt đầu", "error");
      return;
    }

    try {
      const payload = {
        ...batchForm,
        courseId:
          batchForm.courseId ||
          editingBatch?.courseId?._id ||
          editingBatch?.courseId,
        maxlearners: Number(batchForm.maxlearners) || 30,
        minlearners: Number(batchForm.minlearners) || 1,
        examLocationId: batchForm.examLocationId || null,
      };

      if (editingBatch) {
        await apiClient.put(`/batches/${editingBatch._id}`, payload);
        showToast("Cập nhật lớp học thành công!", "success");
      } else {
        await apiClient.post("/batches", payload);
        showToast("Tạo lớp học thành công!", "success");
      }
      setShowBatchModal(false);
      setEditingBatch(null);
      setBatchForm({
        courseId: "",
        name: "",
        startDate: "",
        estimatedEndDate: "",
        location: "",
        examLocation: "",
        examLocationId: "",
        minlearners: 1,
        maxlearners: 30,
        status: "OPEN",
      });
      loadAllBatches();
    } catch (submitError) {
      console.error(submitError);
      showToast(submitError.message || "Lỗi khi lưu lớp học", "error");
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setBatchForm({
      courseId: batch.courseId?._id || batch.courseId || "",
      name: batch.name || "",
      startDate: batch.startDate ? batch.startDate.split("T")[0] : "",
      estimatedEndDate: batch.estimatedEndDate
        ? batch.estimatedEndDate.split("T")[0]
        : "",
      location: batch.location || "",
      examLocation: batch.examLocation || "",
      examLocationId: batch.examLocationId?._id || batch.examLocationId || "",
      minlearners: batch.minlearners || 1,
      maxlearners: batch.maxlearners || 30,
      status: batch.status || "OPEN",
    });
    setShowBatchModal(true);
  };

  const handleDeleteBatch = async () => {
    if (!batchDeleteConfirm.id) return;
    try {
      await apiClient.delete(`/batches/${batchDeleteConfirm.id}`);
      showToast("Xoá lớp học thành công!", "success");
      loadAllBatches();
    } catch (deleteError) {
      console.error(deleteError);
      showToast(deleteError.message || "Lỗi khi xoá lớp học", "error");
    } finally {
      setBatchDeleteConfirm({ open: false, id: null });
    }
  };

  const handleOpenAssignModal = async (batch) => {
    try {
      setAssigningBatch(batch);
      setShowAssignModal(true);
      setAssignLoading(true);
      setAssignForm({ learnerId: "" });

      const courseId = batch.courseId?._id || batch.courseId;
      // Chỉ lấy học viên đã nộp tiền đợt 1 và chưa được gán vào lớp nào
      const pendingRegRes = await apiClient.get(
        `/registrations?courseId=${courseId}&unassigned=true&status=NEW,PROCESSING,WAITING&paidFirstInstallment=true`,
      );

      const eligiblelearners = (pendingRegRes?.data || [])
        .map((reg) => reg.learnerId)
        .filter((learner) => learner != null);

      setlearners(eligiblelearners);
    } catch (openError) {
      console.error(openError);
      showToast("Không tải được danh sách học viên");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignlearner = async (e) => {
    e.preventDefault();
    if (!assignForm.learnerId) {
      showToast("Vui lòng chọn học viên", "error");
      return;
    }

    try {
      setAssignLoading(true);
      await apiClient.post("/registrations/assign", {
        learnerId: assignForm.learnerId,
        batchId: assigningBatch._id,
        status: "PROCESSING",
        paymentPlanType: "INSTALLMENT",
        registerMethod: "CONSULTANT",
      });
      showToast("Gán học viên vào lớp thành công!", "success");
      loadAllBatches(); // Refresh to update learner count
    } catch (assignError) {
      console.error(assignError);
      showToast(assignError.message || "Gán học viên thất bại", "error");
    } finally {
      setAssignLoading(false);
    }
  };

  const _handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!editingCourse?._id) return;

    if (
      !batchForm.startDate ||
      !batchForm.estimatedEndDate ||
      !batchForm.location
    ) {
      showToast("Vui lòng nhập đủ thông tin lớp (batch)");
      return;
    }

    try {
      setBatchLoading(true);
      await apiClient.post("/batches", {
        courseId: editingCourse._id,
        name: batchForm.name,
        startDate: batchForm.startDate,
        estimatedEndDate: batchForm.estimatedEndDate,
        location: batchForm.location,
        examLocation: batchForm.examLocation,
        examLocationId: batchForm.examLocationId || null,
        minlearners: batchForm.minlearners || 1,
        maxlearners: batchForm.maxlearners,
        status: batchForm.status,
      });

      setBatchForm((prev) => ({
        ...prev,
        name: "",
        startDate: "",
        estimatedEndDate: "",
        examLocation: "",
        examLocationId: "",
      }));

      await loadCourseBatches(editingCourse._id);
      // Also reload all batches if active tab is batches
      if (activeTab === "batches") {
        loadAllBatches();
      }
      showToast("Tạo lớp học thành công");
    } catch (createBatchError) {
      console.error(createBatchError);
      showToast(createBatchError.message || "Tạo lớp học thất bại");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleDeleteBatchInModal = async () => {
    if (!batchModalDeleteConfirm.id) return;
    try {
      setBatchLoading(true);
      await apiClient.delete(`/batches/${batchModalDeleteConfirm.id}`);
      await loadCourseBatches(editingCourse._id);
    } catch (deleteBatchError) {
      console.error(deleteBatchError);
      showToast(deleteBatchError.message || "Xóa lớp thất bại");
    } finally {
      setBatchLoading(false);
      setBatchModalDeleteConfirm({ open: false, id: null });
    }
  };

  const _handleUpdateBatchStatus = async (batchId, status) => {
    try {
      await apiClient.put(`/batches/${batchId}`, { status });
      await loadCourseBatches(editingCourse._id);
    } catch (updateBatchError) {
      console.error(updateBatchError);
      showToast(updateBatchError.message || "Cập nhật trạng thái lớp thất bại");
    }
  };

  const handleAddPayment = () => {
    setFormData((prev) => ({
      ...prev,
      feePayments: [
        ...prev.feePayments,
        { name: "", amount: 0, note: "", afterPreviousPaidDays: 30 },
      ],
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

  const handleImageUpload = async (file) => {
    if (!file) return;

    if (!config.cloudinary.cloudName || !config.cloudinary.uploadPreset) {
      showToast(
        "Cloudinary chưa được cấu hình. Vui lòng thêm VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.",
      );
      return;
    }

    try {
      setImageUploading(true);

      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", config.cloudinary.uploadPreset);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`;

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok || !data.secure_url) {
        throw new Error(data.error?.message || "Upload ảnh thất bại");
      }

      const imageUrl = data.secure_url;
      setFormData((prev) => ({ ...prev, image: imageUrl }));
    } catch (err) {
      console.error("Image upload error:", err);
      showToast(err.message || "Upload ảnh thất bại");
    } finally {
      setImageUploading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      courseId: "",
      status: "",
      location: "",
      search: "",
    });
  };

  // Get unique locations from batches for filter
  const uniqueLocations = [
    ...new Set(batches.map((b) => b.location).filter(Boolean)),
  ];

  if (loading && courses.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("courses")}
            className={`${
              activeTab === "courses"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            } border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
          >
            Quản lý khoá học
          </button>
          <button
            onClick={() => setActiveTab("batches")}
            className={`${
              activeTab === "batches"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            } border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
          >
            Quản lý lớp học
          </button>
        </nav>
      </div>

      {/* ==================== TAB QUẢN LÝ KHOÁ HỌC ==================== */}
      {activeTab === "courses" && (
        <>
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
              <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  {editingCourse ? "Sửa khoá học" : "Thêm khoá học mới"}
                </h3>
                <form
                  id="course-form"
                  onSubmit={handleSubmit}
                  className="flex-1 overflow-y-auto p-4 space-y-4 pb-24"
                >
                  <div className="max-w-xs">
                    <FormGroup
                      label="Ảnh khóa học"
                      helperText="Hỗ trợ .jpg, .png. Ảnh sẽ được lưu trên Cloudinary."
                    >
                      <FileUpload
                        accept=".jpg,.jpeg,.png"
                        multiple={false}
                        maxSize={5 * 1024 * 1024}
                        onChange={handleImageUpload}
                        disabled={imageUploading}
                      />
                      {imageUploading && (
                        <p className="mt-2 text-xs text-slate-500">
                          Đang upload ảnh...
                        </p>
                      )}
                      {formData.image && !imageUploading && (
                        <div className="mt-2">
                          <img
                            src={formData.image}
                            alt="Course"
                            className="h-32 w-auto object-cover rounded-md"
                          />
                        </div>
                      )}
                    </FormGroup>
                  </div>

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
                    {/* <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Hạng khoá học
                      </label>
                      <input
                        value={formData.level}
                        onChange={(e) =>
                          setFormData({ ...formData, level: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="VD: A1-A2, B1-B2, B2-C1"
                      />
                    </div> */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Số giờ thực hành bắt buộc
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.requiredPracticeHours || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            requiredPracticeHours:
                              parseInt(e.target.value) < 0
                                ? 0
                                : parseInt(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="VD: 10 giờ (0 = không giới hạn)"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Số giờ thực hành mà học viên cần hoàn thành để hoàn
                        thành khóa học
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Học phí (VND)
                      </label>
                      <input
                        disabled
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Thời lượng (tháng)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.estimatedDuration || 1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estimatedDuration:
                              e.target.value < 1 ? 1 : e.target.value,
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
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
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

                  <div className="border-t pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-bold text-slate-800">
                        Cấu hình kế hoạch đóng phí theo đợt
                      </label>
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
                        <div
                          key={index}
                          className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-200"
                        >
                          <div className="flex-1 space-y-2">
                            <div className={`grid gap-2 ${index === 0 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              <input
                                placeholder="Tên đợt"
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
                                min="0"
                                placeholder="Số tiền"
                                value={payment.amount || 0}
                                onChange={(e) =>
                                  handlePaymentChange(
                                    index,
                                    "amount",
                                    e.target.value <0 ? 0 : e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="Cách đợt trước (ngày)"
                                value={payment.afterPreviousPaidDays ?? 30}
                                onChange={(e) =>
                                  handlePaymentChange(
                                    index,
                                    "afterPreviousPaidDays",
                                    parseInt(e.target.value) < 0
                                      ? 0
                                      : parseInt(e.target.value),
                                  )
                                }
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                title="Số ngày kể từ khi đợt trước được thanh toán"
                              />
                            </div>
                            <input
                              placeholder="Ghi chú"
                              value={payment.note}
                              onChange={(e) =>
                                handlePaymentChange(
                                  index,
                                  "note",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePayment(index)}
                            className="text-red-500 p-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 z-[999]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    form="course-form"
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          )}

          {courses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Chưa có khóa học nào</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="relative rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge
                        status={course.status === "Active" ? "done" : "expired"}
                        label={
                          course.status === "Active"
                            ? course.level || "Mở đăng ký"
                            : "Đã ẩn"
                        }
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setCourseStatusConfirm({ open: true, course })
                          }
                          className={`p-1.5 ${
                            course.status === "Active"
                              ? "text-slate-600 hover:bg-slate-50"
                              : "text-amber-600 hover:bg-amber-50"
                          } rounded-full`}
                          title={course.status === "Active" ? "Ẩn" : "Hiện"}
                        >
                          {course.status === "Active" ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 15l-3-3m0 0l-3-3m3 3l-3 3m3-3l3-3"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(course)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full"
                          title="Sửa"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            ></path>
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            setCourseDeleteConfirm({
                              open: true,
                              id: course._id,
                            })
                          }
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                          title="Xóa"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 overflow-hidden rounded-xl bg-slate-100 w-full flex items-center justify-center">
                      <img
                        src={course.image}
                        alt={course.name}
                        className="w-50% h-48 object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {course.name}
                    </p>
                    {course.level && (
                      <p className="text-sm text-indigo-600 font-medium">
                        Hạng: {course.level}
                      </p>
                    )}
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
                    <div className="mt-1">
                      {course.requiredPracticeHours > 0 && (
                        <span className="ml-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          {course.requiredPracticeHours} giờ thực hành
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-slate-700 h-20 overflow-y-auto pr-1">
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
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Pagination
                  currentPage={coursesPage}
                  totalPages={coursesPagination.totalPages}
                  onPageChange={setCoursesPage}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* ==================== TAB QUẢN LÝ LỚP HỌC ==================== */}
      {activeTab === "batches" && (
        <>
          <SectionHeader
            title="Quản lý lớp học"
            description="Thêm, sửa, xóa các lớp học và tự động thêm học viên"
            action={
              <button
                onClick={() => {
                  setEditingBatch(null);
                  setBatchForm({
                    courseId: filters.courseId || "",
                    name: "",
                    startDate: "",
                    estimatedEndDate: "",
                    location: "",
                    examLocation: "",
                    examLocationId: "",
                    minlearners: 1,
                    maxlearners: 30,
                    status: "OPEN",
                  });
                  setShowBatchModal(true);
                }}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                + Thêm lớp học
              </button>
            }
          />

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                ></path>
              </svg>
              <span className="font-medium text-slate-700">Bộ lọc</span>
              {(filters.courseId ||
                filters.status ||
                filters.location ||
                filters.search) && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Khoá học
                </label>
                <select
                  value={filters.courseId}
                  onChange={(e) =>
                    handleFilterChange("courseId", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Tất cả khoá học</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Trạng thái
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="OPEN">Mở</option>
                  <option value="CLOSED">Đóng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Địa điểm
                </label>
                <select
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Tất cả địa điểm</option>
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Tìm kiếm
                </label>
                <input
                  type="text"
                  placeholder="Tên lớp, địa điểm..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Batch List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              <svg
                className="w-12 h-12 mx-auto text-slate-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                ></path>
              </svg>
              <p>Chưa có lớp học nào</p>
              <button
                onClick={() => {
                  setEditingBatch(null);
                  setBatchForm({
                    courseId: filters.courseId || "",
                    name: "",
                    startDate: "",
                    estimatedEndDate: "",
                    location: "",
                    examLocation: "",
                    examLocationId: "",
                    minlearners: 1,
                    maxlearners: 30,
                    status: "OPEN",
                  });
                  setShowBatchModal(true);
                }}
                className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + Tạo lớp học mới
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Tên lớp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Khoá học
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Địa điểm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Học viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {batches.map((batch, idx) => (
                    <tr
                      key={`${batch._id}-${idx}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {batch.name || "Lớp không tên"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">
                          {batch.courseInfo?.name ||
                            batch.courseId?.name ||
                            "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {batch.courseInfo?.code ||
                            batch.courseId?.code ||
                            "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {batch.startDate && batch.estimatedEndDate ? (
                          <>
                            {new Date(batch.startDate).toLocaleDateString(
                              "vi-VN",
                            )}{" "}
                            →{" "}
                            {new Date(
                              batch.estimatedEndDate,
                            ).toLocaleDateString("vi-VN")}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div>Học: {batch.location || "—"}</div>
                        {(batch.examLocationId?.name || batch.examLocation) && (
                          <div className="mt-1">
                            Thi:{" "}
                            {batch.examLocationId?.name || batch.examLocation}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            batch.learnerCount >= (batch.maxlearners || 30)
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {batch.learnerCount || 0} / {batch.maxlearners || 30}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={batch.status}
                          onChange={async (e) => {
                            try {
                              await apiClient.put(`/batches/${batch._id}`, {
                                status: e.target.value,
                              });
                              loadAllBatches();
                            } catch {
                              showToast("Lỗi cập nhật trạng thái", "error");
                            }
                          }}
                          className={`text-xs rounded-full px-2 py-1 border-0 cursor-pointer ${
                            batch.status === "OPEN"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <option value="OPEN">Mở</option>
                          <option value="CLOSED">Đóng</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenAssignModal(batch)}
                            className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-100"
                            title="Thêm học viên"
                          >
                            + Học viên
                          </button>
                          <button
                            onClick={() => handleAutoEnroll(batch)}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-100"
                            title="Tự động xếp lớp"
                          >
                            <svg
                              className="w-3.5 h-3.5 inline mr-1 -mt-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            Xếp lớp
                          </button>
                          <button
                            onClick={() => setViewingBatch(batch)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
                            title="Xem chi tiết"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditBatch(batch)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Sửa"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              ></path>
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              setBatchDeleteConfirm({
                                open: true,
                                id: batch._id,
                              })
                            }
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Xóa"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 border-t border-slate-200">
                <Pagination
                  currentPage={batchesPage}
                  totalPages={batchesPagination.totalPages}
                  onPageChange={setBatchesPage}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingBatch ? "Sửa lớp học" : "Thêm lớp học mới"}
            </h3>
            <form onSubmit={handleSubmitBatch} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Khoá học
                </label>
                <select
                  required
                  value={batchForm.courseId}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, courseId: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">-- Chọn khoá học --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tên lớp học
                </label>
                <input
                  value={batchForm.name}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="VD: Lớp A1 - Sáng thứ 2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    required
                    min={
                      !editingBatch
                        ? new Date().toISOString().split("T")[0]
                        : undefined
                    }
                    value={batchForm.startDate}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, startDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Ngày kết thúc (dự kiến)
                  </label>
                  <input
                    type="date"
                    required
                    min={
                      batchForm.startDate ||
                      (!editingBatch
                        ? new Date().toISOString().split("T")[0]
                        : undefined)
                    }
                    value={batchForm.estimatedEndDate}
                    onChange={(e) =>
                      setBatchForm({
                        ...batchForm,
                        estimatedEndDate: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <select
                value={batchForm.examLocationId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  // Tìm location trong danh sách
                  const selectedLocation = examLocations.find(
                    (loc) => loc._id === selectedId,
                  );

                  setBatchForm((prev) => ({
                    ...prev,
                    examLocationId: selectedId,
                    // Ưu tiên lấy googleMapUrl, nếu không có thì lấy address, nếu không có nữa thì để trống
                    location: selectedLocation
                      ? selectedLocation.googleMapUrl ||
                        selectedLocation.address ||
                        ""
                      : prev.location,
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">-- Chọn trường sát hạch --</option>
                {examLocations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} - {loc.address}
                  </option>
                ))}
              </select>

              {/* Ô Địa điểm bên dưới */}
              <input
                required
                value={batchForm.location || ""} // Thêm || "" để tránh lỗi controlled/uncontrolled
                onChange={(e) =>
                  setBatchForm({ ...batchForm, location: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="VD: 123 Nguyễn Trãi, Q1, TP.HCM"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Số học viên tối thiểu
                  </label>
                  <input
                    type="number"
                    value={batchForm.minlearners}
                    onChange={(e) =>
                      setBatchForm({
                        ...batchForm,
                        minlearners: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    min={1}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Số học viên tối đa
                  </label>
                  <input
                    type="number"
                    value={batchForm.maxlearners}
                    onChange={(e) =>
                      setBatchForm({
                        ...batchForm,
                        maxlearners: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Trạng thái
                </label>
                <select
                  value={batchForm.status}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, status: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="OPEN">Mở</option>
                  <option value="CLOSED">Đóng</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBatchModal(false);
                    setEditingBatch(null);
                  }}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
                >
                  {editingBatch ? "Cập nhật" : "Tạo lớp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign learner Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Thêm học viên vào lớp
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Lớp: <span className="font-semibold">{assigningBatch?.name}</span>
              <br />
              Khoá học:{" "}
              <span className="font-semibold">
                {assigningBatch?.courseInfo?.name ||
                  assigningBatch?.courseId?.name}
              </span>
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleAssignlearner}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Học viên
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={assignForm.learnerId}
                  onChange={(e) =>
                    setAssignForm((prev) => ({
                      ...prev,
                      learnerId: e.target.value,
                    }))
                  }
                  required
                  disabled={assignLoading}
                >
                  <option value="">-- Chọn học viên --</option>
                  {learners.map((learner) => (
                    <option key={learner._id} value={learner._id}>
                      {learner.fullName} - {learner.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700"
                  disabled={assignLoading}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
                  disabled={assignLoading}
                >
                  {assignLoading ? "Đang thêm..." : "Thêm học viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={courseDeleteConfirm.open}
        onClose={() => setCourseDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Xóa khóa học"
        message="Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác."
        variant="danger"
      />

      <ConfirmDialog
        isOpen={batchDeleteConfirm.open}
        onClose={() => setBatchDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDeleteBatch}
        title="Xóa lớp học"
        message="Bạn có chắc muốn xóa lớp này? Hành động này không thể hoàn tác."
        variant="danger"
      />

      <ConfirmDialog
        isOpen={batchModalDeleteConfirm.open}
        onClose={() => setBatchModalDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDeleteBatchInModal}
        title="Xóa lớp học"
        message="Bạn có chắc muốn xóa lớp này?"
        variant="danger"
        loading={batchLoading}
      />

      <ConfirmDialog
        isOpen={autoEnrollModalParams.isOpen}
        onClose={() => setAutoEnrollModalParams({ isOpen: false, batch: null })}
        onConfirm={confirmAutoEnroll}
        title="Xếp lớp tự động"
        message={`Bạn có chắc chắn muốn hệ thống tự động tìm kiếm và thêm học viên chờ hợp lệ vào lớp ${
          autoEnrollModalParams.batch?.name || "này"
        }?`}
        variant="primary"
      />

      <ConfirmDialog
        isOpen={priceChangeConfirm.open}
        onClose={() => setPriceChangeConfirm({ open: false, payload: null })}
        onConfirm={handleConfirmPriceChange}
        title="Xác nhận đổi học phí"
        message="Bạn có chắc chắn muốn thay đổi học phí của khóa học này? Hệ thống sẽ tự động cập nhật kế hoạch đóng phí cho các học viên CHƯA nộp bất kỳ đợt nào và gửi email thông báo cho họ. Các học viên đã nộp tiền sẽ không bị ảnh hưởng."
        variant="warning"
      />

      {/* Batch Details Modal */}
      <AdminBatchDetailsModal
        isOpen={!!viewingBatch}
        onClose={() => setViewingBatch(null)}
        batch={viewingBatch}
        onLearnerRemoved={loadAllBatches}
      />
      <ConfirmDialog
        isOpen={courseStatusConfirm.open}
        onClose={() => setCourseStatusConfirm({ open: false, course: null })}
        onConfirm={handleToggleCourseStatus}
        title={
          courseStatusConfirm.course?.status === "Active"
            ? "Ẩn khoá học"
            : "Hiện khoá học"
        }
        message={
          courseStatusConfirm.course?.status === "Active"
            ? "Bạn có chắc chắn muốn ẩn khoá học này? Học viên sẽ không thể đăng ký khoá học nếu bị ẩn."
            : "Bạn có chắc chắn muốn hiển thị lại khoá học này?"
        }
        variant={
          courseStatusConfirm.course?.status === "Active" ? "danger" : "primary"
        }
      />
    </div>
  );
};

export default AdminCourses;

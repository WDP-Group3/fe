import { useState, useEffect, useRef } from "react";

// ─── Helper: timezone-safe getDaysDiff (frontend) ────────────────────────────
const getDaysDiff = (dateA, dateB) => {
  const toStartOfDayICT = (d) => {
    const s = new Date(d).toLocaleString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    return new Date(s.substring(0, 10) + 'T00:00:00.000Z');
  };
  const a = toStartOfDayICT(dateA);
  const b = toStartOfDayICT(dateB);
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
};

const DAYS_COLOR_CLASS = {
  safe:   'text-emerald-700',
  warn:   'text-amber-700',
  danger: 'text-red-600',
  safeBg:   'bg-emerald-100 text-emerald-700',
  warnBg:   'bg-amber-100 text-amber-700',
  dangerBg: 'bg-red-100 text-red-700',
};

const getDaysLabel = (diffDays) => {
  if (diffDays < 0) return `Quá hạn ${Math.abs(diffDays)} ngày`;
  if (diffDays === 0) return 'Hết hạn hôm nay';
  return `Còn ${diffDays} ngày`;
};

const getDaysColorClass = (diffDays) => {
  if (diffDays >= 7) return { text: DAYS_COLOR_CLASS.safe,   bg: DAYS_COLOR_CLASS.safeBg };
  if (diffDays >= 1) return { text: DAYS_COLOR_CLASS.warn,   bg: DAYS_COLOR_CLASS.warnBg };
  return                { text: DAYS_COLOR_CLASS.danger, bg: DAYS_COLOR_CLASS.dangerBg };
};
import { useNavigate, useLocation } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import StatusBadge from "../components/ui/StatusBadge";
import DataTable from "../components/ui/DataTable";
import apiClient from "../services/apiClient";
import { formatCurrency } from "../utils/formatters";
import { useAuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useSocket } from "../context/SocketContext";

const Payments = () => {
  const { user, getProfile } = useAuthContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const socket = useSocket();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [tuitionInfo, setTuitionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dueDateSubmitting, setDueDateSubmitting] = useState(false);
  const [showScheduleList, setShowScheduleList] = useState(true);
  const [expandedSchedules, setExpandedSchedules] = useState({});

  const [adminDueDateForm, setAdminDueDateForm] = useState({
    registrationId: "",
    scheduleIndex: "",
    dueDate: "",
    name: "",
    amount: "",
    note: "",
  });

  const [notifyForm, setNotifyForm] = useState({
    userId: "",
    registrationId: "",
    scheduleIndex: "",
    message: "",
  });
  const [notifySubmitting, setNotifySubmitting] = useState(false);

  const [qrForm, setQrForm] = useState({
    amount: "",
  });
  const [creatingQr, setCreatingQr] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState("");
  const [paymentTransferContent, setPaymentTransferContent] = useState("");
  const [selectedRegistrationForQr, setSelectedRegistrationForQr] =
    useState("");
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState("");
  const [currentTransactionId, setCurrentTransactionId] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("idle");
  const [transactions, setTransactions] = useState([]);
  const pollRef = useRef(null);
  const pendingPollRef = useRef(null);
  const autoQrCreatedRef = useRef(false);
  const incomingRegistrationIdRef = useRef("");

  const canCollect = ["ADMIN", "CONSULTANT"].includes(user?.role);
  const islearner = user?.role === "learner" || user?.role === "USER";

  useEffect(() => {
    loadData();
  }, []);

  // Poll for role change after payment (USER → learner)
  const roleCheckRef = useRef(null);
  useEffect(() => {
    if (user?.role !== "USER") {
      // Role đã đổi → dọn interval
      if (roleCheckRef.current) {
        clearInterval(roleCheckRef.current);
        roleCheckRef.current = null;
      }
      return;
    }

    roleCheckRef.current = setInterval(async () => {
      try {
        const updatedUser = await getProfile();
        if (updatedUser?.role === "learner") {
          clearInterval(roleCheckRef.current);
          roleCheckRef.current = null;
          loadData();
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => {
      if (roleCheckRef.current) {
        clearInterval(roleCheckRef.current);
        roleCheckRef.current = null;
      }
    };
  }, [user?.role]);

  // Socket listener: reload data khi thanh toán thành công (từ trang QR)
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handlePaymentSuccess = (data) => {
      console.log('[Payments] Socket payment-success:', data);
      showToast('Thanh toán thành công!', 'success');
      loadData();
    };

    socket.on('payment-success', handlePaymentSuccess);
    return () => socket.off('payment-success', handlePaymentSuccess);
  }, [socket, user?.id]);

  useEffect(() => {
    const incomingRegistration = location.state?.registration;
    if (!incomingRegistration) return;

    const incomingId = String(
      incomingRegistration._id || incomingRegistration.registrationId || "",
    );
    setSelectedRegistrationForQr(incomingId);
    incomingRegistrationIdRef.current = incomingId;
    autoQrCreatedRef.current = false;
  }, [location.state]);

  useEffect(() => {
    if (!islearner) return undefined;

    if (pendingPollRef.current) {
      clearInterval(pendingPollRef.current);
    }

    pendingPollRef.current = setInterval(async () => {
      try {
        const response = await apiClient.get(
          "/payments/transactions?status=pending",
        );
        const pending = response?.data || [];
        const currentPending = transactions.filter(
          (t) => t.status !== "completed",
        );

        if (pending.length !== currentPending.length) {
          await loadData();
        }
      } catch {
        // ignore
      }
    }, 300000); // 5 phút (300000ms)

    return () => {
      if (pendingPollRef.current) {
        clearInterval(pendingPollRef.current);
        pendingPollRef.current = null;
      }
    };
  }, [islearner, transactions]);

  // Khi transaction hoàn thành → reload trang để cập nhật role (USER → learner)
  useEffect(() => {
    if (user?.role !== "USER") return;
    const hasCompleted = transactions.some((t) => t.status === "completed");
    if (hasCompleted) {
      getProfile().then((updated) => {
        if (updated?.role === "learner") {
          showToast("Bạn đã trở thành Học viên!", "success");
          window.location.reload();
        }
      });
    }
  }, [transactions, user?.role]);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
      if (pendingPollRef.current) {
        clearInterval(pendingPollRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsResponse, tuitionResponse, transactionResponse] =
        await Promise.all([
          apiClient.get("/payments"),
          apiClient.get("/payments/tuition-info"),
          apiClient.get("/payments/transactions"),
        ]);

      if (paymentsResponse.status === "success") {
        setPayments(paymentsResponse.data || []);
      }

      if (tuitionResponse.status === "success") {
        const info = tuitionResponse.data;
        setTuitionInfo(info);

        const incomingRegistrationId =
          location.state?.registration?._id ||
          location.state?.registration?.registrationId ||
          "";
        const defaultRegId =
          incomingRegistrationId || info?.items?.[0]?.registrationId || "";
        setAdminDueDateForm((prev) => ({
          ...prev,
          registrationId: prev.registrationId || defaultRegId,
        }));

        if (incomingRegistrationId) {
          setSelectedRegistrationForQr(defaultRegId);

          const target = (info?.items || []).find(
            (item) => item.registrationId === defaultRegId,
          );
          if (target) {
            const schedule = target.paymentSchedule || [];
            if (schedule.length > 0) {
              setSelectedScheduleIndex("0");
              setQrForm((prev) => ({
                ...prev,
                amount: String(schedule[0]?.amount || ""),
              }));
            }
          }
        }
      }

      if (transactionResponse.status === "success") {
        setTransactions(transactionResponse.data || []);
      }
    } catch (err) {
      console.error("Error loading payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminUpsertDueDate = async (e) => {
    e.preventDefault();
    if (!adminDueDateForm.registrationId || !adminDueDateForm.dueDate) {
      showToast("Vui lòng chọn hồ sơ và nhập hạn thanh toán", "error");
      return;
    }

    try {
      setDueDateSubmitting(true);
      await apiClient.post("/payments/upsert-due-date", {
        registrationId: adminDueDateForm.registrationId,
        scheduleIndex:
          adminDueDateForm.scheduleIndex === ""
            ? undefined
            : Number(adminDueDateForm.scheduleIndex),
        dueDate: adminDueDateForm.dueDate,
        name: adminDueDateForm.name,
        amount:
          adminDueDateForm.amount === ""
            ? undefined
            : Number(adminDueDateForm.amount),
        note: adminDueDateForm.note,
      });
      await loadData();
      showToast("Đã cập nhật hạn thanh toán", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Cập nhật hạn thất bại", "error");
    } finally {
      setDueDateSubmitting(false);
    }
  };

  const handleQuickExtend = async (registrationId, scheduleIndex) => {
    const days = window.prompt("Nhập số ngày gia hạn (1-30):", "7");
    if (!days) return;

    const parsedDays = Math.max(1, Math.min(Number(days) || 0, 30));
    if (!parsedDays) {
      showToast("Số ngày không hợp lệ", "error");
      return;
    }

    try {
      setDueDateSubmitting(true);
      await apiClient.post("/payments/upsert-due-date", {
        registrationId,
        scheduleIndex: Number(scheduleIndex),
        dueDate: new Date(
          Date.now() + parsedDays * 24 * 60 * 60 * 1000,
        ).toISOString(),
        note: `Admin gia hạn ${parsedDays} ngày`,
      });
      await loadData();
      showToast("Đã gia hạn hạn thanh toán", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Gia hạn thất bại", "error");
    } finally {
      setDueDateSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    const confirmed = window.confirm("Bạn chắc chắn muốn xóa giao dịch này?");
    if (!confirmed) return;

    try {
      await apiClient.delete(`/payments/${paymentId}`);
      await loadData();
      showToast("Đã xóa giao dịch thành công", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Xóa giao dịch thất bại", "error");
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!notifyForm.userId || !notifyForm.message.trim()) {
      showToast("Vui lòng nhập nội dung thông báo", "error");
      return;
    }

    try {
      setNotifySubmitting(true);
      await apiClient.post("/notifications", {
        type: "OTHER",
        title: "Nhắc đóng học phí",
        message: notifyForm.message.trim(),
        expirationDays: 7,
        userId: notifyForm.userId,
      });

      setNotifyForm({
        userId: "",
        registrationId: "",
        scheduleIndex: "",
        message: "",
      });
      showToast("Đã gửi thông báo đến học viên", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Gửi thông báo thất bại", "error");
    } finally {
      setNotifySubmitting(false);
    }
  };

  const startPollingTransaction = (transactionId) => {
    if (!transactionId) return;

    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    pollRef.current = setInterval(async () => {
      try {
        const statusRes = await apiClient.get(
          `/payments/transaction-status/${transactionId}`,
        );
        const paymentStatus = statusRes?.data?.paymentStatus || "pending";
        setTransactionStatus(paymentStatus);

        if (paymentStatus === "completed") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          await loadData();
          showToast(
            "Thanh toán đã được xác nhận. Hệ thống đã cập nhật học phí và tự động gán lớp (nếu có lớp OPEN).",
            "success",
          );
          if (user?.role === "USER") {
            window.location.reload();
          }
        }
      } catch {
        // ignore
      }
    }, 5000);
  };

  const handleCreateQr = async (e) => {
    e.preventDefault();

    if (!selectedRegistrationForQr || selectedScheduleIndex === "") {
      showToast("Vui lòng chọn khóa học và đợt thanh toán", "error");
      return;
    }

    if (!qrForm.amount || Number(qrForm.amount) <= 0) {
      showToast("Vui lòng nhập số tiền hợp lệ", "error");
      return;
    }

    try {
      setCreatingQr(true);
      setPaymentQrUrl("");
      setPaymentTransferContent("");
      setCurrentTransactionId("");
      setTransactionStatus("pending");

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }

      const response = await apiClient.post("/payments/create-qr", {
        vnp_Amount: Number(qrForm.amount),
        vnp_OrderInfo: `Thanh toan hoc phi ${new Date().toLocaleDateString("vi-VN")}`,
        user: user?._id || user?.id,
        registrationId: selectedRegistrationForQr || undefined,
        scheduleIndex:
          selectedScheduleIndex !== ""
            ? Number(selectedScheduleIndex)
            : undefined,
      });

      const qrUrl = response?.data?.paymentUrl || response?.paymentUrl || "";
      const transferContent = response?.data?.transferContent || "";
      const transactionId = response?.data?.transactionId || "";

      if (qrUrl) {
        setPaymentQrUrl(qrUrl);
        setPaymentTransferContent(transferContent);
        setCurrentTransactionId(transactionId);
        startPollingTransaction(transactionId);

        const selectedItem = (tuitionInfo?.items || []).find(
          (item) => item.registrationId === selectedRegistrationForQr,
        );
        const schedule = selectedItem?.paymentSchedule || [];
        const scheduleItem = schedule[Number(selectedScheduleIndex)] || null;

        navigate("/portal/payments/qr", {
          state: {
            paymentUrl: qrUrl,
            transferContent,
            transactionId,
            amount: Number(qrForm.amount),
            courseName: selectedItem?.courseName || "",
            courseCode: selectedItem?.courseCode || "",
            scheduleName:
              scheduleItem?.name || `Đợt ${Number(selectedScheduleIndex) + 1}`,
            scheduleAmount: scheduleItem?.amount || Number(qrForm.amount),
            scheduleNote: scheduleItem?.note || "",
            registrationId: selectedItem?._id || "",
          },
        });
      } else {
        showToast(
          "Đã tạo QR nhưng không đọc được đường dẫn thanh toán.",
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || "Tạo QR thanh toán thất bại", "error");
    } finally {
      setCreatingQr(false);
    }
  };

  // Auto-create QR for installment 1 when navigating from course registration
  useEffect(() => {
    const incomingId = incomingRegistrationIdRef.current;
    if (!incomingId) return;
    if (!tuitionInfo) return;
    if (creatingQr) return;
    if (autoQrCreatedRef.current) return;

    // Must be installment 1 (index 0)
    if (String(selectedRegistrationForQr || "") !== String(incomingId)) return;
    if (String(selectedScheduleIndex) !== "0") return;
    if (!qrForm.amount || Number(qrForm.amount) <= 0) return;

    // Avoid creating another QR if we already have one in state
    if (paymentQrUrl && currentTransactionId) {
      autoQrCreatedRef.current = true;
      return;
    }

    autoQrCreatedRef.current = true;
    // simulate a form submit without needing the event object
    handleCreateQr({ preventDefault: () => { } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tuitionInfo,
    selectedRegistrationForQr,
    selectedScheduleIndex,
    qrForm.amount,
  ]);

  const handleConfirmTransaction = async (transactionId) => {
    try {
      await apiClient.patch(
        `/payments/transactions/${transactionId}/confirm`,
        {},
      );
      if (currentTransactionId === transactionId) {
        setTransactionStatus("completed");
      }
      await loadData();
      showToast("Đã xác nhận giao dịch thành công", "success");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Xác nhận giao dịch thất bại", "error");
    }
  };

  const columns = [
    { key: "title", title: "Mã GD", dataIndex: "_id" },
    {
      key: "amount",
      title: "Số tiền",
      dataIndex: "amount",
      render: (val) => formatCurrency(val),
    },
    {
      key: "paidAt",
      title: "Ngày thanh toán",
      dataIndex: "paidAt",
      render: (val) =>
        val ? new Date(val).toLocaleDateString("vi-VN") : "Chưa có",
    },
    {
      key: "status",
      title: "Trạng thái",
      dataIndex: "method",
      render: () => <StatusBadge status="paid" label="Đã thu" />,
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (_, row) =>
        canCollect ? (
          <button
            type="button"
            onClick={() => handleDeletePayment(row._id)}
            className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Xóa
          </button>
        ) : null,
    },
  ];

  const scheduleColumns = [
    {
      key: "learnerName",
      title: "Học viên",
      dataIndex: "learnerName",
      render: (val) => val || "—",
    },
    { key: "courseName", title: "Khoá học", dataIndex: "courseName" },
    {
      key: "totalFee",
      title: "Tổng phí",
      dataIndex: "totalFee",
      render: (val) => formatCurrency(val),
    },
    {
      key: "paidAmount",
      title: "Đã đóng",
      dataIndex: "paidAmount",
      render: (val) => formatCurrency(val),
    },
    {
      key: "remaining",
      title: "Còn lại",
      dataIndex: "remaining",
      render: (val, row) => (
        <span
          className={
            row.isOverdue ? "font-semibold text-red-600" : "text-slate-800"
          }
        >
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: "detailToggle",
      title: "Chi tiết",
      render: (_, row) => (
        <button
          type="button"
          onClick={() =>
            setExpandedSchedules((prev) => ({
              ...prev,
              [row.registrationId]: !prev[row.registrationId],
            }))
          }
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
        >
          {expandedSchedules[row.registrationId] ? "-" : "+"}
        </button>
      ),
    },
  ];

  console.log("Tuition Info:", tuitionInfo);
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="HỌC PHÍ"
          description="Xem tổng phí, đã đóng, công nợ còn lại và lịch thanh toán"
        />

        {(() => {
          const hasUnpaidFirstInstallment = (tuitionInfo?.items || []).some(
            (item) => item.paymentSchedule?.[0]?.paymented === false,
          );

          if (hasUnpaidFirstInstallment) {
            return (
              <div className="mb-6 rounded-3xl bg-gradient-to-br from-red-50 to-rose-50 p-6 border border-red-200 shadow-sm">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-inner">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-900 leading-none">
                      Thông báo về học phí và khóa học bạn đang quan tâm
                    </h3>
                    <div className="mt-2 space-y-3">
                      <div className="rounded-2xl bg-white/60 p-4 border border-white shadow-sm">
                        <p className="text-sm font-medium text-slate-800 leading-relaxed">
                          Các khoá học chưa hoàn thành đợt đóng phí đầu tiên đã
                          được áp dụng theo mức học phí mới nhất hoặc sẽ không được hỗ trợ thi từ Trung Tâm.
                          <br />
                          <span className="text-xs text-red-600 mt-1 block font-semibold italic">
                            Lưu ý: Vui lòng đóng phí đợt 1 ngay để chốt giá và
                            giữ chỗ chính thức.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })()}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs font-semibold text-slate-600">TỔNG PHÍ</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatCurrency(tuitionInfo?.totalFee || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">ĐÃ TRẢ</p>
                <p className="mt-1 text-base font-semibold text-emerald-700">
                  {formatCurrency(tuitionInfo?.paidAmount || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">DƯ NỢ</p>
                <p
                  className={`mt-1 text-base font-semibold ${tuitionInfo?.isOverdue ? "text-red-600" : "text-amber-600"}`}
                >
                  {formatCurrency(tuitionInfo?.remaining || 0)}
                </p>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between text-sm">
              <p className="font-semibold text-slate-700">Danh sách khóa học</p>
              <button
                type="button"
                onClick={() => setShowScheduleList((prev) => !prev)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                {showScheduleList ? "-" : "+"}
              </button>
            </div>

            {showScheduleList && (
              <div className="space-y-3">
                <DataTable
                  columns={scheduleColumns}
                  data={tuitionInfo?.items || []}
                />
                {(tuitionInfo?.items || [])
                  .filter((item) => expandedSchedules[item.registrationId])
                  .map((item) => {
                    const schedule = item.paymentSchedule || [];
                    const paidAmount = Number(item.paidAmount || 0);
                    let accumulated = 0;

                    return (
                      <div
                        key={`detail-${item.registrationId}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              Thời gian khóa học
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                              {item.courseStartDate
                                ? new Date(
                                  item.courseStartDate,
                                ).toLocaleDateString("vi-VN")
                                : "Chưa có"}{" "}
                              →{" "}
                              {item.courseEndDate
                                ? new Date(
                                  item.courseEndDate,
                                ).toLocaleDateString("vi-VN")
                                : "Chưa có"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-slate-500">
                              Học viên
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                              {item.learnerName || "—"}
                            </p>
                          </div>
                        </div>

                        {schedule.length === 0 ? (
                          <p className="mt-3 text-xs text-slate-500">
                            Chưa có lịch đóng phí.
                          </p>
                        ) : (
                          <div className="mt-3 grid gap-2">
                            {schedule.map((scheduleItem, idx) => {
                              const installmentAmount = Number(
                                scheduleItem?.amount || 0,
                              );
                              const paidForInstallment = Math.min(
                                Math.max(paidAmount - accumulated, 0),
                                installmentAmount,
                              );
                              const remainingForInstallment = Math.max(
                                installmentAmount - paidForInstallment,
                                0,
                              );
                              const isPaid = remainingForInstallment === 0;

                              accumulated += installmentAmount;

                              return (
                                <div
                                  key={`${item.registrationId}-schedule-${idx}`}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3 py-2"
                                >
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {scheduleItem?.name || `Đợt ${idx + 1}`}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {idx === 0 && item.registrationDate
                                        ? `Ngày đăng ký: ${new Date(item.registrationDate).toLocaleDateString("vi-VN")}${scheduleItem?.dueDate ? ` | Hạn: ${new Date(scheduleItem.dueDate).toLocaleDateString("vi-VN")}` : ''}`
                                        : `Hạn nộp: ${scheduleItem?.dueDate ? new Date(scheduleItem.dueDate).toLocaleDateString("vi-VN") : "Chưa có"}`}
                                    </p>
                                    {scheduleItem?.note && (
                                      <p className="text-xs text-slate-500">
                                        Ghi chú: {scheduleItem.note}
                                      </p>
                                    )}
                                    {!isPaid && scheduleItem?.dueDate && (
                                      (() => {
                                        const diffDays = getDaysDiff(scheduleItem.dueDate, new Date());
                                        const { text, bg } = getDaysColorClass(diffDays);
                                        return (
                                          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${bg}`}>
                                            {getDaysLabel(diffDays)}
                                          </span>
                                        );
                                      })()
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-right">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {isPaid
                                          ? formatCurrency(installmentAmount)
                                          : <span className="text-red-600">{formatCurrency(remainingForInstallment)}</span>}
                                        {!isPaid && (
                                          <span className="text-xs font-normal text-slate-400 ml-1">
                                            / {formatCurrency(installmentAmount)}
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Đã đóng:{" "}
                                        {formatCurrency(paidForInstallment)}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Còn lại:{" "}
                                        {formatCurrency(
                                          remainingForInstallment,
                                        )}
                                      </p>
                                      <span
                                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                                      >
                                        {isPaid ? "Đã đóng" : "Chưa đóng"}
                                      </span>
                                    </div>
                                    {!isPaid && canCollect && (
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleQuickExtend(
                                              item.registrationId,
                                              idx,
                                            )
                                          }
                                          className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                        >
                                          Gia hạn
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setNotifyForm({
                                              userId: item.learnerId,
                                              registrationId:
                                                item.registrationId,
                                              scheduleIndex: idx,
                                              message: `Nhắc đóng ${scheduleItem?.name || `Đợt ${idx + 1}`} cho khóa ${item.courseName}. Còn thiếu ${formatCurrency(remainingForInstallment)}.`,
                                            });
                                          }}
                                          className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                                        >
                                          Thông báo
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {canCollect && (
                              <form
                                onSubmit={handleSendNotification}
                                className="mt-3 grid gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs"
                              >
                                <p className="text-xs font-semibold text-indigo-700">
                                  Gửi thông báo nhắc đóng
                                </p>
                                <textarea
                                  rows={2}
                                  placeholder="Nội dung thông báo"
                                  className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-xs"
                                  value={
                                    notifyForm.registrationId ===
                                      item.registrationId
                                      ? notifyForm.message
                                      : ""
                                  }
                                  onChange={(e) =>
                                    setNotifyForm((prev) => ({
                                      ...prev,
                                      userId: item.learnerId,
                                      registrationId: item.registrationId,
                                      message: e.target.value,
                                    }))
                                  }
                                />
                                <button
                                  type="submit"
                                  disabled={
                                    notifySubmitting ||
                                    notifyForm.registrationId !==
                                    item.registrationId
                                  }
                                  className="w-full rounded-full bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                  {notifySubmitting
                                    ? "Đang gửi..."
                                    : "Gửi thông báo"}
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>

      {islearner && (
        <>
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
            <SectionHeader
              title="Thanh toán qua QR"
              description="Chọn khóa học và đợt đóng phí cố định"
            />
            <form
              onSubmit={handleCreateQr}
              className="grid gap-3 md:grid-cols-2"
            >
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={selectedRegistrationForQr}
                onChange={(e) => {
                  setSelectedRegistrationForQr(e.target.value);
                  setSelectedScheduleIndex("");
                  setQrForm((prev) => ({ ...prev, amount: "" }));
                }}
              >
                <option value="">-- Chọn khóa học --</option>
                {(tuitionInfo?.items || []).map((item) => (
                  <option key={item.registrationId} value={item.registrationId}>
                    [{item.courseCode || "N/A"}] {item.courseName} - Còn nợ{" "}
                    {formatCurrency(item.remaining)}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={selectedScheduleIndex}
                onChange={(e) => {
                  const index = e.target.value;
                  setSelectedScheduleIndex(index);

                  const selectedItem = (tuitionInfo?.items || []).find(
                    (item) => item.registrationId === selectedRegistrationForQr,
                  );
                  const schedule = selectedItem?.paymentSchedule || [];
                  const paidAmount = Number(selectedItem?.paidAmount || 0);

                  // Tính số tiền còn nợ của đợt được chọn
                  let acc = 0;
                  for (let i = 0; i < Number(index); i++) {
                    acc += Number(schedule[i]?.amount || 0);
                  }
                  const instAmt = Number(schedule[Number(index)]?.amount || 0);
                  // remaining = max(0, instAmt - max(0, paidAmount - acc))
                  const remaining = Math.max(instAmt - Math.max(paidAmount - acc, 0), 0);

                  setQrForm((prev) => ({ ...prev, amount: remaining > 0 ? String(remaining) : "" }));
                }}
                disabled={!selectedRegistrationForQr}
              >
                <option value="">-- Chọn đợt thanh toán --</option>
                {(() => {
                  const selectedItem = (tuitionInfo?.items || []).find(
                    (item) => item.registrationId === selectedRegistrationForQr,
                  );
                  const schedule = selectedItem?.paymentSchedule || [];
                  const paidAmount = Number(selectedItem?.paidAmount || 0);

                  let accumulated = 0;
                  const installmentAmounts = schedule.map((item) => {
                    const instAmt = Number(item?.amount || 0);
                    const paidForInst = Math.min(Math.max(paidAmount - accumulated, 0), instAmt);
                    const remaining = Math.max(instAmt - paidForInst, 0);
                    accumulated += instAmt;
                    return remaining;
                  });

                  if (installmentAmounts.every((amt) => amt === 0)) {
                    return (
                      <option value="" disabled>
                        Đã hoàn tất thanh toán
                      </option>
                    );
                  }

                  return schedule.map((scheduleItem, idx) => {
                    const remaining = installmentAmounts[idx];
                    if (remaining === 0) return null;
                    return (
                      <option
                        key={`${selectedRegistrationForQr}-${idx}`}
                        value={idx}
                      >
                        {scheduleItem?.name || `Đợt ${idx + 1}`}{" "}
                        {remaining < (Number(scheduleItem?.amount) || 0)
                          ? `- Còn nợ ${formatCurrency(remaining)} / ${formatCurrency(Number(scheduleItem?.amount) || 0)}`
                          : `- ${formatCurrency(remaining)}`}
                      </option>
                    );
                  });
                })()}
              </select>
              <input
                type="number"
                min="1000"
                placeholder="Số tiền theo đợt"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={qrForm.amount}
                onChange={(e) =>
                  setQrForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                required
                readOnly
              />
              <button
                type="submit"
                disabled={creatingQr}
                className="md:col-span-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {creatingQr ? "Đang tạo QR..." : "Tạo QR thanh toán"}
              </button>
            </form>

            {paymentQrUrl && (
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm">
                <p className="font-semibold text-indigo-900">
                  Link thanh toán đã tạo
                </p>
                <a
                  href={paymentQrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-indigo-700 underline"
                >
                  {paymentQrUrl}
                </a>
                {paymentTransferContent && (
                  <p className="mt-2 text-xs text-slate-700">
                    Nội dung chuyển khoản (bắt buộc đúng):
                    <span className="ml-1 rounded bg-white px-2 py-1 font-semibold text-indigo-700">
                      {paymentTransferContent}
                    </span>
                  </p>
                )}
                {currentTransactionId && (
                  <p className="mt-2 text-xs text-slate-700">
                    Trạng thái giao dịch:
                    <span
                      className={`ml-1 rounded px-2 py-1 font-semibold ${transactionStatus === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {transactionStatus === "completed"
                        ? "Đã thanh toán"
                        : "Chờ thanh toán"}
                    </span>
                  </p>
                )}
                <div className="mt-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentQrUrl)}`}
                    alt="QR thanh toán"
                    className="h-40 w-40 rounded-lg border border-slate-200 bg-white p-2"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {canCollect && (
        <>
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
            <SectionHeader
              title="Gia Hạn Thanh Toán Học Phí"
              description="Admin/Sale chỉnh hạn từng đợt hoặc thêm đợt mới"
            />
            <form
              onSubmit={handleAdminUpsertDueDate}
              className="grid gap-3 md:grid-cols-2"
            >
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.registrationId}
                onChange={(e) =>
                  setAdminDueDateForm((prev) => ({
                    ...prev,
                    registrationId: e.target.value,
                  }))
                }
                required
              >
                <option value="">-- Chọn khóa học --</option>
                {(tuitionInfo?.items || []).map((item) => (
                  <option key={item.registrationId} value={item.registrationId}>
                    {item.learnerName ? `${item.learnerName} - ` : ""}[
                    {item.courseCode || "N/A"}] {item.courseName}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.dueDate}
                onChange={(e) =>
                  setAdminDueDateForm((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                required
              />
              <input
                type="number"
                min="0"
                placeholder="Index đợt (để trống = add mới)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.scheduleIndex}
                onChange={(e) =>
                  setAdminDueDateForm((prev) => ({
                    ...prev,
                    scheduleIndex: e.target.value,
                  }))
                }
              />
              <input
                placeholder="Tên đợt"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.name}
                onChange={(e) =>
                  setAdminDueDateForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
              <input
                type="number"
                placeholder="Số tiền đợt"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.amount}
                onChange={(e) =>
                  setAdminDueDateForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
              />
              <input
                placeholder="Ghi chú"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={adminDueDateForm.note}
                onChange={(e) =>
                  setAdminDueDateForm((prev) => ({
                    ...prev,
                    note: e.target.value,
                  }))
                }
              />
              <button
                type="submit"
                disabled={dueDateSubmitting}
                className="md:col-span-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                {dueDateSubmitting ? "Đang cập nhật..." : "Lưu hạn thanh toán"}
              </button>
            </form>
          </div>
        </>
      )}

      {canCollect && (
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <SectionHeader
            title="Xác nhận giao dịch SePay"
            description="Danh sách giao dịch đang chờ xác nhận"
          />
          {transactions.filter((t) => t.status !== "completed").length === 0 ? (
            <div className="py-4 text-sm text-slate-500">
              Không có giao dịch chờ xác nhận.
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {transactions
                .filter((t) => t.status !== "completed")
                .map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {formatCurrency(t.amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.transferContent} ·{" "}
                        {new Date(t.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConfirmTransaction(t._id)}
                      className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Xác nhận
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Lịch sử giao dịch"
          description="Các lần thanh toán đã ghi nhận"
        />
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            Chưa có giao dịch nào
          </div>
        ) : (
          <DataTable columns={columns} data={payments} />
        )}
      </div>
    </div>
  );
};

export default Payments;

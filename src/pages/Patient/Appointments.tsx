import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
} from "@heroui/react";
import toast from "react-hot-toast";

import { appointmentApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import CancelAppointmentModal from "@/components/Patient/CancelAppointmentModal";
import { DateRangePicker, RescheduleAppointmentModal, ChangeDoctorModal } from "@/components/Common";

interface Appointment {
  id: string;
  status: string;
  type: string;
  mode: string;
  patientName: string;
  doctorName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  notes?: string;
  paymentStatus?: string;
  appointmentFor: string;
  customerName?: string;
  customerEmail?: string; // ⭐ THÊM: Email của customer
  paymentId?: {
    status: string;
    amount: number;
    method: string;
  };
}

const Appointments = () => {
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{startDate: string | null, endDate: string | null}>({
    startDate: null,
    endDate: null
  });
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [rescheduleFor, setRescheduleFor] = useState<Appointment | null>(null);
  const [changeDoctorFor, setChangeDoctorFor] = useState<Appointment | null>(null);

  // Fetch user appointments
  const refetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await appointmentApi.getMyAppointments({ includePendingPayment: true });

      if (!res) {
        console.error("❌ Response is null or undefined");
        setError("Không nhận được dữ liệu từ server");
        setAppointments([]);

        return;
      }

      if (res.success === false) {
        console.error("❌ API returned success=false:", res.message);
        setError(res.message || "Lỗi lấy danh sách ca khám");
        setAppointments([]);

        return;
      }

      if (!res.data) {
        console.error("❌ Response has no data field");
        setError("Dữ liệu không hợp lệ");
        setAppointments([]);

        return;
      }

      if (!Array.isArray(res.data)) {
        console.error("❌ res.data is not an array:", res.data);
        setError("Dữ liệu không hợp lệ (không phải mảng)");
        setAppointments([]);

        return;
      }

      if (res.data.length === 0) {
        setAppointments([]);

        return;
      }

      // Map backend response to frontend interface
      const mappedAppointments: Appointment[] = res.data.map(
        (apt: any, _index: number) => {

          return {
            id: apt._id,
            status: apt.status,
            type: apt.type,
            mode: apt.mode,
            patientName: apt.patientUserId?.fullName || "",
            doctorName: apt.doctorUserId?.fullName || "",
            serviceName: apt.serviceId?.serviceName || "",
            startTime: apt.timeslotId?.startTime || "",
            endTime: apt.timeslotId?.endTime || "",
            notes: apt.notes || "",
            paymentStatus: apt.paymentId?.status || "",
            appointmentFor: apt.appointmentFor || "self",
            customerName: apt.customerId?.fullName || "",
            customerEmail: apt.customerId?.email || "",
            paymentId: apt.paymentId ? {
              status: apt.paymentId.status,
              amount: apt.paymentId.amount,
              method: apt.paymentId.method,
            } : undefined,
          };
        },
      );

      // Debug log để kiểm tra dữ liệu
      console.log('🔍 [Appointments] Mapped appointments:', mappedAppointments.map(apt => ({
        id: apt.id,
        appointmentFor: apt.appointmentFor,
        customerName: apt.customerName,
        customerEmail: apt.customerEmail
      })));

      setAppointments(mappedAppointments);
      setError(null);
    } catch (err: any) {
      console.error("❌ Error fetching appointments:", err);
      console.error("❌ Error message:", err.message);
      console.error("❌ Error stack:", err.stack);
      setError(err.message || "Lỗi khi tải ca khám");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔍 [useEffect] isAuthenticated changed:", isAuthenticated);
    if (!isAuthenticated) {
      console.log("⚠️ Not authenticated, skipping fetch");
      setAppointments([]);

      return;
    }

    console.log("✅ Authenticated, fetching appointments");
    refetchAppointments();
  }, [isAuthenticated]);

  const getStatusText = (status: string): string => {
    switch (status) {
      case "Pending":
        return "Chờ duyệt";
      case "Approved":
        return "Đã xác nhận";
      case "CheckedIn":
        return "Đã nhận";
      case "Completed":
        return "Đã hoàn thành";
      case "Cancelled":
        return "Đã hủy";
      case "PendingPayment":
        return "Chờ thanh toán";
      default:
        return status;
    }
  };

  const formatPaymentInfo = (
    appointment: Appointment,
  ): { text: string; color: string } => {
    if (appointment.type === "Examination") {
      return {
        text: "Thanh toán tại phòng khám",
        color: "text-gray-500",
      };
    }

    if (appointment.type === "Consultation") {
      if (
        appointment.paymentId &&
        appointment.paymentId.status === "Completed"
      ) {
        return {
          text: `${appointment.paymentId.amount.toLocaleString("vi-VN")} VNĐ`,
          color: "text-green-600 font-semibold",
        };
      }

      if (
        appointment.paymentId &&
        appointment.paymentId.status === "Pending"
      ) {
        return {
          text: `Chưa thanh toán (${appointment.paymentId.amount.toLocaleString("vi-VN")} VNĐ)`,
          color: "text-orange-600 font-semibold",
        };
      }

      return {
        text: "Chưa thanh toán",
        color: "text-red-600 font-semibold",
      };
    }

    return {
      text: "N/A",
      color: "text-gray-400",
    };
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);

    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  // Hàm xử lý hủy ca khám với logic khác nhau cho Examination/Consultation
  const handleCancelAppointment = async (appointment: Appointment) => {
    try {
      // Không bật loading toàn trang khi mở popup
      // Gọi API hủy ca khám
      const response = await appointmentApi.cancelAppointment(appointment.id);
      
      if (response.data?.requiresConfirmation) {
        // Nếu là Consultation, hiển thị modal xác nhận với policies
        setAppointmentToCancel(appointment);
        setPolicies(response.data.policies || []);
        setIsCancelModalOpen(true);
      } else {
        // Nếu là Examination, hủy trực tiếp
        toast.success("Đã hủy lịch khám thành công");
        refetchAppointments();
      }
    } catch (error: any) {
      console.error('Error canceling appointment:', error);
      toast.error(error.message || "Không thể hủy lịch hẹn");
    }
  };

  // Hàm xác nhận hủy lịch tư vấn (sau khi hiển thị popup)
  const handleConfirmCancel = async (
    confirmed: boolean, 
    cancelReason?: string,
    bankInfo?: {
      accountHolderName: string;
      accountNumber: string;
      bankName: string;
    }
  ) => {
    if (!appointmentToCancel) return;

    try {
      if (confirmed) {
        await appointmentApi.confirmCancelAppointment(
          appointmentToCancel.id, 
          true, 
          cancelReason,
          bankInfo
        );
        toast.success("Đã hủy lịch tư vấn thành công");
      refetchAppointments();
      }
      
      setIsCancelModalOpen(false);
      setAppointmentToCancel(null);
      setPolicies([]);
    } catch (error: any) {
      console.error('Error confirming cancellation:', error);
      toast.error(error.message || "Không thể xác nhận hủy lịch hẹn");
    }
  };

  const currentAppointments = appointments.filter((apt) => {
    // Kiểm tra xem startTime có hợp lệ không
    if (!apt.startTime) {
      return false;
    }

    try {
      const aptDate = new Date(apt.startTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Nếu startTime invalid, không hiển thị
      if (isNaN(aptDate.getTime())) {
        return false;
      }

      // Filter theo tab (Sắp tới / Đã khám)
      let tabMatch = false;
      if (activeTab === "upcoming") {
        tabMatch = aptDate >= today;
      } else if (activeTab === "completed") {
        tabMatch = aptDate < today;
      }

      if (!tabMatch) {
        return false;
      }

      // Filter theo status
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && apt.status !== "Pending") return false;
        if (statusFilter === "approved" && apt.status !== "Approved") return false;
        if (statusFilter === "checkedIn" && apt.status !== "CheckedIn") return false;
        if (statusFilter === "completed" && apt.status !== "Completed") return false;
        if (statusFilter === "cancelled" && apt.status !== "Cancelled") return false;
        if (statusFilter === "pendingPayment" && apt.status !== "PendingPayment") return false;
      }

      // Filter theo date range
      if (dateRange.startDate || dateRange.endDate) {
        const aptDateStr = aptDate.toISOString().split('T')[0];
        
        if (dateRange.startDate && aptDateStr < dateRange.startDate) {
          return false;
        }
        if (dateRange.endDate && aptDateStr > dateRange.endDate) {
          return false;
        }
      }

      // Filter theo ngày (fallback cho dateFilter cũ)
      if (dateFilter !== "all") {
        const now = new Date();
        const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateFilter === "today") {
          if (aptDateOnly.getTime() !== todayOnly.getTime()) return false;
        } else if (dateFilter === "tomorrow") {
          const tomorrow = new Date(todayOnly);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (aptDateOnly.getTime() !== tomorrow.getTime()) return false;
        } else if (dateFilter === "thisWeek") {
          const weekStart = new Date(todayOnly);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          if (aptDate < weekStart || aptDate > weekEnd) return false;
        } else if (dateFilter === "thisMonth") {
          if (aptDate.getMonth() !== now.getMonth() || aptDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // Filter theo search term với tìm kiếm một phần
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase().trim();
        
        // Tạo function tìm kiếm một phần với nhiều cách
        const partialSearch = (text: string, searchTerm: string) => {
          if (!text || typeof text !== 'string') {
        return false;
      }

          // Normalize text để xử lý ký tự đặc biệt
          const normalizeText = (str: string) => {
            return str.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
              .replace(/đ/g, 'd')
              .replace(/Đ/g, 'D');
          };
          
          const textNormalized = normalizeText(text);
          const searchNormalized = normalizeText(searchTerm);
          
          // Tìm kiếm chính xác với text đã normalize
          if (textNormalized.includes(searchNormalized)) {
            return true;
          }
          
          // Tìm kiếm từng từ riêng lẻ với text đã normalize
          const searchWords = searchNormalized.split(/\s+/).filter((word: string) => word.length > 0);
          const textWords = textNormalized.split(/\s+/);
          
          // Kiểm tra xem tất cả từ tìm kiếm có xuất hiện trong text không
          return searchWords.every((searchWord: string) => 
            textWords.some((textWord: string) => textWord.includes(searchWord))
          );
        };
        
        // Áp dụng tìm kiếm một phần cho từng trường
        const doctorMatch = apt.doctorName && partialSearch(apt.doctorName, searchLower);
        const serviceMatch = apt.serviceName && partialSearch(apt.serviceName, searchLower);
        const notesMatch = apt.notes && partialSearch(apt.notes, searchLower);
        
        if (!doctorMatch && !serviceMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    } catch (_err) {
      return false;
    }
  });

  const columns = [
    { key: "date", label: "Ngày, tháng, năm" },
    { key: "time", label: "Giờ bắt đầu" },
    { key: "endTime", label: "Giờ kết thúc" },
    { key: "doctor", label: "Bác sĩ" },
    { key: "service", label: "Dịch vụ" },
    { key: "bookedFor", label: "Đặt lịch cho ai" }, // ⭐ THÊM: Cột "Đặt lịch cho ai"
    { key: "payment", label: "Thanh toán" }, // ⭐ THÊM: Cột "Thanh toán"
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hoạt động" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Vui lòng đăng nhập để xem ca khám</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Spinner color="primary" label="Đang tải ca khám..." />
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Ca khám của tôi</h1>
              <p className="text-gray-600 mt-1">
                Quản lý và theo dõi các cuộc hẹn khám bệnh của bạn
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {rescheduleFor && (
          <RescheduleAppointmentModal
            appointmentId={rescheduleFor.id}
            currentStartTime={rescheduleFor.startTime}
            currentEndTime={rescheduleFor.endTime}
            onClose={() => setRescheduleFor(null)}
            onSuccess={() => {
              setRescheduleFor(null);
              toast.success("Yêu cầu đổi lịch hẹn đã được gửi thành công!");
            }}
          />
        )}
        {changeDoctorFor && (
          <ChangeDoctorModal
            appointmentId={changeDoctorFor.id}
            currentStartTime={changeDoctorFor.startTime}
            currentEndTime={changeDoctorFor.endTime}
            serviceName={changeDoctorFor.serviceName}
            currentDoctorName={changeDoctorFor.doctorName}
            onClose={() => setChangeDoctorFor(null)}
            onSuccess={() => {
              setChangeDoctorFor(null);
              toast.success("Yêu cầu đổi bác sĩ đã được gửi thành công!");
            }}
          />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Sắp tới</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === "Approved" || apt.status === "Pending" || apt.status === "CheckedIn").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === "Completed").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Đã nhận</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === "CheckedIn").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Chờ thanh toán</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === "PendingPayment").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm một phần: 'Hải', 'nha khoa', 'khám răng'..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã xác nhận</option>
                <option value="checkedIn">Đã nhận</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="pendingPayment">Chờ thanh toán</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="lg:w-64">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateChange={(startDate, endDate) => setDateRange({startDate, endDate})}
                placeholder="Chọn khoảng thời gian"
              />
            </div>

            {/* Clear Filters */}
            <button
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
                setDateRange({startDate: null, endDate: null});
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>


        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6 w-full">
          <div className="flex border-b border-gray-200 w-full">
            <button
              className={`flex-1 px-8 py-5 text-center text-lg font-semibold transition-all duration-200 ${
                activeTab === "upcoming"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              onClick={() => {
                setActiveTab("upcoming");
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg">Sắp tới</span>
              </div>
            </button>
            <button
              className={`flex-1 px-8 py-5 text-center text-lg font-semibold transition-all duration-200 ${
                activeTab === "completed"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              onClick={() => {
                setActiveTab("completed");
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg">Đã khám</span>
              </div>
            </button>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <Table className="w-full table-fixed min-w-[1200px]" aria-label="Appointments table">
            <TableHeader columns={columns}>
              {(column) => (
                  <TableColumn key={column.key} className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.key === 'date' ? 'w-32' :
                    column.key === 'startTime' ? 'w-24' :
                    column.key === 'endTime' ? 'w-24' :
                    column.key === 'doctor' ? 'w-40' :
                    column.key === 'service' ? 'w-48' :
                    column.key === 'patient' ? 'w-48' :
                    column.key === 'payment' ? 'w-40' :
                    column.key === 'status' ? 'w-32' :
                    column.key === 'actions' ? 'w-64' : 'w-auto'
                  }`}>
                    {column.label}
                  </TableColumn>
              )}
            </TableHeader>
            <TableBody
                emptyContent={
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không có ca khám</h3>
                    <p className="mt-1 text-sm text-gray-500">Bạn chưa có cuộc hẹn nào trong danh mục này.</p>
                  </div>
                }
              items={currentAppointments}
            >
              {(appointment) => (
                  <TableRow key={appointment.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="px-4 py-4 whitespace-nowrap w-32">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(appointment.startTime)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap w-24">
                      <div className="text-sm text-gray-900">
                        {formatTime(appointment.startTime)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap w-24">
                      <div className="text-sm text-gray-900">
                        {formatTime(appointment.endTime)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap w-40">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.doctorName}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap w-48">
                      <div className="text-sm text-gray-900">
                        {appointment.serviceName}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap w-48">
                    {appointment.appointmentFor === 'other' && appointment.customerName && appointment.customerEmail ? (
                      <div className="text-sm">
                          <p className="font-medium text-gray-900">
                          {appointment.customerName}
                        </p>
                        <p className="text-gray-500">
                          {appointment.customerEmail}
                        </p>
                      </div>
                    ) : (
                        <p className="text-sm text-gray-900">Bản thân</p>
                    )}
                  </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap w-40">
                      <div className="text-sm">
                        <p className={`font-medium ${formatPaymentInfo(appointment).color}`}>
                          {formatPaymentInfo(appointment).text}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap w-32">
                    <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : appointment.status === "PendingPayment"
                              ? "bg-orange-100 text-orange-800"
                                : appointment.status === "Completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : appointment.status === "Cancelled"
                                    ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getStatusText(appointment.status)}
                    </span>
                  </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-64">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Đổi lịch hẹn - chỉ hiển thị khi có thể thay đổi */}
                        {(appointment.status === "Pending" || appointment.status === "Approved") && (
                        <button
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Đổi lịch hẹn"
                          onClick={() => {
                              setRescheduleFor(appointment);
                          }}
                        >
                            Đổi lịch
                        </button>
                        )}

                        {/* Đổi bác sĩ - chỉ hiển thị khi có thể thay đổi */}
                        {(appointment.status === "Pending" || appointment.status === "Approved") && (
                          <button
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                            title="Đổi bác sĩ"
                            onClick={() => {
                              setChangeDoctorFor(appointment);
                            }}
                          >
                            Đổi bác sĩ
                          </button>
                        )}

                        {/* Hủy cuộc hẹn - chỉ hiển thị khi có thể hủy */}
                        {(appointment.status === "Pending" || appointment.status === "Approved" || appointment.status === "PendingPayment") && (
                          <button
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Hủy cuộc hẹn"
                            onClick={() => handleCancelAppointment(appointment)}
                            disabled={loading}
                          >
                            Hủy lịch hẹn
                          </button>
                        )}

                        {/* Xem hóa đơn - chỉ hiển thị khi đã hoàn thành */}
                        {appointment.status === "Completed" && (
                          <button
                            className="p-2.5 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                            title="Xem hóa đơn"
                            onClick={() => {
                              // TODO: Navigate to invoice/bill page
                              console.log("View invoice for appointment:", appointment.id);
                            }}
                          >
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}

                        {/* Thanh toán - chỉ hiển thị khi chờ thanh toán */}
                        {appointment.status === "PendingPayment" && (
                          <button
                            className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md text-xs font-medium hover:bg-orange-200 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                            title="Thanh toán"
                            onClick={() => {
                              console.log("Pay for appointment:", appointment.id);
                            }}
                          >
                            Thanh toán
                          </button>
                        )}
                      </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {/* Results info */}
          {currentAppointments.length > 0 && (
            <div className="px-6 py-6 border-t border-gray-200 bg-gray-50 rounded-b-xl w-full">
              <div className="flex items-center justify-between">
              <p className="text-base text-gray-600">
                  Hiển thị <span className="font-medium">1</span> đến{" "}
                  <span className="font-medium">{currentAppointments.length}</span> trong{" "}
                  <span className="font-medium">{currentAppointments.length}</span> kết quả
                </p>
                <div className="flex items-center space-x-2 text-base text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Tổng cộng {appointments.length} cuộc hẹn</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Appointment Modal */}
      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setAppointmentToCancel(null);
          setPolicies([]);
        }}
        appointment={appointmentToCancel}
        policies={policies}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
};

export default Appointments;

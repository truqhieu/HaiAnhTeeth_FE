import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Chip,
  Tabs,
  Tab,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
} from "@heroui/react";
import { 
  MagnifyingGlassIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { appointmentApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/Common";
import toast from "react-hot-toast";
// ===== Interface định nghĩa =====
interface Appointment {
  id: string;
  status: string;
  patientName: string;
  doctorName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  checkedInAt: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Chi tiết appointment cho modal
interface AppointmentDetailData {
  _id: string;
  status: string;
  type: string;
  mode: string;
  service?: { serviceName?: string; price?: number } | null;
  doctor?: { fullName?: string } | null;
  patient?: { fullName?: string } | null;
  timeslot?: { startTime?: string; endTime?: string } | null;
  bankInfo?: {
    accountHolderName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
  } | null;
  cancelReason?: string | null;
}

// ===== Component chính =====
const AllAppointments = () => {
  const { isAuthenticated, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Cancel Modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [activeTab, setActiveTab] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Danh sách unique doctors
  const [doctors, setDoctors] = useState<string[]>([]);

  // Detail modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<AppointmentDetailData | null>(null);

  // ===== Hàm lấy tất cả bác sĩ =====
  const fetchAllDoctors = async () => {
    try {
      const res = await appointmentApi.getAllDoctors();
      if (res.success && res.data) {
        const doctorNames = res.data.map(doctor => doctor.fullName);
        setDoctors(doctorNames);
      }
    } catch (err: any) {
      console.error("Error fetching all doctors:", err);
      // Fallback: lấy từ appointments nếu API lỗi
    }
  };

  // ===== Hàm lấy tất cả ca khám =====
  const refetchAllAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const res: ApiResponse<any[]> = await appointmentApi.getAllAppointments();

      console.log('🔍 getAllAppointments API response:', {
        success: res.success,
        dataType: Array.isArray(res.data) ? 'array' : typeof res.data,
        dataLength: res.data?.length || 0,
        data: res.data
      });

      if (res.success && res.data && Array.isArray(res.data)) {
        const allMapped: Appointment[] = res.data.map((apt) => {
          let patientName = "N/A";

          if (apt.customerId && typeof apt.customerId === "object" && apt.customerId.fullName) {
            patientName = apt.customerId.fullName;
          } else if (apt.patientUserId && typeof apt.patientUserId === "object" && apt.patientUserId.fullName) {
            patientName = apt.patientUserId.fullName;
          }

          return {
            id: apt._id,
            status: apt.status,
            patientName: patientName,
            doctorName: apt.doctorUserId?.fullName || "N/A",
            serviceName: apt.serviceId?.serviceName || "N/A",
            startTime: apt.timeslotId?.startTime || "",
            endTime: apt.timeslotId?.endTime || "",
            checkedInAt: apt.checkedInAt || "",
            createdAt: apt.createdAt || "",
          };
        });

        setAppointments(allMapped);
        setFilteredAppointments(allMapped);
      } else {
        console.error("API Response:", res);
        if (res.data && !Array.isArray(res.data)) {
          setError(`Lỗi: API trả về dữ liệu không đúng định dạng. Expected array, got ${typeof res.data}`);
        } else {
          setError(res.message || "Lỗi lấy danh sách ca khám");
        }
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Lỗi khi tải ca khám");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllDoctors(); // Lấy tất cả bác sĩ trước
      refetchAllAppointments();
    }
  }, [isAuthenticated]);

  // ===== Filter appointments =====
  useEffect(() => {
    let filtered = [...appointments];

    // Ẩn các ca 'PendingPayment' và 'Expired' khỏi màn Staff
    filtered = filtered.filter(
      (apt) => apt.status !== "PendingPayment" && apt.status !== "Expired"
    );

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter(apt => apt.status === activeTab);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(apt => 
        apt.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
        apt.serviceName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by doctor
    if (selectedDoctor !== "all") {
      filtered = filtered.filter(apt => apt.doctorName === selectedDoctor);
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.startTime);
        const startDate = new Date(dateRange.startDate!);
        const endDate = new Date(dateRange.endDate!);
        
        // Set time to start of day for comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        return aptDate >= startDate && aptDate <= endDate;
      });
    } else if (dateRange.startDate) {
      // Only start date selected
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.startTime);
        const startDate = new Date(dateRange.startDate!);
        startDate.setHours(0, 0, 0, 0);
        return aptDate >= startDate;
      });
    } else if (dateRange.endDate) {
      // Only end date selected
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.startTime);
        const endDate = new Date(dateRange.endDate!);
        endDate.setHours(23, 59, 59, 999);
        return aptDate <= endDate;
      });
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [searchText, selectedDoctor, dateRange, activeTab, appointments]);

  // ===== Open Cancel Modal =====
  const openCancelModal = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setCancelReason("");
    setIsCancelModalOpen(true);
  };

  // ===== Close Cancel Modal =====
  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setSelectedAppointmentId(null);
    setCancelReason("");
  };

  // ===== Confirm Cancel =====
  const handleConfirmCancel = async () => {
    if (!selectedAppointmentId) return;
    
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy!");
      return;
    }

    try {
      setProcessingId(selectedAppointmentId);

      const res: ApiResponse<null> = await appointmentApi.reviewAppointment(
        selectedAppointmentId,
        "cancel",
        cancelReason.trim()
      );

      if (res.success) {
        toast.success("Đã hủy ca khám thành công!");
        closeCancelModal();
        await refetchAllAppointments();
      } else {
        toast.error(res.message || "Thao tác thất bại");
      }
    } catch (error: any) {
      console.error("=== REVIEW API ERROR ===", error);
      toast.error(error.message || "Thao tác thất bại, vui lòng thử lại.");
    } finally {
      setProcessingId(null);
    }
  };

  // ===== Duyệt ca khám =====
  const handleApprove = async (appointmentId: string) => {
    try {
      setProcessingId(appointmentId);
      
      console.log("🔍 [AllAppointments] Approving appointment:", appointmentId);

      const res: ApiResponse<null> = await appointmentApi.reviewAppointment(
        appointmentId,
        "approve"
      );

      if (res.success) {
        toast.success("Đã duyệt ca khám thành công!");
        await refetchAllAppointments();
      } else {
        toast.error(res.message || "Thao tác thất bại");
      }
    } catch (error: any) {
      console.error("=== REVIEW API ERROR ===", error);
      toast.error(error.message || "Thao tác thất bại, vui lòng thử lại.");
    } finally {
      setProcessingId(null);
    }
  };

  // ===== Helper: Kiểm tra appointment có trong giờ làm việc không =====
  const isWithinWorkingHours = (appointment: Appointment): boolean => {
    if (!appointment.startTime) return false;
    
    const appointmentDate = new Date(appointment.startTime);
    const now = new Date();
    
    // Lấy ngày của appointment (chỉ phần ngày, không có giờ)
    const appointmentDateOnly = new Date(appointmentDate);
    appointmentDateOnly.setUTCHours(0, 0, 0, 0);
    
    // Lấy giờ của appointment (VN time, UTC+7)
    const appointmentHour = (appointmentDate.getUTCHours() + 7) % 24;
    
    // Nếu appointment vào buổi sáng (trước 12:00), endTime là 12:00
    // Nếu appointment vào buổi chiều (từ 12:00 trở đi), endTime là 18:00
    let scheduleEndHourVN = 18; // Mặc định buổi chiều
    if (appointmentHour < 12) {
      scheduleEndHourVN = 12; // Buổi sáng
    }
    
    // Tạo endTime của buổi làm việc (VN time), sau đó convert sang UTC
    // VN time = UTC + 7, nên UTC = VN time - 7
    const scheduleEndDate = new Date(appointmentDateOnly);
    scheduleEndDate.setUTCHours(scheduleEndHourVN - 7, 0, 0, 0); // Convert VN time to UTC
    
    // Kiểm tra xem hiện tại có trước endTime không
    return now < scheduleEndDate;
  };

  // ===== Cập nhật trạng thái ca khám =====
  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: "CheckedIn" | "Completed" | "Cancelled" | "No-Show"
  ) => {
    try {
      setProcessingId(appointmentId);
      
      console.log("🔍 [AllAppointments] Updating status:", { appointmentId, newStatus });

      const res = await appointmentApi.updateAppointmentStatus(
        appointmentId,
        newStatus
      );

      if (res.success) {
        const statusMessages = {
          CheckedIn: "Đã check-in bệnh nhân thành công!",
          Completed: "Đã hoàn thành ca khám!",
          Cancelled: "Đã hủy ca khám thành công!",
          "No-Show": "Đã đánh dấu No-Show!",
        };
        toast.success(statusMessages[newStatus]);
        await refetchAllAppointments();
      } else {
        toast.error(res.message || "Thao tác thất bại");
      }
    } catch (error: any) {
      console.error("=== UPDATE STATUS ERROR ===", error);
      toast.error(error.message || "Thao tác thất bại, vui lòng thử lại.");
    } finally {
      setProcessingId(null);
    }
  };

  // ===== Helper functions =====
  const getStatusText = (status: string): string => {
    switch (status) {
      case "Pending":
        return "Chờ duyệt";
      case "Approved":
        return "Đã xác nhận";
      case "CheckedIn":
        return "Đã check-in";
      case "Completed":
        return "Đã hoàn thành";
      case "Cancelled":
        return "Đã hủy";
      case "Refunded":
        return "Đã hoàn tiền";
      case "No-Show":
        return "Không đến";
      case "PendingPayment":
        return "Chờ thanh toán";
      case "Expired":
        return "Đã hết hạn";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "primary" | "danger" | "default" => {
    switch (status) {
      case "Approved":
        return "success";
      case "Pending":
      case "PendingPayment":
        return "warning";
      case "Completed":
        return "primary";
      case "CheckedIn":
        return "primary";
      case "Cancelled":
      case "No-Show":
      case "Expired":
        return "danger";
      case "Refunded":
        return "success";
      default:
        return "default";
    }
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    
    const dateStr = date.toLocaleDateString('vi-VN');
    const timeStr = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh'
    });
    
    return `${dateStr}, ${timeStr}`;
  };

  // Format local time cho check-in (hiển thị giờ địa phương)
  const formatLocalDateTime = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  // Kiểm tra đã đến thời điểm bắt đầu lịch chưa (so sánh theo UTC ISO)
  const isAtOrAfterStartTime = (startTimeISO: string): boolean => {
    if (!startTimeISO) return false;
    const now = new Date();
    const start = new Date(startTimeISO);
    return now.getTime() >= start.getTime();
  };

  // ===== Helper functions =====
  const shouldShowRefundButton = (appointment: any) => {
    // Chỉ hiển thị nút hoàn tiền khi:
    // 1. Trạng thái là Cancelled
    // 2. Loại là Consultation (có thanh toán)
    // 3. Có cancelReason
    // 4. KHÔNG phải No-Show (staff hủy)
    if (!appointment || 
        appointment.status !== "Cancelled" || 
        appointment.type !== "Consultation" || 
        !appointment.cancelReason) {
      return false;
    }

    const cancelReason = appointment.cancelReason.toLowerCase();
    const isNoShow = cancelReason.includes('no-show') || 
                    cancelReason.includes('không đến') ||
                    cancelReason.includes('không xuất hiện') ||
                    cancelReason.includes('absent');
    
    return !isNoShow;
  };

  // ===== Detail modal handlers =====
  const openDetailModal = async (appointmentId: string) => {
    try {
      setDetailLoading(true);
      setIsDetailOpen(true);
      
      console.log("🔍 [AllAppointments] Getting appointment details:", appointmentId);
      
      const res: ApiResponse<AppointmentDetailData> = await appointmentApi.getAppointmentDetails(appointmentId);
      if (res.success && res.data) {
        console.log("Detail data:", res.data);
        setDetailData(res.data);
      } else {
        setDetailData(null);
        toast.error(res.message || "Không tải được chi tiết ca khám");
      }
    } catch (err: any) {
      setDetailData(null);
      toast.error(err.message || "Không tải được chi tiết ca khám");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setDetailData(null);
  };

  const handleMarkRefunded = async () => {
    if (!detailData?._id) return;
    try {
      setProcessingId(detailData._id);
      const res = await appointmentApi.markAsRefunded(detailData._id);
      if (res.success) {
        toast.success("Đã đánh dấu hoàn tiền");
        await refetchAllAppointments();
        // cập nhật trong modal
        setDetailData(prev => prev ? { ...prev, status: "Refunded" } : prev);
      } else {
        toast.error(res.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thất bại");
    } finally {
      setProcessingId(null);
    }
  };

  // Stats calculation (exclude PendingPayment, Expired)
  const visibleAppointments = appointments.filter(
    (a) => a.status !== "PendingPayment" && a.status !== "Expired"
  );
  const stats = {
    total: visibleAppointments.length,
    pending: visibleAppointments.filter((a) => a.status === "Pending").length,
    approved: visibleAppointments.filter((a) => a.status === "Approved").length,
    checkedIn: visibleAppointments.filter((a) => a.status === "CheckedIn").length,
    completed: visibleAppointments.filter((a) => a.status === "Completed").length,
    cancelled: visibleAppointments.filter((a) => a.status === "Cancelled").length,
  };

  const columns = [
    { key: "date", label: "Ngày khám" },
    { key: "time", label: "Giờ khám" },
    { key: "patient", label: "Bệnh nhân" },
    { key: "doctor", label: "Bác sĩ" },
    { key: "service", label: "Dịch vụ" },
    { key: "status", label: "Trạng thái" },
    { key: "checkin", label: "Giờ check-in" },
    { key: "actions", label: "Hành động" },
  ];

  // ===== Pagination logic =====
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  // ===== Render UI =====
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardBody className="text-center p-8">
            <ExclamationCircleIcon className="w-16 h-16 mx-auto mb-4 text-warning-500" />
            <p className="text-lg font-semibold">Vui lòng đăng nhập để xem ca khám</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" label="Đang tải ca khám..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-[1600px] mx-auto">
      {/* Cancel Appointment Modal */}
      <Modal 
        isOpen={isCancelModalOpen} 
        onClose={closeCancelModal}
        size="2xl"
        classNames={{
          base: "rounded-2xl",
          header: "border-b border-gray-200",
          footer: "border-t border-gray-200",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-full p-2">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Xác nhận hủy ca khám</h3>
                <p className="text-sm text-gray-500 font-normal mt-1">
                  Vui lòng nhập lý do hủy ca khám
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <Textarea
              label="Lý do hủy"
              placeholder="Vui lòng nhập lý do hủy ca khám (bắt buộc)..."
              value={cancelReason}
              onValueChange={setCancelReason}
              minRows={4}
              maxRows={8}
              size="lg"
              variant="bordered"
              isRequired
              description="Lý do sẽ được gửi đến bệnh nhân"
              classNames={{
                input: "text-base",
                label: "text-base font-semibold",
              }}
            />
            
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <ExclamationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Lưu ý:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Hành động này không thể hoàn tác</li>
                    <li>Bệnh nhân sẽ nhận được thông báo về việc hủy</li>
                    <li>Lý do hủy sẽ được lưu vào hệ thống</li>
                  </ul>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="gap-3">
            <Button
              color="default"
              variant="flat"
              onPress={closeCancelModal}
              size="lg"
              className="font-semibold"
              isDisabled={processingId === selectedAppointmentId}
            >
              Đóng
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmCancel}
              size="lg"
              className="font-semibold"
              isDisabled={!cancelReason.trim() || processingId === selectedAppointmentId}
              isLoading={processingId === selectedAppointmentId}
            >
              {processingId === selectedAppointmentId ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={closeDetailModal}
        size="2xl"
        classNames={{
          base: "rounded-2xl",
          header: "border-b border-gray-200",
          footer: "border-t border-gray-200",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <InformationCircleIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Chi tiết ca khám</h3>
              <p className="text-sm text-gray-500">Thông tin và chi tiết hoàn tiền</p>
            </div>
          </ModalHeader>
          <ModalBody>
            {detailLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner label="Đang tải chi tiết..." />
              </div>
            ) : detailData ? (
              <div className="space-y-4">
                <Card>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Bệnh nhân</p>
                        <p className="font-semibold text-lg">{detailData.patient?.fullName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Bác sĩ</p>
                        <p className="font-semibold text-lg">{detailData.doctor?.fullName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dịch vụ</p>
                        <p className="font-semibold text-lg">{detailData.service?.serviceName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Trạng thái</p>
                        <Chip color={getStatusColor(detailData.status)} variant="flat" className="mt-1">
                          {getStatusText(detailData.status)}
                        </Chip>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-500 mb-2">Thời gian khám</p>
                      <p className="font-semibold text-lg">
                        {formatDate(detailData.timeslot?.startTime || "")} từ {formatTime(detailData.timeslot?.startTime || "")} - {formatTime(detailData.timeslot?.endTime || "")}
                      </p>
                    </div>

                    {detailData.type === 'Consultation' && detailData.bankInfo && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-500 mb-3">Thông tin hoàn tiền</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Chủ tài khoản</p>
                            <p className="font-semibold">{detailData.bankInfo?.accountHolderName || "-"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Số tài khoản</p>
                            <p className="font-semibold">{detailData.bankInfo?.accountNumber || "-"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Ngân hàng</p>
                            <p className="font-semibold">{detailData.bankInfo?.bankName || "-"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailData.status === 'Cancelled' && detailData.type === 'Consultation' && !shouldShowRefundButton(detailData) && (
                      <div className="border-t pt-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-sm text-yellow-800">
                              <strong>Lưu ý:</strong> Ca khám này bị hủy do không đến khám nên sẽ không được hoàn tiền .
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            ) : (
              <p className="text-center text-gray-500">Không có dữ liệu</p>
            )}
          </ModalBody>
          <ModalFooter className="gap-3">
            <Button variant="flat" onPress={closeDetailModal}>Đóng</Button>
            {shouldShowRefundButton(detailData) && (
              <Button color="success" onPress={handleMarkRefunded} isLoading={processingId === detailData?._id}>
                Đã hoàn tiền
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý ca khám</h1>
          <p className="text-gray-600 mt-1">Theo dõi và quản lý tất cả các ca khám</p>
        </div>
        {user && (
          <Chip color="primary" variant="flat" size="lg">
            {user.role}
          </Chip>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-danger-50 border-danger-200">
          <CardBody className="flex flex-row items-center gap-3">
            <XCircleIcon className="w-6 h-6 text-danger-600 flex-shrink-0" />
            <p className="text-danger-700">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Statistics Cards (no expired/pending payment) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
            <p className="text-sm text-blue-600 mt-1">Tổng số</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-sm text-yellow-600 mt-1">Chờ duyệt</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
            <p className="text-sm text-green-600 mt-1">Đã xác nhận</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-indigo-700">{stats.checkedIn}</p>
            <p className="text-sm text-indigo-600 mt-1">Đã check-in</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-purple-700">{stats.completed}</p>
            <p className="text-sm text-purple-600 mt-1">Hoàn thành</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
            <p className="text-sm text-red-600 mt-1">Đã hủy</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Tìm kiếm bệnh nhân, dịch vụ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
              isClearable
              onClear={() => setSearchText("")}
              size="lg"
              variant="bordered"
            />

            <Select
              label="Bác sĩ"
              placeholder="Chọn bác sĩ"
              selectedKeys={selectedDoctor !== "all" ? new Set([selectedDoctor]) : new Set([])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setSelectedDoctor(selected ? String(selected) : "all");
              }}
              size="lg"
              variant="bordered"
              startContent={<UserGroupIcon className="w-5 h-5 text-gray-400" />}
            >
              {[{ key: "all", label: "Tất cả bác sĩ" }, ...doctors.map(d => ({ key: d, label: d }))].map((item) => (
                <SelectItem key={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>

            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={(startDate, endDate) => setDateRange({ startDate, endDate })}
              placeholder="Chọn khoảng thời gian"
              className="w-full"
            />
          </div>
        </CardBody>
      </Card>

      {/* Tabs for Status Filter (no Expired tab) */}
      <Card>
        <CardBody className="overflow-x-auto">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
            size="lg"
            color="primary"
            variant="underlined"
          >
            <Tab key="all" title={`Tất cả (${stats.total})`} />
            <Tab key="Pending" title={`Chờ duyệt (${stats.pending})`} />
            <Tab key="Approved" title={`Đã xác nhận (${stats.approved})`} />
            <Tab key="CheckedIn" title={`Đã check-in (${stats.checkedIn})`} />
            <Tab key="Completed" title={`Hoàn thành (${stats.completed})`} />
            <Tab key="Cancelled" title={`Đã hủy (${stats.cancelled})`} />
          </Tabs>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          <Table 
            aria-label="Bảng quản lý ca khám"
            removeWrapper
            classNames={{
              th: "bg-gray-100 text-gray-700 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody
              items={currentAppointments}
              emptyContent={
                <div className="text-center py-12">
                  <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">Không có ca khám nào</p>
                </div>
              }
            >
              {(appointment: Appointment) => (
                <TableRow key={appointment.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{formatDate(appointment.startTime)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">{appointment.patientName}</p>
                      <p className="text-xs text-gray-500">Đặt lúc: {formatLocalDateTime(appointment.createdAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip variant="flat" color="default">
                      {appointment.doctorName}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-700">{appointment.serviceName}</p>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(appointment.status)}
                      variant="flat"
                      size="lg"
                      startContent={
                        appointment.status === "Completed" ? <CheckCircleIcon className="w-4 h-4" /> :
                        appointment.status === "Cancelled" ? <XCircleIcon className="w-4 h-4" /> : null
                      }
                    >
                      {getStatusText(appointment.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {appointment.checkedInAt ? (
                      <div className="text-sm">
                        <p className="font-semibold text-primary-600">{formatLocalDateTime(appointment.checkedInAt)}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {appointment.status === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            onPress={() => handleApprove(appointment.id)}
                            isDisabled={processingId === appointment.id}
                            isLoading={processingId === appointment.id}
                          >
                            Xác nhận
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => openCancelModal(appointment.id)}
                            isDisabled={processingId === appointment.id}
                          >
                            Hủy
                          </Button>
                        </>
                      )}
                      {appointment.status === "Approved" && (
                          <>
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onPress={() => handleUpdateStatus(appointment.id, "CheckedIn")}
                              isDisabled={processingId === appointment.id}
                              isLoading={processingId === appointment.id}
                            >
                              Check-in
                            </Button>
                            <Button
                              size="sm"
                              color="warning"
                              variant="flat"
                              onPress={() => handleUpdateStatus(appointment.id, "Cancelled")}
                              isDisabled={processingId === appointment.id}
                              isLoading={processingId === appointment.id}
                            >
                              No Show
                            </Button>
                          </>
                      )}
                      {appointment.status === "CheckedIn" && (
                        <Button
                          size="sm"
                          color="warning"
                          variant="flat"
                          onPress={() => handleUpdateStatus(appointment.id, "No-Show")}
                          isDisabled={processingId === appointment.id}
                          isLoading={processingId === appointment.id}
                        >
                          No Show
                        </Button>
                      )}
                      {appointment.status === "No-Show" && isWithinWorkingHours(appointment) && (
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => handleUpdateStatus(appointment.id, "CheckedIn")}
                          isDisabled={processingId === appointment.id}
                          isLoading={processingId === appointment.id}
                        >
                          Check-in
                        </Button>
                      )}
                      {(!["Pending", "Approved", "CheckedIn", "No-Show"].includes(appointment.status) || 
                       (appointment.status === "No-Show" && !isWithinWorkingHours(appointment))) && (
                        <div className="flex gap-2">
                          {appointment.status === "Cancelled" || appointment.status === "Refunded" ? (
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onPress={() => openDetailModal(appointment.id)}
                            >
                              Xem chi tiết
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            color="primary"
            size="lg"
            classNames={{
              wrapper: "gap-2",
              item: "w-10 h-10 text-base",
              cursor: "bg-primary text-white font-semibold",
            }}
          />
        </div>
      )}

      {/* Result Count */}
      <div className="text-center text-sm text-gray-600">
        Hiển thị <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)}</span> trong tổng số <span className="font-semibold">{filteredAppointments.length}</span> ca khám
      </div>
    </div>
  );
};

export default AllAppointments;
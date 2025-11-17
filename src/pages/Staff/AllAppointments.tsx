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
  Tooltip,
} from "@heroui/react";
import { 
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserPlusIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { appointmentApi, leaveRequestApi } from "@/api";
import { availableSlotApi, getDoctorScheduleRange, validateAppointmentTime } from "@/api/availableSlot";
import { doctorApi } from "@/api/doctor";
import { serviceApi } from "@/api/service";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { vi } from "date-fns/locale";
registerLocale("vi", vi);
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/Common";
import { ReassignDoctorModal } from "@/components/Staff";
import toast from "react-hot-toast";
// ===== Interface định nghĩa =====
interface Appointment {
  id: string;
  status: string;
  patientName: string;
  doctorName: string;
  doctorUserId?: string; // Thêm doctorUserId để check leave
  doctorStatus?: string | null; // ⭐ Status của doctor: 'Available', 'Busy', 'On Leave', 'Inactive'
  hasReplacementDoctor?: boolean; // ⭐ Đã có bác sĩ thay thế được confirm (replacedDoctorUserId = null)
  hasPendingReplacement?: boolean; // ⭐ Có bác sĩ thay thế đang chờ patient confirm (replacedDoctorUserId != null)
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

  // Reassign Doctor Modal states
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignAppointment, setReassignAppointment] = useState<Appointment | null>(null);

  // Leave requests state - để check doctor có leave không
  const [approvedLeaves, setApprovedLeaves] = useState<Array<{
    userId: string;
    startDate: string;
    endDate: string;
  }>>([]);

  // Walk-in modal states
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInForm, setWalkInForm] = useState<{
    fullName: string;
    email: string;
    phoneNumber: string;
    serviceId: string;
    doctorUserId: string;
    date: string; // YYYY-MM-DD
    selectedSlotISO: string; // startTime ISO
    notes: string;
  }>({
    fullName: "",
    email: "",
    phoneNumber: "",
    serviceId: "",
    doctorUserId: "",
    date: "",
    selectedSlotISO: "",
    notes: ""
  });
  const [walkInDoctors, setWalkInDoctors] = useState<Array<{ _id: string; fullName: string }>>([]);
  const [walkInServices, setWalkInServices] = useState<Array<{ _id: string; serviceName: string; durationMinutes?: number }>>([]);
  const [walkInSlots, setWalkInSlots] = useState<Array<{ startTime: string; endTime: string; displayTime?: string }>>([]);
  const [walkInDoctorScheduleId, setWalkInDoctorScheduleId] = useState<string | null>(null);
  const [walkInLoadingSlots, setWalkInLoadingSlots] = useState(false);
  const [walkInDate, setWalkInDate] = useState<Date | null>(null);
  const [walkInScheduleRanges, setWalkInScheduleRanges] = useState<any[] | null>(null);
  const [walkInTimeInput, setWalkInTimeInput] = useState<string>("");
  const [walkInTimeError, setWalkInTimeError] = useState<string | null>(null);
  const [walkInStartTime, setWalkInStartTime] = useState<Date | null>(null);
  const [walkInEndTime, setWalkInEndTime] = useState<Date | null>(null);
  const [walkInErrors, setWalkInErrors] = useState<Record<string, string>>({});

  // Inline field validator for Walk-in form
  const validateWalkInField = (fieldName: string) => {
    const next: Record<string, string> = { ...walkInErrors };
    switch (fieldName) {
      case "fullName":
        if (!String(walkInForm.fullName || "").trim()) next.fullName = "Vui lòng nhập họ và tên.";
        else delete next.fullName;
        break;
      case "email":
        {
          const ok = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(walkInForm.email || "").trim());
          if (!ok) next.email = "Email không hợp lệ.";
          else delete next.email;
        }
        break;
      case "phoneNumber":
        {
          const digits = String(walkInForm.phoneNumber || "").replace(/[^0-9]/g, "");
          if (digits.length !== 10) next.phoneNumber = "Số điện thoại phải gồm 10 chữ số.";
          else delete next.phoneNumber;
        }
        break;
      case "serviceId":
        if (!walkInForm.serviceId) next.serviceId = "Vui lòng chọn dịch vụ.";
        else delete next.serviceId;
        break;
      case "doctorUserId":
        if (!walkInForm.doctorUserId) next.doctorUserId = "Vui lòng chọn bác sĩ.";
        else delete next.doctorUserId;
        break;
      case "date":
        {
          const d = new Date((walkInForm.date || "") + "T00:00:00");
          if (!walkInForm.date || isNaN(d.getTime())) next.date = "Ngày không hợp lệ.";
          else delete next.date;
        }
        break;
      default:
        break;
    }
    setWalkInErrors(next);
  };

  // Debug: Log khi approvedLeaves thay đổi
  useEffect(() => {
    console.log('📊 [approvedLeaves State] Updated:', {
      count: approvedLeaves.length,
      leaves: approvedLeaves.map(l => ({
        userId: l.userId,
        startDate: l.startDate,
        endDate: l.endDate,
      })),
    });
  }, [approvedLeaves]);

  // ===== Hàm lấy tất cả bác sĩ =====
  const fetchAllDoctors = async () => {
    try {
      const res = await appointmentApi.getAllDoctors();
      if (res.success && res.data) {
        const doctorNames = res.data.map(doctor => doctor.fullName);
        setDoctors(doctorNames);
        setWalkInDoctors(res.data);
      }
    } catch (err: any) {
      console.error("Error fetching all doctors:", err);
      // Fallback: lấy từ appointments nếu API lỗi
    }
  };

  // Load services Active (giống form bệnh nhân: có promotion fields, lọc status Active)
  const fetchWalkInServices = async () => {
    try {
      const res = await serviceApi.getPublicServices({ status: "Active", limit: 100 });
      if (res.success && Array.isArray(res.data)) {
        setWalkInServices(
          res.data.map((s) => ({
            _id: s._id,
            serviceName: s.serviceName,
            durationMinutes: s.durationMinutes,
          }))
        );
      } else {
        setWalkInServices([]);
      }
    } catch (e) {
      console.warn("⚠️ Không thể tải danh sách dịch vụ cho walk-in:", e);
      setWalkInServices([]);
    }
  };

  // Fetch available slots when doctor/service/date selected
  // Lấy scheduleRanges giống BookingModal (BE đã chuẩn hóa)
  const fetchWalkInScheduleRanges = async () => {
    const { doctorUserId, serviceId, date } = walkInForm;
    if (!doctorUserId || !serviceId || !date) {
      setWalkInScheduleRanges(null);
      setWalkInDoctorScheduleId(null);
      return;
    }
    try {
      setWalkInLoadingSlots(true);
      const res = await getDoctorScheduleRange(doctorUserId, serviceId, date, "other");
      if (res.success && (res as any).data) {
        const data: any = (res as any).data;
        setWalkInScheduleRanges(data.scheduleRanges || []);
        setWalkInDoctorScheduleId(data.doctorScheduleId || null);
      } else {
        setWalkInScheduleRanges(null);
        setWalkInDoctorScheduleId(null);
      }
    } catch (e) {
      console.error("❌ Lỗi tải scheduleRanges walk-in:", e);
      setWalkInScheduleRanges(null);
      setWalkInDoctorScheduleId(null);
    } finally {
      setWalkInLoadingSlots(false);
    }
  };

  const isTimeInWalkInRanges = (timeInput: string): boolean => {
    if (!walkInScheduleRanges || !Array.isArray(walkInScheduleRanges)) return false;
    const [h, m] = timeInput.split(":");
    const hh = parseInt(h || "", 10);
    const mm = parseInt(m || "", 10);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return false;
    const total = hh * 60 + mm;
    for (const range of walkInScheduleRanges) {
      if (range.displayRange === "Đã hết chỗ" || range.displayRange === "Đã qua thời gian làm việc") continue;
      const start = new Date(range.startTime);
      const end = new Date(range.endTime);
      const startMin = (start.getUTCHours() + 7) * 60 + start.getUTCMinutes();
      const endMin = (end.getUTCHours() + 7) * 60 + end.getUTCMinutes();
      if (total >= startMin && total < endMin) return true;
    }
    return false;
  };

  const handleWalkInTimeBlur = async (timeInput: string) => {
    if (!timeInput || !walkInForm.doctorUserId) {
      setWalkInEndTime(null);
      return;
    }
    const timeRegex = /^(\d{1,2}):(\d{1,2})$/;
    if (!timeRegex.test(timeInput)) {
      setWalkInTimeError("Định dạng thời gian không hợp lệ. Vui lòng nhập HH:mm");
      setWalkInEndTime(null);
      return;
    }
    const [hours, minutes] = timeInput.split(":");
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (h < 0 || h > 23) {
      setWalkInTimeError("Giờ không hợp lệ. 00-23");
      setWalkInEndTime(null);
      return;
    }
    if (m < 0 || m > 59) {
      setWalkInTimeError("Phút không hợp lệ. 00-59");
      setWalkInEndTime(null);
      return;
    }
    if (!isTimeInWalkInRanges(timeInput)) {
      setWalkInTimeError("Khung giờ này không nằm trong khoảng khả dụng.");
      setWalkInEndTime(null);
      return;
    }
    // Convert VN → UTC
    const dateObj = new Date((walkInForm.date || "") + "T00:00:00.000Z");
    const utcHours = h - 7;
    dateObj.setUTCHours(utcHours, m, 0, 0);
    const startISO = dateObj.toISOString();
    try {
      const validateRes = await validateAppointmentTime(
        walkInForm.doctorUserId,
        walkInForm.serviceId,
        walkInForm.date,
        startISO
      );
      if (!validateRes.success) {
        setWalkInTimeError(validateRes.message || "Thời gian không hợp lệ");
        setWalkInEndTime(null);
        return;
      }
      setWalkInTimeError(null);
      setWalkInStartTime(dateObj);
      setWalkInEndTime(new Date(validateRes.data!.endTime));
    } catch (e: any) {
      setWalkInTimeError(e.message || "Lỗi validate thời gian");
      setWalkInEndTime(null);
    }
  };

  // Cập nhật end time ngay khi người dùng nhập đủ HH và mm hợp lệ
  const tryUpdateWalkInEndTimeLive = async (timeInput: string) => {
    const timeRegexFull = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegexFull.test(timeInput)) {
      // Chưa đủ định dạng hợp lệ -> chưa tính
      return;
    }
    // Sử dụng cùng logic như blur nhưng không báo lỗi UI nếu thất bại
    const [hours, minutes] = timeInput.split(":");
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (!isTimeInWalkInRanges(timeInput)) {
      setWalkInEndTime(null);
      return;
    }
    const dateObj = new Date((walkInForm.date || "") + "T00:00:00.000Z");
    const utcHours = h - 7;
    dateObj.setUTCHours(utcHours, m, 0, 0);
    const startISO = dateObj.toISOString();
    try {
      const validateRes = await validateAppointmentTime(
        walkInForm.doctorUserId,
        walkInForm.serviceId,
        walkInForm.date,
        startISO
      );
      if (!validateRes.success) {
        setWalkInEndTime(null);
        return;
      }
      setWalkInStartTime(dateObj);
      setWalkInEndTime(new Date(validateRes.data!.endTime));
    } catch {
      setWalkInEndTime(null);
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
          let patientName = "Chưa có";

          if (apt.customerId && typeof apt.customerId === "object" && apt.customerId.fullName) {
            patientName = apt.customerId.fullName;
          } else if (apt.patientUserId && typeof apt.patientUserId === "object" && apt.patientUserId.fullName) {
            patientName = apt.patientUserId.fullName;
          }

          // ⭐ QUAN TRỌNG: Logic hiển thị bác sĩ
          // - Nếu có replacedDoctorUserId → chưa confirm → hiển thị bác sĩ cũ (doctorUserId)
          // - Nếu không có replacedDoctorUserId → đã confirm hoặc chưa gán → hiển thị doctorUserId
          // Chỉ hiển thị bác sĩ mới sau khi patient confirm (khi replacedDoctorUserId = null)
          const doctorName = apt.doctorUserId?.fullName || "N/A";
          
          // ⭐ QUAN TRỌNG: Để check leave, chúng ta cần check BÁC SĨ GỐC (doctorUserId)
          // vì đó là bác sĩ có leave request. Nếu đã gán bác sĩ mới (replacedDoctorUserId),
          // thì bác sĩ mới không có leave, nhưng bác sĩ gốc vẫn có leave.
          // Vậy nên chúng ta luôn check doctorUserId gốc để xem có leave không.
          let doctorUserId = null; // doctorUserId gốc để check leave
          if (apt.doctorUserId) {
            // doctorUserId có thể là object (populated) hoặc ObjectId
            if (typeof apt.doctorUserId === 'object') {
              // Nếu là object, lấy _id
              doctorUserId = apt.doctorUserId._id?.toString() 
                || apt.doctorUserId.toString();
            } else {
              doctorUserId = apt.doctorUserId.toString();
            }
          }

          // ⭐ hasReplacementDoctor chỉ = true khi đã confirm (replacedDoctorUserId = null)
          // Nếu có replacedDoctorUserId → chưa confirm → hasReplacementDoctor = false
          const hasReplacementDoctor = false; // Chỉ hiển thị bác sĩ mới sau khi confirm
          
          // ⭐ hasPendingReplacement = true nếu có replacedDoctorUserId (chưa confirm)
          const hasPendingReplacement = Boolean(apt.replacedDoctorUserId);
          
          // Debug log nếu có replacedDoctorUserId (chưa confirm)
          if (apt.replacedDoctorUserId) {
            console.log('🔍 [AllAppointments] Appointment with pending replacement (waiting for patient confirm):', {
              appointmentId: apt._id,
              currentDoctor: apt.doctorUserId?.fullName || apt.doctorUserId,
              pendingReplacementDoctor: apt.replacedDoctorUserId?.fullName || apt.replacedDoctorUserId,
              displayedDoctor: doctorName,
              hasReplacementDoctor: hasReplacementDoctor,
              hasPendingReplacement: hasPendingReplacement
            });
          }

          return {
            id: apt._id,
            status: apt.status,
            patientName: patientName,
            doctorName: doctorName,
            doctorUserId: doctorUserId, // Thêm doctorUserId
            doctorStatus: apt.doctorStatus || null, // ⭐ Thêm doctorStatus từ backend
            hasReplacementDoctor: hasReplacementDoctor,
            hasPendingReplacement: hasPendingReplacement,
            serviceName: apt.serviceId?.serviceName || "Chưa có",
            startTime: apt.timeslotId?.startTime 
              ? (apt.timeslotId.startTime instanceof Date 
                  ? apt.timeslotId.startTime.toISOString() 
                  : String(apt.timeslotId.startTime))
              : "",
            endTime: apt.timeslotId?.endTime 
              ? (apt.timeslotId.endTime instanceof Date 
                  ? apt.timeslotId.endTime.toISOString() 
                  : String(apt.timeslotId.endTime))
              : "",
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

  // ===== Hàm lấy approved leaves =====
  const fetchApprovedLeaves = async () => {
    try {
      const res = await leaveRequestApi.getAllLeaveRequests({
        status: "Approved",
        limit: 1000,
      });
      
      // Backend trả về: { success: true, data: LeaveRequest[], total, totalPages, ... }
      if (!res || !res.success || !res.data) {
        console.warn('⚠️ [fetchApprovedLeaves] Invalid response:', res);
        setApprovedLeaves([]);
        return;
      }

      // res.data là array trực tiếp
      const leavesArray = Array.isArray(res.data) ? res.data : [];
      
      if (leavesArray.length > 0) {
        const leaves = leavesArray.map((leave: any) => {
          // Extract userId - có thể là object với _id hoặc string
          let userId = "";
          if (leave.userId) {
            if (typeof leave.userId === 'object' && leave.userId._id) {
              userId = leave.userId._id.toString();
            } else if (typeof leave.userId === 'string') {
              userId = leave.userId;
            } else {
              userId = String(leave.userId);
            }
          }
          
          return {
            userId: userId,
            startDate: leave.startDate,
            endDate: leave.endDate,
          };
        });
        
        console.log('✅ [fetchApprovedLeaves] Loaded', leaves.length, 'approved leaves');
        setApprovedLeaves(leaves);
      } else {
        console.log('⚠️ [fetchApprovedLeaves] No approved leaves found');
        setApprovedLeaves([]);
      }
    } catch (err: any) {
      console.error("❌ Error fetching approved leaves:", err);
      setApprovedLeaves([]);
    }
  };

  // ===== Helper: Check doctor có leave trong thời gian appointment không =====
  const isDoctorOnLeave = (appointment: Appointment): boolean => {
    // ⭐ Cách 1: Check doctorStatus từ backend (nhanh và chính xác nhất)
    if (appointment.doctorStatus === 'On Leave') {
      return true;
    }

    // ⭐ Cách 2: Fallback - check approved leaves (nếu doctorStatus chưa được update)
    if (!appointment.doctorUserId || !appointment.startTime || approvedLeaves.length === 0) {
      return false;
    }

    const appointmentDate = new Date(appointment.startTime);
    if (isNaN(appointmentDate.getTime())) {
      return false;
    }
    appointmentDate.setHours(0, 0, 0, 0);

    const doctorId = appointment.doctorUserId.toString().trim();

    // Check xem có leave nào cover appointmentDate không
    return approvedLeaves.some((leave) => {
      const leaveUserId = (leave.userId?.toString() || leave.userId || "").trim();
      
      if (leaveUserId !== doctorId) {
        return false;
      }

      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      
      if (isNaN(leaveStart.getTime()) || isNaN(leaveEnd.getTime())) {
        return false;
      }
      
      leaveStart.setHours(0, 0, 0, 0);
      leaveEnd.setHours(23, 59, 59, 999);

      return appointmentDate >= leaveStart && appointmentDate <= leaveEnd;
    });
  };

  const hasAppointmentDayEnded = (startTime: string): boolean => {
    if (!startTime) {
      return false;
    }

    const appointmentDate = new Date(startTime);
    if (Number.isNaN(appointmentDate.getTime())) {
      return false;
    }

    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    return new Date().getTime() > endOfDay.getTime();
  };

  // ⭐ Kiểm tra xem đã đến ngày của ca khám chưa (chỉ cho phép check-in khi đã đến ngày)
  const isAppointmentDateReached = (startTime: string): boolean => {
    if (!startTime) {
      return false;
    }

    const appointmentDate = new Date(startTime);
    if (Number.isNaN(appointmentDate.getTime())) {
      return false;
    }

    // Chỉ lấy phần ngày, bỏ phần giờ
    const appointmentDay = new Date(appointmentDate);
    appointmentDay.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cho phép check-in khi đã đến ngày (today >= appointmentDay)
    return today.getTime() >= appointmentDay.getTime();
  };

  const shouldShowReassignButton = (
    appointment: Appointment,
    isOnLeaveOverride?: boolean
  ): boolean => {
    // ⭐ Nếu đã có bác sĩ thay thế được confirm, không hiển thị nút "Gán bác sĩ"
    if (appointment.hasReplacementDoctor) {
      return false;
    }

    // ⭐ Nếu có bác sĩ thay thế đang chờ patient confirm, không hiển thị nút "Gán bác sĩ"
    if (appointment.hasPendingReplacement) {
      return false;
    }

    const doctorOnLeave =
      typeof isOnLeaveOverride === "boolean"
        ? isOnLeaveOverride
        : isDoctorOnLeave(appointment);

    if (!doctorOnLeave) {
      return false;
    }

    // ⭐ Chỉ hiển thị vắng mặt cho các ca đang chờ duyệt, đã approved, hoặc đã check-in
    // KHÔNG hiển thị cho các ca đã hoàn thành (Completed) hoặc đang tiến hành (InProgress)
    const allowedStatuses = ['Pending', 'Approved', 'CheckedIn'];
    if (!allowedStatuses.includes(appointment.status)) {
      return false;
    }

    if (hasAppointmentDayEnded(appointment.startTime)) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    console.log('🔍 [useEffect] Component mounted/updated, isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('✅ [useEffect] Calling fetchAllDoctors, fetchApprovedLeaves, refetchAllAppointments');
      fetchAllDoctors(); // Lấy tất cả bác sĩ trước
      fetchWalkInServices();
      fetchApprovedLeaves(); // Lấy approved leaves
      refetchAllAppointments();
    } else {
      console.log('⚠️ [useEffect] Not authenticated, skipping API calls');
    }
  }, [isAuthenticated]);

  // Re-fetch slots when inputs change
  useEffect(() => {
    // Clear previous time when inputs change
    setWalkInTimeInput("");
    setWalkInTimeError(null);
    setWalkInStartTime(null);
    setWalkInEndTime(null);
    fetchWalkInScheduleRanges();
  }, [walkInForm.doctorUserId, walkInForm.serviceId, walkInForm.date]);

  // Khởi tạo ngày mặc định khi mở modal (hôm nay) để tránh rỗng -> lỗi định dạng
  useEffect(() => {
    if (!isWalkInOpen) return;
    if (walkInForm.date) {
      // Đồng bộ DatePicker từ giá trị đã có (YYYY-MM-DD)
      try {
        const d = new Date(walkInForm.date + "T00:00:00");
        if (!isNaN(d.getTime())) setWalkInDate(d);
      } catch {}
      return;
    }
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const iso = `${yyyy}-${mm}-${dd}`;
    setWalkInDate(now);
    setWalkInForm(prev => ({ ...prev, date: iso }));
  }, [isWalkInOpen]);

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
        await fetchApprovedLeaves(); // Refresh leaves
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
        await fetchApprovedLeaves(); // Refresh leaves
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
          CheckedIn: "Đã đánh dấu có mặt thành công!",
          Completed: "Đã hoàn thành ca khám!",
          Cancelled: "Đã hủy ca khám thành công!",
          "No-Show": "Đã đánh dấu vắng mặt!",
        };
        toast.success(statusMessages[newStatus]);
        await fetchApprovedLeaves(); // Refresh leaves
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

  // ===== Open Reassign Modal =====
  const openReassignModal = (appointment: Appointment) => {
    setReassignAppointment(appointment);
    setIsReassignModalOpen(true);
  };

  // ===== Close Reassign Modal =====
  const closeReassignModal = () => {
    setIsReassignModalOpen(false);
    setReassignAppointment(null);
  };

  // ===== Handle Reassign Success =====
  const handleReassignSuccess = async () => {
    await fetchApprovedLeaves(); // Refresh leaves
    await refetchAllAppointments();
  };

  // ===== Helper functions =====
  const getStatusText = (status: string): string => {
    switch (status) {
      case "Pending":
        return "Chờ duyệt";
      case "Approved":
        return "Đã xác nhận";
      case "CheckedIn":
        return "Đã có mặt";
      case "InProgress":
        return "Đang trong ca khám";
      case "Completed":
        return "Đã hoàn thành";
      case "Cancelled":
        return "Đã hủy";
      case "Refunded":
        return "Đã hoàn tiền";
      case "No-Show":
        return "Vắng mặt";
      case "PendingPayment":
        return "Chờ thanh toán";
      case "Expired":
        return "Đã hết hạn";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "primary" | "danger" | "default" => {
    // Subtle colors - still use colors but with flat variant for softer look
    switch (status) {
      case "Approved":
      case "Completed":
      case "Refunded":
        return "success";
      case "Pending":
      case "PendingPayment":
        return "warning";
      case "CheckedIn":
      case "InProgress":
        return "primary";
      case "Cancelled":
      case "No-Show":
      case "Expired":
        return "danger";
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

  // ===== Xuất phiếu khám bệnh PDF =====
  const handleDownloadPDF = async (appointmentId: string) => {
    try {
      setProcessingId(appointmentId);
      toast.loading("Đang tạo file PDF...", { id: "pdf-download" });

      // Call API với authentication header
      const token = sessionStorage.getItem("authToken");
      
      if (!token) {
        toast.error("Token không tồn tại. Vui lòng đăng nhập lại.", { id: "pdf-download" });
        return;
      }
      
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9999/api";
      
      const response = await fetch(`${API_URL}/appointments/${appointmentId}/visit-ticket/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể tải file PDF");
      }

      // Get PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `phieu-kham-${appointmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Đã tải xuống phiếu khám bệnh!", { id: "pdf-download" });
    } catch (error: any) {
      console.error("❌ Error downloading PDF:", error);
      toast.error(error.message || "Lỗi khi tải file PDF", { id: "pdf-download" });
    } finally {
      setProcessingId(null);
    }
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
    inProgress: visibleAppointments.filter((a) => a.status === "InProgress").length,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="space-y-6 pr-6 pb-6">
      {/* Walk-in Modal */}
      <Modal 
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        size="2xl"
        isDismissable={false}
        shouldCloseOnInteractOutside={false}
        classNames={{
          base: "rounded-2xl",
          header: "border-b border-gray-200",
          footer: "border-t border-gray-200",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <UserPlusIcon className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Tạo lịch trực tiếp (Walk-in)</h3>
              <p className="text-sm text-gray-500">Nhập thông tin bệnh nhân vãng lai và chọn thời gian</p>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Họ và tên"
                value={walkInForm.fullName}
                onValueChange={(v) => {
                  setWalkInForm(prev => ({ ...prev, fullName: v }));
                  if (walkInErrors.fullName) {
                    setWalkInErrors(prev => { const n = { ...prev }; delete n.fullName; return n; });
                  }
                }}
                onBlur={() => validateWalkInField("fullName")}
                variant="bordered"
                isInvalid={!!walkInErrors.fullName}
                errorMessage={walkInErrors.fullName}
                isRequired
              />
              <Input
                label="Email"
                type="email"
                value={walkInForm.email}
                onValueChange={(v) => {
                  setWalkInForm(prev => ({ ...prev, email: v }));
                  if (walkInErrors.email) {
                    setWalkInErrors(prev => { const n = { ...prev }; delete n.email; return n; });
                  }
                }}
                onBlur={() => validateWalkInField("email")}
                variant="bordered"
                isInvalid={!!walkInErrors.email}
                errorMessage={walkInErrors.email}
                isRequired
              />
              <Input
                label="Số điện thoại"
                value={walkInForm.phoneNumber}
                onValueChange={(v) => {
                  setWalkInForm(prev => ({ ...prev, phoneNumber: v }));
                  if (walkInErrors.phoneNumber) {
                    setWalkInErrors(prev => { const n = { ...prev }; delete n.phoneNumber; return n; });
                  }
                }}
                onBlur={() => validateWalkInField("phoneNumber")}
                variant="bordered"
                isInvalid={!!walkInErrors.phoneNumber}
                errorMessage={walkInErrors.phoneNumber}
                isRequired
              />
              <Select
                label="Dịch vụ"
                selectedKeys={walkInForm.serviceId ? new Set([walkInForm.serviceId]) : new Set([])}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  setWalkInForm(prev => ({ ...prev, serviceId: selected ? String(selected) : "", selectedSlotISO: "" }));
                  if (walkInErrors.serviceId) setWalkInErrors(prev => { const n = { ...prev }; delete n.serviceId; return n; });
                }}
                variant="bordered"
                isInvalid={!!walkInErrors.serviceId}
                errorMessage={walkInErrors.serviceId}
                placeholder="Chọn dịch vụ"
                isRequired
              >
                {walkInServices.map(s => {
                  const duration = typeof s.durationMinutes === 'number' ? `${s.durationMinutes} phút` : '';
                  return (
                    <SelectItem key={s._id} description={duration || undefined}>
                      {s.serviceName}
                    </SelectItem>
                  );
                })}
              </Select>
              <Select
                label="Bác sĩ"
                selectedKeys={walkInForm.doctorUserId ? new Set([walkInForm.doctorUserId]) : new Set([])}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  setWalkInForm(prev => ({ ...prev, doctorUserId: selected ? String(selected) : "", selectedSlotISO: "" }));
                  if (walkInErrors.doctorUserId) setWalkInErrors(prev => { const n = { ...prev }; delete n.doctorUserId; return n; });
                }}
                variant="bordered"
                isInvalid={!!walkInErrors.doctorUserId}
                errorMessage={walkInErrors.doctorUserId}
                placeholder="Chọn bác sĩ"
                isRequired
              >
                {walkInDoctors.map(d => (
                  <SelectItem key={d._id}>{d.fullName}</SelectItem>
                ))}
              </Select>
              <Input
                label="Ngày khám"
                value={walkInForm.date}
                variant="bordered"
                isReadOnly
                className="hidden"
              />
              <DatePicker
                selected={walkInDate}
                onChange={(d) => {
                  setWalkInDate(d);
                  const yyyy = d ? d.getFullYear() : "";
                  const mm = d ? String(d.getMonth() + 1).padStart(2, "0") : "";
                  const dd = d ? String(d.getDate()).padStart(2, "0") : "";
                  const isoDate = d ? `${yyyy}-${mm}-${dd}` : "";
                  setWalkInForm(prev => ({ ...prev, date: isoDate, selectedSlotISO: "" }));
                  if (walkInErrors.date) setWalkInErrors(prev => { const n = { ...prev }; delete n.date; return n; });
                }}
                onCalendarClose={() => validateWalkInField("date")}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                locale="vi"
                placeholderText="Chọn ngày"
                className="w-full border px-3 py-2 rounded-lg"
              />
              {walkInErrors.date && <p className="text-xs text-red-600 -mt-3">{walkInErrors.date}</p>}
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-500">Khoảng thời gian khả dụng</p>
              {walkInLoadingSlots ? (
                <div className="flex items-center gap-2 text-gray-600"><Spinner size="sm" /> Đang tải khung giờ...</div>
              ) : walkInScheduleRanges && walkInScheduleRanges.length > 0 ? (
                <div className="space-y-2">
                  {walkInScheduleRanges.map((range: any, idx: number) => (
                    <div key={idx}>
                      <p className="text-sm font-semibold text-[#39BDCC]">{range.shiftDisplay}:</p>
                      <p className="text-sm text-gray-700 ml-2">
                        {range.displayRange === 'Đã hết chỗ' ? (
                          <span className="text-red-600 font-medium">Đã hết chỗ</span>
                        ) : range.displayRange === 'Đã qua thời gian làm việc' ? (
                          <span className="text-red-600 font-medium">Đã qua thời gian làm việc</span>
                        ) : (
                          range.displayRange.split(', ').map((gap: string, i: number) => (
                            <span key={i}>
                              {i > 0 && <span className="mx-2">|</span>}
                              <span className="text-[#39BDCC] font-medium">{gap}</span>
                            </span>
                          ))
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Không có khoảng thời gian phù hợp</div>
              )}

              {/* Nhập giờ giống BookingModal */}
              {walkInForm.doctorUserId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Nhập giờ bắt đầu</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Giờ"
                        className={`w-16 text-center border px-3 py-2 rounded-lg ${walkInTimeError ? 'border-red-500' : ''}`}
                        value={(walkInTimeInput || '').split(':')[0] || ''}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const minute = (walkInTimeInput || '').split(':')[1] || '';
                          setWalkInTimeError(null);
                          setWalkInTimeInput(v + ':' + minute);
                          const maybeTime = (v || '') + ':' + (minute || '');
                          void tryUpdateWalkInEndTimeLive(maybeTime);
                        }}
                        onBlur={() => {
                          const [h, m] = (walkInTimeInput || '').split(':');
                          if (h && m) handleWalkInTimeBlur(`${h}:${m}`);
                        }}
                      />
                      <span className="font-semibold">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Phút"
                        className={`w-16 text-center border px-3 py-2 rounded-lg ${walkInTimeError ? 'border-red-500' : ''}`}
                        value={(walkInTimeInput || '').split(':')[1] || ''}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const hour = (walkInTimeInput || '').split(':')[0] || '';
                          setWalkInTimeError(null);
                          setWalkInTimeInput(hour + ':' + v);
                          const maybeTime = (hour || '') + ':' + (v || '');
                          void tryUpdateWalkInEndTimeLive(maybeTime);
                        }}
                        onBlur={() => {
                          const [h, m] = (walkInTimeInput || '').split(':');
                          if (h && m) handleWalkInTimeBlur(`${h}:${m}`);
                        }}
                      />
                    </div>
                    {walkInTimeError && <p className="mt-1 text-xs text-red-600">{walkInTimeError}</p>}
                  </div>

                  {walkInEndTime && walkInStartTime && (
                    <div className="flex flex-col items-end text-right">
                      <label className="block text-xs text-gray-600 mb-1">Thời gian kết thúc dự kiến</label>
                      <div className="flex items-center gap-2 justify-end">
                        <input
                          type="text"
                          className="w-16 text-center border px-3 py-2 rounded-lg bg-white border-[#39BDCC] text-[#39BDCC]"
                          readOnly
                          value={String((walkInEndTime.getUTCHours() + 7) % 24).padStart(2, '0')}
                        />
                        <span className="font-semibold">:</span>
                        <input
                          type="text"
                          className="w-16 text-center border px-3 py-2 rounded-lg bg-white border-[#39BDCC] text-[#39BDCC]"
                          readOnly
                          value={String(walkInEndTime.getUTCMinutes()).padStart(2, '0')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Textarea
              label="Ghi chú (không bắt buộc)"
              value={walkInForm.notes}
              onValueChange={(v) => setWalkInForm(prev => ({ ...prev, notes: v }))}
              minRows={3}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsWalkInOpen(false)} isDisabled={walkInSubmitting}>Đóng</Button>
            <Button
              color="primary"
              isLoading={walkInSubmitting}
              onPress={async () => {
                // Basic validation
                const newErr: Record<string, string> = {};
                if (!walkInForm.fullName?.trim()) newErr.fullName = "Vui lòng nhập họ tên.";
                // Email format
                // Cho phép mọi domain hợp lệ (dạng chung, không giới hạn nhà cung cấp)
                const emailValue = (walkInForm.email || "").trim();
                const emailOk = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(emailValue);
                if (!emailOk) newErr.email = "Email không hợp lệ";
                // Phone: 8-15 digits (cho phép + và khoảng trắng/dấu gạch bỏ đi)
                const normalizedPhone = walkInForm.phoneNumber.replace(/[^0-9]/g, "");
                if (normalizedPhone.length !== 10) newErr.phoneNumber = "Số điện thoại phải gồm 10 chữ số.";
                if (!walkInForm.serviceId) newErr.serviceId = "Vui lòng chọn dịch vụ.";
                if (!walkInForm.doctorUserId) newErr.doctorUserId = "Vui lòng chọn bác sĩ.";
                if (!walkInForm.date) newErr.date = "Vui lòng chọn ngày.";
                // Validate ngày bằng parse an toàn (không phụ thuộc regex UI)
                const dateObjForCheck = new Date(walkInForm.date + "T00:00:00");
                if (!walkInForm.date || isNaN(dateObjForCheck.getTime())) newErr.date = "Ngày không hợp lệ";
                if (Object.keys(newErr).length) { setWalkInErrors(newErr); return; }
                if (!walkInDoctorScheduleId) {
                  toast.error("Không tìm thấy lịch làm việc của bác sĩ cho ngày này");
                  return;
                }
                try {
                  setWalkInSubmitting(true);
                  if (!walkInStartTime || !walkInEndTime) {
                    toast.error("Vui lòng nhập thời gian bắt đầu hợp lệ");
                    return;
                  }
                  const res = await appointmentApi.createWalkIn({
                    fullName: walkInForm.fullName,
                    email: walkInForm.email,
                    phoneNumber: walkInForm.phoneNumber,
                    serviceId: walkInForm.serviceId,
                    doctorUserId: walkInForm.doctorUserId,
                    doctorScheduleId: walkInDoctorScheduleId,
                    selectedSlot: { startTime: walkInStartTime.toISOString(), endTime: walkInEndTime.toISOString() },
                    notes: walkInForm.notes || undefined
                  } as any);
                  if (res.success) {
                    toast.success("Tạo lịch trực tiếp thành công");
                    setIsWalkInOpen(false);
                    setWalkInForm({
                      fullName: "",
                      email: "",
                      phoneNumber: "",
                      serviceId: "",
                      doctorUserId: "",
                      date: "",
                      selectedSlotISO: "",
                      notes: ""
                    });
                    await refetchAllAppointments();
                  } else {
                    toast.error(res.message || "Tạo lịch thất bại");
                  }
                } catch (e: any) {
                  toast.error(e.message || "Tạo lịch thất bại");
                } finally {
                  setWalkInSubmitting(false);
                }
              }}
            >
              Xác nhận tạo lịch
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
                        <p className="font-semibold text-lg">{detailData.patient?.fullName || "Chưa có"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Bác sĩ</p>
                        <p className="font-semibold text-lg">{detailData.doctor?.fullName || "Chưa có"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dịch vụ</p>
                        <p className="font-semibold text-lg">{detailData.service?.serviceName || "Chưa có"}</p>
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

      {/* Header - Outside card */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý ca khám</h1>
        <p className="text-gray-600 mt-1 text-base">Theo dõi và quản lý tất cả các ca khám</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <XCircleIcon className="w-6 h-6 text-danger-600 flex-shrink-0" />
            <p className="text-danger-700">{error}</p>
          </div>
        </div>
      )}

      {/* Table with Filters and Tabs */}
      <Card className="shadow-lg border border-gray-100">
        <CardBody className="p-0">
          {/* Filters */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input
                placeholder="Tìm kiếm bệnh nhân, dịch vụ..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
                isClearable
                onClear={() => setSearchText("")}
                size="lg"
                variant="bordered"
                classNames={{
                  inputWrapper: "border-2 hover:border-[#39BDCC] data-[focus=true]:border-[#39BDCC] h-14",
                }}
              />

              <Select
                placeholder="Chọn bác sĩ"
                selectedKeys={selectedDoctor !== "all" ? new Set([selectedDoctor]) : new Set([])}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  setSelectedDoctor(selected ? String(selected) : "all");
                }}
                size="lg"
                variant="bordered"
                startContent={<UserGroupIcon className="w-5 h-5 text-gray-400" />}
                classNames={{
                  trigger: "border-2 hover:border-[#39BDCC] data-[focus=true]:border-[#39BDCC] h-14",
                }}
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
            <div className="mt-4 flex justify-end">
              <Button color="primary" onPress={() => setIsWalkInOpen(true)} startContent={<UserPlusIcon className="w-5 h-5" />}>
                Tạo lịch trực tiếp
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-6 border-b border-gray-200">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(String(key))}
              size="lg"
              variant="underlined"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                cursor: "w-full bg-gray-900",
                tab: "max-w-fit px-4 h-12",
                tabContent: "group-data-[selected=true]:text-gray-900 font-semibold"
              }}
            >
              <Tab key="all" title={`Tất cả (${stats.total})`} />
              <Tab 
                key="Pending" 
                title={
                  <div className="relative flex items-center">
                    <span>Chờ duyệt ({stats.pending})</span>
                    {stats.pending > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                } 
              />
              <Tab key="Approved" title={`Đã xác nhận (${stats.approved})`} />
              <Tab key="CheckedIn" title={`Đã có mặt (${stats.checkedIn})`} />
              <Tab key="InProgress" title={`Đang khám (${stats.inProgress})`} />
              <Tab key="Completed" title={`Hoàn thành (${stats.completed})`} />
              <Tab key="Cancelled" title={`Đã hủy (${stats.cancelled})`} />
            </Tabs>
          </div>

          {/* Table */}
          <Table 
            aria-label="Bảng quản lý ca khám"
            removeWrapper
            classNames={{
              th: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-bold text-sm uppercase tracking-wide",
              td: "py-5 border-b border-gray-100",
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
                <TableRow key={appointment.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                  <TableCell>
                    <span className="font-semibold text-gray-900">{formatDate(appointment.startTime)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-700">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{appointment.patientName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Đặt lúc: {formatLocalDateTime(appointment.createdAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // ⭐ Nếu đã có bác sĩ thay thế, hiển thị tên bác sĩ thay thế (không hiển thị "Vắng mặt")
                      if (appointment.hasReplacementDoctor) {
                        return (
                          <Chip variant="flat" color="default">
                            {appointment.doctorName}
                          </Chip>
                        );
                      }
                      
                      // ⭐ Nếu chưa có bác sĩ thay thế, kiểm tra xem bác sĩ gốc có on leave không
                      const isOnLeave = isDoctorOnLeave(appointment);
                      // ⭐ Chỉ hiển thị vắng mặt cho các ca đang chờ duyệt, đã approved, hoặc đã check-in
                      // KHÔNG hiển thị cho các ca đã hoàn thành (Completed) hoặc đang tiến hành (InProgress)
                      const allowedStatuses = ['Pending', 'Approved', 'CheckedIn'];
                      const shouldShowAbsent = isOnLeave && allowedStatuses.includes(appointment.status);
                      
                      return shouldShowAbsent ? (
                        <Chip variant="flat" color="danger">
                          Vắng mặt
                        </Chip>
                      ) : (
                        <Chip variant="flat" color="default">
                          {appointment.doctorName}
                        </Chip>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-gray-700">{appointment.serviceName}</p>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(appointment.status)}
                      variant="flat"
                      size="lg"
                      className="font-semibold"
                    >
                      {getStatusText(appointment.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {appointment.checkedInAt ? (
                      <div className="text-sm">
                        <p className="font-bold text-gray-900">{formatLocalDateTime(appointment.checkedInAt)}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm font-medium">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {(() => {
                        const isOnLeave = isDoctorOnLeave(appointment);
                        if (isOnLeave) {
                          return shouldShowReassignButton(appointment, isOnLeave) ? (
                            <Tooltip content="Gán bác sĩ">
                              <Button
                                isIconOnly
                                size="md"
                                variant="light"
                                className="text-purple-600 hover:bg-purple-50 transition-colors"
                                onPress={() => openReassignModal(appointment)}
                                isDisabled={processingId === appointment.id}
                              >
                                <UserPlusIcon className="w-5 h-5" />
                              </Button>
                            </Tooltip>
                          ) : null;
                        }

                        return (
                          <>
                            {appointment.status === "Pending" && (
                              <>
                                <Tooltip content="Xác nhận">
                                  <Button
                                    isIconOnly
                                    size="md"
                                    variant="light"
                                    className="text-green-600 hover:bg-green-50 transition-colors"
                                    onPress={() => handleApprove(appointment.id)}
                                    isDisabled={processingId === appointment.id}
                                    isLoading={processingId === appointment.id}
                                  >
                                    <CheckCircleIcon className="w-5 h-5" />
                                  </Button>
                                </Tooltip>
                                <Tooltip content="Hủy">
                                  <Button
                                    isIconOnly
                                    size="md"
                                    variant="light"
                                    className="text-red-600 hover:bg-red-50 transition-colors"
                                    onPress={() => openCancelModal(appointment.id)}
                                    isDisabled={processingId === appointment.id}
                                  >
                                    <XCircleIcon className="w-5 h-5" />
                                  </Button>
                                </Tooltip>
                              </>
                            )}
                            {appointment.status === "Approved" && (
                              <>
                                {/* ⭐ Chỉ hiển thị nút check-in khi đã đến ngày của ca khám */}
                                {isAppointmentDateReached(appointment.startTime) ? (
                                  <Tooltip content="Có mặt">
                                    <Button
                                      isIconOnly
                                      size="md"
                                      variant="light"
                                      className="text-blue-600 hover:bg-blue-50 transition-colors"
                                      onPress={() => handleUpdateStatus(appointment.id, "CheckedIn")}
                                      isDisabled={processingId === appointment.id}
                                      isLoading={processingId === appointment.id}
                                    >
                                      <CheckIcon className="w-5 h-5" />
                                    </Button>
                                  </Tooltip>
                                ) : null}
                                {/* ⭐ Không hiển thị nút No Show khi chỉ approved - chỉ hiển thị khi đã check-in */}
                              </>
                            )}
                            {appointment.status === "CheckedIn" && (
                              <Tooltip content="Vắng mặt">
                                <Button
                                  isIconOnly
                                  size="md"
                                  variant="light"
                                  className="text-orange-600 hover:bg-orange-50 transition-colors"
                                  onPress={() => handleUpdateStatus(appointment.id, "No-Show")}
                                  isDisabled={processingId === appointment.id}
                                  isLoading={processingId === appointment.id}
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </Button>
                              </Tooltip>
                            )}
                            {/* ⭐ Chỉ cho phép check-in từ No-Show khi đã đến ngày và trong giờ làm việc */}
                            {appointment.status === "No-Show" && isWithinWorkingHours(appointment) && isAppointmentDateReached(appointment.startTime) && (
                              <Tooltip content="Có mặt">
                                <Button
                                  isIconOnly
                                  size="md"
                                  variant="light"
                                  className="text-blue-600 hover:bg-blue-50 transition-colors"
                                  onPress={() => handleUpdateStatus(appointment.id, "CheckedIn")}
                                  isDisabled={processingId === appointment.id}
                                  isLoading={processingId === appointment.id}
                                >
                                  <CheckIcon className="w-5 h-5" />
                                </Button>
                              </Tooltip>
                            )}
                            {(!["Pending", "Approved", "CheckedIn", "No-Show"].includes(appointment.status) ||
                              (appointment.status === "No-Show" && !isWithinWorkingHours(appointment))) && (
                              <div className="flex gap-2">
                                {appointment.status === "Completed" && (
                                  <Tooltip content="Xuất PDF">
                                    <Button
                                      isIconOnly
                                      size="md"
                                      variant="light"
                                      className="text-green-600 hover:bg-green-50 transition-colors"
                                      onPress={() => handleDownloadPDF(appointment.id)}
                                      isDisabled={processingId === appointment.id}
                                      isLoading={processingId === appointment.id}
                                    >
                                      <DocumentArrowDownIcon className="w-5 h-5" />
                                    </Button>
                                  </Tooltip>
                                )}
                                {appointment.status === "Cancelled" || appointment.status === "Refunded" ? (
                                  <Tooltip content="Xem chi tiết">
                                    <Button
                                      isIconOnly
                                      size="md"
                                      variant="light"
                                      className="text-blue-600 hover:bg-blue-50 transition-colors"
                                      onPress={() => openDetailModal(appointment.id)}
                                    >
                                      <EyeIcon className="w-5 h-5" />
                                    </Button>
                                  </Tooltip>
                                ) : null}
                              </div>
                            )}
                          </>
                        );
                      })()}
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
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredAppointments.length)} trong tổng số {filteredAppointments.length} ca khám
          </div>

          <div className="flex items-center space-x-2">
            {/* Previous button */}
            <Button
              isDisabled={currentPage === 1}
              size="sm"
              variant="bordered"
              onPress={() => setCurrentPage(currentPage - 1)}
            >
              ←
            </Button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                className="min-w-8"
                color={currentPage === page ? "primary" : "default"}
                size="sm"
                variant={currentPage === page ? "solid" : "bordered"}
                onPress={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}

            {/* Next button */}
            <Button
              isDisabled={currentPage === totalPages}
              size="sm"
              variant="bordered"
              onPress={() => setCurrentPage(currentPage + 1)}
            >
              →
            </Button>
          </div>
        </div>
      )}

      {/* Reassign Doctor Modal */}
      {reassignAppointment && (
        <ReassignDoctorModal
          isOpen={isReassignModalOpen}
          onClose={closeReassignModal}
          onSuccess={handleReassignSuccess}
          appointmentId={reassignAppointment.id}
          currentDoctorName={reassignAppointment.doctorName}
          startTime={reassignAppointment.startTime}
          endTime={reassignAppointment.endTime}
        />
      )}
      </div>
    </div>
  );
};

export default AllAppointments;
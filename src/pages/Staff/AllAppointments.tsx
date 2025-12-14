import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { appointmentApi, leaveRequestApi, availableDoctorApi } from "@/api";
import { availableSlotApi, getDoctorScheduleRange, validateAppointmentTime } from "@/api/availableSlot";
import { doctorApi } from "@/api/doctor";
import { serviceApi } from "@/api/service";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/Common";
import VietnameseDateInput from "@/components/Common/VietnameseDateInput";
import { ReassignDoctorModal } from "@/components/Staff";
import toast from "react-hot-toast";
// ===== Interface định nghĩa =====
interface Appointment {
  id: string;
  status: string;
  type?: string; // ⭐ THÊM: Type của appointment (Consultation, Examination, FollowUp)
  patientName: string;
  doctorName: string;
  doctorUserId?: string; // Thêm doctorUserId để check leave
  doctorStatus?: string | null; // ⭐ Status của doctor: 'Available', 'Busy', 'On Leave', 'Inactive'
  hasReplacementDoctor?: boolean; // ⭐ Đã có bác sĩ thay thế được confirm (replacedDoctorUserId = null)
  hasPendingReplacement?: boolean; // ⭐ Có bác sĩ thay thế đang chờ patient confirm (replacedDoctorUserId != null)
  serviceName: string;
  allServices?: string[]; // ⭐ THÊM: Tất cả dịch vụ (serviceId + additionalServiceIds) cho ca tái khám
  startTime: string;
  endTime: string;
  checkedInAt: string;
  createdAt: string;
  updatedAt?: string; // ⭐ THÊM: Thời gian cập nhật để sắp xếp
  noTreatment?: boolean;
  mode: string; // ⭐ THÊM: Mode của appointment (Online/Offline)
  hasVisitTicket?: boolean; // ⭐ Đánh dấu đã xuất phiếu khám
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
  appointmentFor?: string; // ⭐ THÊM: 'self' hoặc 'other' để biết đặt cho ai
  service?: { serviceName?: string; price?: number } | null;
  additionalServiceIds?: Array<{ serviceName?: string; price?: number }> | null; // ⭐ THÊM: Dịch vụ bổ sung cho ca tái khám
  doctor?: { fullName?: string; phoneNumber?: string } | null; // ⭐ THÊM: phoneNumber cho doctor
  patient?: { fullName?: string; phoneNumber?: string } | null; // ⭐ THÊM: phoneNumber cho patient
  customer?: { fullName?: string; phoneNumber?: string } | null; // ⭐ THÊM: Thông tin customer khi đặt cho người khác
  timeslot?: { startTime?: string; endTime?: string } | null;
  noTreatment?: boolean; // ⭐ THÊM: Trường noTreatment
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
  const [itemsPerPage] = useState(5);

  // Danh sách unique doctors
  const [doctors, setDoctors] = useState<string[]>([]);

  // Detail modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<AppointmentDetailData | null>(null);

  // Reassign Doctor Modal states
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignAppointment, setReassignAppointment] = useState<Appointment | null>(null);
  const [prefetchedDoctors, setPrefetchedDoctors] = useState<Array<{ _id: string; fullName: string }>>([]);
  const [isPrefetchingDoctors, setIsPrefetchingDoctors] = useState(false);

  // Leave requests state - để check doctor có leave không
  const [approvedLeaves, setApprovedLeaves] = useState<Array<{
    userId: string;
    startDate: string;
    endDate: string;
  }>>([]);

  // Walk-in modal states (restructured to match BookingModal)
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  // ⭐ NEW: Restructured form state for sequential flow
  const [walkInForm, setWalkInForm] = useState<{
    fullName: string;
    email: string;
    phoneNumber: string;
    date: string; // YYYY-MM-DD - Selected FIRST
    serviceId: string; // Selected SECOND
    doctorUserId: string; // Selected THIRD
    userStartTimeInput: string; // User input "HH:mm" - Selected FOURTH
    startTime: Date | null; // Converted from userStartTimeInput
    endTime: Date | null; // From validation response
    doctorScheduleId: string | null;
    notes: string;
  }>({
    fullName: "",
    email: "",
    phoneNumber: "",
    date: "",
    serviceId: "",
    doctorUserId: "",
    userStartTimeInput: "",
    startTime: null,
    endTime: null,
    doctorScheduleId: null,
    notes: ""
  });

  // ⭐ NEW: Reservation state (like BookingModal)
  const [walkInReservation, setWalkInReservation] = useState<{
    timeslotId: string;
    expiresAt: string;
    countdownSeconds: number;
  } | null>(null);

  // ⭐ NEW: Available doctors (filtered by leave)
  const [walkInAvailableDoctors, setWalkInAvailableDoctors] = useState<Array<{ _id: string; fullName: string }>>([]);
  const [walkInLoadingDoctors, setWalkInLoadingDoctors] = useState(false);
  const [hasAttemptedDoctorFetch, setHasAttemptedDoctorFetch] = useState(false); // ⭐ Track if we've tried fetching

  // ⭐ NEW: Schedule ranges
  const [walkInScheduleRanges, setWalkInScheduleRanges] = useState<any>(null);
  const [walkInServices, setWalkInServices] = useState<Array<{ _id: string; serviceName: string; durationMinutes?: number }>>([]);
  const [walkInDoctorScheduleId, setWalkInDoctorScheduleId] = useState<string | null>(null);
  const [walkInLoadingSlots, setWalkInLoadingSlots] = useState(false);
  const [walkInLoadingSchedule, setWalkInLoadingSchedule] = useState(false); // ⭐ NEW: Loading state for schedule
  const [walkInTimeError, setWalkInTimeError] = useState<string | null>(null);
  const [walkInErrors, setWalkInErrors] = useState<Record<string, string>>({});

  // ⭐ PERFORMANCE: useRef for debouncing release slot API calls
  const releaseSlotTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        setWalkInAvailableDoctors(res.data);
      }
    } catch (err: any) {
      console.error("Error fetching all doctors:", err);
      // Fallback: lấy từ appointments nếu API lỗi
    }
  };

  // Load services Active (giống form bệnh nhân: có promotion fields, lọc status Active)
  const fetchWalkInServices = async () => {
    try {
      const res = await serviceApi.getPublicServices({ status: "Active", limit: 100, category: "Examination", minPrice: 0 });
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

  // ⭐ NEW: Fetch available doctors (filtered by date + service) - Backend already filters leave
  // ⭐ OPTIMIZED: Wrapped with useCallback to prevent re-creation on every render
  const fetchWalkInAvailableDoctors = useCallback(async () => {
    const { date, serviceId } = walkInForm;

    if (!date || !serviceId) {
      setWalkInAvailableDoctors([]);
      setHasAttemptedDoctorFetch(false);
      return;
    }

    try {
      setWalkInLoadingDoctors(true);
      setHasAttemptedDoctorFetch(true); // ⭐ Mark that we've attempted

      // Fetch available doctors for this date + service
      // ⭐ Backend already filters out doctors on leave, so we don't need to filter again
      const res = await availableDoctorApi.getByDate(serviceId, date);

      if (!res.success || !res.data || !res.data.availableDoctors) {
        setWalkInAvailableDoctors([]);
        return;
      }

      // Map to correct format
      const doctors = res.data.availableDoctors.map(doc => ({
        _id: doc.doctorId,
        fullName: doc.doctorName
      }));

      console.log(`✅ [fetchWalkInAvailableDoctors] Found ${doctors.length} available doctors (backend already filtered leave)`);
      setWalkInAvailableDoctors(doctors);

    } catch (e) {
      console.error("❌ Lỗi tải available doctors cho walk-in:", e);
      setWalkInAvailableDoctors([]);
    } finally {
      setWalkInLoadingDoctors(false);
    }
  }, [walkInForm.date, walkInForm.serviceId]);


  // Fetch available slots when doctor/service/date selected
  // Lấy scheduleRanges giống BookingModal (BE đã chuẩn hóa)
  // @param silent - If true, skip showing loading spinner (for background refresh)
  // ⭐ OPTIMIZED: Wrapped with useCallback to prevent re-creation on every render
  const fetchWalkInScheduleRanges = useCallback(async (silent: boolean = false) => {
    const { doctorUserId, serviceId, date } = walkInForm;
    if (!doctorUserId || !serviceId || !date) {
      setWalkInScheduleRanges(null);
      setWalkInDoctorScheduleId(null);
      return;
    }
    try {
      if (!silent) {
        setWalkInLoadingSchedule(true); // ⭐ Set loading state only if not silent
      }

      // ⭐ FIX: Pass staffUserId để backend loại trừ reserved slots của chính staff
      // Lấy staffUserId từ auth context
      const staffUserId = user?._id || user?.id;

      const res = await getDoctorScheduleRange(
        doctorUserId,
        serviceId,
        date,
        "other",
        undefined, // customerFullName
        undefined, // customerEmail
        staffUserId // ⭐ THÊM: Pass staffUserId để backend loại trừ reserved slots
      );
      if (res.success && (res as any).data) {
        const data: any = (res as any).data;
        setWalkInScheduleRanges(data.scheduleRanges || []);
        setWalkInDoctorScheduleId(data.doctorScheduleId || null);
      } else {
        console.warn('⚠️ [fetchWalkInScheduleRanges] Backend returned error or no data:', res);
        setWalkInScheduleRanges(null);
        setWalkInDoctorScheduleId(null);
      }
    } catch (e) {
      console.error("❌ Lỗi tải scheduleRanges walk-in:", e);
      setWalkInScheduleRanges(null);
      setWalkInDoctorScheduleId(null);
    } finally {
      if (!silent) {
        setWalkInLoadingSchedule(false); // ⭐ Clear loading state only if not silent
      }
    }
  }, [walkInForm.doctorUserId, walkInForm.serviceId, walkInForm.date, user]);

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

  // ⭐ NEW: Handle time input blur with SLOT RESERVATION (like BookingModal)
  // ⭐ OPTIMIZED: Wrapped with useCallback to prevent re-creation on every render
  const handleWalkInTimeBlur = useCallback(async (timeInput: string) => {
    if (!timeInput || !walkInForm.doctorUserId) {
      setWalkInForm(prev => ({ ...prev, endTime: null }));
      return;
    }

    // Validate format
    const timeRegex = /^(\d{1,2}):(\d{1,2})$/;
    if (!timeRegex.test(timeInput)) {
      setWalkInTimeError("Định dạng thời gian không hợp lệ. Vui lòng nhập HH:mm");
      setWalkInForm(prev => ({ ...prev, endTime: null }));
      return;
    }

    const [hours, minutes] = timeInput.split(":");
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);

    if (h < 0 || h > 23) {
      setWalkInTimeError("Giờ không hợp lệ. 00-23");
      setWalkInForm(prev => ({ ...prev, endTime: null }));
      return;
    }

    if (m < 0 || m > 59) {
      setWalkInTimeError("Phút không hợp lệ. 00-59");
      setWalkInForm(prev => ({ ...prev, endTime: null }));
      return;
    }

    if (!isTimeInWalkInRanges(timeInput)) {
      setWalkInTimeError("Khung giờ này không nằm trong khoảng khả dụng.");
      setWalkInForm(prev => ({ ...prev, endTime: null }));
      return;
    }

    // Convert VN → UTC
    const dateObj = new Date((walkInForm.date || "") + "T00:00:00.000Z");
    const utcHours = h - 7;
    dateObj.setUTCHours(utcHours, m, 0, 0);
    const startISO = dateObj.toISOString();

    // ⭐ Check if this time is already reserved - if so, skip reservation
    if (walkInReservation && walkInForm.startTime) {
      const currentReservedTime = walkInForm.startTime.toISOString();
      if (currentReservedTime === startISO) {
        // Same time already reserved, no need to reserve again
        return;
      } else {
        // Different time, release old reservation first
        await appointmentApi.releaseSlot({ timeslotId: walkInReservation.timeslotId })
          .catch(err => console.warn("Failed to release old slot:", err));
        setWalkInReservation(null);
      }
    }

    try {
      // Step 1: Validate time
      const validateRes = await validateAppointmentTime(
        walkInForm.doctorUserId,
        walkInForm.serviceId,
        walkInForm.date,
        startISO
      );

      if (!validateRes.success) {
        setWalkInTimeError(validateRes.message || "Thời gian không hợp lệ");
        setWalkInForm(prev => ({ ...prev, endTime: null }));
        return;
      }

      // Step 2: Reserve slot (60s hold)
      const reserveRes = await appointmentApi.reserveSlot({
        doctorUserId: walkInForm.doctorUserId,
        serviceId: walkInForm.serviceId,
        doctorScheduleId: walkInForm.doctorScheduleId,
        date: walkInForm.date,
        startTime: startISO,
        appointmentFor: "other" // Staff always books for "other"
      });

      if (!reserveRes.success || !reserveRes.data) {
        setWalkInTimeError(reserveRes.message || "Không thể giữ chỗ");
        setWalkInForm(prev => ({ ...prev, endTime: null }));
        return;
      }

      // Success! Update state
      setWalkInTimeError(null);
      setWalkInForm(prev => ({
        ...prev,
        startTime: dateObj,
        endTime: new Date(reserveRes.data!.endTime),
        doctorScheduleId: reserveRes.data!.doctorScheduleId || prev.doctorScheduleId
      }));

      // Set reservation with countdown
      const expiresAt = reserveRes.data.expiresAt;
      const countdownSeconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

      setWalkInReservation({
        timeslotId: reserveRes.data.timeslotId,
        expiresAt: expiresAt,
        countdownSeconds: countdownSeconds
      });

      // ⭐ REMOVED: toast.success message for faster UX
      // Countdown timer already indicates successful reservation

      // ⭐ Refetch schedule ranges silently to update available time display
      // Pass true to skip showing loading spinner (silent refresh)
      fetchWalkInScheduleRanges(true).catch(err => console.warn("Failed to refresh schedule:", err));

    } catch (e: any) {
      setWalkInTimeError(e.message || "Lỗi validate thời gian");
      setWalkInForm(prev => ({ ...prev, endTime: null }));
    }
  }, [walkInForm.doctorUserId, walkInForm.serviceId, walkInForm.date, walkInForm.doctorScheduleId, walkInForm.startTime, walkInReservation, isTimeInWalkInRanges, fetchWalkInScheduleRanges]);

  // ⭐ Countdown timer for walk-in reservation
  useEffect(() => {
    if (!walkInReservation || walkInReservation.countdownSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setWalkInReservation(prev => {
        if (!prev) return null;

        const newCountdown = prev.countdownSeconds - 1;

        // Hết hạn → auto release
        if (newCountdown <= 0) {
          appointmentApi.releaseSlot({ timeslotId: prev.timeslotId })
            .then(() => {
              toast.error('Giữ chỗ đã hết hạn. Vui lòng chọn lại thời gian.');
              // Refetch schedule ranges để hiển thị lại slot
              fetchWalkInScheduleRanges().catch(err => console.warn('Failed to refresh:', err));
            })
            .catch(err => console.warn('Failed to release expired slot:', err));
          return null;
        }

        return { ...prev, countdownSeconds: newCountdown };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [walkInReservation?.timeslotId]); // Chỉ re-run khi timeslotId thay đổi

  // ⭐ REMOVED: tryUpdateWalkInEndTimeLive (không cần nữa vì đã có reservation)


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

          // ⭐ THÊM: Lấy tất cả dịch vụ cho ca tái khám (serviceId + additionalServiceIds)
          const allServices: string[] = [];
          const mainService = apt.serviceId?.serviceName;
          if (mainService) {
            allServices.push(mainService);
          }

          // Nếu là ca tái khám, thêm các dịch vụ bổ sung
          if (apt.type === 'FollowUp') {
            // Ưu tiên sử dụng additionalServiceNames nếu có (backend đã map sẵn)
            if (apt.additionalServiceNames && Array.isArray(apt.additionalServiceNames) && apt.additionalServiceNames.length > 0) {
              apt.additionalServiceNames.forEach((serviceName: string) => {
                if (serviceName && !allServices.includes(serviceName)) {
                  allServices.push(serviceName);
                }
              });
            }
            // Nếu không có additionalServiceNames, thử lấy từ additionalServiceIds
            else if (apt.additionalServiceIds && Array.isArray(apt.additionalServiceIds)) {
              apt.additionalServiceIds.forEach((service: any) => {
                let serviceName: string | null = null;

                // Nếu là object đã được populate, lấy serviceName
                if (typeof service === 'object' && service !== null) {
                  serviceName = service.serviceName || service.name || null;
                }
                // Nếu là string, có thể là ID - bỏ qua (không hiển thị ID)
                else if (typeof service === 'string') {
                  // Nếu là ID, không thêm vào danh sách
                  console.warn('⚠️ [AllAppointments] additionalServiceIds contains ID instead of populated object:', service);
                  return;
                }

                if (serviceName && !allServices.includes(serviceName)) {
                  allServices.push(serviceName);
                }
              });
            }
          }

          return {
            id: apt._id,
            status: apt.status,
            type: apt.type || "Examination", // ⭐ THÊM: Type của appointment
            patientName: patientName,
            doctorName: doctorName,
            doctorUserId: doctorUserId, // Thêm doctorUserId
            doctorStatus: apt.doctorStatus || null, // ⭐ Thêm doctorStatus từ backend
            hasReplacementDoctor: hasReplacementDoctor,
            hasPendingReplacement: hasPendingReplacement,
            serviceName: apt.serviceId?.serviceName || "Chưa có",
            allServices: allServices.length > 0 ? allServices : undefined, // ⭐ THÊM: Tất cả dịch vụ
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
            updatedAt: apt.updatedAt || apt.createdAt || "", // ⭐ Thêm updatedAt để sắp xếp
            noTreatment: !!apt.noTreatment,
            mode: apt.mode || "Offline", // ⭐ Map mode từ API
            hasVisitTicket: Boolean((apt as any).hasVisitTicket),
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
      // HOẶC nếu backend controller trả về dạng paginated: { success: true, data: { data: LeaveRequest[], total... } }
      
      let leavesData: any[] = [];
      
      // Handle different response structures
      if (res && res.success) {
         if (Array.isArray(res.data)) {
           leavesData = res.data;
         } else if (res.data && Array.isArray((res.data as any).data)) {
           leavesData = (res.data as any).data;
         }
      }

      if (leavesData.length > 0) {
        const leaves = leavesData.map((leave: any) => {
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
        console.log('⚠️ [fetchApprovedLeaves] No approved leaves found (response data empty)');
        setApprovedLeaves([]);
      }
    } catch (err: any) {
      console.error("❌ Error fetching approved leaves:", err);
      setApprovedLeaves([]);
    }
  };

  // ===== Helper: Check doctor có leave trong thời gian appointment không =====
  const isDoctorOnLeave = (appointment: Appointment): boolean => {
    // ⭐ Ưu tiên kiểm tra theo ngày của appointment (chính xác nhất)
    if (appointment.doctorUserId && appointment.startTime && approvedLeaves.length > 0) {
      const appointmentDate = new Date(appointment.startTime);
      if (!isNaN(appointmentDate.getTime())) {
        // Normalize appointment date to Start of Day (UTC+7 handled implicitly if using extracted string components, or just strip time)
        // Here we use simple string comparison YYYY-MM-DD for robustness
        const aptDateStr = new Date(appointmentDate.getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];

        const doctorId = appointment.doctorUserId.toString().trim();

        // Check xem có leave nào cover appointmentDate không
        const isOnLeaveByDate = approvedLeaves.some((leave) => {
          const leaveUserId = (leave.userId?.toString() || leave.userId || "").trim();

          if (leaveUserId !== doctorId) {
            return false;
          }

          const leaveStart = new Date(leave.startDate);
          const leaveEnd = new Date(leave.endDate);

          if (isNaN(leaveStart.getTime()) || isNaN(leaveEnd.getTime())) {
            return false;
          }

          // Normalize ranges to strings for robust include check
          // Assuming leave dates are stored as UTC midnights or similar. 
          // Let's compare timestamps safely by stripping time.
          const checkTime = new Date(aptDateStr).getTime();
          const startTime = new Date(leaveStart.toISOString().split('T')[0]).getTime();
          const endTime = new Date(leaveEnd.toISOString().split('T')[0]).getTime();

          return checkTime >= startTime && checkTime <= endTime;
        });

        // Nếu kiểm tra theo ngày cho kết quả, trả về ngay
        if (isOnLeaveByDate) {
          return true;
        }
      }
    }

    // ⭐ Fallback: Check doctorStatus từ backend (chỉ dùng khi không có approvedLeaves hoặc không có startTime)
    // Backend đã được sửa để chỉ set doctorStatus = 'On Leave' khi appointment thực sự nằm trong khoảng nghỉ phép
    if (appointment.doctorStatus === 'On Leave') {
      return true;
    }

    return false;
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


  // ⭐ NEW: Countdown timer for reservation
  useEffect(() => {
    if (!walkInReservation) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(walkInReservation.expiresAt).getTime() - Date.now()) / 1000)
      );

      if (remaining === 0) {
        setWalkInReservation(null);
        toast.error("Hết thời gian giữ chỗ. Vui lòng chọn lại giờ.");
      } else {
        setWalkInReservation(prev => prev ? { ...prev, countdownSeconds: remaining } : null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [walkInReservation]);

  // ⭐ NEW: Auto-release reservation when date/service/doctor changes
  useEffect(() => {
    if (walkInReservation) {
      // Release current reservation
      appointmentApi.releaseSlot({ timeslotId: walkInReservation.timeslotId })
        .then(() => {
          console.log("✅ Auto-released reservation due to field change");
        })
        .catch(err => {
          console.warn("⚠️ Failed to auto-release:", err);
        });

      setWalkInReservation(null);
    }

    // Clear time input and errors
    setWalkInForm(prev => ({
      ...prev,
      userStartTimeInput: "",
      startTime: null,
      endTime: null
    }));
    setWalkInTimeError(null);

    // Fetch schedule ranges when doctor selected
    fetchWalkInScheduleRanges();
  }, [walkInForm.doctorUserId, walkInForm.serviceId, walkInForm.date]);

  // ⭐ NEW: Fetch available doctors when date + service selected - WITH DEBOUNCING
  useEffect(() => {
    if (!walkInForm.date || !walkInForm.serviceId) {
      setWalkInAvailableDoctors([]);
      setHasAttemptedDoctorFetch(false);
      return;
    }

    // Debounce API call to prevent excessive requests
    const timeoutId = setTimeout(() => {
      fetchWalkInAvailableDoctors();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [walkInForm.date, walkInForm.serviceId, approvedLeaves]);

  // ⭐ NEW: Reset service and doctor when date changes
  // Use ref to track previous date to avoid triggering on initial mount
  const prevWalkInDateRef = useRef<string | null>(null);

  useEffect(() => {
    // Only reset if date actually changed (not initial set)
    if (prevWalkInDateRef.current !== null && prevWalkInDateRef.current !== walkInForm.date && walkInForm.date) {
      console.log('📅 [Date Changed] Resetting service and doctor selections');
      console.log('   Previous date:', prevWalkInDateRef.current);
      console.log('   New date:', walkInForm.date);

      // Release reservation if exists
      if (walkInReservation) {
        appointmentApi.releaseSlot({ timeslotId: walkInReservation.timeslotId })
          .catch(err => console.warn("Failed to release on date change:", err));
        setWalkInReservation(null);
      }

      // Reset form fields
      setWalkInForm(prev => ({
        ...prev,
        serviceId: "",
        doctorUserId: "",
        userStartTimeInput: "",
        startTime: null,
        endTime: null,
        doctorScheduleId: null
      }));

      // Clear errors and states
      setWalkInTimeError(null);
      setWalkInErrors(prev => {
        const next = { ...prev };
        delete next.serviceId;
        delete next.doctorUserId;
        delete next.userStartTimeInput;
        return next;
      });
      setWalkInScheduleRanges(null);
      setWalkInAvailableDoctors([]);
      setHasAttemptedDoctorFetch(false);
    }

    // Update ref for next comparison
    prevWalkInDateRef.current = walkInForm.date;
  }, [walkInForm.date, walkInReservation]);


  // Khởi tạo ngày mặc định khi mở modal (hôm nay)
  useEffect(() => {
    if (!isWalkInOpen) {
      // ⭐ Reset prevRef when modal closes
      prevWalkInDateRef.current = null;
      return;
    }

    // Only initialize date when modal first opens and date is empty
    if (!walkInForm.date) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const iso = `${yyyy}-${mm}-${dd}`;

      setWalkInForm(prev => ({ ...prev, date: iso }));
      // ⭐ Initialize prevRef with default date
      prevWalkInDateRef.current = iso;
    } else {
      // ⭐ Initialize prevRef with current date when modal opens (if not already set)
      if (prevWalkInDateRef.current === null) {
        prevWalkInDateRef.current = walkInForm.date;
      }
    }
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
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(apt => {
        const matchesBasic =
          apt.patientName.toLowerCase().includes(searchLower) ||
          apt.serviceName.toLowerCase().includes(searchLower);

        const appointmentDateVi = apt.startTime
          ? new Date(apt.startTime).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).toLowerCase()
          : "";
        const appointmentDateTimeVi = apt.startTime
          ? new Date(apt.startTime).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).toLowerCase()
          : "";
        const matchesDate = appointmentDateVi.includes(searchLower) || appointmentDateTimeVi.includes(searchLower);

        return matchesBasic || matchesDate;
      });
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

    // ⭐ Sort by updatedAt/createdAt descending (mới nhất/vừa đặt/vừa cập nhật lên đầu)
    // Nếu không có updatedAt/createdAt thì dùng startTime
    filtered.sort((a, b) => {
      // Ưu tiên updatedAt, nếu không có thì dùng createdAt, nếu không có thì dùng startTime
      const timeA = a.updatedAt
        ? new Date(a.updatedAt).getTime()
        : (a.createdAt ? new Date(a.createdAt).getTime() : (a.startTime ? new Date(a.startTime).getTime() : 0));
      const timeB = b.updatedAt
        ? new Date(b.updatedAt).getTime()
        : (b.createdAt ? new Date(b.createdAt).getTime() : (b.startTime ? new Date(b.startTime).getTime() : 0));
      // ⭐ Descending: mới nhất lên đầu (thời gian lớn hơn lên trước)
      return timeB - timeA;
    });

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
  const openReassignModal = async (appointment: Appointment) => {
    // Mở modal ngay lập tức
    setReassignAppointment(appointment);
    setIsReassignModalOpen(true);

    // Pre-fetch danh sách bác sĩ trong background (modal đã mở)
    setIsPrefetchingDoctors(true);
    try {
      const response = await appointmentApi.getAvailableDoctors(
        appointment.id,
        appointment.startTime,
        appointment.endTime
      );

      if (response.success && response.data) {
        setPrefetchedDoctors(response.data.availableDoctors || []);
      } else {
        setPrefetchedDoctors([]);
      }
    } catch (error: any) {
      console.error("Error prefetching doctors:", error);
      setPrefetchedDoctors([]);
    } finally {
      setIsPrefetchingDoctors(false);
    }
  };

  // ===== Close Reassign Modal =====
  const closeReassignModal = () => {
    setIsReassignModalOpen(false);
    setReassignAppointment(null);
    setPrefetchedDoctors([]); // Clear cache khi đóng modal
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
      case "Completed":
      case "Refunded":
        return "success"; // Hoàn thành/hoàn tiền: xanh lá
      case "Approved":
        return "primary"; // Đã xác nhận: xanh dương
      case "CheckedIn":
      case "InProgress":
        return "default"; // Trung tính để không trùng màu
      case "Pending":
      case "PendingPayment":
        return "warning";
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

      const API_URL = import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api";

      // ⭐ Lấy token từ localStorage để gửi kèm Authorization header
      const token = localStorage.getItem("authToken");

      // ⭐ Tạo headers với Authorization nếu có token
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/appointments/${appointmentId}/visit-ticket/pdf`, {
        method: "GET",
        credentials: "include",
        headers: headers,
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
        // Đóng modal sau khi thành công
        closeDetailModal();
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
        {/* OLD WALK-IN MODAL COMPLETELY REMOVED - Using new redesigned modal below */}
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
                          <p className="font-semibold text-lg">
                            {detailData.appointmentFor === 'other' && detailData.customer
                              ? detailData.customer.fullName
                              : detailData.patient?.fullName || "Chưa có"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Số điện thoại</p>
                          <p className="font-semibold text-lg">
                            {detailData.appointmentFor === 'other' && detailData.customer
                              ? (detailData.customer.phoneNumber || "Chưa có")
                              : (detailData.patient?.phoneNumber || "Chưa có")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Bác sĩ</p>
                          <p className="font-semibold text-lg">{detailData.doctor?.fullName || "Chưa có"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Dịch vụ</p>
                          {/* ⭐ Hiển thị tất cả dịch vụ cho ca tái khám */}
                          {detailData.type === "FollowUp" && detailData.additionalServiceIds && detailData.additionalServiceIds.length > 0 ? (
                            <div className="space-y-1 mt-1">
                              {detailData.service?.serviceName && (
                                <p className="font-semibold text-lg">{detailData.service.serviceName}</p>
                              )}
                              {detailData.additionalServiceIds.map((service, index) => (
                                <p key={index} className="font-semibold text-lg">
                                  {service.serviceName || "Chưa có"}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="font-semibold text-lg">{detailData.service?.serviceName || "Chưa có"}</p>
                          )}
                          {/* ⭐ Badge hiển thị trạng thái tái khám */}
                          {detailData.type === "FollowUp" && (
                            <Chip
                              size="sm"
                              variant="flat"
                              color="primary"
                              className="mt-2"
                            >
                              Tái khám
                            </Chip>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Trạng thái</p>
                          <Chip color={getStatusColor(detailData.status)} variant="flat" className="mt-1">
                            {getStatusText(detailData.status)}
                          </Chip>
                          {detailData.status === "Completed" && detailData.noTreatment && (
                            <p className="text-xs text-gray-500 mt-1 font-medium">Không cần khám</p>
                          )}
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
                  size="lg"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button color="primary" onPress={() => setIsWalkInOpen(true)} startContent={<UserPlusIcon className="w-5 h-5" />}>
                  Đặt lịch cho bệnh nhân
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
                      <div className="space-y-1">
                        {/* ⭐ Hiển thị tất cả dịch vụ cho ca tái khám */}
                        {appointment.type === "FollowUp" && appointment.allServices && appointment.allServices.length > 0 ? (
                          <div className="space-y-1">
                            {appointment.allServices.map((service, index) => (
                              <p key={index} className="text-sm font-medium text-gray-700">
                                {service}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-gray-700">{appointment.serviceName}</p>
                        )}
                        {/* ⭐ Badge hiển thị trạng thái tái khám */}
                        {appointment.type === "FollowUp" && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="mt-1"
                          >
                            Tái khám
                          </Chip>
                        )}
                      </div>
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
                      {appointment.hasVisitTicket && (
                        <p className="text-xs text-green-600 mt-1 font-semibold">
                          Đã xuất phiếu khám bệnh
                        </p>
                      )}
                      {appointment.status === "Completed" && appointment.noTreatment && (
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                          Không cần khám
                        </p>
                      )}
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
                          // ⭐ Ca khám Online: Staff có thể xác nhận hoặc từ chối khi ở trạng thái Pending
                          if (appointment.mode === "Online") {
                            // Hiển thị nút xác nhận/từ chối cho ca khám Pending
                            if (appointment.status === "Pending") {
                              return (
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
                                  <Tooltip content="Từ chối">
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
                              );
                            }
                            // Chỉ cho phép xem chi tiết nếu đã hủy hoặc hoàn tiền
                            if (appointment.status === "Cancelled" || appointment.status === "Refunded") {
                              return (
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
                              );
                            }
                            // Không hiển thị nút nào khác cho ca khám Online ở các trạng thái khác
                            return null;
                          }

                          // ⭐ Logic cho ca khám Offline (giữ nguyên)
                          const isOnLeave = isDoctorOnLeave(appointment);
                          // ⭐ Nếu ca khám đã hoàn thành, vẫn cho phép xuất phiếu khám dù bác sĩ nghỉ phép
                          if (isOnLeave && appointment.status !== "Completed") {
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
                                    {appointment.status === "Completed" && !appointment.noTreatment && (
                                      <Tooltip content="Xuất phiếu khám bệnh">
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
            prefetchedDoctors={prefetchedDoctors}
          />
        )}

        {/* ⭐ Walk-in Modal - Staff creates appointment for walk-in patients */}
        <Modal
          isOpen={isWalkInOpen}
          onClose={() => {
            // Release reservation if exists
            if (walkInReservation) {
              appointmentApi.releaseSlot({ timeslotId: walkInReservation.timeslotId })
                .catch(err => console.warn("Failed to release on close:", err));
            }
            setIsWalkInOpen(false);
            // Reset form
            setWalkInForm({
              fullName: "",
              email: "",
              phoneNumber: "",
              date: "",
              serviceId: "",
              doctorUserId: "",
              userStartTimeInput: "",
              startTime: null,
              endTime: null,
              doctorScheduleId: null,
              notes: ""
            });
            setWalkInReservation(null);
            setWalkInTimeError(null);
            setWalkInErrors({});
            setHasAttemptedDoctorFetch(false); // ⭐ Reset flag
          }}
          size="4xl"
          scrollBehavior="inside"
          isDismissable={false}
          hideCloseButton={false}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1 border-b bg-gradient-to-r from-[#39BDCC] to-[#32a8b5] text-white">
              <h2 className="text-2xl font-bold">Đặt lịch cho bệnh nhân</h2>
              <p className="text-sm font-normal opacity-90">Nhập thông tin bệnh nhân và chọn lịch khám</p>
            </ModalHeader>

            <ModalBody className="py-6">
              <form
                id="walk-in-form"
                onSubmit={async (e) => {
                  e.preventDefault();

                  // ⭐ FIX: Auto-process time input if user typed time but didn't blur (click submit immediately)
                  let processedStartTime = walkInForm.startTime;
                  let processedEndTime = walkInForm.endTime;
                  let processedReservation = walkInReservation;

                  if (walkInForm.userStartTimeInput && (!walkInForm.startTime || !walkInForm.endTime)) {
                    const timeRegex = /^(\d{1,2}):(\d{1,2})$/;
                    if (timeRegex.test(walkInForm.userStartTimeInput)) {
                      const [hours, minutes] = walkInForm.userStartTimeInput.split(":");
                      const h = parseInt(hours, 10);
                      const m = parseInt(minutes, 10);

                      // Validate time format
                      if (h < 0 || h > 23) {
                        toast.error("Giờ không hợp lệ. 00-23");
                        return;
                      }
                      if (m < 0 || m > 59) {
                        toast.error("Phút không hợp lệ. 00-59");
                        return;
                      }

                      // Check if time is in available ranges
                      if (!isTimeInWalkInRanges(walkInForm.userStartTimeInput)) {
                        toast.error("Khung giờ này không nằm trong khoảng khả dụng.");
                        return;
                      }

                      // Convert VN → UTC
                      const dateObj = new Date((walkInForm.date || "") + "T00:00:00.000Z");
                      const utcHours = h - 7;
                      dateObj.setUTCHours(utcHours, m, 0, 0);
                      const startISO = dateObj.toISOString();

                      // ⭐ OPTIMIZED: Skip reservation during auto-submit, go straight to appointment creation
                      // Calculate end time based on service duration
                      const selectedService = walkInServices.find(s => s._id === walkInForm.serviceId);
                      const durationMinutes = selectedService?.durationMinutes || 30;
                      const endTimeObj = new Date(dateObj);
                      endTimeObj.setMinutes(endTimeObj.getMinutes() + durationMinutes);

                      // Use processed values for submission
                      processedStartTime = dateObj;
                      processedEndTime = endTimeObj;
                      processedReservation = null; // No reservation during auto-submit

                      // Update state for UI feedback
                      setWalkInForm(prev => ({
                        ...prev,
                        startTime: processedStartTime,
                        endTime: processedEndTime,
                      }));
                      setWalkInTimeError(null);
                    }
                  }

                  // Validate using processed values
                  const errors: Record<string, string> = {};
                  if (!walkInForm.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
                  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(walkInForm.email.trim())) {
                    errors.email = "Email không hợp lệ";
                  }
                  if (walkInForm.phoneNumber.replace(/[^0-9]/g, "").length !== 10) {
                    errors.phoneNumber = "Số điện thoại phải gồm 10 chữ số";
                  }
                  if (!walkInForm.date) errors.date = "Vui lòng chọn ngày";
                  if (!walkInForm.serviceId) errors.serviceId = "Vui lòng chọn dịch vụ";
                  if (!walkInForm.doctorUserId) errors.doctorUserId = "Vui lòng chọn bác sĩ";
                  if (!processedStartTime || !processedEndTime) {
                    errors.userStartTimeInput = "Vui lòng chọn giờ bắt đầu";
                  }

                  if (Object.keys(errors).length > 0) {
                    setWalkInErrors(errors);
                    toast.error("Vui lòng điền đầy đủ thông tin");
                    return;
                  }

                  try {
                    setWalkInSubmitting(true);

                    const payload = {
                      fullName: walkInForm.fullName,
                      email: walkInForm.email,
                      phoneNumber: walkInForm.phoneNumber,
                      serviceId: walkInForm.serviceId,
                      doctorUserId: walkInForm.doctorUserId,
                      doctorScheduleId: walkInForm.doctorScheduleId || "",
                      selectedSlot: {
                        startTime: processedStartTime!.toISOString(),
                        endTime: processedEndTime!.toISOString()
                      },
                      notes: walkInForm.notes,
                      reservedTimeslotId: processedReservation?.timeslotId || null
                    };

                    console.log('📤 Sending walk-in appointment request:', payload);
                    const res = await appointmentApi.createWalkIn(payload);
                    console.log('📥 Walk-in appointment response:', res);

                    if (res.success) {
                      toast.success("Đặt lịch thành công!");

                      // Log pricing info if available
                      if ((res.data as any)?.pricing) {
                        console.log('💰 Appointment pricing:', (res.data as any).pricing);
                      }

                      setIsWalkInOpen(false);
                      refetchAllAppointments();

                      // Reset form
                      setWalkInForm({
                        fullName: "",
                        email: "",
                        phoneNumber: "",
                        date: "",
                        serviceId: "",
                        doctorUserId: "",
                        userStartTimeInput: "",
                        startTime: null,
                        endTime: null,
                        doctorScheduleId: null,
                        notes: ""
                      });
                      setWalkInReservation(null);
                    } else {
                      console.error('❌ Walk-in appointment failed:', res);
                      toast.error(res.message || "Đặt lịch thất bại");
                    }
                  } catch (err: any) {
                    console.error('❌ Walk-in appointment error:', err);
                    console.error('   - Error message:', err.message);
                    console.error('   - Error response:', err.response?.data);

                    const errorMessage = err.response?.data?.message || err.message || "Có lỗi xảy ra khi đặt lịch";
                    toast.error(errorMessage);
                  } finally {
                    setWalkInSubmitting(false);
                  }
                }}
                className="space-y-6"
              >
                {/* Patient Info */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-[#39BDCC] rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin bệnh nhân</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1.5 font-medium text-gray-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={walkInForm.fullName}
                        onChange={(e) => {
                          setWalkInForm(prev => ({ ...prev, fullName: e.target.value }));
                          if (walkInErrors.fullName) {
                            setWalkInErrors(prev => {
                              const next = { ...prev };
                              delete next.fullName;
                              return next;
                            });
                          }
                        }}
                        onBlur={() => validateWalkInField("fullName")}
                        placeholder="Nhập họ và tên"
                        isInvalid={!!walkInErrors.fullName}
                        errorMessage={walkInErrors.fullName}
                        size="lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1.5 font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={walkInForm.email}
                        onChange={(e) => {
                          setWalkInForm(prev => ({ ...prev, email: e.target.value }));
                          if (walkInErrors.email) {
                            setWalkInErrors(prev => {
                              const next = { ...prev };
                              delete next.email;
                              return next;
                            });
                          }
                        }}
                        onBlur={() => validateWalkInField("email")}
                        placeholder="example@email.com"
                        isInvalid={!!walkInErrors.email}
                        errorMessage={walkInErrors.email}
                        size="lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1.5 font-medium text-gray-700">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="tel"
                        value={walkInForm.phoneNumber}
                        onChange={(e) => {
                          setWalkInForm(prev => ({ ...prev, phoneNumber: e.target.value }));
                          if (walkInErrors.phoneNumber) {
                            setWalkInErrors(prev => {
                              const next = { ...prev };
                              delete next.phoneNumber;
                              return next;
                            });
                          }
                        }}
                        onBlur={() => validateWalkInField("phoneNumber")}
                        placeholder="0123456789"
                        isInvalid={!!walkInErrors.phoneNumber}
                        errorMessage={walkInErrors.phoneNumber}
                        size="lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-[#39BDCC] rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin lịch khám</h3>
                  </div>

                  {/* Date, Service, Doctor - 3 COLUMNS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date - FIRST */}
                    <div>
                      <label className="block text-sm mb-1.5 font-medium text-gray-700">
                        Ngày khám <span className="text-red-500">*</span>
                      </label>
                      <VietnameseDateInput
                        value={walkInForm.date}
                        onChange={(dateStr) => {
                          setWalkInForm(prev => ({ ...prev, date: dateStr }));
                        }}
                        minDate={new Date()}
                        className="w-full"
                        inputWrapperClassName="border-2 border-gray-300 hover:border-[#39BDCC] data-[focus=true]:border-[#39BDCC] h-11 transition-colors"
                      />
                      {walkInErrors.date && (
                        <p className="mt-1 text-xs text-red-600">{walkInErrors.date}</p>
                      )}
                    </div>

                    {/* Service - SECOND (enabled after date) */}
                    <div>
                      <label className="block text-sm mb-1.5 font-medium text-gray-700">
                        Dịch vụ <span className="text-red-500">*</span>
                      </label>
                      <Select
                        placeholder="Chọn dịch vụ"
                        selectedKeys={walkInForm.serviceId ? new Set([walkInForm.serviceId]) : new Set([])}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0];
                          setWalkInForm(prev => ({ ...prev, serviceId: selected ? String(selected) : "" }));
                        }}
                        isDisabled={!walkInForm.date}
                        isInvalid={!!walkInErrors.serviceId}
                        errorMessage={walkInErrors.serviceId}
                        size="lg"
                        classNames={{
                          trigger: "h-11"
                        }}
                      >
                        {walkInServices.map((service) => (
                          <SelectItem key={service._id}>
                            {service.serviceName}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Doctor - THIRD (enabled after service) */}
                    <div>
                      <label className="block text-sm mb-1.5 font-medium text-gray-700">
                        Bác sĩ <span className="text-red-500">*</span>
                      </label>
                      <Select
                        placeholder={walkInLoadingDoctors ? "Đang tải..." : "Chọn bác sĩ"}
                        selectedKeys={walkInForm.doctorUserId ? new Set([walkInForm.doctorUserId]) : new Set([])}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0];
                          setWalkInForm(prev => ({ ...prev, doctorUserId: selected ? String(selected) : "" }));
                        }}
                        isDisabled={!walkInForm.serviceId || walkInLoadingDoctors}
                        isInvalid={!!walkInErrors.doctorUserId}
                        errorMessage={walkInErrors.doctorUserId}
                        size="lg"
                        classNames={{
                          trigger: "h-11"
                        }}
                      >
                        {walkInAvailableDoctors.map((doctor) => (
                          <SelectItem key={doctor._id}>
                            {doctor.fullName}
                          </SelectItem>
                        ))}
                      </Select>
                      {/* Only show message when: has attempted fetch, has date, has service, not loading, and no doctors available */}
                      {hasAttemptedDoctorFetch && walkInForm.date && walkInAvailableDoctors.length === 0 && walkInForm.serviceId && !walkInLoadingDoctors && (
                        <p className="mt-1 text-xs text-orange-600">
                          Không có bác sĩ khả dụng cho ngày này (có thể đang nghỉ phép)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Time - FOURTH (enabled after doctor) */}
                  {walkInForm.doctorUserId && (
                    <div className="space-y-3">
                      {/* Loading state */}
                      {walkInLoadingSchedule ? (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Đang tải lịch bác sĩ...</p>
                        </div>
                      ) : walkInScheduleRanges && Array.isArray(walkInScheduleRanges) ? (
                        <>
                          {/* Schedule Ranges Display - Match BookingModal UI */}
                          <div className="p-3 bg-blue-50 border border-gray-200 rounded-lg">
                            <p className="text-xs text-gray-600 font-medium mb-2">
                              Khoảng thời gian khả dụng:
                            </p>
                            <div className="space-y-2">
                              {walkInScheduleRanges.map((range: any, index: number) => (
                                <div key={index}>
                                  <p className="text-sm font-semibold text-[#39BDCC] mb-1">
                                    {range.shift === "Morning" ? "Ca sáng" : "Ca chiều"}:
                                  </p>
                                  <p className="text-sm text-gray-700 ml-2">
                                    {range.displayRange === 'Đã hết chỗ' ? (
                                      <span className="text-red-600 font-medium">Đã hết chỗ</span>
                                    ) : range.displayRange === 'Đã qua thời gian làm việc' ? (
                                      <span className="text-red-600 font-medium">Đã qua thời gian làm việc</span>
                                    ) : (
                                      range.displayRange.split(', ').map((gap: string, gapIdx: number) => (
                                        <span key={gapIdx}>
                                          {gapIdx > 0 && <span className="mx-2">|</span>}
                                          <span className="text-[#39BDCC] font-medium">{gap}</span>
                                        </span>
                                      ))
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Time Input and End Time Display - Grid Layout */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Nhập giờ bắt đầu
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Giờ"
                                  className={`w-16 text-center border px-3 py-2 rounded-lg ${walkInTimeError ? "border-red-500" : "border-gray-300"
                                    }`}
                                  value={(walkInForm.userStartTimeInput || "").split(":")[0] || ""}
                                  onChange={(e) => {
                                    let v = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                                    const currentMinute = (walkInForm.userStartTimeInput || "").split(":")[1] || "";

                                    // ⭐ LOGIC FROM BOOKINGMODAL: Release immediately when both hour and minute are empty
                                    if ((!v || v === '') && (!currentMinute || currentMinute === '')) {
                                      console.log('🔍 [DEBUG] Hour onChange - COMPLETELY EMPTY path triggered');
                                      if (walkInReservation) {
                                        // Clear debounce timeout if any
                                        if (releaseSlotTimeoutRef.current) {
                                          clearTimeout(releaseSlotTimeoutRef.current);
                                          releaseSlotTimeoutRef.current = null;
                                        }
                                        // Release immediately (no debounce)
                                        appointmentApi.releaseSlot({ timeslotId: walkInReservation.timeslotId })
                                          .then(() => {
                                            console.log('✅ Released reservation - time input cleared');
                                          })
                                          .catch(err => console.warn("Failed to release slot:", err));
                                        setWalkInReservation(null);
                                      }
                                      // ⭐ FIX: Refetch schedule when time is completely cleared to show released slot
                                      // This causes UI reload but ensures slot visibility
                                      console.log('✅ [COMPLETELY EMPTY] Refetching schedule...');
                                      fetchWalkInScheduleRanges().catch(err => console.warn('Failed to refresh:', err));

                                      setWalkInForm(prev => ({
                                        ...prev,
                                        userStartTimeInput: v + ":" + currentMinute,
                                        startTime: null,
                                        endTime: null
                                      }));
                                      setWalkInTimeError(null);
                                      return;
                                    }

                                    // ⭐ For partial input (still typing), debounce the release
                                    const newTimeInput = v + ":" + currentMinute;
                                    const oldTimeInput = walkInForm.userStartTimeInput || "";

                                    console.log(`🔍 [DEBUG] Hour onChange - DEBOUNCED path: newTimeInput="${newTimeInput}", oldTimeInput="${oldTimeInput}"`);

                                    if (newTimeInput !== oldTimeInput && walkInReservation) {
                                      // Clear previous timeout
                                      if (releaseSlotTimeoutRef.current) {
                                        clearTimeout(releaseSlotTimeoutRef.current);
                                      }

                                      // ⭐ FIX: Check if time will be cleared after this change
                                      const willBeCleared = newTimeInput === ":" || newTimeInput === "" || !newTimeInput;
                                      console.log(`🔍 [DEBUG] willBeCleared=${willBeCleared}`);

                                      // ⭐ CRITICAL: Capture reservation ID before it might be cleared
                                      const reservationToRelease = walkInReservation.timeslotId;

                                      // Debounce release slot API call by 300ms
                                      releaseSlotTimeoutRef.current = setTimeout(() => {
                                        appointmentApi.releaseSlot({ timeslotId: reservationToRelease })
                                          .then(() => {
                                            console.log('✅ Released old reservation due to time change');
                                            // ⭐ FIX: Clear reservation AFTER successful release
                                            setWalkInReservation(null);
                                            // ⭐ FIX: Refetch schedule if time was cleared
                                            if (willBeCleared) {
                                              console.log('✅ Time cleared (debounced path), refetching schedule...');
                                              fetchWalkInScheduleRanges().catch(err => console.warn('Failed to refresh:', err));
                                            }
                                          })
                                          .catch(err => {
                                            console.warn("Failed to release slot:", err);
                                            // Still clear reservation on error to avoid stuck state
                                            setWalkInReservation(null);
                                          });
                                      }, 300);

                                      // Clear startTime/endTime to indicate time needs re-processing
                                      setWalkInForm(prev => ({ ...prev, startTime: null, endTime: null }));
                                    }

                                    setWalkInForm(prev => ({ ...prev, userStartTimeInput: v + ":" + currentMinute }));
                                    setWalkInTimeError(null);
                                  }}
                                  onBlur={() => {
                                    const [h, m] = (walkInForm.userStartTimeInput || "").split(":");
                                    if (h && m && m.length >= 2) {
                                      handleWalkInTimeBlur(h + ":" + m);
                                    }
                                  }}
                                />
                                <span className="font-semibold">:</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Phút"
                                  className={`w-16 text-center border px-3 py-2 rounded-lg ${walkInTimeError ? "border-red-500" : "border-gray-300"
                                    }`}
                                  value={(walkInForm.userStartTimeInput || "").split(":")[1] || ""}
                                  onChange={(e) => {
                                    let v = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                                    const currentHour = (walkInForm.userStartTimeInput || "").split(":")[0] || "";

                                    // ⭐ LOGIC FROM BOOKINGMODAL: Release immediately when both hour and minute are empty
                                    if ((!currentHour || currentHour === '') && (!v || v === '')) {
                                      console.log('🔍 [DEBUG] Minute onChange - COMPLETELY EMPTY path triggered');
                                      if (walkInReservation) {
                                        // Clear debounce timeout if any
                                        if (releaseSlotTimeoutRef.current) {
                                          clearTimeout(releaseSlotTimeoutRef.current);
                                          releaseSlotTimeoutRef.current = null;
                                        }
                                        // Release immediately (no debounce)
                                        appointmentApi.releaseSlot({ timeslotId: walkInReservation.timeslotId })
                                          .then(() => {
                                            console.log('✅ Released reservation - time input cleared');
                                          })
                                          .catch(err => console.warn("Failed to release slot:", err));
                                        setWalkInReservation(null);
                                      }
                                      // ⭐ FIX: Refetch schedule when time is completely cleared to show released slot
                                      // This causes UI reload but ensures slot visibility
                                      console.log('✅ [COMPLETELY EMPTY] Refetching schedule...');
                                      fetchWalkInScheduleRanges().catch(err => console.warn('Failed to refresh:', err));


                                      setWalkInForm(prev => ({
                                        ...prev,
                                        userStartTimeInput: currentHour + ":" + v,
                                        startTime: null,
                                        endTime: null
                                      }));
                                      setWalkInTimeError(null);
                                      return;
                                    }

                                    // ⭐ For partial input (still typing), debounce the release
                                    const newTimeInput = currentHour + ":" + v;
                                    const oldTimeInput = walkInForm.userStartTimeInput || "";

                                    console.log(`🔍 [DEBUG] Minute onChange - DEBOUNCED path: newTimeInput="${newTimeInput}", oldTimeInput="${oldTimeInput}"`);

                                    if (newTimeInput !== oldTimeInput && walkInReservation) {
                                      // Clear previous timeout
                                      if (releaseSlotTimeoutRef.current) {
                                        clearTimeout(releaseSlotTimeoutRef.current);
                                      }

                                      // ⭐ FIX: Check if time will be cleared after this change
                                      const willBeCleared = newTimeInput === ":" || newTimeInput === "" || !newTimeInput;
                                      console.log(`🔍 [DEBUG] willBeCleared=${willBeCleared}`);

                                      // ⭐ CRITICAL: Capture reservation ID before it might be cleared
                                      const reservationToRelease = walkInReservation.timeslotId;

                                      // Debounce release slot API call by 300ms
                                      releaseSlotTimeoutRef.current = setTimeout(() => {
                                        appointmentApi.releaseSlot({ timeslotId: reservationToRelease })
                                          .then(() => {
                                            console.log('✅ Released old reservation due to time change');
                                            // ⭐ FIX: Clear reservation AFTER successful release
                                            setWalkInReservation(null);
                                            // ⭐ FIX: Refetch schedule if time was cleared
                                            if (willBeCleared) {
                                              console.log('✅ Time cleared (debounced path), refetching schedule...');
                                              fetchWalkInScheduleRanges().catch(err => console.warn('Failed to refresh:', err));
                                            }
                                          })
                                          .catch(err => {
                                            console.warn("Failed to release slot:", err);
                                            // Still clear reservation on error to avoid stuck state
                                            setWalkInReservation(null);
                                          });
                                      }, 300);

                                      // Clear startTime/endTime to indicate time needs re-processing
                                      setWalkInForm(prev => ({ ...prev, startTime: null, endTime: null }));
                                    }

                                    setWalkInForm(prev => ({ ...prev, userStartTimeInput: currentHour + ":" + v }));
                                    setWalkInTimeError(null);
                                  }}
                                  onBlur={() => {
                                    const [h, m] = (walkInForm.userStartTimeInput || "").split(":");
                                    if (h && m && m.length >= 2) {
                                      handleWalkInTimeBlur(h + ":" + m);
                                    }
                                  }}
                                />
                              </div>
                              {walkInTimeError && (
                                <p className="mt-1 text-xs text-red-600">{walkInTimeError}</p>
                              )}
                              {walkInReservation && walkInReservation.countdownSeconds > 0 && !walkInTimeError && (
                                <p className="mt-1 text-xs text-[#39BDCC]">
                                  Đã giữ chỗ · Còn lại {walkInReservation.countdownSeconds}s
                                </p>
                              )}
                            </div>

                            {/* ⭐ Display predicted end time - matches patient booking modal exactly */}
                            {walkInForm.userStartTimeInput &&
                              walkInForm.serviceId &&
                              !walkInTimeError &&
                              /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(walkInForm.userStartTimeInput) &&
                              (() => {
                                const selectedService = walkInServices.find(s => s._id === walkInForm.serviceId);
                                if (!selectedService || !selectedService.durationMinutes) return false;

                                const [h, m] = walkInForm.userStartTimeInput.split(':');
                                if (!h || !m || m.length < 2) return false;

                                const hours = parseInt(h, 10);
                                const minutes = parseInt(m, 10);
                                if (isNaN(hours) || isNaN(minutes)) return false;

                                return true;
                              })() && (
                                <div className="flex flex-col items-end text-right">
                                  <label className="block text-xs text-gray-600 mb-1">
                                    Thời gian kết thúc dự kiến
                                  </label>
                                  <div className="flex items-center gap-2 justify-end">
                                    {(() => {
                                      const selectedService = walkInServices.find(s => s._id === walkInForm.serviceId);
                                      const [h, m] = walkInForm.userStartTimeInput.split(':');
                                      const hours = parseInt(h, 10);
                                      const minutes = parseInt(m, 10);
                                      const totalMinutes = hours * 60 + minutes + (selectedService?.durationMinutes || 0);
                                      const endHours = Math.floor(totalMinutes / 60) % 24;
                                      const endMinutes = totalMinutes % 60;

                                      return (
                                        <>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Giờ"
                                            className="w-16 text-center border px-3 py-2 rounded-lg bg-white border-[#39BDCC] text-[#39BDCC]"
                                            readOnly
                                            value={String(endHours).padStart(2, '0')}
                                          />
                                          <span className="font-semibold">:</span>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Phút"
                                            className="w-16 text-center border px-3 py-2 rounded-lg bg-white border-[#39BDCC] text-[#39BDCC]"
                                            readOnly
                                            value={String(endMinutes).padStart(2, '0')}
                                          />
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}


                  {/* Notes */}
                  <div>
                    <label className="block text-sm mb-1 font-medium text-gray-700">
                      Ghi chú
                    </label>
                    <Textarea
                      value={walkInForm.notes}
                      onChange={(e) => setWalkInForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Ghi chú thêm (nếu có)"
                      rows={3}
                    />
                  </div>
                </div>
              </form>
            </ModalBody>

            <ModalFooter className="border-t">
              <Button
                variant="flat"
                onPress={() => {
                  if (walkInReservation) {
                    appointmentApi.releaseSlot({ timeslotId: walkInReservation.timeslotId })
                      .catch(err => console.warn("Failed to release:", err));
                  }
                  setIsWalkInOpen(false);
                }}
              >
                Hủy
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={walkInSubmitting}
                isDisabled={walkInSubmitting}
                onPress={() => {
                  // Trigger form submit
                  const form = document.getElementById('walk-in-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
              >
                {walkInSubmitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default AllAppointments;
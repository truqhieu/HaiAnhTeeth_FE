import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { medicalRecordApi, type MedicalRecordDisplay, type MedicalRecordPermissions } from "@/api/medicalRecord";
import { doctorApi, type AppointmentDetail } from "@/api/doctor";
import { getDoctorScheduleRangeForFollowUp, validateAppointmentTime } from "@/api/availableSlot";
import { appointmentApi } from "@/api/appointment";
import { Spinner, Button, Card, CardBody, Textarea, Input, CardHeader } from "@heroui/react";
import { BeakerIcon, DocumentTextIcon, PencilSquareIcon, HeartIcon, CheckCircleIcon, XMarkIcon, ChevronDownIcon, PlusIcon, TrashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
registerLocale("vi", vi);

interface ReservationInfo {
  timeslotId: string;
  startTime: string;
  endTime: string;
  expiresAt: string;
  doctorScheduleId?: string | null;
}

const DoctorMedicalRecord: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [display, setDisplay] = useState<MedicalRecordDisplay | null>(null);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<MedicalRecordPermissions | null>(null);
  const [currentAppointment, setCurrentAppointment] = useState<AppointmentDetail | null>(null);

  // Form state - doctor có thể chỉnh sửa tất cả trường
  const [diagnosis, setDiagnosis] = useState("");
  const [conclusion, setConclusion] = useState("");
  // ⭐ Đổi thành array để hỗ trợ nhiều đơn thuốc
  const [prescriptions, setPrescriptions] = useState<Array<{ medicine: string; dosage: string; duration: string }>>([]);
  const [nurseNote, setNurseNote] = useState("");

  // Additional Services state
  const [currentServices, setCurrentServices] = useState<Array<{ _id: string; serviceName: string; price: number; finalPrice?: number; discountAmount?: number; durationMinutes?: number }>>([]);
  const [allServices, setAllServices] = useState<Array<{ _id: string; serviceName: string; price: number; finalPrice?: number; discountAmount?: number; durationMinutes?: number }>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpDateTime, setFollowUpDateTime] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpAppointmentId, setFollowUpAppointmentId] = useState<string | null>(null);

  // Follow-up separate fields
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [followUpTimeInput, setFollowUpTimeInput] = useState("");
  const [followUpServiceIds, setFollowUpServiceIds] = useState<string[]>([]);
  const [followUpDoctorUserId, setFollowUpDoctorUserId] = useState<string | null>(null);
  const [followUpPatientUserId, setFollowUpPatientUserId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [userReservedSlots, setUserReservedSlots] = useState<any[]>([]); // Reserved slots của user từ BE
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);
  const [timeInputError, setTimeInputError] = useState<string | null>(null);
  const [followUpDateError, setFollowUpDateError] = useState<string | null>(null); // Lỗi ngày tái khám
  const [serviceDuration, setServiceDuration] = useState<number>(30); // Default 30 minutes
  const [followUpEndTime, setFollowUpEndTime] = useState<Date | null>(null); // Thời gian kết thúc dự kiến (Date object giống BookingModal)

  // Reservation state
  const [activeReservation, setActiveReservation] = useState<ReservationInfo | null>(null);
  const [reservationCountdown, setReservationCountdown] = useState(0);
  const [hasReservedAfterBlur, setHasReservedAfterBlur] = useState(false); // ⭐ Track xem đã blur và reserve thành công chưa
  const reservationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scheduleRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeReservationRef = useRef<ReservationInfo | null>(null);
  const isReleasingRef = useRef<boolean>(false); // ⭐ Flag để track đang release
  const pendingValidationRef = useRef<{ timeInput: string; timeoutId: ReturnType<typeof setTimeout> | null } | null>(null); // ⭐ Track pending validation
  const prevScheduleKeyRef = useRef<string | null>(null); // Track previous schedule key để tránh gọi API không cần thiết
  const prevReservationIdRef = useRef<string | null>(null); // Track previous reservation ID để tránh refresh không cần thiết
  // Refs để lưu giá trị mới nhất cho interval callback (tránh stale closure)
  const followUpDateRef = useRef<Date | null>(followUpDate);
  const followUpDoctorUserIdRef = useRef<string | null>(followUpDoctorUserId);
  const followUpServiceIdsRef = useRef<string[]>(followUpServiceIds);

  const canEdit = permissions?.doctor?.canEdit ?? true;
  const isFinalized = permissions?.recordStatus === "Finalized";
  const lockReason = !canEdit ? permissions?.doctor?.reason || null : null;
  const canApprove = canEdit && !isFinalized;

  // ⭐ Lọc đơn thuốc rỗng: khi đã duyệt (Finalized) thì ẩn đơn rỗng, khi chưa duyệt (Draft) thì hiển thị tất cả
  const displayedPrescriptions = useMemo(() => {
    if (isFinalized) {
      // Khi đã duyệt: chỉ hiển thị đơn thuốc có ít nhất một trường không rỗng
      return prescriptions.filter(
        (p) => p.medicine.trim() !== "" || p.dosage.trim() !== "" || p.duration.trim() !== ""
      );
    } else {
      // Khi chưa duyệt: hiển thị tất cả đơn thuốc (kể cả rỗng)
      return prescriptions;
    }
  }, [prescriptions, isFinalized]);

  // Reservation helper functions
  const clearReservationTimer = useCallback(() => {
    if (reservationTimerRef.current) {
      clearInterval(reservationTimerRef.current);
      reservationTimerRef.current = null;
    }
  }, []);

  const clearScheduleRefreshInterval = useCallback(() => {
    if (scheduleRefreshTimerRef.current) {
      clearInterval(scheduleRefreshTimerRef.current);
      scheduleRefreshTimerRef.current = null;
    }
  }, []);


  useEffect(() => {
    activeReservationRef.current = activeReservation;
  }, [activeReservation]);

  useEffect(() => {
    return () => {
      clearScheduleRefreshInterval();
      clearReservationTimer();
    };
  }, [clearReservationTimer, clearScheduleRefreshInterval]);

  const calcAge = (dob?: string | null): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
      age--;
    }
    return age < 0 ? 0 : age;
  };

  const formatDateTimeInputValue = (value?: string | Date | null): string => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const timezoneOffset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - timezoneOffset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const formatVNTimeFromISO = (iso: string) => {
    if (!iso) return "";
    const dateObj = new Date(iso);
    if (Number.isNaN(dateObj.getTime())) return "";
    return dateObj.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatVNDateFromISO = (iso: string) => {
    if (!iso) return "";
    const dateObj = new Date(iso);
    if (Number.isNaN(dateObj.getTime())) return "";
    return dateObj.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Load services và medical record
  useEffect(() => {
    const load = async () => {
      if (!appointmentId) return;
      setLoading(true);
      setError(null);
      try {
        // Load appointment detail để lấy startTime
        try {
          const appointmentRes = await doctorApi.getAppointmentDetail(appointmentId);
          if (appointmentRes.success && appointmentRes.data) {
            setCurrentAppointment(appointmentRes.data);
          }
        } catch (e) {
          console.error('Error loading appointment detail:', e);
          // Không block nếu không load được appointment detail
        }

        // Load medical record
        const res = await medicalRecordApi.getOrCreateByAppointment(appointmentId, 'doctor');
        console.log('🔍 [MedicalRecord] API Response:', res);

        if (res.success && res.data) {
          console.log('🔍 [MedicalRecord] Record:', res.data.record);
          console.log('🔍 [MedicalRecord] Display:', res.data.display);
          console.log('🔍 [MedicalRecord] additionalServices from display:', res.data.display?.additionalServices);
          console.log('🔍 [MedicalRecord] additionalServiceIds from record:', res.data.record?.additionalServiceIds);

          setDisplay(res.data.display);
          setPermissions(res.data.permissions || null);
          setDiagnosis(res.data.record.diagnosis || "");
          setConclusion(res.data.record.conclusion || "");
          // ⭐ Load prescriptions (array mới) hoặc prescription (object cũ - backward compatibility)
          const prescriptionsData = res.data.record.prescriptions || (res.data.record.prescription ? [res.data.record.prescription] : []);
          const loadedPrescriptions = prescriptionsData.map((p: any) => ({
            medicine: p.medicine || "",
            dosage: p.dosage || "",
            duration: p.duration || "",
          }));
          // ⭐ Nếu không có đơn thuốc nào và có thể edit, tự động thêm 1 đơn trống
          if (loadedPrescriptions.length === 0 && (res.data.permissions?.doctor?.canEdit ?? true)) {
            setPrescriptions([{ medicine: "", dosage: "", duration: "" }]);
          } else {
            setPrescriptions(loadedPrescriptions);
          }
          setNurseNote(res.data.record.nurseNote || "");
          setFollowUpEnabled(!!res.data.record.followUpRequired);

          // Parse followUpDate để tách date và time
          if (res.data.record.followUpDate) {
            const followUpDateObj = new Date(res.data.record.followUpDate);
            setFollowUpDate(followUpDateObj);
            // ⭐ Check và set lỗi nếu ngày là ngày hiện tại
            if (isToday(followUpDateObj)) {
              setFollowUpDateError("Vui lòng chọn ngày tái khám khác ngày hiện tại");
            } else {
              setFollowUpDateError(null);
            }
            const hours = String((followUpDateObj.getUTCHours() + 7) % 24).padStart(2, '0');
            const minutes = String(followUpDateObj.getUTCMinutes()).padStart(2, '0');
            setFollowUpTimeInput(`${hours}:${minutes}`);
            setFollowUpDateTime(formatDateTimeInputValue(res.data.record.followUpDate));
          } else {
            setFollowUpDate(null);
            setFollowUpTimeInput("");
            setFollowUpDateTime("");
            setFollowUpDateError(null);
          }

          setFollowUpNote(res.data.record.followUpNote || "");

          // ⭐ FIX: Lấy followUpAppointmentId từ record (có thể là ObjectId hoặc object đã populate)
          const followUpApptId = res.data.record.followUpAppointmentId;
          if (followUpApptId) {
            const followUpId = typeof followUpApptId === 'object' && followUpApptId !== null && '_id' in followUpApptId
              ? (followUpApptId as { _id: string })._id
              : followUpApptId;
            setFollowUpAppointmentId(followUpId?.toString() || String(followUpId));

            // ⭐ FIX: Ưu tiên lấy thời gian từ follow-up appointment's timeslot (nếu có)
            if (typeof followUpApptId === 'object' && followUpApptId !== null && 'timeslotId' in followUpApptId) {
              const timeslot = (followUpApptId as any).timeslotId;
              if (timeslot && timeslot.startTime) {
                const startTime = new Date(timeslot.startTime);
                if (!Number.isNaN(startTime.getTime())) {
                  // Set followUpDate và followUpTimeInput từ timeslot
                  setFollowUpDate(startTime);
                  const vnHours = String((startTime.getUTCHours() + 7) % 24).padStart(2, '0');
                  const vnMinutes = String(startTime.getUTCMinutes()).padStart(2, '0');
                  setFollowUpTimeInput(`${vnHours}:${vnMinutes}`);
                  setFollowUpDateTime(formatDateTimeInputValue(startTime.toISOString()));

                  // ⭐ FIX: Tính và set followUpEndTime từ timeslot.endTime
                  if (timeslot.endTime) {
                    const endTime = new Date(timeslot.endTime);
                    if (!Number.isNaN(endTime.getTime())) {
                      setFollowUpEndTime(endTime);
                      console.log('✅ [load] Loaded follow-up appointment end time from timeslot');
                    }
                  }

                  console.log('✅ [load] Loaded follow-up appointment time from timeslot:', `${vnHours}:${vnMinutes}`);
                  // ⭐ Skip parsing từ followUpDate vì đã lấy từ timeslot
                  return;
                }
              }
            }
          } else {
            setFollowUpAppointmentId(null);
          }

          // ⭐ Fallback: Nếu không có timeslot từ follow-up appointment, lấy từ followUpDate của record
          if (res.data.record.followUpDate) {
            const followUpDateObj = new Date(res.data.record.followUpDate);
            setFollowUpDate(followUpDateObj);
            // ⭐ Check và set lỗi nếu ngày là ngày hiện tại
            if (isToday(followUpDateObj)) {
              setFollowUpDateError("Vui lòng chọn ngày tái khám khác ngày hiện tại");
            } else {
              setFollowUpDateError(null);
            }
            const hours = String((followUpDateObj.getUTCHours() + 7) % 24).padStart(2, '0');
            const minutes = String(followUpDateObj.getUTCMinutes()).padStart(2, '0');
            setFollowUpTimeInput(`${hours}:${minutes}`);
            setFollowUpDateTime(formatDateTimeInputValue(res.data.record.followUpDate));

            // ⭐ Tính followUpEndTime từ followUpDate + service duration (nếu có)
            if (followUpServiceIds.length > 0 && allServices.length > 0) {
              const totalDuration = followUpServiceIds.reduce((total, serviceId) => {
                const service = allServices.find(s => s._id === serviceId);
                return total + (service?.durationMinutes || 0);
              }, 0);
              if (totalDuration > 0) {
                const endTime = new Date(followUpDateObj.getTime() + totalDuration * 60 * 1000);
                setFollowUpEndTime(endTime);
              }
            }
          } else {
            setFollowUpDate(null);
            setFollowUpTimeInput("");
            setFollowUpDateTime("");
            setFollowUpDateError(null);
            setFollowUpEndTime(null);
          }

          // Lấy doctorUserId từ record (có thể là ObjectId hoặc string)
          const doctorUserId = res.data.record.doctorUserId;
          if (doctorUserId) {
            const doctorId = typeof doctorUserId === 'object' && doctorUserId !== null && '_id' in doctorUserId
              ? (doctorUserId as { _id: string })._id
              : doctorUserId;
            setFollowUpDoctorUserId(doctorId?.toString() || String(doctorId));
          }

          const patientUserId = res.data.record.patientUserId;
          if (patientUserId) {
            const parsedPatientId = typeof patientUserId === 'object' && patientUserId !== null && '_id' in patientUserId
              ? (patientUserId as { _id: string })._id
              : patientUserId;
            setFollowUpPatientUserId(parsedPatientId?.toString() || String(parsedPatientId));
          } else {
            setFollowUpPatientUserId(null);
          }

          // Set current services from display or record
          const services = res.data.display?.additionalServices || res.data.record?.additionalServiceIds || [];

          // Lấy tất cả serviceIds từ additional services
          if (Array.isArray(services) && services.length > 0) {
            const serviceIds = services
              .filter((s: any) => s && s._id)
              .map((s: any) => s._id.toString());
            setFollowUpServiceIds(serviceIds);
          } else {
            setFollowUpServiceIds([]);
          }
          console.log('🔍 [MedicalRecord] Parsed services:', services);
          console.log('🔍 [MedicalRecord] Services isArray:', Array.isArray(services));
          console.log('🔍 [MedicalRecord] Services length:', services?.length);

          if (Array.isArray(services) && services.length > 0) {
            const mappedServices = services
              .filter((s: any) => s && (s._id || (typeof s === 'object' && s !== null))) // Filter out null/undefined
              .map((s: any) => ({
                _id: s._id || (typeof s === 'string' ? s : s.toString()),
                serviceName: s.serviceName || (typeof s === 'object' ? s.name || '' : ''),
                price: typeof s.finalPrice === 'number' ? s.finalPrice : (s.price || 0),
                finalPrice: s.finalPrice,
                discountAmount: s.discountAmount,
              }));
            console.log('🔍 [MedicalRecord] Mapped services:', mappedServices);
            setCurrentServices(mappedServices);
          } else {
            console.log('🔍 [MedicalRecord] No services found, setting empty array');
            setCurrentServices([]);
          }
        } else {
          setError(res.message || "Không thể tải hồ sơ khám bệnh");
        }

        // Load all available services (chỉ Examination)
        const servicesRes = await medicalRecordApi.getActiveServicesForDoctor();
        if (servicesRes.success && servicesRes.data) {
          // ⭐ Filter chỉ lấy Examination để đảm bảo (BE đã filter nhưng filter thêm ở FE để chắc chắn)
          const examinationServices = servicesRes.data.filter((s: any) => s.category === 'Examination');
          setAllServices(examinationServices);
        }
      } catch (e: any) {
        setError(e.message || "Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId]);

  // Tự động cập nhật followUpServiceIds khi currentServices thay đổi
  useEffect(() => {
    if (followUpEnabled && currentServices.length > 0) {
      const serviceIds = currentServices
        .filter(s => s && s._id)
        .map(s => s._id.toString());
      setFollowUpServiceIds(serviceIds);
    } else if (followUpEnabled && currentServices.length === 0) {
      setFollowUpServiceIds([]);
    }
  }, [currentServices, followUpEnabled]);

  // Tính max duration từ các dịch vụ trong followUpServiceIds
  useEffect(() => {
    if (followUpServiceIds.length === 0) {
      setServiceDuration(30); // Default 30 minutes
      return;
    }

    // Tìm tất cả services từ allServices hoặc currentServices
    const allServicesList = [...allServices, ...currentServices];
    const durations: number[] = [];

    followUpServiceIds.forEach(serviceId => {
      const service = allServicesList.find(s => s._id === serviceId);
      if (service && service.durationMinutes) {
        durations.push(service.durationMinutes);
      }
    });

    // Nếu không tìm thấy duration nào, dùng default
    if (durations.length === 0) {
      setServiceDuration(30); // Default 30 minutes
      return;
    }

    // Lấy max duration (dịch vụ có thời lượng dài nhất)
    const maxDuration = Math.max(...durations);
    setServiceDuration(maxDuration);
  }, [followUpServiceIds, allServices, currentServices]);

  // Helper function để format date theo timezone VN (YYYY-MM-DD)
  // ⭐ FIX: DatePicker trả về local date với time 00:00:00 local timezone
  // Cần lấy local date components (year, month, day) để tạo date string
  // Vì user chọn ngày theo local timezone, nên phải giữ nguyên local date components
  const formatDateToVNString = (date: Date): string => {
    // ⭐ FIX: Lấy local date components (theo timezone của user)
    // DatePicker trả về date với local time 00:00:00, nên getFullYear(), getMonth(), getDate()
    // sẽ trả về đúng ngày mà user chọn
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function để check xem ngày có phải là ngày hiện tại không
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;

    // ⭐ FIX: Sử dụng local date (vì DatePicker trả về local timezone)
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };


  // ⭐ Memoize followUpServiceIds để tránh thay đổi reference không cần thiết
  const followUpServiceIdsString = useMemo(() => JSON.stringify(followUpServiceIds), [followUpServiceIds]);

  // Load available slots function (tách ra để có thể gọi lại)
  const loadAvailableSlots = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!followUpDate || !followUpDoctorUserId || !followUpServiceIds || followUpServiceIds.length === 0) {
      setAvailableSlots([]);
      setSlotsMessage(null);
      return;
    }

    if (!silent) {
      setLoadingSlots(true);
    }
    setSlotsMessage(null);

    try {
      // Lấy service đầu tiên để check available slots
      const serviceId = followUpServiceIds[0];
      // ⭐ Sử dụng helper function để format date theo VN timezone
      // Format date giống như BookingModal để đảm bảo consistency
      const yyyy = followUpDate.getFullYear();
      const mm = String(followUpDate.getMonth() + 1).padStart(2, "0");
      const dd = String(followUpDate.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // ⭐ GIẢM LOG: Comment lại để giảm spam log
      // console.log('🔍 [FollowUp] Loading slots for date:', dateStr, 'from Date object:', followUpDate);
      const res = await getDoctorScheduleRangeForFollowUp(
        followUpDoctorUserId,
        serviceId,
        dateStr,
        "self",
        followUpPatientUserId,
      );

      // // ⭐ THÊM DEBUG LOGS NGAY ĐÂY
      console.log("🔍 [loadAvailableSlots] Raw Response:", res);
      console.log("🔍 [loadAvailableSlots] Response success:", res.success);
      console.log("🔍 [loadAvailableSlots] Response message:", res.message);
      console.log("🔍 [loadAvailableSlots] Response data:", res.data);

      if (res.data) {
        console.log("🔍 [loadAvailableSlots] Data keys:", Object.keys(res.data));
        console.log("🔍 [loadAvailableSlots] startTimes:", res.data.startTimes);
        console.log("🔍 [loadAvailableSlots] startTimes length:", res.data.startTimes?.length);

        if (res.data.startTimes && Array.isArray(res.data.startTimes)) {
          console.log("🔍 [loadAvailableSlots] First time:", res.data.startTimes[0]);
          res.data.startTimes.forEach((timeSlot: any, idx: number) => {
            console.log(`   TimeSlot ${idx}:`, {
              time: timeSlot.time,
              available: timeSlot.available,
            });
          });
        }
      }

      // ⭐ GIẢM LOG: Comment lại để giảm spam log
      // console.log('🔍 [FollowUp] API response:', res.success, res.data ? 'has data' : 'no data', res.message);
      if (res.success && res.data) {
        const data = res.data as any;

        // ⭐ THÊM: Kiểm tra bác sĩ đang nghỉ phép
        if ((!data.startTimes || data.startTimes.length === 0) &&
          data.message &&
          data.message.includes("nghỉ phép")) {
          setAvailableSlots([]);
          setSlotsMessage(data.message);
          setUserReservedSlots([]);
          return;
        }

        if (data.scheduleRanges && Array.isArray(data.scheduleRanges)) {
          setAvailableSlots(data.scheduleRanges);
          setSlotsMessage(data.message || null);
          // ⭐ Lưu userReservedSlots từ BE để hiển thị trong available slots
          if (data.userReservedSlots && Array.isArray(data.userReservedSlots)) {
            setUserReservedSlots(data.userReservedSlots);
          } else {
            setUserReservedSlots([]);
          }
          // ⭐ Không set serviceDuration từ API nữa, vì đã tính từ max duration của các services
          // Logic: Sử dụng max duration của tất cả dịch vụ trong followUpServiceIds
        } else {
          setAvailableSlots([]);
          setUserReservedSlots([]);
          setSlotsMessage(res.message || "Không có lịch khả dụng");
        }
      } else {
        setAvailableSlots([]);
        setUserReservedSlots([]);
        setSlotsMessage(res.message || "Không thể tải lịch khả dụng");
      }
    } catch (error: any) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
      setSlotsMessage(error.message || "Lỗi tải lịch khả dụng");
    } finally {
      if (!silent) {
        setLoadingSlots(false);
      }
    }
  }, [followUpDate, followUpDoctorUserId, followUpServiceIdsString, followUpPatientUserId]);

  // ⭐ Cập nhật refs mỗi khi giá trị thay đổi
  useEffect(() => {
    followUpDateRef.current = followUpDate;
    followUpDoctorUserIdRef.current = followUpDoctorUserId;
    followUpServiceIdsRef.current = followUpServiceIds;
  }, [followUpDate, followUpDoctorUserId, followUpServiceIds]);

  // ⭐ Auto-refresh available slots (tối ưu để tránh gọi API quá nhiều - giống BookingModal)
  useEffect(() => {
    if (!followUpEnabled || !followUpDate || !followUpDoctorUserId || !followUpServiceIds || followUpServiceIds.length === 0) {
      clearScheduleRefreshInterval();
      prevScheduleKeyRef.current = null; // Reset key khi không có đủ điều kiện
      return;
    }

    // ⭐ Tạo key từ các giá trị quan trọng để so sánh
    const serviceId = followUpServiceIds[0];
    const yyyy = followUpDate.getFullYear();
    const mm = String(followUpDate.getMonth() + 1).padStart(2, "0");
    const dd = String(followUpDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const currentKey = `${followUpDoctorUserId}-${serviceId}-${dateStr}`;

    // ⭐ Chỉ gọi API khi key thay đổi (các giá trị thực sự thay đổi)
    // Tránh gọi API mỗi lần component re-render
    if (prevScheduleKeyRef.current !== currentKey) {
      prevScheduleKeyRef.current = currentKey;

      // Clear interval cũ trước khi set mới
      clearScheduleRefreshInterval();

      // Gọi API ngay lập tức khi có thay đổi thực sự
      loadAvailableSlots({ silent: true });

      // ⭐ Set interval mới với thời gian dài hơn (90 giây thay vì 45 giây) để giảm tần suất
      scheduleRefreshTimerRef.current = setInterval(() => {
        // ⭐ Sử dụng refs để lấy giá trị mới nhất (tránh stale closure)
        const currentDate = followUpDateRef.current;
        const currentDoctorUserId = followUpDoctorUserIdRef.current;
        const currentServiceIds = followUpServiceIdsRef.current;

        if (currentDate && currentDoctorUserId && currentServiceIds && currentServiceIds.length > 0) {
          loadAvailableSlots({ silent: true });
        }
      }, 90000); // Tăng từ 45s lên 90s để giảm tần suất gọi API
    }

    return () => {
      clearScheduleRefreshInterval();
      // ⭐ Cancel pending validation khi unmount hoặc dependencies thay đổi
      if (pendingValidationRef.current?.timeoutId) {
        clearTimeout(pendingValidationRef.current.timeoutId);
        pendingValidationRef.current = null;
      }
    };
    // ⭐ Loại bỏ loadAvailableSlots và clearScheduleRefreshInterval khỏi dependencies
    // để tránh re-run không cần thiết khi các function này được tạo lại
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    followUpEnabled,
    followUpDate,
    followUpDoctorUserId,
    followUpServiceIdsString,
  ]);

  // ⭐ Refresh schedule khi reservation thay đổi (tạo mới hoặc bị clear)
  useEffect(() => {
    if (!followUpDate || !followUpDoctorUserId || !followUpServiceIds || followUpServiceIds.length === 0) {
      return;
    }

    const currentReservationId = activeReservation?.timeslotId || null;

    // ⭐ Chỉ refresh khi reservation ID thay đổi (tạo mới hoặc bị clear)
    if (prevReservationIdRef.current !== currentReservationId) {
      prevReservationIdRef.current = currentReservationId;

      // Refresh schedule khi reservation thay đổi để cập nhật khoảng thời gian khả dụng
      // Delay một chút để đảm bảo state đã được cập nhật
      const timeoutId = setTimeout(() => {
        loadAvailableSlots({ silent: true });
      }, 200);

      return () => {
        clearTimeout(timeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReservation, followUpDate, followUpDoctorUserId, followUpServiceIdsString]);

  // ⭐ Helper function để format VN time from UTC
  const formatVNTimeFromUTC = useCallback((date: Date) => {
    const vnHours = (date.getUTCHours() + 7) % 24;
    const hours = String(vnHours).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  // ⭐ Helper function để tính toán displayRange với reserved slot
  const getDisplayRangeWithReservation = useCallback((range: any, reservedSlots: any[]): string => {
    if (!reservedSlots || reservedSlots.length === 0 || !range.displayRange || range.displayRange === 'Đã hết chỗ' || range.displayRange === 'Đã qua thời gian làm việc') {
      return range.displayRange;
    }

    const rangeStart = new Date(range.startTime);
    const rangeEnd = new Date(range.endTime);

    // Tìm reserved slots trong range này
    const reservedSlotsInRange = reservedSlots.filter(slot => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      return slotStart < rangeEnd && slotEnd > rangeStart;
    });

    if (reservedSlotsInRange.length === 0) {
      return range.displayRange;
    }

    // Format reserved slots
    const reservedSlotDisplays = reservedSlotsInRange.map(slot => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      const startStr = formatVNTimeFromUTC(slotStart);
      const endStr = formatVNTimeFromUTC(slotEnd);
      return `${startStr}-${endStr}`;
    });

    // Parse existing gaps (loại bỏ reserved markers cũ)
    const existingGaps = range.displayRange.split(', ').filter((gap: string) => {
      const gapClean = gap.trim().replace(' (Đang giữ chỗ)', '');
      return gapClean !== '' && !reservedSlotDisplays.includes(gapClean);
    });

    // Thêm reserved slots vào displayRange (không thêm text "(Đang giữ chỗ)" nữa)
    // ⭐ FIX: Không hiển thị reserved slots ở phần "Khoảng thời gian khả dụng" nữa theo yêu cầu
    const allGaps = [...existingGaps];
    return allGaps.join(', ');
  }, [formatVNTimeFromUTC]);

  // ⭐ Tính toán availableSlots với reserved slot (từ activeReservation hoặc userReservedSlots từ BE)
  const availableSlotsWithReservation = useMemo(() => {
    if (!availableSlots || !Array.isArray(availableSlots)) {
      return availableSlots;
    }

    // Ưu tiên sử dụng activeReservation, nếu không có thì dùng userReservedSlots từ BE
    let reservedSlotsToUse: any[] = [];
    if (activeReservation) {
      reservedSlotsToUse = [{
        startTime: activeReservation.startTime,
        endTime: activeReservation.endTime,
        timeslotId: activeReservation.timeslotId
      }];
    } else if (userReservedSlots && userReservedSlots.length > 0) {
      reservedSlotsToUse = userReservedSlots;
    }

    if (reservedSlotsToUse.length === 0) {
      return availableSlots;
    }

    return availableSlots.map((range: any) => ({
      ...range,
      displayRange: getDisplayRangeWithReservation(range, reservedSlotsToUse)
    }));
  }, [availableSlots, activeReservation, userReservedSlots, getDisplayRangeWithReservation]);

  const slotsForDisplay = useMemo(() => {
    if (Array.isArray(availableSlotsWithReservation)) {
      return availableSlotsWithReservation;
    }
    return availableSlots;
  }, [availableSlotsWithReservation, availableSlots]);

  // ⭐ Helper giống BookingModal: kiểm tra input có nằm trong khoảng khả dụng không
  const isTimeInAvailableRanges = useCallback(
    (timeInput: string) => {
      if (!availableSlots || !Array.isArray(availableSlots) || availableSlots.length === 0) {
        return { isValid: false as const };
      }

      const [hours, minutes] = timeInput.split(":");
      if (
        !hours ||
        !minutes ||
        hours.trim() === "" ||
        minutes.trim() === "" ||
        Number.isNaN(Number(hours)) ||
        Number.isNaN(Number(minutes))
      ) {
        return { isValid: false as const };
      }

      const vnHours = parseInt(hours, 10);
      const vnMinutes = parseInt(minutes, 10);
      const inputMinutes = vnHours * 60 + vnMinutes;

      for (const range of availableSlots) {
        if (!range || range.displayRange === "Đã hết chỗ" || range.displayRange === "Đã qua thời gian làm việc") {
          continue;
        }

        const rangeStart = new Date(range.startTime);
        const rangeEnd = new Date(range.endTime);
        if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
          continue;
        }

        const rangeStartVNMinutes = (rangeStart.getUTCHours() + 7) * 60 + rangeStart.getUTCMinutes();
        const rangeEndVNMinutes = (rangeEnd.getUTCHours() + 7) * 60 + rangeEnd.getUTCMinutes();

        if (inputMinutes >= rangeStartVNMinutes && inputMinutes < rangeEndVNMinutes) {
          return {
            isValid: true as const,
            overrideHours: vnHours,
            overrideMinutes: vnMinutes,
            rangeEndVNMinutes,
          };
        }
      }

      return { isValid: false as const };
    },
    [availableSlots],
  );

  // ⭐ Release reservation function (phải đặt sau loadAvailableSlots)
  const releaseReservation = useCallback(
    async ({ skipApi = false, silent = false }: { skipApi?: boolean; silent?: boolean } = {}) => {
      // ⭐ Nếu đang release, đợi release hiện tại hoàn tất
      if (isReleasingRef.current) {
        // Đợi tối đa 1 giây để release hiện tại hoàn tất
        let waitCount = 0;
        while (isReleasingRef.current && waitCount < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waitCount++;
        }
        // Nếu vẫn đang release, return (có thể có vấn đề nhưng tránh deadlock)
        if (isReleasingRef.current) {
          return;
        }
      }

      const currentReservation = activeReservationRef.current;
      if (!currentReservation) {
        setReservationCountdown(0);
        clearReservationTimer();
        return;
      }

      // ⭐ Set flag để tránh multiple releases đồng thời
      isReleasingRef.current = true;

      try {
        clearReservationTimer();
        setReservationCountdown(0);

        if (!skipApi) {
          try {
            await appointmentApi.releaseSlot({
              timeslotId: currentReservation.timeslotId,
            });
            // ⭐ Đợi thêm một chút để đảm bảo BE đã cập nhật DB
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            if (!silent) {
              console.error("Error releasing reservation:", error);
            }
          }
        }

        activeReservationRef.current = null;
        setActiveReservation(null);
      } finally {
        // ⭐ Clear flag sau khi release hoàn tất
        isReleasingRef.current = false;
      }
    },
    [clearReservationTimer],
  );

  // ⭐ Handle reservation success (phải đặt sau loadAvailableSlots)
  const handleReservationSuccess = useCallback((reservation: ReservationInfo) => {
    // ⭐ Cancel pending validation khi có reservation mới
    if (pendingValidationRef.current?.timeoutId) {
      clearTimeout(pendingValidationRef.current.timeoutId);
      pendingValidationRef.current = null;
    }
    activeReservationRef.current = reservation;
    setActiveReservation(reservation);
  }, []);

  // ⭐ Cleanup reservation khi component unmount (giống BookingModal)
  useEffect(() => {
    return () => {
      releaseReservation({ skipApi: true, silent: true });
    };
  }, [releaseReservation]);

  // Load available slots khi chọn ngày tái khám (giống BookingModal - fetch doctors khi date/service/doctor thay đổi)
  useEffect(() => {
    if (!followUpDate || !followUpServiceIds || followUpServiceIds.length === 0 || !followUpDoctorUserId) {
      setAvailableSlots([]);
      setUserReservedSlots([]);
      setSlotsMessage(null);
      return;
    }

    // ⭐ Cancel pending validation khi date/service/doctor thay đổi
    if (pendingValidationRef.current?.timeoutId) {
      clearTimeout(pendingValidationRef.current.timeoutId);
      pendingValidationRef.current = null;
    }

    // ⭐ Release reservation khi date/service/doctor thay đổi (giống BookingModal)
    releaseReservation({ silent: true });

    // ⭐ Clear time input khi date/service/doctor thay đổi (giống BookingModal)
    setFollowUpTimeInput("");
    setFollowUpEndTime(null);
    setTimeInputError(null);

    loadAvailableSlots();
  }, [followUpDate, followUpServiceIdsString, followUpDoctorUserId, loadAvailableSlots, releaseReservation]);

  // Helper function để map error message cho context bác sĩ
  const mapErrorMessageForDoctor = (errorMsg: string): string => {
    // Map các message từ backend cho phù hợp với context bác sĩ
    if (errorMsg.includes('Bạn đã có lịch khám cho bản thân')) {
      return 'Bạn đã có lịch khám vào khung giờ này. Vui lòng chọn khung giờ khác.';
    }
    if (errorMsg.includes('Bác sĩ đã có lịch khám vào thời gian này')) {
      return 'Bạn đã có lịch khám vào khung giờ này. Vui lòng chọn khung giờ khác.';
    }
    if (errorMsg.includes('Bạn đã đặt lịch với bác sĩ này')) {
      return 'Bạn đã có lịch khám vào khung giờ này. Vui lòng chọn khung giờ khác.';
    }
    // ⭐ Map message về conflict tái khám
    if (errorMsg.includes('Khung giờ tái khám bị trùng với ca khám khác của bác sĩ')) {
      return 'Khung giờ tái khám bị trùng với ca khám khác của bạn. Vui lòng chọn khung giờ khác.';
    }
    if (errorMsg.includes('Khung giờ tái khám mới bị trùng với ca khám khác của bác sĩ')) {
      return 'Khung giờ tái khám mới bị trùng với ca khám khác của bạn. Vui lòng chọn khung giờ khác.';
    }
    // Map các message khác có thể liên quan đến "bác sĩ" hoặc "bạn"
    if (errorMsg.includes('Thời gian bạn chọn không nằm trong lịch làm việc của bác sĩ')) {
      return 'Thời gian bạn chọn không nằm trong thời gian khả dụng của bạn. Vui lòng chọn thời gian khác.';
    }
    if (errorMsg.includes('Bác sĩ rảnh:')) {
      return errorMsg.replace('Bác sĩ rảnh:', 'Bạn rảnh:');
    }
    if (errorMsg.includes('Bác sĩ bạn chọn')) {
      return errorMsg.replace(/Bác sĩ bạn chọn/g, 'Bạn');
    }
    if (errorMsg.includes('không có lịch làm việc')) {
      return errorMsg.replace(/bác sĩ/g, 'bạn');
    }
    return errorMsg;
  };

  // Handle time input blur - validate time
  const handleTimeInputBlur = async (timeInput: string) => {
    // ⭐ Cancel pending validation nếu có
    if (pendingValidationRef.current?.timeoutId) {
      clearTimeout(pendingValidationRef.current.timeoutId);
      pendingValidationRef.current = null;
    }

    // ⭐ Đợi release hoàn tất trước khi validate (nếu đang release)
    if (isReleasingRef.current) {
      let waitCount = 0;
      while (isReleasingRef.current && waitCount < 15) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
    }

    // ⭐ Clear error ngay khi bắt đầu validate để tránh hiển thị lỗi cũ
    setTimeInputError(null);
    // ⭐ Sửa: KHÔNG clear endTime ngay khi bắt đầu validate
    // Chỉ clear khi thực sự có lỗi hoặc thời gian thay đổi
    // Giữ lại endTime hiện tại để tránh bị ẩn khi blur

    if (!timeInput || !followUpDoctorUserId || !followUpServiceIds || followUpServiceIds.length === 0) {
      setTimeInputError(null);
      // ⭐ Chỉ clear endTime khi thiếu thông tin cần thiết
      setFollowUpEndTime(null);
      return;
    }

    // ⭐ Kiểm tra xem đã nhập đủ cả giờ và phút chưa
    const [hours, minutes] = timeInput.split(":");
    if (!hours || !minutes || hours === '' || minutes === '') {
      // Chưa nhập đủ, không validate
      setTimeInputError(null);
      return;
    }

    // Validate format: HH:mm (basic format check)
    const timeRegex = /^(\d{1,2}):(\d{1,2})$/;
    if (!timeRegex.test(timeInput)) {
      setTimeInputError("Định dạng thời gian không hợp lệ. Vui lòng nhập HH:mm (ví dụ: 08:30)");
      // ⭐ Chỉ clear endTime khi format không hợp lệ
      setFollowUpEndTime(null);
      return;
    }

    const hoursNum = parseInt(hours);
    const minutesNum = parseInt(minutes);

    // Validate range với thông báo lỗi cụ thể
    if (isNaN(hoursNum) || isNaN(minutesNum)) {
      setTimeInputError("Thời gian không hợp lệ. Vui lòng nhập số hợp lệ");
      setFollowUpEndTime(null);
      return;
    }

    // Kiểm tra giờ
    if (hoursNum < 0 || hoursNum > 23) {
      setTimeInputError("Giờ không hợp lệ. Giờ phải từ 00-23");
      setFollowUpEndTime(null);
      return;
    }

    // Kiểm tra phút
    if (minutesNum < 0 || minutesNum > 59) {
      setTimeInputError("Phút không hợp lệ. Phút phải từ 00-59");
      setFollowUpEndTime(null);
      return;
    }

    if (!followUpDate) {
      setTimeInputError("Vui lòng chọn ngày trước");
      setFollowUpEndTime(null);
      return;
    }

    // ⭐ FE validation giống BookingModal: thời gian phải nằm trong khoảng khả dụng và đủ thời lượng dịch vụ
    const rangeResult = isTimeInAvailableRanges(timeInput);
    if (!rangeResult.isValid) {
      setTimeInputError("Khung giờ này không khả dụng. Vui lòng chọn thời gian trong khoảng thời gian khả dụng.");
      setFollowUpEndTime(null);
      return;
    }

    const validatedHours = rangeResult.overrideHours ?? hoursNum;
    const validatedMinutes = rangeResult.overrideMinutes ?? minutesNum;
    const startTotalMin = validatedHours * 60 + validatedMinutes;
    const endLimitMinutes = rangeResult.rangeEndVNMinutes ?? null;
    if (endLimitMinutes != null) {
      const endTotalMin = startTotalMin + serviceDuration;
      if (endTotalMin > endLimitMinutes) {
        setTimeInputError(`Thời gian bạn chọn không đáp ứng đủ thời gian cho dịch vụ này (${serviceDuration} phút). Vui lòng chọn giờ khác.`);
        setFollowUpEndTime(null);
        return;
      }
    }

    // ⭐ Convert giờ VN sang UTC: VN - 7
    // User nhập 08:00 (VN) → lưu 01:00 (UTC)
    // ⭐ Sử dụng helper function để format date theo VN timezone
    const dateStr = formatDateToVNString(followUpDate);
    const dateObj = new Date(dateStr + "T00:00:00.000Z");
    const utcHours = validatedHours - 7; // Convert VN to UTC
    dateObj.setUTCHours(utcHours, validatedMinutes, 0, 0);
    const startTimeISO = dateObj.toISOString();

    // ⭐ Clear tất cả lỗi cũ trước khi gọi BE validate
    setTimeInputError(null);

    // ⭐ Gọi backend validation, để BE quyết định trường hợp quá khứ và các edge cases
    try {
      // ⭐ Lưu endTime hiện tại để giữ lại trong quá trình validate (tránh bị ẩn khi click vào field khác)
      const currentEndTime = followUpEndTime;

      // ⭐ Kiểm tra xem thời gian input có thay đổi so với reservation hiện tại không
      // Nếu không thay đổi và đã có endTime, có thể skip validate hoặc giữ lại endTime
      const currentReservation = activeReservationRef.current;
      const isSameTime = currentReservation && currentReservation.startTime === startTimeISO;

      // ⭐ Release reservation cũ trước khi validate (nếu có và thời gian đã thay đổi)
      // Note: Có thể đã được release trong onChange, nhưng đảm bảo release hoàn tất
      if (activeReservationRef.current && !isSameTime) {
        await releaseReservation({ silent: true });
        // ⭐ Đợi thêm để đảm bảo BE đã cập nhật status trong DB trước khi validate
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const serviceId = followUpServiceIds[0]; // Lấy service đầu tiên để validate
      const validateRes = await validateAppointmentTime(
        followUpDoctorUserId,
        serviceId,
        dateStr,
        startTimeISO
      );

      if (!validateRes.success) {
        const errorMsg = validateRes.message || "Thời gian không hợp lệ";
        // ⭐ Map error message cho context bác sĩ
        const mappedErrorMsg = mapErrorMessageForDoctor(errorMsg);
        setTimeInputError(mappedErrorMsg);
        setHasReservedAfterBlur(false); // ⭐ Clear flag khi có lỗi
        // ⭐ Chỉ clear endTime khi thực sự có lỗi, không clear khi chỉ đang validate lại
        setFollowUpEndTime(null);
        return;
      }

      // ⭐ Parse endTime từ BE (UTC) và tạo Date object ngay sau khi validate thành công
      // ⭐ Set endTime ngay để tránh bị ẩn khi click vào field khác
      const endTimeDate = new Date(validateRes.data!.endTime);
      // ⭐ Chỉ update endTime nếu thực sự có thay đổi, hoặc chưa có endTime
      // Nếu đã có endTime và giống nhau, giữ nguyên để tránh bị ẩn
      if (!currentEndTime || currentEndTime.getTime() !== endTimeDate.getTime()) {
        setFollowUpEndTime(endTimeDate);
      }

      // ⭐ Reserve slot sau khi validate thành công (giống BookingModal)
      // Tìm doctorScheduleId từ availableSlots
      let doctorScheduleId: string | null = null;
      for (const range of availableSlots) {
        if (range.doctorScheduleId) {
          doctorScheduleId = range.doctorScheduleId;
          break;
        }
      }

      const reserveRes = await appointmentApi.reserveSlot({
        doctorUserId: followUpDoctorUserId,
        serviceId: serviceId,
        doctorScheduleId: doctorScheduleId,
        date: dateStr,
        startTime: startTimeISO,
        appointmentFor: "self", // Bác sĩ đặt cho chính mình
      });

      if (!reserveRes.success || !reserveRes.data) {
        const reserveError = reserveRes.message || "Không thể giữ chỗ cho khung giờ này.";
        setTimeInputError(reserveError);
        setHasReservedAfterBlur(false); // ⭐ Clear flag khi reserve thất bại
        // ⭐ Chỉ clear endTime khi reserve thất bại, nhưng nếu đã có endTime từ validate thì giữ lại
        // Vì endTime từ validate vẫn đúng, chỉ là không reserve được
        // setFollowUpEndTime(null);
        return;
      }

      handleReservationSuccess(reserveRes.data as ReservationInfo);

      // ⭐ Đánh dấu đã blur và reserve thành công để hiển thị message
      setHasReservedAfterBlur(true);

      // ⭐ Refresh schedule ngay sau khi giữ chỗ thành công
      // để cập nhật khoảng thời gian khả dụng (slot đã giữ chỗ sẽ không còn khả dụng)
      if (followUpDoctorUserId) {
        await loadAvailableSlots({ silent: true });
      }

      // ⭐ Clear error khi validation thành công
      setTimeInputError(null);
      // ⭐ endTime đã được set ở trên, không cần set lại
    } catch (err: any) {
      console.error("Error validating time:", err);
      const errorMsg = err.message || err.response?.data?.message || "Lỗi validate thời gian";
      // ⭐ Map error message cho context bác sĩ
      const mappedErrorMsg = mapErrorMessageForDoctor(errorMsg);
      setTimeInputError(mappedErrorMsg);
      setHasReservedAfterBlur(false); // ⭐ Clear flag khi có lỗi
      setFollowUpEndTime(null);
    }
  };

  // ⭐ Reservation countdown effect
  useEffect(() => {
    if (!activeReservation) {
      clearReservationTimer();
      setReservationCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const expiresAt = new Date(activeReservation.expiresAt).getTime();
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        clearReservationTimer();
        releaseReservation({ silent: true });
        setTimeInputError("Giữ chỗ đã hết hạn. Vui lòng chọn lại khung giờ.");
        setFollowUpTimeInput("");
        setFollowUpEndTime(null);
        return;
      }
      setReservationCountdown(Math.ceil(diff / 1000));
    };

    updateCountdown();
    clearReservationTimer();
    reservationTimerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      clearReservationTimer();
    };
  }, [activeReservation, clearReservationTimer, releaseReservation]);

  // ⭐ Clear hasReservedAfterBlur khi thay đổi input hoặc clear reservation
  // ⭐ Sửa: Clear ngay khi thay đổi input để đảm bảo message không hiển thị khi đang nhập
  useEffect(() => {
    // ⭐ Clear flag khi không có input hoặc không có reservation
    // Hoặc khi input thay đổi (để đảm bảo phải blur lại mới hiển thị message)
    if (!followUpTimeInput || !activeReservation) {
      setHasReservedAfterBlur(false);
    }
  }, [followUpTimeInput, activeReservation]);

  // ⭐ Release reservation khi thay đổi input (giống BookingModal)
  useEffect(() => {
    if (followUpTimeInput === "" || !followUpDate) {
      // ⭐ Cancel pending validation khi clear input
      if (pendingValidationRef.current?.timeoutId) {
        clearTimeout(pendingValidationRef.current.timeoutId);
        pendingValidationRef.current = null;
      }
      releaseReservation({ silent: true });
      setHasReservedAfterBlur(false); // ⭐ Clear flag khi clear input
    }
  }, [followUpTimeInput, followUpDate, releaseReservation]);


  // Helper function to close dropdown
  const closeDropdown = () => {
    setIsDropdownOpen(false);
    setDropdownPosition(null);
  };

  // Calculate dropdown position and close when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | FocusEvent) => {
      const target = event.target as Node;

      // Kiểm tra xem click có nằm trong các phần tử liên quan đến dropdown không
      const isClickInsideButton = dropdownButtonRef.current?.contains(target);
      const isClickInsideDropdownMenu = dropdownMenuRef.current?.contains(target);
      const isClickInsideCard = dropdownRef.current?.contains(target);

      // Nếu click vào bất kỳ đâu ngoài button, menu và card "Dịch vụ bổ sung", đóng dropdown
      const isClickInsideDropdownArea = isClickInsideButton || isClickInsideDropdownMenu || isClickInsideCard;

      if (!isClickInsideDropdownArea) {
        closeDropdown();
      }
    };

    const updateDropdownPosition = () => {
      if (dropdownButtonRef.current && isDropdownOpen) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    updateDropdownPosition();

    // Use a small delay to ensure the dropdown is rendered before adding listeners
    const timeoutId = setTimeout(() => {
      window.addEventListener('resize', updateDropdownPosition);
      document.addEventListener('mousedown', handleClickOutside, true); // Use capture phase
      document.addEventListener('click', handleClickOutside, true); // Also listen to click events
      document.addEventListener('scroll', updateDropdownPosition, true);
      document.addEventListener('focusin', handleClickOutside, true); // Listen to focus events
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDropdownPosition);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('scroll', updateDropdownPosition, true);
      document.removeEventListener('focusin', handleClickOutside, true);
    };
  }, [isDropdownOpen]);

  const handleAddService = async (service: { _id: string; serviceName: string; price: number }) => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      closeDropdown();
      return;
    }

    // Check if service already exists
    if (currentServices.some(s => s._id === service._id)) {
      toast.error("Dịch vụ này đã được thêm");
      closeDropdown();
      return;
    }

    // Close dropdown first
    closeDropdown();

    // Lưu lại state cũ để revert nếu có lỗi
    const previousServices = [...currentServices];

    // Add service locally for immediate UI update
    const newServices = [...currentServices, service];
    setCurrentServices(newServices);

    // Update on backend
    try {
      const serviceIds = newServices.map(s => s._id);
      const res = await medicalRecordApi.updateAdditionalServicesForDoctor(appointmentId, serviceIds);
      if (res.success && res.data) {
        // Sử dụng data từ response (đã được populate với additionalServiceIds)
        const record = res.data;
        if (record.additionalServiceIds && Array.isArray(record.additionalServiceIds)) {
          const updatedServices = record.additionalServiceIds
            .filter((s: any) => s && s._id)
            .map((s: any) => ({
              _id: s._id.toString(),
              serviceName: s.serviceName || '',
              price: s.price || 0
            }));
          setCurrentServices(updatedServices);

          // Update display từ response
          if (display) {
            setDisplay({
              ...display,
              additionalServices: updatedServices
            });
          }
        } else {
          // Nếu backend trả về empty, giữ lại local state
          setCurrentServices(newServices);
        }
        toast.success(`Đã thêm dịch vụ: ${service.serviceName}`);
      } else {
        // Revert on error
        setCurrentServices(previousServices);
        toast.error(res.message || "Không thể thêm dịch vụ");
      }
    } catch (e: any) {
      // Revert on error
      setCurrentServices(previousServices);
      toast.error(e.message || "Không thể thêm dịch vụ");
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      return;
    }

    const serviceToRemove = currentServices.find(s => s._id === serviceId);
    if (!serviceToRemove) return;

    // Lưu lại state cũ để revert nếu có lỗi
    const previousServices = [...currentServices];

    // Remove service locally
    const newServices = currentServices.filter(s => s._id !== serviceId);
    setCurrentServices(newServices);

    // Update on backend
    try {
      const serviceIds = newServices.map(s => s._id);
      const res = await medicalRecordApi.updateAdditionalServicesForDoctor(appointmentId, serviceIds);
      if (res.success && res.data) {
        // Sử dụng data từ response (đã được populate với additionalServiceIds)
        const record = res.data;
        if (record.additionalServiceIds && Array.isArray(record.additionalServiceIds)) {
          const updatedServices = record.additionalServiceIds
            .filter((s: any) => s && s._id)
            .map((s: any) => ({
              _id: s._id.toString(),
              serviceName: s.serviceName || '',
              price: s.price || 0
            }));
          setCurrentServices(updatedServices);

          // Update display từ response
          if (display) {
            setDisplay({
              ...display,
              additionalServices: updatedServices
            });
          }
        } else {
          setCurrentServices([]);
        }
        toast.success(`Đã xóa dịch vụ: ${serviceToRemove.serviceName}`);
      } else {
        // Revert on error
        setCurrentServices(previousServices);
        toast.error(res.message || "Không thể xóa dịch vụ");
      }
    } catch (e: any) {
      // Revert on error
      setCurrentServices(previousServices);
      toast.error(e.message || "Không thể xóa dịch vụ");
    }
  };

  const onSave = async (approve: boolean = false) => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      return;
    }
    if (approve && !canApprove) {
      toast.error("Không thể duyệt hồ sơ khi đã được khóa.");
      return;
    }

    // ⭐ VALIDATION: Kiểm tra các trường bắt buộc
    if (!diagnosis || diagnosis.trim() === '') {
      toast.error("Vui lòng nhập chẩn đoán");
      return;
    }

    if (!conclusion || conclusion.trim() === '') {
      toast.error("Vui lòng nhập kết luận");
      return;
    }

    // ⭐ THÊM: Validate nếu bác sĩ đang nghỉ phép
    if (
      followUpEnabled &&
      followUpDate &&
      availableSlots.length === 0 &&
      slotsMessage &&
      slotsMessage.includes("nghỉ phép")
    ) {
      toast.error("Bạn đang xin nghỉ phép vào ngày tái khám. Vui lòng chọn ngày khác.");
      return;
    }
    let followUpDateISO: string | null = null;
    if (followUpEnabled) {
      if (!followUpServiceIds || followUpServiceIds.length === 0) {
        toast.error("Không tìm thấy dịch vụ để tái khám. Vui lòng thêm dịch vụ bổ sung trước.");
        return;
      }
      if (!followUpDate) {
        toast.error("Vui lòng chọn ngày tái khám");
        return;
      }
      if (!followUpTimeInput) {
        toast.error("Vui lòng nhập giờ tái khám");
        return;
      }

      // ⭐ Validate: Phải nhập đủ cả giờ và phút
      const [hours, minutes] = followUpTimeInput.split(':');
      if (!hours || !minutes || hours === '' || minutes === '') {
        toast.error("Vui lòng nhập đủ cả giờ và phút (ví dụ: 08:30)");
        return;
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(followUpTimeInput)) {
        toast.error("Định dạng giờ không hợp lệ. Vui lòng nhập lại (ví dụ: 08:30)");
        return;
      }

      // Combine date and time
      const vnHours = parseInt(hours);
      const vnMinutes = parseInt(minutes);

      // ⭐ FIX: Tạo Date object từ date string (YYYY-MM-DD) để tránh timezone issue
      // followUpDate từ DatePicker là local date với time 00:00:00 local timezone
      // Cần lấy local date components và tạo UTC date string đúng
      const dateStr = formatDateToVNString(followUpDate);

      console.log('🔍 [onSave] Creating followUpDateISO:', {
        followUpDate: followUpDate,
        dateStr,
        vnHours,
        vnMinutes
      });

      // ⭐ Tạo Date object với UTC date string (YYYY-MM-DD) và set UTC hours
      // dateStr là "YYYY-MM-DD" từ local date components
      const followUpDateObj = new Date(dateStr + "T00:00:00.000Z");
      const utcHours = vnHours - 7;
      followUpDateObj.setUTCHours(utcHours, vnMinutes, 0, 0);

      // ⭐ Client-side validation for time availability before saving
      // Check if time is in available ranges
      const rangeResult = isTimeInAvailableRanges(followUpTimeInput);
      if (!rangeResult.isValid) {
        setTimeInputError("Khung giờ này không khả dụng. Vui lòng chọn thời gian trong khoảng thời gian khả dụng.");
        return;
      }

      // Check duration
      const validatedHours = rangeResult.overrideHours ?? vnHours;
      const validatedMinutes = rangeResult.overrideMinutes ?? vnMinutes;
      const startTotalMin = validatedHours * 60 + validatedMinutes;
      const endLimitMinutes = rangeResult.rangeEndVNMinutes ?? null;
      if (endLimitMinutes != null) {
        const endTotalMin = startTotalMin + serviceDuration;
        if (endTotalMin > endLimitMinutes) {
          setTimeInputError(`Thời gian bạn chọn không đáp ứng đủ thời gian cho dịch vụ này (${serviceDuration} phút). Vui lòng chọn giờ khác.`);
          return;
        }
      }

      console.log('🔍 [onSave] followUpDateObj after setUTCHours:', {
        iso: followUpDateObj.toISOString(),
        utc: {
          year: followUpDateObj.getUTCFullYear(),
          month: followUpDateObj.getUTCMonth() + 1,
          day: followUpDateObj.getUTCDate(),
          hour: followUpDateObj.getUTCHours(),
          minute: followUpDateObj.getUTCMinutes()
        },
        local: {
          year: followUpDateObj.getFullYear(),
          month: followUpDateObj.getMonth() + 1,
          day: followUpDateObj.getDate(),
          hour: followUpDateObj.getHours(),
          minute: followUpDateObj.getMinutes()
        }
      });

      // if (Number.isNaN(followUpDateObj.getTime())) {
      //   toast.error("Thời gian tái khám không hợp lệ");
      //   return;
      // }

      // Validate: Ngày tái khám phải lớn hơn ngày của ca khám hiện tại
      if (currentAppointment?.startTime) {
        try {
          const appointmentStartTime = new Date(currentAppointment.startTime);
          if (isNaN(appointmentStartTime.getTime())) {
            // Nếu không parse được startTime, fallback về check tương lai
            if (followUpDateObj.getTime() <= Date.now()) {
              toast.error("Ngày tái khám phải ở tương lai");
              return;
            }
          } else {
            if (followUpDateObj.getTime() <= appointmentStartTime.getTime()) {
              toast.error("Ngày tái khám phải sau ngày của ca khám hiện tại");
              return;
            }
          }
        } catch (e) {
          // Nếu có lỗi, fallback về check tương lai
          if (followUpDateObj.getTime() <= Date.now()) {
            toast.error("Ngày tái khám phải ở tương lai");
            return;
          }
        }
      } else if (followUpDateObj.getTime() <= Date.now()) {
        // Fallback: nếu không có appointment info, chỉ check tương lai
        toast.error("Ngày tái khám phải ở tương lai");
        return;
      }
      followUpDateISO = followUpDateObj.toISOString();
    }

    // ⭐ FIX: Release reservation trước khi save để tránh conflict với follow-up appointment mới
    // Reserved slot từ lần blur có thể conflict với follow-up appointment khi tạo
    if (followUpEnabled && activeReservation) {
      try {
        await releaseReservation({ silent: true });
        // ⭐ Đợi một chút để đảm bảo BE đã cập nhật status trong DB (giảm xuống limit)
      } catch (e) {
        // Ignore lỗi release reservation, vẫn tiếp tục save
        console.warn('Failed to release reservation before save:', e);
      }
    }

    setSaving(true);
    try {
      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const normalizeText = (text: string): string => {
        return text.trim().replace(/\s+/g, ' ');
      };

      // Normalize prescriptions array
      const normalizedPrescriptions = prescriptions.map((p) => ({
        medicine: normalizeText(p.medicine),
        dosage: normalizeText(p.dosage),
        duration: normalizeText(p.duration),
      }));

      const payload: any = {
        diagnosis: normalizeText(diagnosis),
        conclusion: normalizeText(conclusion),
        prescription: normalizedPrescriptions, // ⭐ Gửi prescriptions array đã normalize
        nurseNote: normalizeText(nurseNote),
        approve: approve,
        followUpRequired: followUpEnabled,
        followUpDate: followUpEnabled ? followUpDateISO : null,
        followUpNote: followUpEnabled ? normalizeText(followUpNote) : '',
      };

      const res = await medicalRecordApi.updateMedicalRecordForDoctor(appointmentId, payload);

      if (res.success && res.data) {
        if (approve) {
          // 1️⃣ Lưu xong rồi thì gọi approve
          const approveRes = await medicalRecordApi.approveMedicalRecordByDoctor(appointmentId);
          if (!approveRes.success) {
            throw new Error(approveRes.message || 'Duyệt hồ sơ thất bại');
          }

          // 2️⃣ Sau đó mới reload record như code cũ
          toast.success("Đã lưu và duyệt hồ sơ khám bệnh");
          // ⭐ FIX: Reload ngay lập tức (limit delay)
          setTimeout(async () => {
            try {
              const reloadRes = await medicalRecordApi.getOrCreateByAppointment(appointmentId, 'Doctor');
              if (reloadRes.success && reloadRes.data) {
                // ⭐ Update permissions từ reload response (quan trọng để update canEdit sau khi duyệt)
                if (reloadRes.data.permissions) {
                  setPermissions(reloadRes.data.permissions);
                  console.log('✅ [onSave] Updated permissions after approve:', reloadRes.data.permissions);
                }

                // ⭐ Update follow-up appointment info
                const reloadedRecord = reloadRes.data.record;
                setFollowUpEnabled(!!reloadedRecord.followUpRequired);

                // ⭐ Lấy followUpAppointmentId và thời gian từ follow-up appointment đã tạo
                const followUpApptId = reloadedRecord.followUpAppointmentId;
                if (followUpApptId) {
                  const followUpId = typeof followUpApptId === 'object' && followUpApptId !== null && '_id' in followUpApptId
                    ? (followUpApptId as { _id: string })._id
                    : followUpApptId;
                  setFollowUpAppointmentId(followUpId?.toString() || String(followUpId));

                  // ⭐ Nếu follow-up appointment đã được populate với timeslotId, lấy thời gian từ đó
                  if (typeof followUpApptId === 'object' && followUpApptId !== null && 'timeslotId' in followUpApptId) {
                    const timeslot = (followUpApptId as any).timeslotId;
                    if (timeslot && timeslot.startTime) {
                      const startTime = new Date(timeslot.startTime);
                      if (!Number.isNaN(startTime.getTime())) {
                        // Set followUpDate và followUpTimeInput từ timeslot
                        setFollowUpDate(startTime);
                        const vnHours = String((startTime.getUTCHours() + 7) % 24).padStart(2, '0');
                        const vnMinutes = String(startTime.getUTCMinutes()).padStart(2, '0');
                        setFollowUpTimeInput(`${vnHours}:${vnMinutes}`);
                        setFollowUpDateTime(formatDateTimeInputValue(startTime.toISOString()));

                        // ⭐ FIX: Tính và set followUpEndTime từ timeslot.endTime
                        if (timeslot.endTime) {
                          const endTime = new Date(timeslot.endTime);
                          if (!Number.isNaN(endTime.getTime())) {
                            setFollowUpEndTime(endTime);
                            console.log('✅ [onSave] Reloaded follow-up appointment end time from timeslot');
                          }
                        }

                        console.log('✅ [onSave] Reloaded follow-up appointment time from timeslot:', `${vnHours}:${vnMinutes}`);
                      }
                    }
                  }
                } else {
                  setFollowUpAppointmentId(null);
                }

                // ⭐ Update follow-up date và note từ record (fallback nếu không có timeslot)
                // ⭐ FIX: Luôn check followUpDate từ record để đảm bảo hiển thị đúng giờ/phút
                if (!reloadedRecord.followUpAppointmentId || (typeof reloadedRecord.followUpAppointmentId === 'object' && reloadedRecord.followUpAppointmentId !== null && !('timeslotId' in reloadedRecord.followUpAppointmentId))) {
                  if (reloadedRecord.followUpDate) {
                    const followUpDateObj = new Date(reloadedRecord.followUpDate);
                    setFollowUpDate(followUpDateObj);
                    const hours = String((followUpDateObj.getUTCHours() + 7) % 24).padStart(2, '0');
                    const minutes = String(followUpDateObj.getUTCMinutes()).padStart(2, '0');
                    setFollowUpTimeInput(`${hours}:${minutes}`);
                    setFollowUpDateTime(formatDateTimeInputValue(reloadedRecord.followUpDate));

                    // ⭐ Tính followUpEndTime từ followUpDate + service duration (nếu có)
                    if (followUpServiceIds.length > 0 && allServices.length > 0) {
                      const totalDuration = followUpServiceIds.reduce((total, serviceId) => {
                        const service = allServices.find(s => s._id === serviceId);
                        return total + (service?.durationMinutes || 0);
                      }, 0);
                      if (totalDuration > 0) {
                        const endTime = new Date(followUpDateObj.getTime() + totalDuration * 60 * 1000);
                        setFollowUpEndTime(endTime);
                      }
                    }
                  } else {
                    setFollowUpDate(null);
                    setFollowUpTimeInput("");
                    setFollowUpDateTime("");
                    setFollowUpEndTime(null);
                  }
                }
                setFollowUpNote(reloadedRecord.followUpNote || "");

                console.log('✅ [onSave] Reloaded medical record after approve');

                // ⭐ FIX: Delay tối thiểu (limit) trước khi navigate
                setTimeout(() => {
                  navigate(-1);
                }, 500); // 500ms delay
              }
            } catch (e) {
              console.warn('Failed to reload medical record:', e);
              // ⭐ FIX: Chỉ navigate khi reload thành công, không navigate khi có lỗi
              // Để user có thể thấy error và thử lại
            }
          }, 0); // 0ms delay
        } else {
          toast.success("Đã lưu hồ sơ khám bệnh");
          // ⭐ FIX: Nếu chỉ lưu (không approve), vẫn reload lại để lấy permissions và follow-up info mới
          setTimeout(async () => {
            try {
              const reloadRes = await medicalRecordApi.getOrCreateByAppointment(appointmentId, 'Doctor');
              if (reloadRes.success && reloadRes.data) {
                // ⭐ Update permissions từ reload response
                if (reloadRes.data.permissions) {
                  setPermissions(reloadRes.data.permissions);
                }

                // ⭐ Update follow-up info
                const reloadedRecord = reloadRes.data.record;
                setFollowUpEnabled(!!reloadedRecord.followUpRequired);

                // ⭐ Lấy followUpAppointmentId và thời gian từ follow-up appointment (nếu có)
                const followUpApptId = reloadedRecord.followUpAppointmentId;
                if (followUpApptId) {
                  const followUpId = typeof followUpApptId === 'object' && followUpApptId !== null && '_id' in followUpApptId
                    ? (followUpApptId as { _id: string })._id
                    : followUpApptId;
                  setFollowUpAppointmentId(followUpId?.toString() || String(followUpId));

                  // ⭐ Nếu follow-up appointment đã được populate với timeslotId, lấy thời gian từ đó
                  if (typeof followUpApptId === 'object' && followUpApptId !== null && 'timeslotId' in followUpApptId) {
                    const timeslot = (followUpApptId as any).timeslotId;
                    if (timeslot && timeslot.startTime) {
                      const startTime = new Date(timeslot.startTime);
                      if (!Number.isNaN(startTime.getTime())) {
                        setFollowUpDate(startTime);
                        const vnHours = String((startTime.getUTCHours() + 7) % 24).padStart(2, '0');
                        const vnMinutes = String(startTime.getUTCMinutes()).padStart(2, '0');
                        setFollowUpTimeInput(`${vnHours}:${vnMinutes}`);
                        setFollowUpDateTime(formatDateTimeInputValue(startTime.toISOString()));

                        if (timeslot.endTime) {
                          const endTime = new Date(timeslot.endTime);
                          if (!Number.isNaN(endTime.getTime())) {
                            setFollowUpEndTime(endTime);
                          }
                        }
                      }
                    }
                  }
                } else {
                  setFollowUpAppointmentId(null);
                }

                // ⭐ Update follow-up date và time từ record (nếu chưa có follow-up appointment)
                // ⭐ FIX: Luôn check followUpDate từ record để đảm bảo hiển thị đúng giờ/phút
                if (!followUpApptId || (typeof followUpApptId === 'object' && followUpApptId !== null && !('timeslotId' in followUpApptId))) {
                  if (reloadedRecord.followUpDate) {
                    const followUpDateObj = new Date(reloadedRecord.followUpDate);
                    setFollowUpDate(followUpDateObj);
                    const vnHours = String((followUpDateObj.getUTCHours() + 7) % 24).padStart(2, '0');
                    const vnMinutes = String(followUpDateObj.getUTCMinutes()).padStart(2, '0');
                    setFollowUpTimeInput(`${vnHours}:${vnMinutes}`);
                    setFollowUpDateTime(formatDateTimeInputValue(reloadedRecord.followUpDate));

                    // ⭐ Tính followUpEndTime từ followUpDate + service duration (nếu có)
                    if (followUpServiceIds.length > 0 && allServices.length > 0) {
                      const totalDuration = followUpServiceIds.reduce((total, serviceId) => {
                        const service = allServices.find(s => s._id === serviceId);
                        return total + (service?.durationMinutes || 0);
                      }, 0);
                      if (totalDuration > 0) {
                        const endTime = new Date(followUpDateObj.getTime() + totalDuration * 60 * 1000);
                        setFollowUpEndTime(endTime);
                      }
                    }
                  } else {
                    setFollowUpDate(null);
                    setFollowUpTimeInput("");
                    setFollowUpDateTime("");
                    setFollowUpEndTime(null);
                  }
                }

                setFollowUpNote(reloadedRecord.followUpNote || "");
              }
            } catch (e) {
              console.warn('Failed to reload medical record after save:', e);
            }
          }, 300);
          // ⭐ FIX: Không navigate khi chỉ lưu, để user có thể xem kết quả
        }
      } else {
        // ⭐ Hiển thị error chỉ qua toast (không hiển thị inline error)
        const errorMsg = res.message || "Lưu thất bại";
        if (followUpEnabled && (errorMsg.includes('trùng') || errorMsg.includes('Khung giờ') || errorMsg.includes('thời gian') || errorMsg.includes('Bệnh nhân đã có lịch'))) {
          const mappedErrorMsg = mapErrorMessageForDoctor(errorMsg);
          // ⭐ Set inline error thay vì toast
          setTimeInputError(mappedErrorMsg);

          // ⭐ QUAN TRỌNG: Gọi hàm này để hủy trạng thái "Đang giữ chỗ" trên UI
          // Vì lịch này đã bị lỗi trùng, không thể giữ chỗ được nữa.
          await releaseReservation({ silent: true });
          // ⭐ Force clear state ngay lập tức để ẩn bộ đếm
          setActiveReservation(null);
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (e: any) {
      // ⭐ Hiển thị error chỉ qua toast (không hiển thị inline error)
      const errorMsg = e.message || "Lưu thất bại";
      if (followUpEnabled && (errorMsg.includes('trùng') || errorMsg.includes('Khung giờ') || errorMsg.includes('thời gian') || errorMsg.includes('Bệnh nhân đã có lịch'))) {
        const mappedErrorMsg = mapErrorMessageForDoctor(errorMsg);
        // ⭐ Set inline error thay vì toast
        setTimeInputError(mappedErrorMsg);

        // ⭐ QUAN TRỌNG: Gọi hàm này để hủy trạng thái "Đang giữ chỗ" trên UI
        // Vì lịch này đã bị lỗi trùng, không thể giữ chỗ được nữa.
        await releaseReservation({ silent: true });
        // ⭐ Force clear state ngay lập tức để ẩn bộ đếm
        setActiveReservation(null);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const onApprove = async () => {
    if (!canApprove) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể duyệt.");
      return;
    }
    await onSave(true);
  };

  // Filter services that are not yet added
  const availableServices = allServices.filter(
    service => !currentServices.some(current => current._id === service._id)
  );

  if (loading) return (
    <div className="flex items-center justify-center h-96"><Spinner label="Đang tải hồ sơ..." /></div>
  );

  if (error) return (
    <div className="p-6 text-center text-red-600">{error}</div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ⭐ Nút Back khi không thể chỉnh sửa (read-only) */}
      {!canEdit && (
        <div className="mb-4">
          <Button
            onClick={() => navigate(-1)}
            color="default"
            variant="flat"
            className="border border-gray-300"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Quay lại
          </Button>
        </div>
      )}
      {!canEdit && lockReason && (
        <Card className="bg-warning-50 border-warning-200">
          <CardBody>
            <p className="text-warning-700 font-medium">{lockReason}</p>
          </CardBody>
        </Card>
      )}

      {/* Patient info */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">Thông tin bệnh nhân</h3>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 font-medium">Họ và tên</p>
              <p className="text-gray-900 font-semibold text-lg">{display?.patientName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Giới tính</p>
              <p className="text-gray-900 font-semibold">{display?.gender || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Tuổi</p>
              <p className="text-gray-900 font-semibold">{(() => {
                const ageFromBE = display?.patientAge ?? null;
                const fallback = calcAge(display?.patientDob ?? null);
                const age = ageFromBE && ageFromBE > 0 ? ageFromBE : (fallback ?? 0);
                return age || '-';
              })()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Số điện thoại</p>
              <p className="text-gray-900 font-semibold">{display?.phoneNumber || '-'}</p>
            </div>
            <div className="lg:col-span-2">
              <p className="text-sm text-gray-600 font-medium">Email</p>
              <p className="text-gray-900 font-semibold break-all">{display?.email || '-'}</p>
            </div>
            <div className="lg:col-span-2">
              <p className="text-sm text-gray-600 font-medium">Địa chỉ</p>
              <p className="text-gray-900 font-semibold">{display?.address || '-'}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Additional Services (editable cho doctor) */}
      <div className="relative" ref={dropdownRef}>
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-teal-600" />
              <h4 className="font-semibold text-gray-800">Dịch vụ bổ sung</h4>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4 space-y-4">
            {/* Current services */}
            {currentServices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentServices.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-teal-200 shadow-sm"
                  >
                    <span className="font-medium text-gray-800">{s.serviceName}</span>
                    <span className="text-xs text-gray-500">{(s.finalPrice ?? s.price).toLocaleString('vi-VN')}đ</span>
                    <button
                      onClick={() => handleRemoveService(s._id)}
                      disabled={!canEdit}
                      className={`ml-1 p-1 rounded-full transition-colors ${canEdit ? "hover:bg-red-100" : "opacity-50 cursor-not-allowed"}`}
                      type="button"
                    >
                      <XMarkIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">Không có dịch vụ bổ sung</div>
            )}

            {/* Dropdown button để thêm dịch vụ - Nằm trong Card */}
            <div>
              <button
                ref={dropdownButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canEdit) return;
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                disabled={!canEdit}
                className={`flex items-center justify-between w-full px-4 py-2 bg-white border border-teal-300 rounded-lg transition-colors shadow-sm ${canEdit ? "hover:bg-teal-50" : "opacity-60 cursor-not-allowed"}`}
                type="button"
              >
                <span className="text-gray-700">Thêm dịch vụ</span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Dropdown menu - Hiển thị bên ngoài Card với fixed positioning */}
        {canEdit && isDropdownOpen && dropdownPosition && (
          <div
            ref={dropdownMenuRef}
            className="fixed z-50 bg-white border border-teal-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {availableServices.length > 0 ? (
              <div className="py-2">
                {availableServices.map((service) => (
                  <button
                    key={service._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Khi thêm, sử dụng finalPrice nếu có để hiển thị ngay
                      handleAddService({ ...service, price: typeof service.finalPrice === 'number' ? service.finalPrice : service.price } as any);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-teal-50 transition-colors"
                    type="button"
                  >
                    <span className="font-medium text-gray-800">{service.serviceName}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {(typeof service.finalPrice === 'number' ? service.finalPrice : service.price).toLocaleString('vi-VN')}đ
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2 text-gray-500 text-center">Không còn dịch vụ nào để thêm</div>
            )}
          </div>
        )}
      </div>

      {/* Diagnosis (editable cho doctor) */}
      <Card
        className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
        onMouseDown={() => {
          if (isDropdownOpen) {
            closeDropdown();
          }
        }}
      >
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <BeakerIcon className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-800">Chẩn đoán <span className="text-red-500">*</span></h4>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <Textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            variant={canEdit ? "bordered" : "flat"}
            minRows={3}
            placeholder="Nhập chẩn đoán bệnh..."
            isReadOnly={!canEdit}
            onFocus={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            onMouseDown={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            classNames={{
              input: canEdit ? undefined : "bg-gray-100 text-gray-500",
              base: canEdit ? undefined : "opacity-60"
            }}
          />
        </CardBody>
      </Card>

      {/* Conclusion (editable cho doctor) */}
      <Card
        className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
        onMouseDown={() => {
          if (isDropdownOpen) {
            closeDropdown();
          }
        }}
      >
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Kết luận - Hướng dẫn <span className="text-red-500">*</span></h4>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <Textarea
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            variant={canEdit ? "bordered" : "flat"}
            minRows={3}
            placeholder="Nhập kết luận và hướng dẫn điều trị..."
            isReadOnly={!canEdit}
            onFocus={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            onMouseDown={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            classNames={{
              input: canEdit ? undefined : "bg-gray-100 text-gray-500",
              base: canEdit ? undefined : "opacity-60"
            }}
          />
        </CardBody>
      </Card>

      {/* Prescription (editable cho doctor) */}
      <Card
        className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
        onMouseDown={() => {
          if (isDropdownOpen) {
            closeDropdown();
          }
        }}
      >
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-gray-800">Đơn thuốc</h4>
            <span className="text-xs text-gray-500 ml-2">(Tùy chọn - có thể bỏ qua nếu không cần)</span>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <div className="space-y-4">
            {/* ⭐ Hiển thị danh sách đơn thuốc */}
            {displayedPrescriptions.length === 0 && !canEdit ? (
              <div className="text-center text-gray-500 py-4">
                Chưa có đơn thuốc
              </div>
            ) : (
              displayedPrescriptions.map((prescription, displayedIndex) => {
                // ⭐ Tìm index trong mảng prescriptions gốc để cập nhật đúng
                const originalIndex = prescriptions.findIndex(
                  (p) => p === prescription
                );
                const index = originalIndex >= 0 ? originalIndex : displayedIndex;
                return (
                <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                  {/* ⭐ 3 trường hiển thị theo hàng ngang */}
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <Input
                      label="Thuốc"
                      value={prescription.medicine}
                      onChange={(e) => {
                        const updated = [...prescriptions];
                        updated[index] = { ...updated[index], medicine: e.target.value };
                        setPrescriptions(updated);
                      }}
                      variant={canEdit ? "bordered" : "flat"}
                      placeholder="Nhập tên thuốc"
                      isReadOnly={!canEdit}
                      onFocus={() => {
                        if (isDropdownOpen) {
                          closeDropdown();
                        }
                      }}
                      onMouseDown={() => {
                        if (isDropdownOpen) {
                          closeDropdown();
                        }
                      }}
                      classNames={!canEdit ? { inputWrapper: "bg-gray-100 opacity-60", input: "text-gray-500" } : undefined}
                    />

                    <Input
                      label="Liều dùng"
                      value={prescription.dosage}
                      onChange={(e) => {
                        const updated = [...prescriptions];
                        updated[index] = { ...updated[index], dosage: e.target.value };
                        setPrescriptions(updated);
                      }}
                      variant={canEdit ? "bordered" : "flat"}
                      placeholder="Ví dụ: 2 viên/lần"
                      isReadOnly={!canEdit}
                      onFocus={() => {
                        if (isDropdownOpen) {
                          closeDropdown();
                        }
                      }}
                      onMouseDown={() => {
                        if (isDropdownOpen) {
                          closeDropdown();
                        }
                      }}
                      classNames={!canEdit ? { inputWrapper: "bg-gray-100 opacity-60", input: "text-gray-500" } : undefined}
                    />

                    <Input
                      label="Thời gian sử dụng"
                      value={prescription.duration}
                      onChange={(e) => {
                        const updated = [...prescriptions];
                        updated[index] = { ...updated[index], duration: e.target.value };
                        setPrescriptions(updated);
                      }}
                      variant={canEdit ? "bordered" : "flat"}
                      placeholder="Ví dụ: 7 ngày"
                      isReadOnly={!canEdit}
                      onFocus={() => {
                        if (isDropdownOpen) {
                          closeDropdown();
                        }
                      }}
                      onMouseDown={() => {
                        if (isDropdownOpen) {
                          closeDropdown();
                        }
                      }}
                      classNames={!canEdit ? { inputWrapper: "bg-gray-100 opacity-60", input: "text-gray-500" } : undefined}
                    />
                  </div>

                  {/* ⭐ Nút xóa đơn thuốc (chỉ hiển thị khi có thể edit và có nhiều hơn 1 đơn) */}
                  {canEdit && displayedPrescriptions.length > 1 && (
                    <Button
                      isIconOnly
                      color="danger"
                      variant="light"
                      size="sm"
                      onPress={() => {
                        const updated = prescriptions.filter((_, i) => i !== index);
                        setPrescriptions(updated);
                      }}
                      className="mt-6"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                );
              })
            )}

            {/* ⭐ Nút thêm đơn thuốc mới - Icon dấu cộng ở góc phải dưới */}
            {canEdit && (
              <div className="flex justify-end pt-2">
                <Button
                  isIconOnly
                  color="primary"
                  variant="solid"
                  size="md"
                  onPress={() => {
                    setPrescriptions([...prescriptions, { medicine: "", dosage: "", duration: "" }]);
                  }}
                >
                  <PlusIcon className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Follow-up */}
      <Card
        className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
        onMouseDown={() => {
          if (isDropdownOpen) {
            closeDropdown();
          }
        }}
      >
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-800">Tái khám</h4>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={followUpEnabled}
              disabled={!canEdit}
              onChange={(e) => {
                const checked = e.target.checked;
                setFollowUpEnabled(checked);
                // ⭐ Luôn clear error state khi thay đổi checkbox (check hoặc uncheck)
                setTimeInputError(null);
                setFollowUpEndTime(null);

                // ⭐ Release reservation khi uncheck (giống BookingModal khi đóng modal)
                if (!checked) {
                  releaseReservation({ silent: true });
                }

                if (checked && !followUpDate) {
                  // ⭐ Đặt mặc định là ngày hiện tại (hôm nay) thay vì 7 ngày sau
                  const defaultDate = new Date();
                  defaultDate.setHours(0, 0, 0, 0);
                  setFollowUpDate(defaultDate);
                  // ⭐ Set lỗi vì ngày tái khám không được là ngày hiện tại
                  setFollowUpDateError("Vui lòng chọn ngày tái khám khác ngày hiện tại");
                  // ⭐ Không tự fill giờ, để người dùng tự nhập
                  setFollowUpTimeInput("");
                  setFollowUpDateTime("");
                } else if (!checked) {
                  // Khi uncheck, clear tất cả
                  setFollowUpTimeInput("");
                  setFollowUpDateTime("");
                  setFollowUpDateError(null);
                }
              }}
              className="w-4 h-4 accent-purple-600"
            />
            <span className="text-sm text-gray-700 font-medium">Có tái khám</span>
          </div>
          {followUpEnabled && (
            <div className="space-y-4">
              {/* Hiển thị tất cả dịch vụ bổ sung */}
              {followUpServiceIds.length > 0 && (
                <div className="p-3 bg-white/80 border border-purple-200 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-2">Dịch vụ tái khám:</p>
                  <div className="space-y-1">
                    {followUpServiceIds.map((serviceId) => {
                      const service = currentServices.find(s => s._id === serviceId) ||
                        allServices.find(s => s._id === serviceId);
                      return service ? (
                        <div key={serviceId} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <p className="text-sm text-purple-700 font-semibold">
                            {service.serviceName}
                          </p>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    (Tự động lấy từ dịch vụ bổ sung, sẽ tự động cập nhật khi thêm/xóa dịch vụ)
                  </p>
                </div>
              )}
              {followUpServiceIds.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    ⚠️ Chưa có dịch vụ bổ sung. Vui lòng thêm dịch vụ bổ sung trước khi đặt tái khám.
                  </p>
                </div>
              )}

              {/* Chọn ngày */}
              <div>
                <label htmlFor="follow-up-date" className="block text-sm mb-1 font-medium text-gray-700">
                  Chọn ngày <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="follow-up-date"
                  selected={followUpDate}
                  onChange={(date) => {
                    setFollowUpDate(date);
                    // ⭐ Check và set lỗi nếu ngày là ngày hiện tại
                    if (isToday(date)) {
                      setFollowUpDateError("Vui lòng chọn ngày tái khám khác ngày hiện tại");
                    } else {
                      setFollowUpDateError(null);
                    }
                    // ⭐ Reset giờ khi đổi ngày (release reservation sẽ được xử lý trong useEffect loadAvailableSlots)
                    setFollowUpTimeInput("");
                    setFollowUpEndTime(null);
                    setTimeInputError(null);
                    setFollowUpDateTime("");
                  }}
                  minDate={currentAppointment?.startTime
                    ? (() => {
                      try {
                        // Lấy ngày của appointment hiện tại từ ISO string
                        const appointmentDate = new Date(currentAppointment.startTime);
                        if (isNaN(appointmentDate.getTime())) {
                          // Fallback nếu không parse được
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          tomorrow.setHours(0, 0, 0, 0);
                          return tomorrow;
                        }
                        // Lấy date string theo timezone VN (UTC+7) để tính chính xác
                        const appointmentYear = appointmentDate.getUTCFullYear();
                        const appointmentMonth = appointmentDate.getUTCMonth();
                        const appointmentDay = appointmentDate.getUTCDate();
                        // Tạo minDate là ngày sau appointment date (dùng local date constructor)
                        const minDate = new Date(appointmentYear, appointmentMonth, appointmentDay + 1);
                        minDate.setHours(0, 0, 0, 0);
                        return minDate;
                      } catch (e) {
                        // Fallback nếu có lỗi
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(0, 0, 0, 0);
                        return tomorrow;
                      }
                    })()
                    : (() => {
                      // Nếu không có appointment info, dùng ngày mai
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(0, 0, 0, 0);
                      return tomorrow;
                    })()}
                  filterDate={(date) => {
                    // Filter: chỉ cho phép chọn ngày sau ngày appointment hiện tại
                    if (currentAppointment?.startTime) {
                      try {
                        const appointmentDate = new Date(currentAppointment.startTime);
                        if (isNaN(appointmentDate.getTime())) {
                          // Fallback: cho phép chọn từ ngày mai
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const selectedDate = new Date(date);
                          selectedDate.setHours(0, 0, 0, 0);
                          return selectedDate > today;
                        }
                        // Lấy date string theo timezone VN (UTC+7) để so sánh chính xác
                        const appointmentYear = appointmentDate.getUTCFullYear();
                        const appointmentMonth = appointmentDate.getUTCMonth();
                        const appointmentDay = appointmentDate.getUTCDate();
                        const appointmentDateStr = `${appointmentYear}-${String(appointmentMonth + 1).padStart(2, '0')}-${String(appointmentDay).padStart(2, '0')}`;

                        // Lấy date string của ngày được chọn (date từ DatePicker là local date)
                        const selectedYear = date.getFullYear();
                        const selectedMonth = date.getMonth();
                        const selectedDay = date.getDate();
                        const selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

                        // So sánh: ngày tái khám phải sau ngày appointment
                        return selectedDateStr > appointmentDateStr;
                      } catch (e) {
                        // Fallback: cho phép chọn từ ngày mai
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const selectedDate = new Date(date);
                        selectedDate.setHours(0, 0, 0, 0);
                        return selectedDate > today;
                      }
                    }
                    // Nếu không có appointment info, cho phép chọn từ ngày mai
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDate = new Date(date);
                    selectedDate.setHours(0, 0, 0, 0);
                    return selectedDate > today;
                  }}
                  dateFormat="dd/MM/yyyy"
                  locale="vi"
                  placeholderText="Chọn ngày"
                  wrapperClassName="w-full"
                  className={`w-full border px-3 py-2 rounded-lg ${followUpDateError ? "border-red-500" : ""} ${!canEdit ? "bg-gray-100 opacity-60" : ""}`}
                  readOnly={!canEdit}
                />
                {followUpDateError && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {followUpDateError}
                  </p>
                )}
              </div>

              {/* Time Input - shows only if doctor is selected và không có lỗi ngày - Giống hệt BookingModal */}
              {followUpDate && followUpDoctorUserId && followUpServiceIds.length > 0 && !followUpDateError && (
                <div>
                  <label className="block text-sm mb-1 font-medium text-gray-700">
                    Thời gian bắt đầu khám *
                  </label>
                  {loadingSlots ? (
                    <div className="text-gray-500 py-3 text-center">
                      Đang tải lịch bác sĩ...
                    </div>
                  ) : slotsForDisplay && Array.isArray(slotsForDisplay) && slotsForDisplay.length > 0 ? (
                    <div className="space-y-3">
                      {/* Hiển thị các khoảng thời gian khả dụng chi tiết - TRƯỚC phần nhập giờ */}
                      <div className="p-3 bg-blue-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium mb-2">
                          Khoảng thời gian khả dụng:
                        </p>
                        <div className="space-y-2">
                          {slotsForDisplay.map((range: any, index: number) => (
                            <div key={index}>
                              <p className="text-sm font-semibold text-[#39BDCC] mb-1">
                                {range.shiftDisplay}:
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

                      {/* Input thời gian và hiển thị kết quả nằm ngang - Chỉ hiện khi có slot khả dụng */}
                      {slotsForDisplay.some((r: any) => r.displayRange !== 'Đã hết chỗ' && r.displayRange !== 'Đã qua thời gian làm việc') ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Nhập giờ bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              {/* Hour input */}
                              <input
                                id="follow-up-time-hour"
                                type="text"
                                inputMode="numeric"
                                placeholder="Giờ"
                                className={`w-16 text-center border px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent ${timeInputError
                                  ? 'border-red-500 focus:ring-red-500'
                                  : !canEdit
                                    ? "bg-gray-100 opacity-60"
                                    : 'focus:ring-[#39BDCC] focus:border-transparent'
                                  }`}
                                value={(followUpTimeInput || '').split(':')[0] || ''}
                                onChange={async (e) => {
                                  let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                  // ⭐ Clear flag ngay khi bắt đầu onChange để ẩn message khi đang nhập
                                  setHasReservedAfterBlur(false);
                                  setTimeInputError(null);
                                  // ⭐ Sửa: Chỉ clear endTime khi thực sự thay đổi giờ/phút, không clear khi đang nhập
                                  // Chỉ clear khi xóa hết hoặc thay đổi đáng kể
                                  const currentMinute = (followUpTimeInput || '').split(':')[1] || '';
                                  const timeInput = v + ':' + currentMinute;
                                  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;

                                  // ⭐ Release reservation nếu đã xóa hết giờ và phút
                                  if (activeReservation && (!v || v === '') && (!currentMinute || currentMinute === '')) {
                                    await releaseReservation({ silent: true });
                                    setFollowUpEndTime(null); // ⭐ Chỉ clear endTime khi xóa hết
                                    setHasReservedAfterBlur(false); // ⭐ Clear flag khi xóa hết
                                  }

                                  // ⭐ Release reservation cũ ngay khi phát hiện thời gian thay đổi (không cần đợi format đầy đủ)
                                  // ⭐ Sử dụng ref để tránh stale closure
                                  const currentReservation = activeReservationRef.current;
                                  if (currentReservation && followUpDate) {
                                    const oldHour = (followUpTimeInput || '').split(':')[0] || '';

                                    // Nếu giờ đã thay đổi (khác với giờ cũ), release ngay
                                    if (oldHour && v && oldHour !== v) {
                                      setTimeInputError(null);
                                      await releaseReservation({ silent: true });
                                      setHasReservedAfterBlur(false); // ⭐ Clear flag khi thay đổi giờ
                                      // ⭐ Chỉ clear endTime khi thay đổi giờ đáng kể (không phải chỉ đang nhập)
                                      if (v.length === 2) {
                                        setFollowUpEndTime(null);
                                      }
                                    }
                                    // Hoặc nếu format đầy đủ và thời gian khác với reservation hiện tại
                                    else if (timeRegex.test(timeInput)) {
                                      const [hours, minutes] = timeInput.split(':');
                                      const vnHours = parseInt(hours);
                                      const vnMinutes = parseInt(minutes);
                                      const utcHours = vnHours - 7;
                                      const dateStr = formatDateToVNString(followUpDate);
                                      const dateObj = new Date(dateStr + 'T00:00:00.000Z');
                                      dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
                                      const newStartTimeISO = dateObj.toISOString();

                                      // So sánh với reservation hiện tại - release nếu khác
                                      if (currentReservation.startTime !== newStartTimeISO) {
                                        // Thời gian đã thay đổi → release reservation cũ ngay lập tức
                                        setTimeInputError(null);
                                        await releaseReservation({ silent: true });
                                        setHasReservedAfterBlur(false); // ⭐ Clear flag khi thời gian thay đổi
                                        setFollowUpEndTime(null); // ⭐ Clear endTime khi thời gian thay đổi
                                      }
                                    }
                                    // Nếu đang xóa (v rỗng hoặc chỉ có 1 ký tự) nhưng vẫn có reservation → release
                                    else if ((!v || v === '') && oldHour) {
                                      setTimeInputError(null);
                                      await releaseReservation({ silent: true });
                                      setHasReservedAfterBlur(false); // ⭐ Clear flag khi xóa
                                      setFollowUpEndTime(null); // ⭐ Clear endTime khi xóa
                                    }
                                  }

                                  if (timeRegex.test(timeInput)) {
                                    const [hours, minutes] = timeInput.split(':');
                                    const vnHours = parseInt(hours);
                                    const vnMinutes = parseInt(minutes);
                                    const utcHours = vnHours - 7;
                                    const dateStr = formatDateToVNString(followUpDate!);
                                    const dateObj = new Date(dateStr + 'T00:00:00.000Z');
                                    dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
                                    const endTimeDate = new Date(dateObj.getTime() + serviceDuration * 60000);
                                    setFollowUpTimeInput(timeInput);
                                    // ⭐ Chỉ set endTime khi format hợp lệ, không clear khi đang nhập
                                    setFollowUpEndTime(endTimeDate);

                                    // ⭐ KHÔNG tự động validate - chỉ validate khi blur
                                  } else {
                                    setFollowUpTimeInput(timeInput);
                                    // ⭐ Không clear endTime khi đang nhập, chỉ clear khi xóa hết hoặc thay đổi đáng kể
                                  }
                                }}
                                onBlur={() => {
                                  const [h, m] = (followUpTimeInput || '').split(':');
                                  if (h && h !== '' && m && m !== '') {
                                    handleTimeInputBlur(h + ':' + m);
                                  } else {
                                    setTimeInputError(null);
                                    setFollowUpEndTime(null);
                                  }
                                }}
                                readOnly={!canEdit}
                              />
                              <span className="font-semibold">:</span>
                              {/* Minute input */}
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Phút"
                                className={`w-16 text-center border px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent ${timeInputError
                                  ? 'border-red-500 focus:ring-red-500'
                                  : !canEdit
                                    ? "bg-gray-100 opacity-60"
                                    : 'focus:ring-[#39BDCC] focus:border-transparent'
                                  }`}
                                value={(followUpTimeInput || '').split(':')[1] || ''}
                                onChange={async (e) => {
                                  let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                  // ⭐ Clear flag ngay khi bắt đầu onChange để ẩn message khi đang nhập
                                  setHasReservedAfterBlur(false);
                                  setTimeInputError(null);
                                  // ⭐ Sửa: Chỉ clear endTime khi thực sự thay đổi giờ/phút, không clear khi đang nhập
                                  const currentHour = (followUpTimeInput || '').split(':')[0] || '';
                                  const timeInput = currentHour + ':' + v;
                                  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;

                                  // ⭐ Release reservation nếu đã xóa hết giờ và phút
                                  if (activeReservation && (!currentHour || currentHour === '') && (!v || v === '')) {
                                    await releaseReservation({ silent: true });
                                    setFollowUpEndTime(null); // ⭐ Chỉ clear endTime khi xóa hết
                                    setHasReservedAfterBlur(false); // ⭐ Clear flag khi xóa hết
                                  }

                                  // ⭐ Release reservation cũ ngay khi phát hiện thời gian thay đổi (không cần đợi format đầy đủ)
                                  // ⭐ Sử dụng ref để tránh stale closure
                                  const currentReservation = activeReservationRef.current;
                                  if (currentReservation && followUpDate) {
                                    const oldMinute = (followUpTimeInput || '').split(':')[1] || '';

                                    // Nếu phút đã thay đổi (khác với phút cũ), release ngay
                                    if (oldMinute && v && oldMinute !== v) {
                                      setTimeInputError(null);
                                      await releaseReservation({ silent: true });
                                      setHasReservedAfterBlur(false); // ⭐ Clear flag khi thay đổi phút
                                      // ⭐ Chỉ clear endTime khi thay đổi phút đáng kể (không phải chỉ đang nhập)
                                      if (v.length === 2) {
                                        setFollowUpEndTime(null);
                                      }
                                    }
                                    // Hoặc nếu format đầy đủ và thời gian khác với reservation hiện tại
                                    else if (timeRegex.test(timeInput)) {
                                      const [hours, minutes] = timeInput.split(':');
                                      const vnHours = parseInt(hours);
                                      const vnMinutes = parseInt(minutes);
                                      const utcHours = vnHours - 7;
                                      const dateStr = formatDateToVNString(followUpDate);
                                      const dateObj = new Date(dateStr + 'T00:00:00.000Z');
                                      dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
                                      const newStartTimeISO = dateObj.toISOString();

                                      // So sánh với reservation hiện tại - release nếu khác
                                      if (currentReservation.startTime !== newStartTimeISO) {
                                        // Thời gian đã thay đổi → release reservation cũ ngay lập tức
                                        setTimeInputError(null);
                                        await releaseReservation({ silent: true });
                                        setHasReservedAfterBlur(false); // ⭐ Clear flag khi thời gian thay đổi
                                        setFollowUpEndTime(null); // ⭐ Clear endTime khi thời gian thay đổi
                                      }
                                    }
                                    // Nếu đang xóa (v rỗng) nhưng vẫn có reservation → release
                                    else if ((!v || v === '') && oldMinute) {
                                      setTimeInputError(null);
                                      await releaseReservation({ silent: true });
                                      setHasReservedAfterBlur(false); // ⭐ Clear flag khi xóa
                                      setFollowUpEndTime(null); // ⭐ Clear endTime khi xóa
                                    }
                                  }

                                  if (timeRegex.test(timeInput)) {
                                    const [hours, minutes] = timeInput.split(':');
                                    const vnHours = parseInt(hours);
                                    const vnMinutes = parseInt(minutes);
                                    const utcHours = vnHours - 7;
                                    const dateStr = formatDateToVNString(followUpDate!);
                                    const dateObj = new Date(dateStr + 'T00:00:00.000Z');
                                    dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
                                    const endTimeDate = new Date(dateObj.getTime() + serviceDuration * 60000);
                                    setFollowUpTimeInput(timeInput);
                                    // ⭐ Chỉ set endTime khi format hợp lệ, không clear khi đang nhập
                                    setFollowUpEndTime(endTimeDate);

                                    // ⭐ KHÔNG tự động validate - chỉ validate khi blur
                                  } else {
                                    setFollowUpTimeInput(timeInput);
                                    // ⭐ Không clear endTime khi đang nhập, chỉ clear khi xóa hết hoặc thay đổi đáng kể
                                  }
                                }}
                                onBlur={() => {
                                  const [h, m] = (followUpTimeInput || '').split(':');
                                  if (h && h !== '' && m && m !== '') {
                                    handleTimeInputBlur(h + ':' + m);
                                  } else {
                                    setTimeInputError(null);
                                    setFollowUpEndTime(null);
                                  }
                                }}
                                readOnly={!canEdit}
                              />
                            </div>

                            {timeInputError && (
                              <p className="mt-1 text-xs text-red-500 font-medium">
                                {timeInputError}
                              </p>
                            )}

                            {/* ⭐ Chỉ hiển thị message giữ chỗ sau khi blur và reserve thành công */}
                            {activeReservation && reservationCountdown > 0 && !timeInputError && hasReservedAfterBlur && (
                              <p className="mt-1 text-xs text-[#39BDCC]">
                                Đang giữ chỗ {formatVNTimeFromISO(activeReservation.startTime)} -{" "}
                                {formatVNTimeFromISO(activeReservation.endTime)} ngày{" "}
                                {formatVNDateFromISO(activeReservation.startTime)} · Hết hạn giữ chỗ sau{" "}
                                {reservationCountdown}s
                              </p>
                            )}
                          </div>

                          {/* ⭐ Hiển thị endTime bằng 2 ô (Giờ/Phút) như start time — chỉ hiện khi start time hợp lệ và đã có endTime */}
                          {/* ⭐ Sửa: Chỉ cần có followUpTimeInput hợp lệ và followUpEndTime, không cần kiểm tra regex lại vì đã validate khi blur */}
                          {followUpTimeInput &&
                            !timeInputError &&
                            followUpEndTime &&
                            !isNaN(followUpEndTime.getTime()) && (
                              <div className="flex flex-col items-end text-right">
                                <label className="block text-xs text-gray-600 mb-1">
                                  Thời gian kết thúc dự kiến
                                </label>
                                <div className="flex items-center gap-2 justify-end">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Giờ"
                                    className="w-16 text-center border px-3 py-2 rounded-lg bg-white border-[#39BDCC] text-[#39BDCC]"
                                    readOnly
                                    value={String((followUpEndTime.getUTCHours() + 7) % 24).padStart(2, '0')}
                                  />
                                  <span className="font-semibold">:</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Phút"
                                    className="w-16 text-center border px-3 py-2 rounded-lg bg-white border-[#39BDCC] text-[#39BDCC]"
                                    readOnly
                                    value={String(followUpEndTime.getUTCMinutes()).padStart(2, '0')}
                                  />
                                </div>
                              </div>
                            )}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-400 rounded-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          {slotsMessage?.includes('nghỉ phép') ? (
                            <>
                              <p className="font-semibold text-yellow-800">🗓️ Bạn đang xin nghỉ phép</p>
                              <p className="text-sm text-yellow-700 mt-2">{slotsMessage}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-yellow-800">⚠️ Không có lịch khả dụng</p>
                              <p className="text-sm text-yellow-700 mt-2">
                                {slotsMessage || "Vui lòng chọn ngày tái khám khác."}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Textarea
                label="Ghi chú tái khám"
                placeholder="Ví dụ: kiểm tra lại sau 1 tuần, mang theo phim X-ray..."
                value={followUpNote}
                onValueChange={setFollowUpNote}
                variant={canEdit ? "bordered" : "flat"}
                isReadOnly={!canEdit}
                minRows={3}
              />
            </div>
          )}
          {followUpAppointmentId && (
            <div className="rounded-lg bg-white/80 border border-purple-200 p-3 text-sm text-purple-700">
              Đã tạo lịch tái khám vào{" "}
              {followUpDate && followUpTimeInput
                ? (() => {
                  // ⭐ FIX: Format date và time từ state thay vì từ followUpDateTime (tránh timezone issue)
                  const dateStr = followUpDate.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                  return `${followUpTimeInput} ngày ${dateStr}`;
                })()
                : followUpDateTime
                  ? (() => {
                    // ⭐ Fallback: Parse từ followUpDateTime nếu không có state
                    try {
                      const followUpDateObj = new Date(followUpDateTime);
                      if (!Number.isNaN(followUpDateObj.getTime())) {
                        const vnHours = String((followUpDateObj.getUTCHours() + 7) % 24).padStart(2, '0');
                        const vnMinutes = String(followUpDateObj.getUTCMinutes()).padStart(2, '0');
                        // ⭐ Convert UTC date sang VN date (cộng 7 giờ)
                        const vnDate = new Date(followUpDateObj.getTime() + 7 * 60 * 60 * 1000);
                        const vnDateStr = vnDate.toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                        return `${vnHours}:${vnMinutes} ngày ${vnDateStr}`;
                      }
                    } catch (e) {
                      // Ignore parse errors
                    }
                    return "thời gian đang cập nhật";
                  })()
                  : "thời gian đang cập nhật"}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Nurse note (editable cho doctor) */}
      <Card
        className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200"
        onMouseDown={() => {
          if (isDropdownOpen) {
            closeDropdown();
          }
        }}
      >
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-pink-600" />
            <h4 className="font-semibold text-gray-800">Ghi chú điều dưỡng</h4>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <Textarea
            placeholder="Nhập ghi chú về bệnh nền hoặc dị ứng của bệnh nhân..."
            value={nurseNote}
            onValueChange={setNurseNote}
            minRows={5}
            variant={canEdit ? "bordered" : "flat"}
            isReadOnly={!canEdit}
            onFocus={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            onMouseDown={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            classNames={{
              input: canEdit ? undefined : "bg-gray-100 text-gray-500",
              base: canEdit ? undefined : "opacity-60"
            }}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button
              color="default"
              variant="flat"
              onPress={() => onSave(false)}
              isLoading={saving}
              isDisabled={saving || !canEdit}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
            <Button
              color="success"
              onPress={onApprove}
              isLoading={saving}
              isDisabled={saving || !canApprove}
              startContent={!saving && <CheckCircleIcon className="w-5 h-5" />}
            >
              {saving ? "Đang xử lý..." : "Duyệt hồ sơ"}
            </Button>
          </div>
        </CardBody>
      </Card>

    </div>
  );
};

export default DoctorMedicalRecord;

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { XMarkIcon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { vi } from "date-fns/locale";
registerLocale("vi", vi);
import toast from "react-hot-toast";

import {
  appointmentApi,
  serviceApi,
  availableDoctorApi,
  getDoctorScheduleRange,
  validateAppointmentTime,
  Service,
} from "@/api";
import type { Relative } from "@/api/appointment";
import { useAuth } from "@/contexts/AuthContext";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  appointmentFor: "self" | "other";
  fullName: string;
  email: string;
  phoneNumber: string;
  date: string;
  serviceId: string;
  doctorUserId: string;
  userStartTimeInput: string;
  startTime: Date;
  endTime: Date;
  doctorScheduleId: string | null;
  notes: string;
}

const now = new Date();
const utcNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

const initialFormData: FormData = {
  appointmentFor: "self",
  fullName: "",
  email: "",
  phoneNumber: "",
  date: utcNow.toISOString().split("T")[0],
  serviceId: "",
  doctorUserId: "",
  userStartTimeInput: "",
  startTime: utcNow,
  endTime: new Date(utcNow.getTime() + 30 * 60000),
  doctorScheduleId: null,
  notes: "",
};

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const prevUserIdRef = useRef<string | undefined>(user?.id || user?._id);
  const isFirstMountRef = useRef(true);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const prevAppointmentForRef = useRef<string | undefined>(formData.appointmentFor);
  const [services, setServices] = useState<Service[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [doctorScheduleRange, setDoctorScheduleRange] = useState<any>(null);
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [loadingRelatives, setLoadingRelatives] = useState(false);

  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Chỉ dùng cho server errors
  const [timeInputError, setTimeInputError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // ⭐ Suppress server error banner for cases user đã thấy trong panel (hết chỗ/qua giờ/không đủ thời gian)
  const isNonCriticalAvailabilityMessage = (msg: string) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes("không đáp ứng đủ thời gian") ||
      lower.includes("không có thời gian phù hợp") ||
      lower.includes("đã qua thời gian làm việc") ||
      lower.includes("đã hết chỗ")
    );
  };
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(formData.date + "T00:00:00"));

  const today = new Date().toISOString().split("T")[0];
  const selectedService = services.find((s) => s._id === formData.serviceId);
  const serviceDuration = selectedService?.durationMinutes || 30;

  // Function to reset form data completely
  const resetForm = () => {
    setFormData(initialFormData);
    setAvailableDoctors([]);
    setDoctorScheduleRange(null);
    setErrorMessage(null);
    setTimeInputError(null);
    setFieldErrors({});
    setLoadingDoctors(false);
    setLoadingSchedule(false);
    setSubmitting(false);
  };

  // === KHÔNG reset form khi modal mở - Chỉ reset sau khi submit thành công hoặc F5 ===
  // useEffect(() => {
  //   if (isOpen) {
  //     resetForm();
  //   }
  // }, [isOpen]);

  // === Fetch services ===
  useEffect(() => {
    if (!isOpen) return;

    const fetchServices = async () => {
      try {
        const res = await serviceApi.get({ status: "Active", limit: 1000 });
        if (res.success && Array.isArray(res.data)) setServices(res.data);
      } catch (err) {
        console.error("Error fetching services:", err);
      }
    };

    fetchServices();
  }, [isOpen]);

  // === Reset form when user changes (logout/login) ===
  useEffect(() => {
    const currentUserId = user?.id || user?._id;
    const prevUserId = prevUserIdRef.current;
    
    // Skip reset on initial mount
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevUserIdRef.current = currentUserId;
      return;
    }
    
    // Reset if user changed (including logout: user -> null, or login: null -> user, or switch user)
    if (prevUserId !== currentUserId) {
      // Reset form data when user changes, regardless of modal state
      resetForm();
    }
    
    // Update ref for next comparison
    prevUserIdRef.current = currentUserId;
  }, [user?.id, user?._id]); // Reset when user ID changes (logout/login)

  // Clear service/doctor fields mỗi khi modal đóng để tránh dữ liệu cũ
  useEffect(() => {
    if (!isOpen) {
      setAvailableDoctors([]);
      setDoctorScheduleRange(null);
      setTimeInputError(null);
      setErrorMessage(null);
      setFieldErrors((prev) => {
        if (!prev.serviceId && !prev.doctorUserId && !prev.userStartTimeInput) {
          return prev;
        }
        const next = { ...prev };
        delete next.serviceId;
        delete next.doctorUserId;
        delete next.userStartTimeInput;
        return next;
      });
      setFormData((prev) => ({
        ...prev,
        serviceId: "",
        doctorUserId: "",
        doctorScheduleId: null,
        userStartTimeInput: "",
        startTime: utcNow,
        endTime: new Date(utcNow.getTime() + 30 * 60000),
      }));
    }
  }, [isOpen]);

  // === Auto-fill user info (chỉ khi appointmentFor thay đổi sang "self", không ghi đè dữ liệu đã nhập) ===
  useEffect(() => {
    if (!isOpen) return;
    
    // Chỉ auto-fill khi appointmentFor thay đổi sang "self" (không phải mỗi lần modal mở)
    const prevAppointmentFor = prevAppointmentForRef.current;
    const currentAppointmentFor = formData.appointmentFor;
    
    if (currentAppointmentFor === "self" && user) {
      // Chỉ auto-fill nếu:
      // 1. appointmentFor vừa thay đổi sang "self" (từ "other" hoặc lần đầu)
      // 2. Hoặc các field đang trống
      if (prevAppointmentFor !== "self" || !formData.fullName || !formData.email) {
        setFormData((prev) => ({
          ...prev,
          // Chỉ auto-fill nếu field đang trống, không ghi đè dữ liệu đã nhập
          fullName: prev.fullName || user.fullName || "",
          email: prev.email || user.email || "",
          phoneNumber: prev.phoneNumber || user.phoneNumber || "",
        }));
      }
    }
    
    // Update ref
    prevAppointmentForRef.current = currentAppointmentFor;
  }, [isOpen, user, formData.appointmentFor, formData.fullName, formData.email]);

  // === Fetch relatives khi appointmentFor === "other" ===
  useEffect(() => {
    if (!isOpen || formData.appointmentFor !== "other" || !user) {
      return;
    }

    const fetchRelatives = async () => {
      setLoadingRelatives(true);
      try {
        const res = await appointmentApi.getMyRelatives();
        if (res.success && res.data) {
          setRelatives(res.data);
        }
      } catch (err) {
        console.error("Error fetching relatives:", err);
      } finally {
        setLoadingRelatives(false);
      }
    };

    fetchRelatives();
  }, [isOpen, formData.appointmentFor, user]);

  // === Handle click vào relative ===
  const handleRelativeClick = (relative: Relative) => {
    setFormData((prev) => ({
      ...prev,
      fullName: relative.fullName,
      email: relative.email,
      phoneNumber: relative.phoneNumber || prev.phoneNumber,
    }));
    
    // Clear errors khi fill data
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.fullName;
      delete newErrors.email;
      return newErrors;
    });
  };

  // === Fetch available doctors for selected date + service ===
  useEffect(() => {
    if (!formData.date || !formData.serviceId) {
      setAvailableDoctors([]);
      setDoctorScheduleRange(null); // ⭐ Clear schedule range
      setErrorMessage(null); // ⭐ Clear error message
      return;
    }

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      setErrorMessage(null); // ⭐ Clear error khi fetch doctors mới
      setDoctorScheduleRange(null); // ⭐ Clear schedule range cũ
      setTimeInputError(null); // ⭐ Clear time input error
      
      // ⭐ Clear input fields khi đổi ngày/service/appointmentFor
      setFormData((prev) => ({
        ...prev,
        userStartTimeInput: "",
        doctorUserId: "",
      }));
      
      // ⭐ Clear field errors khi clear doctorUserId
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.doctorUserId;
        delete newErrors.userStartTimeInput;
        return newErrors;
      });
      
      try {
        const doctorRes = await availableDoctorApi.getByDate(
          formData.serviceId,
          formData.date
        );

        if (doctorRes.success) {
          setAvailableDoctors(doctorRes.data?.availableDoctors || []);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [formData.date, formData.serviceId, formData.appointmentFor]);

  // Sync selectedDate when formData.date changes (external updates)
  useEffect(() => {
    if (formData.date) {
      setSelectedDate(new Date(formData.date + "T00:00:00"));
    }
  }, [formData.date]);

  // === Fetch doctor schedule when doctor is selected ===
  const handleDoctorSelect = async (doctorId: string) => {
    setFormData((prev) => ({
      ...prev,
      doctorUserId: doctorId,
      userStartTimeInput: "",
      startTime: utcNow,
      endTime: new Date(utcNow.getTime() + serviceDuration * 60000),
    }));

    // ⭐ Clear field errors khi chọn bác sĩ mới (vì đã clear userStartTimeInput)
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.userStartTimeInput;
      return newErrors;
    });
    setTimeInputError(null);

    setLoadingSchedule(true);
    setErrorMessage(null);
    try {
      const scheduleRes = await getDoctorScheduleRange(
        doctorId,
        formData.serviceId,
        formData.date,
        formData.appointmentFor
      );

      if (scheduleRes.success && scheduleRes.data) {
        const data = scheduleRes.data as any; // Type assertion để handle cả AvailableTimeRangeData và AvailableStartTimesData
        if (data.scheduleRanges && Array.isArray(data.scheduleRanges)) {
          setDoctorScheduleRange(data.scheduleRanges);
        // ⭐ Lưu doctorScheduleId từ response
        setFormData((prev) => ({
          ...prev,
            doctorScheduleId: data.doctorScheduleId || null,
        }));
        
        // ⭐ Chỉ hiển thị banner nếu là lỗi quan trọng; ẩn các thông điệp “hết chỗ/qua giờ/không đủ thời gian”
          if (data.message) {
            if (isNonCriticalAvailabilityMessage(data.message)) {
              setErrorMessage(null);
            } else {
              setErrorMessage(data.message);
            }
          } else {
            setErrorMessage(null);
          }
        } else {
          setDoctorScheduleRange(null);
        }
      } else {
        setErrorMessage(scheduleRes.message || "Không thể tải lịch bác sĩ");
        setDoctorScheduleRange(null);
      }
    } catch (err) {
      console.error("Error fetching doctor schedule:", err);
      setErrorMessage("Lỗi tải lịch bác sĩ");
      setDoctorScheduleRange(null);
      } finally {
      setLoadingSchedule(false);
    }
  };

  // === Helper: Check if time is within available ranges ===
  const isTimeInAvailableRanges = (timeInput: string) => {
    if (!doctorScheduleRange || !Array.isArray(doctorScheduleRange) || doctorScheduleRange.length === 0) {
      return { isValid: false };
    }

    const [hours, minutes] = timeInput.split(":");
    if (!hours || !minutes || isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) {
      return { isValid: false };
    }

    const vnHours = parseInt(hours);
    const vnMinutes = parseInt(minutes);
    const inputMinutes = vnHours * 60 + vnMinutes; // Total minutes from midnight (VN time)

    // Check if input time is within any available range
    for (const range of doctorScheduleRange) {
      // Skip ranges that are fully booked or passed working hours
      if (range.displayRange === 'Đã hết chỗ' || range.displayRange === 'Đã qua thời gian làm việc') {
        continue;
      }

      // Parse range.startTime and range.endTime (ISO strings in UTC)
      const rangeStart = new Date(range.startTime);
      const rangeEnd = new Date(range.endTime);

      // Convert to VN time for comparison
      const rangeStartVNMinutes = (rangeStart.getUTCHours() + 7) * 60 + rangeStart.getUTCMinutes();
      const rangeEndVNMinutes = (rangeEnd.getUTCHours() + 7) * 60 + rangeEnd.getUTCMinutes();

      // Check if input time is within this range
      if (inputMinutes >= rangeStartVNMinutes && inputMinutes < rangeEndVNMinutes) {
        return {
          isValid: true,
          overrideHours: vnHours,
          overrideMinutes: vnMinutes
        };
      }
    }

    return { isValid: false };
  };

  // === Handle time input blur ===
  const handleTimeInputBlur = async (timeInput: string) => {
    if (!isOpen) {
      return;
    }

    if (!timeInput || !formData.doctorUserId) {
      // Clear endTime if no input
      setFormData((prev) => ({
        ...prev,
        userStartTimeInput: "",
        endTime: utcNow,
      }));
      return;
    }

    // ⭐ Validate format: HH:mm (basic format check)
    const timeRegex = /^(\d{1,2}):(\d{1,2})$/;
    if (!timeRegex.test(timeInput)) {
      setTimeInputError("Định dạng thời gian không hợp lệ. Vui lòng nhập HH:mm (ví dụ: 08:30)");
      // Clear endTime on error
      setFormData((prev) => ({
        ...prev,
        endTime: utcNow,
      }));
      return;
    }

    const [hours, minutes] = timeInput.split(":");
    const hoursNum = parseInt(hours);
    const minutesNum = parseInt(minutes);

    // ⭐ Validate range với thông báo lỗi cụ thể
    if (isNaN(hoursNum) || isNaN(minutesNum)) {
      setTimeInputError("Thời gian không hợp lệ. Vui lòng nhập số hợp lệ");
      setFormData((prev) => ({
        ...prev,
        userStartTimeInput: "",
        endTime: utcNow,
      }));
      return;
    }

    // Kiểm tra giờ
    if (hoursNum < 0 || hoursNum > 23) {
      setTimeInputError("Giờ không hợp lệ. Giờ phải từ 00-23");
      setFormData((prev) => ({
        ...prev,
        userStartTimeInput: "",
        endTime: utcNow,
      }));
      return;
    }

    // Kiểm tra phút
    if (minutesNum < 0 || minutesNum > 59) {
      setTimeInputError("Phút không hợp lệ. Phút phải từ 00-59");
      setFormData((prev) => ({
        ...prev,
        userStartTimeInput: "",
        endTime: utcNow,
      }));
      return;
    }

    // ⭐ FE validation: Kiểm tra thời gian có trong khoảng khả dụng không
    const rangeResult = isTimeInAvailableRanges(timeInput);
    if (!rangeResult.isValid) {
      setTimeInputError("Khung giờ này không khả dụng. Vui lòng chọn thời gian trong khoảng thời gian khả dụng.");
      // Clear endTime on error
      setFormData((prev) => ({
        ...prev,
        userStartTimeInput: "",
        endTime: utcNow,
      }));
      return;
    }

    const vnHours = rangeResult.overrideHours ?? hoursNum;
    const vnMinutes = rangeResult.overrideMinutes ?? minutesNum;

    // ⭐ FE validation: Kiểm tra thời lượng dịch vụ không vượt quá ca làm việc chứa thời điểm bắt đầu
    try {
      // Xác định ca (range) chứa thời điểm bắt đầu
      const [hStr, mStr] = timeInput.split(":");
      const startTotalMin = parseInt(hStr) * 60 + parseInt(mStr);
      let containingRangeEndMin: number | null = null;
      for (const range of doctorScheduleRange || []) {
        if (range.displayRange === 'Đã hết chỗ' || range.displayRange === 'Đã qua thời gian làm việc') continue;
        const rStart = new Date(range.startTime);
        const rEnd = new Date(range.endTime);
        const rStartMin = (rStart.getUTCHours() + 7) * 60 + rStart.getUTCMinutes();
        const rEndMin = (rEnd.getUTCHours() + 7) * 60 + rEnd.getUTCMinutes();
        if (startTotalMin >= rStartMin && startTotalMin < rEndMin) {
          containingRangeEndMin = rEndMin;
          break;
        }
      }
      if (containingRangeEndMin != null) {
        const endTotalMin = startTotalMin + serviceDuration;
        if (endTotalMin > containingRangeEndMin) {
          setTimeInputError(`Thời gian bạn chọn không đáp ứng đủ thời gian cho dịch vụ này (${serviceDuration} phút). Vui lòng chọn giờ khác.`);
          setFormData((prev) => ({
            ...prev,
            userStartTimeInput: "",
            endTime: utcNow,
          }));
          return;
        }
      }
    } catch {
      // Bỏ qua nếu không tính được, backend sẽ validate tiếp
    }

    // ⭐ Convert giờ VN sang UTC: VN - 7
    // User nhập 08:00 (VN) → lưu 01:00 (UTC)
    const dateObj = new Date(formData.date + "T00:00:00.000Z");
    const utcHours = vnHours - 7; // Convert VN to UTC
    dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
    const startTimeISO = dateObj.toISOString();

    // ⭐ FE validation: không cho đặt thời gian ở quá khứ
    // ⭐ Clear tất cả lỗi cũ trước khi validate
    setTimeInputError(null);
    setErrorMessage(null);
    
    const nowUtc = new Date();
    if (doctorScheduleRange && doctorScheduleRange.length > 0) {
      const earliestFutureSlot = doctorScheduleRange.some((range: any) => {
        const rangeStart = new Date(range.startTime);
        return rangeStart.getTime() > nowUtc.getTime();
      });

      if (!earliestFutureSlot && !isTimeInAvailableRanges(timeInput).isValid) {
      // ⭐ Chỉ hiển thị lỗi quá khứ, không gọi backend validation
            if (isOpen) {
              setTimeInputError("Không thể đặt thời gian ở quá khứ");
              setErrorMessage(null);
            }
            setFormData((prev) => ({
              ...prev,
              userStartTimeInput: "",
              endTime: utcNow,
            }));
        return;
      }
    }

    // ⭐ Chỉ gọi backend validation sau khi đã pass FE validation quá khứ
    try {
      const validateRes = await validateAppointmentTime(
        formData.doctorUserId,
        formData.serviceId,
        formData.date,
        startTimeISO
      );

      if (!validateRes.success) {
        const errorMsg = validateRes.message || "Thời gian không hợp lệ";
        // ⭐ Chỉ set vào timeInputError, clear errorMessage để tránh hiển thị chồng chéo
        setTimeInputError(errorMsg);
        setErrorMessage(null);
        // Clear endTime on error
        setFormData((prev) => ({
          ...prev,
          userStartTimeInput: "",
          endTime: utcNow,
        }));
        return;
      }

      // Parse endTime từ BE (UTC) và tạo Date object
      const endTimeDate = new Date(validateRes.data!.endTime);
      
      // Only set endTime if validation successful
      // ⭐ Clear error khi validation thành công
      setTimeInputError(null);
      setErrorMessage(null);
    setFormData((prev) => ({
      ...prev,
        userStartTimeInput: timeInput,
        startTime: dateObj,
        endTime: endTimeDate,
      }));
    } catch (err: any) {
      console.error("Error validating time:", err);
      // ⭐ Chỉ lấy message đầu tiên từ error, không hiển thị nhiều lỗi
      const errorMsg = err.message || err.response?.data?.message || "Lỗi validate thời gian";
      // ⭐ Chỉ set vào timeInputError, clear errorMessage để tránh hiển thị chồng chéo
      setTimeInputError(errorMsg);
      setErrorMessage(null);
      // Clear endTime on error
      setFormData((prev) => ({
        ...prev,
        endTime: utcNow,
      }));
    }
  };

  // === Handlers ===
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: "self" | "other") => {
    if (value === "self") {
      setFormData((prev) => ({
        ...prev,
        appointmentFor: value,
        fullName: user?.fullName || "",
        email: user?.email || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        appointmentFor: value,
        fullName: "",
        email: "",
      }));
    }
  };

  // Validate từng trường (onBlur) và hiển thị lỗi inline
  const handleFieldBlur = (fieldName: string) => {
    const next: Record<string, string> = { ...fieldErrors };
    const v: any = (formData as any)[fieldName];
    switch (fieldName) {
      case "fullName":
        if (formData.appointmentFor === "other" && !String(v || "").trim()) next.fullName = "Vui lòng nhập họ và tên.";
        else delete next.fullName;
        break;
      case "email":
        if (formData.appointmentFor === "other") {
          const ok = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(v || "").trim());
          if (!ok) next.email = "Email không hợp lệ.";
          else delete next.email;
        }
        break;
      case "phoneNumber":
        {
          const digits = String(v || "").replace(/[^0-9]/g, "");
          if (digits.length !== 10) next.phoneNumber = "Số điện thoại phải gồm 10 chữ số.";
          else delete next.phoneNumber;
        }
        break;
      case "serviceId":
        if (!v) next.serviceId = "Vui lòng chọn dịch vụ.";
        else delete next.serviceId;
        break;
      case "date":
        {
          const d = new Date(String(v || "") + "T00:00:00");
          if (!v || isNaN(d.getTime())) next.date = "Ngày không hợp lệ.";
          else delete next.date;
        }
        break;
      case "doctorUserId":
        if (!v) next.doctorUserId = "Vui lòng chọn bác sĩ.";
        else delete next.doctorUserId;
        break;
      default:
        break;
    }
    setFieldErrors(next);
  };

  const validateForm = (): boolean => {
    if (!user?._id && !user?.id) {
      setErrorMessage("Bạn cần đăng nhập để đặt lịch.");
      return false;
    }
    
    const errors: Record<string, string> = {};
    
    if (formData.appointmentFor === "other" && !formData.fullName.trim()) {
      errors.fullName = "Vui lòng nhập họ và tên.";
    }
    if (formData.appointmentFor === "other" && !formData.email.trim()) {
      errors.email = "Vui lòng nhập email.";
    }
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Vui lòng nhập số điện thoại.";
    } else {
      const digits = formData.phoneNumber.replace(/[^0-9]/g, "");
      if (digits.length !== 10) {
        errors.phoneNumber = "Số điện thoại phải gồm 10 chữ số.";
      }
    }
    if (!formData.serviceId) {
      errors.serviceId = "Vui lòng chọn dịch vụ.";
    }
    if (!formData.date) {
      errors.date = "Vui lòng chọn ngày.";
    }
    if (!formData.doctorUserId) {
      errors.doctorUserId = "Vui lòng chọn bác sĩ.";
    }
    if (!formData.userStartTimeInput) {
      errors.userStartTimeInput = "Vui lòng nhập thời gian bắt đầu.";
    } else {
      // ⭐ Validate format và range của thời gian với thông báo lỗi cụ thể
      const timeRegex = /^(\d{1,2}):(\d{1,2})$/;
      if (!timeRegex.test(formData.userStartTimeInput)) {
        errors.userStartTimeInput = "Định dạng thời gian không hợp lệ. Vui lòng nhập HH:mm (ví dụ: 08:30)";
      } else {
        const [hours, minutes] = formData.userStartTimeInput.split(":");
        const hoursNum = parseInt(hours);
        const minutesNum = parseInt(minutes);
        
        if (isNaN(hoursNum) || isNaN(minutesNum)) {
          errors.userStartTimeInput = "Thời gian không hợp lệ. Vui lòng nhập số hợp lệ";
        } else if (hoursNum < 0 || hoursNum > 23) {
          errors.userStartTimeInput = "Giờ không hợp lệ. Giờ phải từ 00-23";
        } else if (minutesNum < 0 || minutesNum > 59) {
          errors.userStartTimeInput = "Phút không hợp lệ. Phút phải từ 00-59";
        } else {
          // ⭐ Kiểm tra xem startTime và endTime đã được set chưa (từ handleTimeInputBlur)
          // Nếu chưa được set hoặc không hợp lệ, có nghĩa là validation chưa pass
          if (!formData.startTime || !formData.endTime || formData.startTime.getTime() === utcNow.getTime() || formData.endTime.getTime() === utcNow.getTime()) {
            errors.userStartTimeInput = "Vui lòng nhập thời gian hợp lệ và click ra ngoài để xác nhận.";
          }
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      // Scroll to first error field
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        appointmentFor: formData.appointmentFor,
        serviceId: formData.serviceId,
        doctorUserId: formData.doctorUserId,
        doctorScheduleId: formData.doctorScheduleId || "",
        selectedSlot: {
          startTime: formData.startTime.toISOString(),
          endTime: formData.endTime.toISOString(),
        },
        notes: formData.notes,
      };

      const res = await appointmentApi.create(payload);

      if (res.success) {
        // Reset form after successful booking
        resetForm();
        
        // ⭐ Nếu đặt cho bản thân và có nhập phoneNumber, cập nhật ngay hồ sơ người dùng trong AuthContext
        if (formData.appointmentFor === 'self' && formData.phoneNumber && user) {
          try {
            updateUser({
              ...user,
              phoneNumber: formData.phoneNumber,
            } as any);
          } catch (e) {
            console.warn('Không thể cập nhật phoneNumber vào AuthContext:', e);
          }
        }
        
        if (res.data?.requirePayment && res.data?.payment?.paymentId) {
          setErrorMessage(null);
          onClose();
          navigate(`/patient/payment/${res.data.payment.paymentId}`);
        } else {
          setErrorMessage(null);
          onClose();
          toast.success(res.message || "Đặt lịch thành công!");
          navigate("/patient/appointments");
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      } else {
        // ⭐ Nếu lỗi liên quan đến thời gian, hiển thị dưới ô input thay vì trên cùng form
        const errorMsg = res.message || "Đặt lịch thất bại. Vui lòng thử lại.";
        const isTimeRelatedError = 
          errorMsg.includes("Khung giờ") || 
          errorMsg.includes("thời gian") || 
          errorMsg.includes("đã có người đặt") ||
          errorMsg.includes("chờ thanh toán") ||
          errorMsg.includes("time slot") ||
          errorMsg.includes("unavailable");
        
        if (isTimeRelatedError) {
          setTimeInputError(errorMsg);
          setErrorMessage(null);
          // Ẩn endTime khi có lỗi
          setFormData((prev) => ({
            ...prev,
            endTime: utcNow,
          }));
        } else {
          // Ẩn banner với các thông điệp người dùng đã thấy ở panel “Khoảng thời gian khả dụng”
          if (isNonCriticalAvailabilityMessage(errorMsg)) {
            setErrorMessage(null);
          } else {
            setErrorMessage(errorMsg);
          }
        }
      }
    } catch (err: any) {
      console.error("Error booking:", err);
      const errorMsg = err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      const isTimeRelatedError = 
        errorMsg.includes("Khung giờ") || 
        errorMsg.includes("thời gian") || 
        errorMsg.includes("đã có người đặt") ||
        errorMsg.includes("chờ thanh toán") ||
        errorMsg.includes("time slot") ||
        errorMsg.includes("unavailable");
      
      if (isTimeRelatedError) {
        setTimeInputError(errorMsg);
        setErrorMessage(null);
        // Ẩn endTime khi có lỗi
        setFormData((prev) => ({
          ...prev,
          endTime: utcNow,
        }));
      } else {
        // Ẩn banner với các thông điệp người dùng đã thấy ở panel
        if (isNonCriticalAvailabilityMessage(errorMsg)) {
          setErrorMessage(null);
        } else {
          setErrorMessage(errorMsg);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39BDCC] sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="w-6 h-6 text-[#39BDCC]" />
            <h2 className="text-2xl font-bold text-gray-800">
              Đặt lịch khám / tư vấn
            </h2>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
            onClick={onClose}
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Error Message - Chỉ hiển thị server errors */}
        {errorMessage && !Object.keys(fieldErrors).length && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <div className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Appointment For */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Đặt lịch cho
              </label>
              <div className="flex gap-6">
                {["self", "other"].map((v) => (
                  <label key={v} className="flex items-center gap-2">
                    <input
                      checked={formData.appointmentFor === v}
                      className="text-[#39BDCC]"
                      name="appointmentFor"
                      type="radio"
                      onChange={() => handleRadioChange(v as "self" | "other")}
                    />
                    {v === "self" ? "Bản thân" : "Người thân khác"}
                  </label>
                ))}
              </div>
            </div>

            {/* Danh sách người thân đã đặt lịch */}
            {formData.appointmentFor === "other" && (
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Chọn người thân đã đặt lịch trước đó
                </label>
                {loadingRelatives ? (
                  <div className="text-sm text-gray-500">Đang tải...</div>
                ) : relatives.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {relatives.map((relative) => (
                      <button
                        key={relative._id}
                        type="button"
                        onClick={() => handleRelativeClick(relative)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                          formData.fullName === relative.fullName && formData.email === relative.email
                            ? "bg-[#39BDCC] text-white border-[#39BDCC]"
                            : "bg-white text-gray-700 border-gray-300 hover:border-[#39BDCC] hover:text-[#39BDCC]"
                        }`}
                      >
                        {relative.fullName}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mb-4">
                    Chưa có người thân nào đã đặt lịch. Vui lòng nhập thông tin bên dưới.
                  </div>
                )}
              </div>
            )}

            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Họ và tên
                </label>
                <input
                  className={`w-full border px-3 py-2 rounded-lg ${
                    formData.appointmentFor === "self" 
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
                      : "bg-white text-gray-900"
                  } ${
                    fieldErrors.fullName ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                  disabled={formData.appointmentFor === "self"}
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                onBlur={() => handleFieldBlur("fullName")}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Email
                </label>
                <input
                  className={`w-full border px-3 py-2 rounded-lg ${
                    formData.appointmentFor === "self" 
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
                      : "bg-white text-gray-900"
                  } ${
                    fieldErrors.email ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                  disabled={formData.appointmentFor === "self"}
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                onBlur={() => handleFieldBlur("email")}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Số điện thoại *
              </label>
              <input
                className={`w-full border px-3 py-2 rounded-lg ${
                  fieldErrors.phoneNumber ? "border-red-500 focus:ring-red-500" : ""
                }`}
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("phoneNumber")}
              />
              {fieldErrors.phoneNumber && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.phoneNumber}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Chọn ngày *
              </label>
              {/* hidden input to keep formData.date for validations */}
              <input className="hidden" name="date" value={formData.date} onChange={()=>{}} readOnly />
              <DatePicker
                selected={selectedDate}
                onChange={(d) => {
                  setSelectedDate(d);
                  if (d) {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");
                    const isoDate = `${yyyy}-${mm}-${dd}`;
                    setFormData(prev => ({ ...prev, date: isoDate }));
                  } else {
                    setFormData(prev => ({ ...prev, date: "" }));
                  }
                  // inline validate date
                  handleFieldBlur("date");
                }}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                locale="vi"
                placeholderText="Chọn ngày"
                wrapperClassName="w-full"
                className={`w-full border px-3 py-2 rounded-lg ${fieldErrors.date ? "border-red-500 focus:ring-red-500" : ""}`}
              />
              {fieldErrors.date && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.date}</p>
              )}
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Chọn dịch vụ *
              </label>
              <select
                className={`w-full border px-3 py-2 rounded-lg ${
                  fieldErrors.serviceId ? "border-red-500 focus:ring-red-500" : ""
                }`}
                name="serviceId"
                value={formData.serviceId}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("serviceId")}
              >
                <option value="">-- Chọn dịch vụ --</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.serviceName} ({s.durationMinutes} phút)
                  </option>
                ))}
              </select>
              {fieldErrors.serviceId && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.serviceId}</p>
              )}
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Chọn bác sĩ *
              </label>
              {loadingDoctors ? (
                  <div className="text-gray-500 py-3 text-center">
                    Đang tải danh sách bác sĩ...
                  </div>
                ) : availableDoctors.length ? (
                  <div>
                  <select
                      className={`w-full border px-3 py-2 rounded-lg ${
                        fieldErrors.doctorUserId ? "border-red-500 focus:ring-red-500" : ""
                      }`}
                    value={formData.doctorUserId}
                      onChange={(e) => {
                        handleDoctorSelect(e.target.value);
                        // Clear error when user selects
                        if (fieldErrors.doctorUserId) {
                          setFieldErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.doctorUserId;
                            return newErrors;
                          });
                        }
                      }}
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {availableDoctors.map((d) => (
                      <option key={d.doctorId} value={d.doctorId}>
                        {d.doctorName}
                      </option>
                    ))}
                  </select>
                    {fieldErrors.doctorUserId && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.doctorUserId}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 py-3 text-center bg-gray-50 rounded-lg">
                  {formData.serviceId && formData.date
                    ? "Không có bác sĩ khả dụng"
                    : "Vui lòng chọn ngày và dịch vụ"}
                </div>
              )}
            </div>

            {/* Time Input - shows only if doctor is selected */}
            {formData.doctorUserId && (
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Thời gian bắt đầu khám *
                </label>
                {loadingSchedule ? (
                  <div className="text-gray-500 py-3 text-center">
                    Đang tải lịch bác sĩ...
                  </div>
                ) : doctorScheduleRange && Array.isArray(doctorScheduleRange) ? (
                  <div className="space-y-3">
                    {/* Hiển thị các khoảng thời gian khả dụng chi tiết */}
                    <div className="p-3 bg-blue-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-2">
                        Khoảng thời gian khả dụng:
                      </p>
                      <div className="space-y-2">
                        {doctorScheduleRange.map((range: any, index: number) => (
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

                    {/* Input thời gian và hiển thị kết quả nằm ngang */}
                    {doctorScheduleRange.some((r: any) => r.displayRange !== 'Đã hết chỗ' && r.displayRange !== 'Đã qua thời gian làm việc') ? (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Nhập giờ bắt đầu
                          </label>
                          <div className="flex items-center gap-2">
                            {/* Hour input */}
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Giờ"
                              className={`w-16 text-center border px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent ${
                                timeInputError || fieldErrors.userStartTimeInput
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'focus:ring-[#39BDCC] focus:border-transparent'
                              }`}
                              value={(formData.userStartTimeInput || '').split(':')[0] || ''}
                              onChange={(e) => {
                                let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                setTimeInputError(null);
                                setErrorMessage(null);
                                if (fieldErrors.userStartTimeInput) {
                                  setFieldErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.userStartTimeInput;
                                    return next;
                                  });
                                }
                                const currentMinute = (formData.userStartTimeInput || '').split(':')[1] || '';
                                const timeInput = v + ':' + currentMinute;
                                const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                                if (timeRegex.test(timeInput)) {
                                  const [hours, minutes] = timeInput.split(':');
                                  const vnHours = parseInt(hours);
                                  const vnMinutes = parseInt(minutes);
                                  const utcHours = vnHours - 7;
                                  const dateObj = new Date(formData.date + 'T00:00:00.000Z');
                                  dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
                                  const endTimeDate = new Date(dateObj.getTime() + serviceDuration * 60000);
                                  setFormData((prev) => ({
                                    ...prev,
                                    userStartTimeInput: timeInput,
                                    startTime: dateObj,
                                    endTime: endTimeDate,
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    userStartTimeInput: timeInput,
                                  }));
                                }
                              }}
                              onBlur={() => {
                                const [h, m] = (formData.userStartTimeInput || '').split(':');
                                if (h && m) handleTimeInputBlur(h + ':' + m);
                              }}
                            />
                            <span className="font-semibold">:</span>
                            {/* Minute input */}
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Phút"
                              className={`w-16 text-center border px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent ${
                                timeInputError || fieldErrors.userStartTimeInput
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'focus:ring-[#39BDCC] focus:border-transparent'
                              }`}
                              value={(formData.userStartTimeInput || '').split(':')[1] || ''}
                              onChange={(e) => {
                                let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                setTimeInputError(null);
                                setErrorMessage(null);
                                if (fieldErrors.userStartTimeInput) {
                                  setFieldErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.userStartTimeInput;
                                    return next;
                                  });
                                }
                                const currentHour = (formData.userStartTimeInput || '').split(':')[0] || '';
                                const timeInput = currentHour + ':' + v;
                                const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                                if (timeRegex.test(timeInput)) {
                                  const [hours, minutes] = timeInput.split(':');
                                  const vnHours = parseInt(hours);
                                  const vnMinutes = parseInt(minutes);
                                  const utcHours = vnHours - 7;
                                  const dateObj = new Date(formData.date + 'T00:00:00.000Z');
                                  dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
                                  const endTimeDate = new Date(dateObj.getTime() + serviceDuration * 60000);
                                  setFormData((prev) => ({
                                    ...prev,
                                    userStartTimeInput: timeInput,
                                    startTime: dateObj,
                                    endTime: endTimeDate,
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    userStartTimeInput: timeInput,
                                  }));
                                }
                              }}
                              onBlur={() => {
                                const [h, m] = (formData.userStartTimeInput || '').split(':');
                                if (h && m) handleTimeInputBlur(h + ':' + m);
                              }}
                            />
                          </div>
                          {(timeInputError || fieldErrors.userStartTimeInput) && (
                            <p className="mt-1 text-xs text-red-600 font-medium">
                              {timeInputError || fieldErrors.userStartTimeInput}
                            </p>
                          )}
                        </div>

                        {/* ⭐ Hiển thị endTime bằng 2 ô (Giờ/Phút) như start time — chỉ hiện khi start time hợp lệ */}
                        {formData.userStartTimeInput &&
                         !timeInputError &&
                         !fieldErrors.userStartTimeInput &&
                         /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(formData.userStartTimeInput) &&
                         formData.endTime &&
                         formData.endTime.getTime() !== utcNow.getTime() && (
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
                                value={String((formData.endTime.getUTCHours() + 7) % 24).padStart(2, '0')}
                              />
                              <span className="font-semibold">:</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Phút"
                                className="w-16 text-center border px-3 py-2 rounded-lg bg-white border-[#39BDCC] text-[#39BDCC]"
                                readOnly
                                value={String(formData.endTime.getUTCMinutes()).padStart(2, '0')}
                              />
                            </div>
                          </div>
                        )}
                    </div>
                    ) : null}
                  </div>
              ) : (
                <div className="text-gray-500 py-3 text-center bg-gray-50 rounded-lg">
                    Vui lòng chọn bác sĩ để xem lịch khả dụng
                </div>
              )}
            </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Ghi chú
              </label>
              <textarea
                className="w-full border px-3 py-2 rounded-lg"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                type="button"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                className="px-6 py-2 bg-[#39BDCC] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#32a8b5]"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

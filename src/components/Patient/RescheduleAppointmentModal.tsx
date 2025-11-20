import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button, Input } from "@heroui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { vi } from "date-fns/locale";

registerLocale("vi", vi);

import { appointmentApi } from "@/api";
import { validateAppointmentTime } from "@/api/availableSlot";

interface Props {
  appointmentId: string;
  currentStartTime: string;
  currentEndTime: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ScheduleGap = {
  start: string;
  end: string;
  display?: string;
};

type ScheduleRange = {
  shift: string;
  shiftDisplay: string;
  startTime: string;
  endTime: string;
  displayRange: string;
  availableGaps: ScheduleGap[];
};

interface ReservationInfo {
  timeslotId: string;
  startTime: string;
  endTime: string;
  expiresAt: string;
  doctorScheduleId?: string | null;
}

const scheduleVisual = (range: ScheduleRange) => {
  const isMorning = range.shift === "Morning";
  const hasGaps = !!(range.availableGaps && range.availableGaps.length > 0);

  if (!hasGaps) {
    return {
      container: "bg-gray-50 border-gray-200",
      title: "text-gray-600",
      time: "text-gray-500",
      banner: {
        border: "border-gray-200",
        background: "bg-gray-50",
        text: "text-gray-500",
      },
    };
  }

  if (isMorning) {
    return {
      container: "bg-orange-50 border-orange-200",
      title: "text-orange-800",
      time: "text-orange-600",
      banner: {
        border: "border-orange-200",
        background: "bg-orange-50",
        text: "text-orange-600",
      },
    };
  }

  return {
    container: "bg-blue-50 border-blue-200",
    title: "text-blue-800",
    time: "text-blue-600",
    banner: {
      border: "border-blue-200",
      background: "bg-blue-50",
      text: "text-blue-600",
    },
  };
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
  // ⭐ Format thành DD/MM/YYYY
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

const RescheduleAppointmentModal: React.FC<Props> = ({
  appointmentId,
  currentStartTime: _currentStartTime,
  currentEndTime: _currentEndTime,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    const iso = today.toISOString().split("T")[0];
    return iso;
  });
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [scheduleRanges, setScheduleRanges] = useState<ScheduleRange[]>([]);
  const [availableGaps, setAvailableGaps] = useState<ScheduleGap[]>([]);
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [computedEndTime, setComputedEndTime] = useState<Date | null>(null);
  const [activeRangeShift, setActiveRangeShift] = useState<string | null>(null);
  const utcNow = useMemo(() => new Date(), []);
  const [validationError, setValidationError] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [serviceInfo, setServiceInfo] = useState<{
    name: string;
    duration: number;
  } | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [hasDoctorSchedule, setHasDoctorSchedule] = useState<boolean>(true);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [doctorUserId, setDoctorUserId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  // ⭐ Reservation states
  const [activeReservation, setActiveReservation] = useState<ReservationInfo | null>(null);
  const [reservationCountdown, setReservationCountdown] = useState(0);
  const [hasReservedAfterBlur, setHasReservedAfterBlur] = useState(false);
  const reservationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeReservationRef = useRef<ReservationInfo | null>(null);
  const prevReservationIdRef = useRef<string | null>(null);

  // Lightweight toast notifications
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const showToast = (type: "success" | "error", message: string, cb?: () => void) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
      if (cb) cb();
    }, 2200);
  };

  const minDate = new Date().toISOString().split("T")[0];

  // ⭐ Clear reservation timer
  const clearReservationTimer = useCallback(() => {
    if (reservationTimerRef.current) {
      clearInterval(reservationTimerRef.current);
      reservationTimerRef.current = null;
    }
  }, []);

  // ⭐ Release reservation
  const releaseReservation = useCallback(
    async ({ skipApi = false, silent = false }: { skipApi?: boolean; silent?: boolean } = {}) => {
      const currentReservation = activeReservationRef.current;
      if (!currentReservation) {
        setReservationCountdown(0);
        clearReservationTimer();
        return;
      }

      clearReservationTimer();
      setReservationCountdown(0);

      if (!skipApi) {
        try {
          await appointmentApi.releaseSlot({
            timeslotId: currentReservation.timeslotId,
          });
        } catch (error) {
          if (!silent) {
            console.error("Error releasing reservation:", error);
          }
        }
      }

      activeReservationRef.current = null;
      setActiveReservation(null);
      setHasReservedAfterBlur(false);
    },
    [clearReservationTimer],
  );

  // ⭐ Handle reservation success - giống BookingModal
  const handleReservationSuccess = useCallback((reservation: ReservationInfo) => {
    console.log("✅ [RescheduleAppointmentModal] handleReservationSuccess called with:", reservation);
    setActiveReservation(reservation);
    activeReservationRef.current = reservation;
  }, []);

  // ⭐ Update activeReservationRef when activeReservation changes
  useEffect(() => {
    activeReservationRef.current = activeReservation;
    console.log("🔄 [RescheduleAppointmentModal] activeReservation changed:", activeReservation);
  }, [activeReservation]);

  // ⭐ Clear hasReservedAfterBlur when selectedStartTime or activeReservation changes
  useEffect(() => {
    if (!selectedStartTime || !activeReservation) {
      setHasReservedAfterBlur(false);
    }
  }, [selectedStartTime, activeReservation]);

  // ⭐ Refresh schedule khi reservation thay đổi (tạo mới hoặc bị clear) - giống BookingModal
  useEffect(() => {
    if (!doctorUserId || !serviceId || !date) {
      return;
    }

    const currentReservationId = activeReservation?.timeslotId || null;
    
    // ⭐ Chỉ refresh khi reservation ID thay đổi (tạo mới hoặc bị clear)
    if (prevReservationIdRef.current !== currentReservationId) {
      prevReservationIdRef.current = currentReservationId;
      
      // Refresh schedule khi reservation thay đổi để cập nhật khoảng thời gian khả dụng
      // Delay một chút để đảm bảo state đã được cập nhật
      // ⭐ Sử dụng silent mode để tránh reset UI
      const timeoutId = setTimeout(() => {
        loadSlots(date, { silent: true });
      }, 200);

      return () => {
        clearTimeout(timeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReservation, doctorUserId, serviceId, date]);

  // ⭐ Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReservationTimer();
      releaseReservation({ skipApi: true, silent: true });
    };
  }, [clearReservationTimer, releaseReservation]);

  const convertVnTimeToUtc = (dateStr: string, timeStr: string): Date | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    const baseUtc = new Date(`${dateStr}T00:00:00.000Z`);
    baseUtc.setUTCHours(hours - 7, minutes, 0, 0);
    return baseUtc;
  };

  const formatUtcToVn = (utcDate: Date): string =>
    utcDate.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });

  const loadSlots = async (d: string, options: { silent?: boolean } = {}) => {
    try {
      // ⭐ Chỉ set loading nếu không phải silent mode (tránh reset UI khi refresh sau reserve)
      if (!options.silent) {
      setLoadingSlots(true);
      }
      
      const res = await appointmentApi.getRescheduleSlots(appointmentId, d);
      const payload: any = res.data;

      if (!res.success || !payload) {
        // ⭐ Chỉ clear state nếu không phải silent mode
        if (!options.silent) {
        setScheduleRanges([]);
        setAvailableGaps([]);
        setScheduleMessage(res.message || "Không thể tải khung giờ.");
        setHasDoctorSchedule(false);
        }
        return;
      }

      // ⭐ Chỉ update service info nếu chưa có (tránh reset khi refresh)
      if (payload?.serviceName && payload?.serviceDuration && !serviceInfo) {
        setServiceInfo({
          name: payload.serviceName,
          duration: payload.serviceDuration,
        });
      }

      // ⭐ Chỉ update doctor/service ID nếu chưa có (tránh reset khi refresh)
      if (!doctorName && payload?.doctorName) {
        setDoctorName(payload.doctorName);
      }
      if (!doctorUserId && payload?.doctorUserId) {
        setDoctorUserId(payload.doctorUserId);
      }
      if (!serviceId && payload?.serviceId) {
        setServiceId(payload.serviceId);
      }
      
      console.log("✅ [RescheduleAppointmentModal] loadSlots completed:", {
        doctorUserId: payload?.doctorUserId,
        serviceId: payload?.serviceId,
        doctorName: payload?.doctorName,
        serviceName: payload?.serviceName,
        silent: options.silent
      });

      // ⭐ Luôn update schedule ranges và gaps (để cập nhật slot availability)
      const ranges: ScheduleRange[] = payload.scheduleRanges || [];
      setScheduleRanges(ranges);
      setAvailableGaps(payload.availableGaps || []);
      setScheduleMessage(payload.message || null);
      setHasDoctorSchedule(Boolean(payload.hasDoctorSchedule));
      // ⭐ KHÔNG clear selectedStartTime và computedEndTime khi refresh schedule
      // Chỉ clear khi thực sự cần (ví dụ: khi đổi ngày hoặc khi không có reservation)
      // setSelectedStartTime("");
      // setComputedEndTime(null);
      // setValidationError("");
    } catch (err: any) {
      // ⭐ Chỉ alert nếu không phải silent mode
      if (!options.silent) {
      alert(err?.response?.data?.message || "Không thể tải khung giờ.");
      setScheduleRanges([]);
      setAvailableGaps([]);
      setScheduleMessage(null);
      setHasDoctorSchedule(false);
      setSelectedStartTime("");
        setComputedEndTime(null);
      setValidationError("");
      }
    } finally {
      if (!options.silent) {
      setLoadingSlots(false);
      }
    }
  };

  const prevDateRef = useRef<string>(date);

  React.useEffect(() => {
    // ⭐ Clear input khi đổi ngày (không phải khi refresh schedule do reservation)
    if (prevDateRef.current !== date) {
      setSelectedStartTime("");
      setComputedEndTime(null);
      setValidationError("");
      releaseReservation({ silent: true });
      prevDateRef.current = date;
      
      // ⭐ Load slots khi đổi ngày (không silent vì đây là thay đổi ngày mới)
      loadSlots(date);
    } else if (!doctorUserId || !serviceId) {
      // ⭐ Chỉ load slots lần đầu nếu chưa có doctorUserId hoặc serviceId
    loadSlots(date);
    }
    
    // ⭐ Sync selectedDate when date changes
    if (date) {
      const dateObj = new Date(date + "T00:00:00");
      setSelectedDate(dateObj);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, appointmentId]);

  const validateTime = (
    timeStr: string,
    { skipErrors = false }: { skipErrors?: boolean } = {},
  ) => {
      setComputedEndTime(null);
    setActiveRangeShift(null);

    const showError = (message: string) => {
      if (!skipErrors) {
        setValidationError(message);
      }
    };

    if (!serviceInfo) {
      showError("Không xác định được thời lượng dịch vụ để kiểm tra.");
      return false;
    }

    if (!timeStr) {
      showError("Vui lòng nhập thời gian bắt đầu");
      return false;
    }

    // ⭐ Kiểm tra định dạng và parse hours, minutes an toàn
    const timeParts = timeStr.split(":");
    if (timeParts.length !== 2) {
      showError("Thời gian không hợp lệ. Vui lòng nhập theo định dạng HH:MM");
      return false;
    }

    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    
    // ⭐ Kiểm tra hours và minutes có hợp lệ không
    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours === undefined || minutes === undefined) {
      showError("Thời gian không hợp lệ. Vui lòng nhập theo định dạng HH:MM");
      return false;
    }

    // ⭐ Đảm bảo hours và minutes là số hợp lệ trước khi gọi toString()
    const inputTimeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    const startUtc = convertVnTimeToUtc(date, inputTimeStr);
    if (!startUtc) {
      showError("Không thể phân tích thời gian. Vui lòng thử lại.");
      return false;
    }

    const nowUtc = new Date();
    if (startUtc <= nowUtc) {
      showError("Không thể đặt lịch hẹn trong quá khứ");
      return false;
    }

    const endUtc = new Date(startUtc.getTime() + serviceInfo.duration * 60000);

    if (!availableGaps.length) {
      showError("Bác sĩ không còn khoảng thời gian trống cho ngày này");
      return false;
    }

    const matchRangeByGap = (predicate: (gapStart: Date, gapEnd: Date) => boolean) =>
      scheduleRanges.find((range) =>
        (range.availableGaps || []).some((gap) => {
          const gapStart = new Date(gap.start);
          const gapEnd = new Date(gap.end);
          return predicate(gapStart, gapEnd);
        }),
      );

    const isWithinGap = (gapStart: Date, gapEnd: Date) => startUtc >= gapStart && endUtc <= gapEnd;

    const matchedRange = matchRangeByGap(isWithinGap);

    if (!matchedRange) {
      showError("Thời gian này không nằm trong các khoảng khả dụng của bác sĩ");
      return false;
    }

    if (!skipErrors) {
      setValidationError("");
    }
    setComputedEndTime(endUtc);
    setActiveRangeShift(matchedRange.shift);
    return true;
  };

  // ⭐ Handle time input blur - validate and reserve slot
  const handleTimeInputBlur = async (timeInput: string) => {

    if (!timeInput || !doctorUserId || !serviceId) {
      console.error("❌ [RescheduleAppointmentModal] Missing required data:", {
        timeInput,
        doctorUserId,
        serviceId
      });
      // ⭐ Chỉ clear khi không có input, không clear khi có lỗi
      if (!timeInput) {
        setSelectedStartTime("");
        setComputedEndTime(null);
      } else {
        setValidationError("Vui lòng chọn ngày để tải thông tin bác sĩ và dịch vụ.");
      }
      return;
    }

    // ⭐ Validate format: HH:mm
    const timeRegex = /^(\d{1,2}):(\d{1,2})$/;
    if (!timeRegex.test(timeInput)) {
      setValidationError("Định dạng thời gian không hợp lệ. Vui lòng nhập HH:mm (ví dụ: 08:30)");
      // ⭐ KHÔNG clear selectedStartTime - giữ lại giá trị người dùng đã nhập
      setComputedEndTime(null);
      return;
    }

    const [hours, minutes] = timeInput.split(":");
    const hoursNum = parseInt(hours);
    const minutesNum = parseInt(minutes);

    if (isNaN(hoursNum) || isNaN(minutesNum)) {
      setValidationError("Thời gian không hợp lệ. Vui lòng nhập số hợp lệ");
      // ⭐ KHÔNG clear selectedStartTime - giữ lại giá trị người dùng đã nhập
      setComputedEndTime(null);
      return;
    }

    if (hoursNum < 0 || hoursNum > 23) {
      setValidationError("Giờ không hợp lệ. Giờ phải từ 00-23");
      // ⭐ KHÔNG clear selectedStartTime - giữ lại giá trị người dùng đã nhập
      setComputedEndTime(null);
      return;
    }

    if (minutesNum < 0 || minutesNum > 59) {
      setValidationError("Phút không hợp lệ. Phút phải từ 00-59");
      // ⭐ KHÔNG clear selectedStartTime - giữ lại giá trị người dùng đã nhập
      setComputedEndTime(null);
      return;
    }

    // ⭐ Convert VN time to UTC
    const dateObj = new Date(date + "T00:00:00.000Z");
    const utcHours = hoursNum - 7;
    dateObj.setUTCHours(utcHours, minutesNum, 0, 0);
    const startTimeISO = dateObj.toISOString();

    // ⭐ Clear errors before validation
    setValidationError("");

    try {
      await releaseReservation({ silent: true });
      
      // ⭐ Validate with backend
      const validateRes = await validateAppointmentTime(
        doctorUserId,
        serviceId,
        date,
        startTimeISO
      );

      if (!validateRes.success) {
        const errorMsg = validateRes.message || "Thời gian không hợp lệ";
        setValidationError(errorMsg);
        setHasReservedAfterBlur(false);
        // ⭐ KHÔNG clear selectedStartTime - giữ lại giá trị người dùng đã nhập
        setComputedEndTime(null);
        return;
      }

      // ⭐ Set computed end time ngay sau khi validate thành công (trước khi reserve)
      // Đảm bảo hiển thị ngay cả khi reserve thất bại
      let endTimeDate: Date;
      if (validateRes.data && validateRes.data.endTime) {
        endTimeDate = new Date(validateRes.data.endTime);
      } else {
        // ⭐ Fallback: Tính endTime từ startTime + serviceDuration
        endTimeDate = new Date(dateObj.getTime() + (serviceInfo?.duration || 30) * 60000);
      }
      setComputedEndTime(endTimeDate);

      // ⭐ Set activeRangeShift để hiển thị đúng banner
      // Tìm range chứa thời gian này
      const matchingRange = scheduleRanges.find((range) => {
        const rangeStart = new Date(range.startTime);
        const rangeEnd = new Date(range.endTime);
        const endTimeDate = validateRes.data?.endTime 
          ? new Date(validateRes.data.endTime)
          : new Date(dateObj.getTime() + (serviceInfo?.duration || 30) * 60000);
        return dateObj >= rangeStart && endTimeDate <= rangeEnd;
      });
      if (matchingRange) {
        setActiveRangeShift(matchingRange.shift);
      }

      const reserveRes = await appointmentApi.reserveSlot({
        doctorUserId: doctorUserId,
        serviceId: serviceId,
        doctorScheduleId: null,
        date: date,
        startTime: startTimeISO,
        appointmentFor: "self",
      });


      if (!reserveRes.success || !reserveRes.data) {
        const reserveError = reserveRes.message || "Không thể giữ chỗ cho khung giờ này.";
        setValidationError(reserveError);
        setHasReservedAfterBlur(false);
        // ⭐ KHÔNG clear computedEndTime khi reserve thất bại - vẫn hiển thị endTime đã tính
        return;
      }

      // ⭐ Parse reservation data từ BE response
      const reservationData: ReservationInfo = {
        timeslotId: reserveRes.data.timeslotId,
        startTime: reserveRes.data.startTime,
        endTime: reserveRes.data.endTime,
        expiresAt: reserveRes.data.expiresAt,
        doctorScheduleId: reserveRes.data.doctorScheduleId || null,
      };
      
    
      
      handleReservationSuccess(reservationData);
      
      
      // ⭐ Đánh dấu đã blur và reserve thành công để hiển thị message
      setHasReservedAfterBlur(true);
      setValidationError("");

      // ⭐ Refresh schedule ngay sau khi giữ chỗ thành công
      // để cập nhật khoảng thời gian khả dụng (slot đã giữ chỗ sẽ không còn khả dụng)
      // ⭐ Sử dụng silent mode để tránh reset UI
      if (doctorUserId && serviceId && date) {
        console.log("🔄 [RescheduleAppointmentModal] Refreshing schedule after reservation...");
        await loadSlots(date, { silent: true });
      }
    } catch (err: any) {
      console.error("Error validating time:", err);
      const errorMsg = err.message || err.response?.data?.message || "Lỗi validate thời gian";
      setValidationError(errorMsg);
      setHasReservedAfterBlur(false);
      await releaseReservation({ silent: true });
      // ⭐ KHÔNG clear selectedStartTime - giữ lại giá trị người dùng đã nhập
      setComputedEndTime(null);
    }
  };

  // ⭐ Countdown timer for reservation - giống BookingModal
  useEffect(() => {
    if (!activeReservation) {
      clearReservationTimer();
      setReservationCountdown(0);
      return;
    }


    const updateCountdown = () => {
      if (!activeReservationRef.current) {
        clearReservationTimer();
        setReservationCountdown(0);
        return;
      }

      const expiresAt = new Date(activeReservationRef.current.expiresAt).getTime();
      const diff = expiresAt - Date.now();
      
      if (diff <= 0) {
        clearReservationTimer();
        releaseReservation({ silent: true });
        setValidationError("Giữ chỗ đã hết hạn. Vui lòng chọn lại khung giờ.");
        setSelectedStartTime("");
        setComputedEndTime(null);
        setReservationCountdown(0);
        return;
      }
      
      const countdown = Math.ceil(diff / 1000);
      setReservationCountdown(countdown);
      console.log("⏰ [RescheduleAppointmentModal] Countdown:", countdown);
    };

    updateCountdown();
    clearReservationTimer();
    reservationTimerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      clearReservationTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReservation]);

  const handleSubmit = async () => {
    if (!validateTime(selectedStartTime)) {
      return;
    }

    if (!serviceInfo) {
      setValidationError("Không xác định được thời lượng dịch vụ.");
      return;
    }

    // ⭐ Kiểm tra xem có active reservation không
    if (!activeReservation) {
      setValidationError("Vui lòng chờ giữ chỗ hoàn tất trước khi gửi yêu cầu.");
      return;
    }

    const startUtc = convertVnTimeToUtc(date, selectedStartTime);
    if (!startUtc) {
      setValidationError("Không thể phân tích thời gian bắt đầu.");
      return;
    }

    const endUtc = new Date(startUtc.getTime() + serviceInfo.duration * 60000);

    try {
      setSubmitting(true);

      await appointmentApi.requestReschedule(appointmentId, {
        newStartTime: startUtc.toISOString(),
        newEndTime: endUtc.toISOString(),
        reason: reason || "Yêu cầu đổi lịch hẹn",
        reservedTimeslotId: activeReservation.timeslotId
      });
      showToast("success", "Đã gửi yêu cầu đổi lịch. Đang chờ staff duyệt.", () => {
        onSuccess();
        onClose();
      });
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Có lỗi xảy ra khi đổi lịch hẹn";
      showToast("error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Đổi lịch hẹn</h3>

        <div className="space-y-4">
          {/* Thông tin dịch vụ */}
          {serviceInfo && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-blue-800">
                Dịch vụ: {serviceInfo.name}
              </div>
              <div className="text-sm text-blue-600">
                Thời lượng: {serviceInfo.duration} phút
              </div>
              {doctorName && (
                <div className="text-sm text-blue-600 mt-1">Bác sĩ: {doctorName}</div>
              )}
            </div>
          )}
          
          <div>
            <label className="block text-sm mb-1">Chọn ngày</label>
            <div className="w-full">
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    setSelectedDate(date);
                    // ⭐ Convert Date to YYYY-MM-DD format
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    setDate(`${year}-${month}-${day}`);
                  }
                }}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                locale="vi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39BDCC] focus:border-transparent"
                placeholderText="Chọn ngày (DD/MM/YYYY)"
                wrapperClassName="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Thời gian khả dụng trong ngày</label>
            {loadingSlots ? (
              <div className="text-sm text-gray-600">Đang tải khung giờ...</div>
            ) : scheduleRanges.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-sm text-orange-600 mb-2">
                  {scheduleMessage || "Bác sĩ không có lịch làm việc trong ngày này"}
                </div>
                <div className="text-xs text-gray-500">Vui lòng chọn ngày khác</div>
              </div>
            ) : (
              <div className="mb-3 space-y-4">
                {scheduleMessage && (
                  <div
                    className={`p-3 rounded-lg ${
                      hasDoctorSchedule ? "bg-blue-50 border border-gray-200" : "bg-orange-50 border border-orange-200"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${
                        hasDoctorSchedule ? "text-blue-800" : "text-orange-800"
                      }`}
                    >
                      {scheduleMessage}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {scheduleRanges.map((range) => {
                    const visual = scheduleVisual(range);
                    const hasGaps = range.availableGaps && range.availableGaps.length > 0;

                    return (
                      <div
                        key={range.shift}
                        className={`p-3 rounded-lg border ${visual.container}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span
                              className={`w-3 h-3 rounded-full mr-3 ${
                                hasGaps
                                  ? range.shift === "Morning"
                                    ? "bg-orange-500"
                                    : "bg-blue-500"
                                  : "bg-gray-400"
                              }`}
                            ></span>
                            <span className={`text-sm font-medium ${visual.title}`}>
                              {range.shiftDisplay || range.shift}
                            </span>
                          </div>
                          <span className={`text-sm ${visual.time}`}>
                            {hasGaps ? range.displayRange : "Đã hết chỗ"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input thời gian và hiển thị kết quả nằm ngang */}
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
                        validationError
                          ? 'border-red-500 focus:ring-red-500'
                          : 'focus:ring-[#39BDCC] focus:border-transparent'
                      }`}
                      value={(selectedStartTime || '').split(':')[0] || ''}
                    onChange={(e) => {
                        let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                        setHasReservedAfterBlur(false);
                        const currentMinute = (selectedStartTime || '').split(':')[1] || '';
                        const timeInput = v + ':' + currentMinute;
                        
                        // ⭐ Clear error khi bắt đầu nhập
                        setValidationError("");
                        
                        // ⭐ Nếu xóa hết cả giờ và phút
                        if ((!v || v === '') && (!currentMinute || currentMinute === '')) {
                          if (activeReservation) {
                            releaseReservation({ silent: true });
                            setHasReservedAfterBlur(false);
                          }
                          setSelectedStartTime(timeInput);
                          setComputedEndTime(null);
                          return;
                        }
                        
                        // ⭐ Release reservation nếu xóa hết
                        if (activeReservation && (!v || v === '') && (!currentMinute || currentMinute === '')) {
                          releaseReservation({ silent: true });
                          setHasReservedAfterBlur(false);
                        }
                        
                        // ⭐ Validate giờ ngay khi nhập
                        if (v && v !== '') {
                          const hoursNum = parseInt(v);
                          if (!isNaN(hoursNum)) {
                            if (hoursNum < 0 || hoursNum > 23) {
                              setValidationError("Giờ không hợp lệ. Giờ phải từ 00-23");
                              setSelectedStartTime(timeInput);
                              return;
                            }
                          }
                        }
                        
                        // ⭐ Nếu chưa nhập đầy đủ cả giờ và phút (phút phải có 2 chữ số)
                        if (!v || v === '' || !currentMinute || currentMinute === '' || currentMinute.length < 2) {
                          setSelectedStartTime(timeInput);
                          return;
                        }
                        
                        // ⭐ Validate cả giờ và phút khi đã nhập đầy đủ
                        const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                        if (timeRegex.test(timeInput)) {
                          const [hours, minutes] = timeInput.split(':');
                          const vnHours = parseInt(hours);
                          const vnMinutes = parseInt(minutes);
                          
                          // ⭐ Validate giờ
                          if (vnHours < 0 || vnHours > 23) {
                            setValidationError("Giờ không hợp lệ. Giờ phải từ 00-23");
                            setSelectedStartTime(timeInput);
                            return;
                          }
                          
                          // ⭐ Validate phút
                          if (vnMinutes < 0 || vnMinutes > 59) {
                            setValidationError("Phút không hợp lệ. Phút phải từ 00-59");
                            setSelectedStartTime(timeInput);
                            return;
                          }
                          
                          const utcHours = vnHours - 7;
                          const dateObj = new Date(date + 'T00:00:00.000Z');
                          dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
                          
                          // ⭐ Tính và set endTime ngay khi nhập đầy đủ (trước khi blur)
                          const endTimeDate = new Date(dateObj.getTime() + (serviceInfo?.duration || 30) * 60000);
                          setComputedEndTime(endTimeDate);
                          
                          if (activeReservation) {
                            const newStartTimeISO = dateObj.toISOString();
                            const currentReservationStart = activeReservation.startTime;
                            if (currentReservationStart !== newStartTimeISO) {
                              releaseReservation({ silent: true });
                              setHasReservedAfterBlur(false);
                            }
                          }
                          
                          setSelectedStartTime(timeInput);
                        } else {
                          // ⭐ Nếu format không đúng
                          setValidationError("Định dạng thời gian không hợp lệ. Vui lòng nhập HH:mm (ví dụ: 08:30)");
                          setSelectedStartTime(timeInput);
                        }
                      }}
                      onBlur={() => {
                        console.log("🔵 [RescheduleAppointmentModal] Hour input onBlur triggered, selectedStartTime:", selectedStartTime);
                        const [h, m] = (selectedStartTime || '').split(':');
                        console.log("🔵 [RescheduleAppointmentModal] Parsed hour:", h, "minute:", m);
                        if (h && h !== '' && m && m !== '' && m.length >= 2) {
                          console.log("🔵 [RescheduleAppointmentModal] Calling handleTimeInputBlur with:", h + ':' + m);
                          handleTimeInputBlur(h + ':' + m);
                        } else {
                          console.log("❌ [RescheduleAppointmentModal] Time format invalid, not calling handleTimeInputBlur");
                          setValidationError("");
                        }
                      }}
                    />
                    <span className="font-semibold">:</span>
                    {/* Minute input */}
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Phút"
                      className={`w-16 text-center border px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent ${
                        validationError
                          ? 'border-red-500 focus:ring-red-500'
                          : 'focus:ring-[#39BDCC] focus:border-transparent'
                      }`}
                      value={(selectedStartTime || '').split(':')[1] || ''}
                      onChange={(e) => {
                        let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                        setHasReservedAfterBlur(false);
                        const currentHour = (selectedStartTime || '').split(':')[0] || '';
                        const timeInput = currentHour + ':' + v;
                        
                        // ⭐ Clear error khi bắt đầu nhập
                        setValidationError("");
                        
                        // ⭐ Nếu xóa hết cả giờ và phút
                        if ((!currentHour || currentHour === '') && (!v || v === '')) {
                          if (activeReservation) {
                            releaseReservation({ silent: true });
                            setHasReservedAfterBlur(false);
                          }
                          setSelectedStartTime(timeInput);
                          setComputedEndTime(null);
                          return;
                        }
                        
                        // ⭐ Release reservation nếu xóa hết
                        if (activeReservation && (!currentHour || currentHour === '') && (!v || v === '')) {
                          releaseReservation({ silent: true });
                          setHasReservedAfterBlur(false);
                        }
                        
                        // ⭐ Validate phút ngay khi nhập
                        if (v && v !== '') {
                          const minutesNum = parseInt(v);
                          if (!isNaN(minutesNum)) {
                            if (minutesNum < 0 || minutesNum > 59) {
                              setValidationError("Phút không hợp lệ. Phút phải từ 00-59");
                              setSelectedStartTime(timeInput);
                              return;
                            }
                          }
                        }
                        
                        // ⭐ Nếu chưa nhập đầy đủ cả giờ và phút (phút phải có 2 chữ số)
                        if (!currentHour || currentHour === '' || !v || v === '' || v.length < 2) {
                          setSelectedStartTime(timeInput);
                          return;
                        }
                        
                        // ⭐ Validate cả giờ và phút khi đã nhập đầy đủ
                        const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                        if (timeRegex.test(timeInput)) {
                          const [hours, minutes] = timeInput.split(':');
                          const vnHours = parseInt(hours);
                          const vnMinutes = parseInt(minutes);
                          
                          // ⭐ Validate giờ
                          if (vnHours < 0 || vnHours > 23) {
                            setValidationError("Giờ không hợp lệ. Giờ phải từ 00-23");
                            setSelectedStartTime(timeInput);
                            return;
                          }
                          
                          // ⭐ Validate phút
                          if (vnMinutes < 0 || vnMinutes > 59) {
                            setValidationError("Phút không hợp lệ. Phút phải từ 00-59");
                            setSelectedStartTime(timeInput);
                            return;
                          }
                          
                          const utcHours = vnHours - 7;
                          const dateObj = new Date(date + 'T00:00:00.000Z');
                          dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
                          
                          // ⭐ Tính và set endTime ngay khi nhập đầy đủ (trước khi blur)
                          const endTimeDate = new Date(dateObj.getTime() + (serviceInfo?.duration || 30) * 60000);
                          setComputedEndTime(endTimeDate);
                          
                          if (activeReservation) {
                            const newStartTimeISO = dateObj.toISOString();
                            const currentReservationStart = activeReservation.startTime;
                            if (currentReservationStart !== newStartTimeISO) {
                              releaseReservation({ silent: true });
                              setHasReservedAfterBlur(false);
                            }
                          }
                          
                          setSelectedStartTime(timeInput);
                        } else {
                          // ⭐ Nếu format không đúng
                          setValidationError("Định dạng thời gian không hợp lệ. Vui lòng nhập HH:mm (ví dụ: 08:30)");
                          setSelectedStartTime(timeInput);
                        }
                      }}
                      onBlur={() => {
                        console.log("🔵 [RescheduleAppointmentModal] Hour input onBlur triggered, selectedStartTime:", selectedStartTime);
                        const [h, m] = (selectedStartTime || '').split(':');
                        console.log("🔵 [RescheduleAppointmentModal] Parsed hour:", h, "minute:", m);
                        if (h && h !== '' && m && m !== '' && m.length >= 2) {
                          console.log("🔵 [RescheduleAppointmentModal] Calling handleTimeInputBlur with:", h + ':' + m);
                          handleTimeInputBlur(h + ':' + m);
                        } else {
                          console.log("❌ [RescheduleAppointmentModal] Time format invalid, not calling handleTimeInputBlur");
                          setValidationError("");
                        }
                      }}
                  />
                </div>
                  {validationError && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {validationError}
                    </p>
                  )}
                  {/* ⭐ Chỉ hiển thị message giữ chỗ sau khi blur và reserve thành công */}
                  {(() => {
                    const shouldShow = activeReservation && reservationCountdown > 0 && !validationError && hasReservedAfterBlur;
                    if (process.env.NODE_ENV === 'development') {
                      console.log("🔍 [RescheduleAppointmentModal] Message display check:", {
                        activeReservation: !!activeReservation,
                        reservationCountdown,
                        validationError: !!validationError,
                        hasReservedAfterBlur,
                        shouldShow
                      });
                    }
                    return shouldShow ? (
                      <p className="mt-1 text-xs text-[#39BDCC]">
                        Đang giữ chỗ {formatVNTimeFromISO(activeReservation.startTime)} -{" "}
                        {formatVNTimeFromISO(activeReservation.endTime)} ngày{" "}
                        {formatVNDateFromISO(activeReservation.startTime)} · Hết hạn giữ chỗ sau{" "}
                        {reservationCountdown}s
                      </p>
                    ) : null;
                  })()}
                  </div>

                  {/* ⭐ Hiển thị endTime bằng 2 ô (Giờ/Phút) như start time — chỉ hiện khi start time hợp lệ */}
                  {selectedStartTime &&
                   !validationError &&
                   /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(selectedStartTime) &&
                   computedEndTime &&
                   computedEndTime.getTime() !== utcNow.getTime() ? (
                    <div className="flex flex-col items-end text-right">
                      <label className="block text-xs text-gray-600 mb-1">
                        Thời gian kết thúc dự kiến
                      </label>
                      <div className="flex items-center gap-2 justify-end">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Giờ"
                          className="w-16 text-center border px-3 py-2 rounded-lg bg-gray-50 border-gray-300 text-gray-700"
                          readOnly
                          value={String((computedEndTime.getUTCHours() + 7) % 24).padStart(2, '0')}
                        />
                        <span className="font-semibold">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Phút"
                          className="w-16 text-center border px-3 py-2 rounded-lg bg-gray-50 border-gray-300 text-gray-700"
                          readOnly
                          value={String(computedEndTime.getUTCMinutes()).padStart(2, '0')}
                        />
                      </div>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Lý do yêu cầu */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Lý do yêu cầu (tùy chọn)</h4>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do yêu cầu đổi lịch hẹn..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button
            disabled={submitting}
            variant="light"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            color="primary"
            isDisabled={!selectedStartTime || !!validationError}
            isLoading={submitting}
            onClick={handleSubmit}
          >
            Gửi yêu cầu
          </Button>
        </div>
      </div>
    </div>

    {/* Toast */}
    {toast && (
      <div
        className={`fixed top-5 right-5 z-[10000] px-4 py-3 rounded-lg shadow-lg text-sm transition-opacity duration-300 ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}
        role="status"
      >
        {toast.message}
      </div>
    )}
    </>
  );
};

export default RescheduleAppointmentModal;
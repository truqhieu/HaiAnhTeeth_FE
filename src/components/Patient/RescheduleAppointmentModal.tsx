import React, { useState } from "react";
import { Button, Input } from "@heroui/react";

import { appointmentApi } from "@/api";

interface Props {
  appointmentId: string;
  currentStartTime: string;
  currentEndTime: string;
  onClose: () => void;
  onSuccess: () => void;
}

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
  const [slots, setSlots] = useState<
    { startTime: string; endTime: string; displayTime?: string }[]
  >([]);
  const [timeRanges, setTimeRanges] = useState<{
    morning: { start: string; end: string; available: boolean };
    afternoon: { start: string; end: string; available: boolean };
  } | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{
    start: string;
    end: string;
    displayStart: string;
    displayEnd: string;
  }[]>([]);
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [serviceInfo, setServiceInfo] = useState<{
    name: string;
    duration: number;
  } | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<{
    hasDoctorSchedule: boolean;
    message: string;
  } | null>(null);
  const [morningAvailable, setMorningAvailable] = useState<{
    hasAvailable: boolean;
    startTime: string | null;
    endTime: string | null;
    message: string;
  } | null>(null);
  const [afternoonAvailable, setAfternoonAvailable] = useState<{
    hasAvailable: boolean;
    startTime: string | null;
    endTime: string | null;
    message: string;
  } | null>(null);

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

  // Tính thời gian kết thúc dựa trên thời gian bắt đầu và thời lượng dịch vụ
  const calculateEndTime = (startTime: string) => {
    if (!startTime || !serviceInfo) return "";
    
    const [hours, minutes] = startTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "";
    
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + serviceInfo.duration * 60000);
    
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  // ⭐ THÊM: Hàm kiểm tra conflict với các slots đã được đặt
  const hasConflict = (startTime: string, endTime: string) => {
    if (!bookedSlots.length) return false;
    
    const startDate = new Date(`${date}T${startTime}:00`);
    const endDate = new Date(`${date}T${endTime}:00`);
    
    return bookedSlots.some(booked => {
      const bookedStart = new Date(booked.start);
      const bookedEnd = new Date(booked.end);
      
      // Kiểm tra overlap
      return (startDate < bookedEnd && endDate > bookedStart);
    });
  };

  const loadSlots = async (d: string) => {
    try {
      setLoadingSlots(true);
      const res = await appointmentApi.getRescheduleSlots(appointmentId, d);
      
      // ⭐ THAY ĐỔI: Xử lý dữ liệu mới từ backend
      const data = res.data as any;
      
      // Lưu thông tin khoảng thời gian khả dụng
      if (data?.morningRange && data?.afternoonRange) {
        setTimeRanges({
          morning: data.morningRange,
          afternoon: data.afternoonRange
        });
      }
      
      // Lưu thông tin các slots đã được đặt
      if (data?.bookedSlots) {
        setBookedSlots(data.bookedSlots);
      }
      
      // Giữ lại slots cũ để tương thích (có thể rỗng)
      setSlots(data?.availableSlots || []);
      setSelectedStartTime("");
      setValidationError("");
      
      // Lưu thông tin dịch vụ từ response
      if (data?.serviceName && data?.serviceDuration) {
        setServiceInfo({
          name: data.serviceName,
          duration: data.serviceDuration
        });
      }

      // Lưu thông tin lịch làm việc từ response
      if (data?.hasDoctorSchedule !== undefined && data?.message) {
        setScheduleInfo({
          hasDoctorSchedule: data.hasDoctorSchedule,
          message: data.message
        });
      }

      // Lưu thông tin thời gian khả dụng theo ca (tương thích với cũ)
      if (data?.morningAvailable) {
        setMorningAvailable(data.morningAvailable);
      }
      if (data?.afternoonAvailable) {
        setAfternoonAvailable(data.afternoonAvailable);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể tải khung giờ.");
      setSlots([]);
      setTimeRanges(null);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Load service info when component mounts
  React.useEffect(() => {
    const loadServiceInfo = async () => {
      try {
        const res = await appointmentApi.getRescheduleSlots(appointmentId, date);
        if ((res.data as any)?.serviceName && (res.data as any)?.serviceDuration) {
          setServiceInfo({
            name: (res.data as any).serviceName,
            duration: (res.data as any).serviceDuration
          });
        }
      } catch (err) {
        console.error('Error loading service info:', err);
      }
    };
    
    loadServiceInfo();
  }, [appointmentId, date]);

  React.useEffect(() => {
    loadSlots(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const validateTime = (timeStr: string) => {
    if (!timeStr) {
      setValidationError("Vui lòng nhập thời gian bắt đầu");
      return false;
    }

    // Parse time input (HH:MM format)
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      setValidationError("Thời gian không hợp lệ. Vui lòng nhập theo định dạng HH:MM");
      return false;
    }

    // Check if time is in the past (if today)
    const todayStr = new Date().toISOString().split('T')[0];
    if (date === todayStr) {
      const now = new Date();
      const inputTime = new Date();
      inputTime.setHours(hours, minutes, 0, 0);
      
      if (inputTime <= now) {
        setValidationError("Không thể đặt lịch hẹn trong quá khứ");
        return false;
      }
    }

    const inputTimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // ⭐ SỬA LỖI: Kiểm tra conflict với các slots đã được đặt TRƯỚC
    const endTime = calculateEndTime(inputTimeStr);
    if (hasConflict(inputTimeStr, endTime)) {
      setValidationError("Thời gian này đã có người đặt lịch. Vui lòng chọn thời gian khác");
      return false;
    }
    
    // Kiểm tra xem thời gian có nằm trong khoảng khả dụng không
    let isInValidRange = false;
    if (timeRanges?.morning.available) {
      isInValidRange = isInValidRange || (inputTimeStr >= timeRanges.morning.start && inputTimeStr < timeRanges.morning.end);
    }
    if (timeRanges?.afternoon.available) {
      isInValidRange = isInValidRange || (inputTimeStr >= timeRanges.afternoon.start && inputTimeStr < timeRanges.afternoon.end);
    }
    
    if (!isInValidRange) {
      setValidationError("Thời gian này không nằm trong giờ làm việc của bác sĩ");
      return false;
    }
    
    // Kiểm tra tương thích với slots cũ (nếu có)
    const isAvailableInOldSlots = slots.length === 0 || slots.some(slot => {
      const slotStart = new Date(slot.startTime);
      const slotStartTime = slotStart.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false,
        timeZone: 'Asia/Ho_Chi_Minh'
      });
      return slotStartTime === inputTimeStr;
    });
    
    if (slots.length > 0 && !isAvailableInOldSlots) {
      setValidationError("Thời gian này không có sẵn. Vui lòng chọn thời gian khác");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateTime(selectedStartTime)) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Create start and end time based on user input
      const [hours, minutes] = selectedStartTime.split(':').map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      if (serviceInfo) {
        endTime.setMinutes(endTime.getMinutes() + serviceInfo.duration);
      } else {
        endTime.setMinutes(endTime.getMinutes() + 30); // Default 30 minutes
      }

      await appointmentApi.requestReschedule(appointmentId, {
        newStartTime: startTime.toISOString(),
        newEndTime: endTime.toISOString(),
        reason: reason || 'Yêu cầu đổi lịch hẹn'
      });
      showToast("success", "Đã gửi yêu cầu đổi lịch. Đang chờ staff duyệt.", () => {
        onSuccess();
        onClose();
      });
    } catch (err: any) {
      // Hiển thị lỗi cụ thể từ API
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
            </div>
          )}
          
          <div>
            <label className="block text-sm mb-1">Chọn ngày</label>
            <Input
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Thời gian khả dụng trong ngày</label>
            {loadingSlots ? (
              <div className="text-sm text-gray-600">Đang tải khung giờ...</div>
            ) : !timeRanges ? (
              <div className="text-center py-4">
                <div className="text-sm text-orange-600 mb-2">
                  Bác sĩ không có lịch làm việc trong ngày này
                </div>
                <div className="text-xs text-gray-500">
                  Vui lòng chọn ngày khác
                </div>
              </div>
            ) : (
              <div className="mb-3">
                {/* Thông báo về lịch làm việc */}
                {scheduleInfo && (
                  <div className={`p-3 rounded-lg mb-3 ${
                    scheduleInfo.hasDoctorSchedule 
                      ? 'bg-blue-50 border border-gray-200' 
                      : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <div className={`text-sm font-medium ${
                      scheduleInfo.hasDoctorSchedule ? 'text-blue-800' : 'text-orange-800'
                    }`}>
                      {scheduleInfo.message}
                    </div>
                  </div>
                )}
                
                {/* ⭐ THAY ĐỔI: Hiển thị thời gian khả dụng theo ca mới */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    Thời gian khả dụng trong ngày:
                  </div>
                  
                  {/* Ca sáng */}
                  {timeRanges?.morning && (
                    <div className={`p-3 rounded-lg border ${
                      timeRanges.morning.available 
                        ? 'bg-orange-50 border-orange-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-3 ${
                            timeRanges.morning.available ? 'bg-orange-500' : 'bg-gray-400'
                          }`}></span>
                          <span className={`text-sm font-medium ${
                            timeRanges.morning.available ? 'text-orange-800' : 'text-gray-600'
                          }`}>
                            Ca sáng
                          </span>
                        </div>
                        <span className={`text-sm ${
                          timeRanges.morning.available ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                          {timeRanges.morning.available 
                            ? `${timeRanges.morning.start} - ${timeRanges.morning.end}`
                            : 'Đã hết chỗ'
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Ca chiều */}
                  {timeRanges?.afternoon && (
                    <div className={`p-3 rounded-lg border ${
                      timeRanges.afternoon.available 
                        ? 'bg-blue-50 border-gray-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-3 ${
                            timeRanges.afternoon.available ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></span>
                          <span className={`text-sm font-medium ${
                            timeRanges.afternoon.available ? 'text-blue-800' : 'text-gray-600'
                          }`}>
                            Ca chiều
                          </span>
                        </div>
                        <span className={`text-sm ${
                          timeRanges.afternoon.available ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {timeRanges.afternoon.available 
                            ? `${timeRanges.afternoon.start} - ${timeRanges.afternoon.end}`
                            : 'Đã hết chỗ'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm mb-1">Thời gian bắt đầu</label>
                    <Input
                      type="text"
                      placeholder="Nhập thời gian bắt đầu (HH:MM) - VD: 14:30"
                      value={selectedStartTime}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Chỉ cho phép nhập số và dấu :
                        value = value.replace(/[^0-9:]/g, '');
                        // Giới hạn độ dài tối đa 5 ký tự (HH:MM)
                        if (value.length <= 5) {
                          setSelectedStartTime(value);
                          setValidationError("");
                        }
                      }}
                      onBlur={() => validateTime(selectedStartTime)}
                    />
                  </div>
                  {selectedStartTime && serviceInfo && (
                    <div>
                      <label className="block text-sm mb-1">Thời gian kết thúc</label>
                      <div className="px-3 py-2 bg-blue-50 rounded-md text-sm font-semibold text-blue-600">
                        {calculateEndTime(selectedStartTime) || "Nhập thời gian hợp lệ"}
                      </div>
                    </div>
                  )}
                </div>
                {validationError && (
                  <div className="text-sm text-red-600 mt-1">{validationError}</div>
                )}
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
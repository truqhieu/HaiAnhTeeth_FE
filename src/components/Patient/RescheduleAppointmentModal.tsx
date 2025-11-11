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
  const [computedEndTime, setComputedEndTime] = useState<string>("");
  const [activeRangeShift, setActiveRangeShift] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [serviceInfo, setServiceInfo] = useState<{
    name: string;
    duration: number;
  } | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [hasDoctorSchedule, setHasDoctorSchedule] = useState<boolean>(true);
  const [doctorName, setDoctorName] = useState<string | null>(null);

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

  const loadSlots = async (d: string) => {
    try {
      setLoadingSlots(true);
      const res = await appointmentApi.getRescheduleSlots(appointmentId, d);
      const payload: any = res.data;

      if (!res.success || !payload) {
        setScheduleRanges([]);
        setAvailableGaps([]);
        setScheduleMessage(res.message || "Không thể tải khung giờ.");
        setHasDoctorSchedule(false);
        return;
      }

      if (payload?.serviceName && payload?.serviceDuration) {
        setServiceInfo({
          name: payload.serviceName,
          duration: payload.serviceDuration,
        });
      }

      setDoctorName(payload?.doctorName || null);

      const ranges: ScheduleRange[] = payload.scheduleRanges || [];
      setScheduleRanges(ranges);
      setAvailableGaps(payload.availableGaps || []);
      setScheduleMessage(payload.message || null);
      setHasDoctorSchedule(Boolean(payload.hasDoctorSchedule));
      setSelectedStartTime("");
      setComputedEndTime("");
      setValidationError("");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể tải khung giờ.");
      setScheduleRanges([]);
      setAvailableGaps([]);
      setScheduleMessage(null);
      setHasDoctorSchedule(false);
      setSelectedStartTime("");
      setComputedEndTime("");
      setValidationError("");
    } finally {
      setLoadingSlots(false);
    }
  };

  React.useEffect(() => {
    loadSlots(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, appointmentId]);

  const validateTime = (
    timeStr: string,
    { skipErrors = false }: { skipErrors?: boolean } = {},
  ) => {
    setComputedEndTime("");
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

    const [hours, minutes] = timeStr.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      showError("Thời gian không hợp lệ. Vui lòng nhập theo định dạng HH:MM");
      return false;
    }

    const inputTimeStr = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;

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
    setComputedEndTime(formatUtcToVn(endUtc));
    setActiveRangeShift(matchedRange.shift);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateTime(selectedStartTime)) {
      return;
    }

    if (!serviceInfo) {
      setValidationError("Không xác định được thời lượng dịch vụ.");
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
        reason: reason || "Yêu cầu đổi lịch hẹn"
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

                <div>
                  <label className="block text-sm mb-1">Thời gian bắt đầu</label>
                  <Input
                    type="text"
                    placeholder="Nhập thời gian bắt đầu (HH:MM) - VD: 14:30"
                    value={selectedStartTime}
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.replace(/[^0-9:]/g, "");
                      if (value.length <= 5) {
                        setSelectedStartTime(value);
                        validateTime(value, { skipErrors: true });
                      }
                    }}
                    onBlur={() => validateTime(selectedStartTime)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Thời gian kết thúc (tự tính)</label>
                  {(() => {
                    const defaultBanner = {
                      border: "border-gray-200",
                      background: "bg-gray-50",
                      text: "text-gray-500",
                    };

                    const activeRange = activeRangeShift
                      ? scheduleRanges.find((range) => range.shift === activeRangeShift)
                      : null;

                    const banner = activeRange
                      ? scheduleVisual(activeRange).banner
                      : defaultBanner;

                    return (
                      <div className={`rounded-lg border px-3 py-2 text-sm ${banner.border} ${banner.background} ${banner.text}`}>
                        {computedEndTime || "Chưa xác định"}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {validationError && (
              <div className="text-xs text-red-600 mt-1">{validationError}</div>
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
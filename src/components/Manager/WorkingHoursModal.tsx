import React, { useState, useEffect } from "react";
import { Input, Button, Form, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import toast from "react-hot-toast";

import { managerApi } from "@/api";

// CSS to force 24-hour format display
const timeInputStyle = `
  input[type="time"] {
    font-variant-numeric: tabular-nums;
  }
  input[type="time"]::-webkit-calendar-picker-indicator {
    filter: invert(0.5);
  }
`;

interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string | null;
  initialWorkingHours?: {
    morningStart: string;
    morningEnd: string;
    afternoonStart: string;
    afternoonEnd: string;
  };
  onSuccess?: () => void;
}

const WorkingHoursModal: React.FC<WorkingHoursModalProps> = ({
  isOpen,
  onClose,
  doctorId,
  initialWorkingHours,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    morningStart: "08:00",
    morningEnd: "12:00",
    afternoonStart: "14:00",
    afternoonEnd: "18:00",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert 12h format to 24h format if needed
  const convertTo24Hour = (time: string | undefined): string => {
    if (!time) return "";
    // If already in 24h format (HH:mm), return as is
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return time;
    }
    // If in 12h format (h:mm AM/PM), convert to 24h
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const ampm = match[3].toUpperCase();

      if (ampm === "PM" && hours !== 12) {
        hours += 12;
      } else if (ampm === "AM" && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, "0")}:${minutes}`;
    }
    return time;
  };

  // Load initial working hours when modal opens
  useEffect(() => {
    if (isOpen && initialWorkingHours) {
      setFormData({
        morningStart: convertTo24Hour(initialWorkingHours.morningStart) || "08:00",
        morningEnd: convertTo24Hour(initialWorkingHours.morningEnd) || "12:00",
        afternoonStart: convertTo24Hour(initialWorkingHours.afternoonStart) || "14:00",
        afternoonEnd: convertTo24Hour(initialWorkingHours.afternoonEnd) || "18:00",
      });
      setShowValidation(false);
    }
  }, [isOpen, initialWorkingHours]);

  const handleInputChange = (field: string, value: string) => {
    // Remove any non-digit and colon characters
    let cleanedValue = value.replace(/[^\d:]/g, "");
    
    // Auto-format as user types (HH:MM)
    if (cleanedValue.length <= 2) {
      // Just hours
      cleanedValue = cleanedValue;
    } else if (cleanedValue.length === 3) {
      // Add colon after 2 digits: "14" -> "14:"
      cleanedValue = cleanedValue.slice(0, 2) + ":" + cleanedValue.slice(2);
    } else if (cleanedValue.length > 5) {
      // Limit to 5 characters (HH:MM)
      cleanedValue = cleanedValue.slice(0, 5);
    } else if (cleanedValue.length === 4 && !cleanedValue.includes(":")) {
      // Add colon: "1400" -> "14:00"
      cleanedValue = cleanedValue.slice(0, 2) + ":" + cleanedValue.slice(2);
    }
    
    // Validate format and ensure valid hours/minutes
    if (cleanedValue && /^\d{1,2}:\d{0,2}$/.test(cleanedValue)) {
      const [hours, minutes = ""] = cleanedValue.split(":");
      const hourNum = parseInt(hours, 10);
      const minuteNum = minutes ? parseInt(minutes, 10) : 0;
      
      // Validate hours (0-23)
      if (hourNum > 23) {
        cleanedValue = "23:" + (minutes || "00");
      }
      
      // Validate minutes (0-59)
      if (minuteNum > 59) {
        cleanedValue = hours + ":59";
      }
      
      // Pad minutes to 2 digits if needed
      if (minutes && minutes.length === 1) {
        cleanedValue = hours + ":" + minutes;
      } else if (minutes && minutes.length === 2) {
        cleanedValue = hours + ":" + minutes;
      }
    }
    
    setFormData((prev) => ({ ...prev, [field]: cleanedValue }));
  };

  // Validation
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const isMorningStartInvalid =
    showValidation && (!formData.morningStart || !timeRegex.test(formData.morningStart));
  const isMorningEndInvalid =
    showValidation && (!formData.morningEnd || !timeRegex.test(formData.morningEnd));
  const isAfternoonStartInvalid =
    showValidation && (!formData.afternoonStart || !timeRegex.test(formData.afternoonStart));
  const isAfternoonEndInvalid =
    showValidation && (!formData.afternoonEnd || !timeRegex.test(formData.afternoonEnd));

  // Check time logic
  const isMorningTimeInvalid =
    showValidation &&
    formData.morningStart &&
    formData.morningEnd &&
    new Date(`2000-01-01T${formData.morningStart}:00`) >=
      new Date(`2000-01-01T${formData.morningEnd}:00`);

  const isAfternoonTimeInvalid =
    showValidation &&
    formData.afternoonStart &&
    formData.afternoonEnd &&
    new Date(`2000-01-01T${formData.afternoonStart}:00`) >=
      new Date(`2000-01-01T${formData.afternoonEnd}:00`);

  const handleSubmit = async () => {
    setShowValidation(true);

    // Check if there are any errors
    const hasErrors =
      !formData.morningStart ||
      !formData.morningEnd ||
      !formData.afternoonStart ||
      !formData.afternoonEnd ||
      !timeRegex.test(formData.morningStart) ||
      !timeRegex.test(formData.morningEnd) ||
      !timeRegex.test(formData.afternoonStart) ||
      !timeRegex.test(formData.afternoonEnd) ||
      isMorningTimeInvalid ||
      isAfternoonTimeInvalid;

    if (hasErrors) {
      if (isMorningTimeInvalid) {
        toast.error("Thời gian bắt đầu ca sáng phải nhỏ hơn thời gian kết thúc ca sáng");
      } else if (isAfternoonTimeInvalid) {
        toast.error("Thời gian bắt đầu ca chiều phải nhỏ hơn thời gian kết thúc ca chiều");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      if (!doctorId) {
        throw new Error("Không tìm thấy ID bác sĩ");
      }

      const workingHours = {
        morningStart: formData.morningStart,
        morningEnd: formData.morningEnd,
        afternoonStart: formData.afternoonStart,
        afternoonEnd: formData.afternoonEnd,
      };

      console.log("📤 Sending update data:", workingHours);
      console.log("📤 Doctor ID:", doctorId);

      const response = await managerApi.updateDoctorWorkingHours(doctorId, workingHours);

      console.log("📥 Response from server:", response);

      if (response.success) {
        toast.success(response.message || "Cập nhật giờ làm việc thành công!");
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || "Không thể cập nhật giờ làm việc");
      }
    } catch (error: any) {
      console.error("❌ Error updating working hours:", error);
      toast.error(
        error.message ||
          "Có lỗi xảy ra khi cập nhật giờ làm việc. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmit();
  };
  const handleClose = () => {
    setShowValidation(false);
    onClose();
  };

  if (!isOpen || !doctorId) return null;

  return (
    <>
      <style>{timeInputStyle}</style>
      <Modal
        isOpen={isOpen}
        isDismissable={false}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
        size="md"
        scrollBehavior="outside"
        classNames={{ base: "max-h-[90vh] rounded-2xl" }}
        lang="vi-VN"
      >
        <ModalContent>
          <>
            <ModalHeader className="flex items-center gap-3 border-b border-gray-200">
              <img
                alt="Logo"
                className="h-8 w-auto object-contain"
                src="/logo1.png"
              />
              <div>
                <h2 className="text-2xl font-bold">Cập nhật giờ làm việc</h2>
                <p className="text-sm text-gray-600">
                  Chỉnh sửa thời gian làm việc của bác sĩ
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="px-4 py-4">
              <Form autoComplete="off" className="space-y-5" onSubmit={handleFormSubmit}>
            {/* Morning Shift */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Ca sáng</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  fullWidth
                  autoComplete="off"
                  classNames={{
                    base: "w-full",
                    inputWrapper: "w-full",
                  }}
                  errorMessage={
                    isMorningStartInvalid
                      ? "Vui lòng nhập thời gian hợp lệ (HH:MM)"
                      : isMorningTimeInvalid
                      ? "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc"
                      : undefined
                  }
                  isInvalid={isMorningStartInvalid || isMorningTimeInvalid}
                  label="Bắt đầu *"
                  placeholder="08:00"
                  type="text"
                  value={formData.morningStart}
                  variant="bordered"
                  maxLength={5}
                  onValueChange={(value) => handleInputChange("morningStart", value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    const keyCode = e.keyCode || e.which;
                    // Allow: backspace, delete, tab, escape, enter, colon
                    if ([8, 9, 27, 13, 46, 58].indexOf(keyCode) !== -1 ||
                      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                      (keyCode === 65 && e.ctrlKey === true) ||
                      (keyCode === 67 && e.ctrlKey === true) ||
                      (keyCode === 86 && e.ctrlKey === true) ||
                      (keyCode === 88 && e.ctrlKey === true) ||
                      // Allow: home, end, left, right
                      (keyCode >= 35 && keyCode <= 39)) {
                      return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (keyCode < 48 || keyCode > 57)) && (keyCode < 96 || keyCode > 105)) {
                      e.preventDefault();
                    }
                  }}
                />

                <Input
                  fullWidth
                  autoComplete="off"
                  classNames={{
                    base: "w-full",
                    inputWrapper: "w-full",
                  }}
                  errorMessage={
                    isMorningEndInvalid
                      ? "Vui lòng nhập thời gian hợp lệ (HH:MM)"
                      : undefined
                  }
                  isInvalid={isMorningEndInvalid}
                  label="Kết thúc *"
                  placeholder="12:00"
                  type="text"
                  value={formData.morningEnd}
                  variant="bordered"
                  maxLength={5}
                  onValueChange={(value) => handleInputChange("morningEnd", value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    const keyCode = e.keyCode || e.which;
                    // Allow: backspace, delete, tab, escape, enter, colon
                    if ([8, 9, 27, 13, 46, 58].indexOf(keyCode) !== -1 ||
                      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                      (keyCode === 65 && e.ctrlKey === true) ||
                      (keyCode === 67 && e.ctrlKey === true) ||
                      (keyCode === 86 && e.ctrlKey === true) ||
                      (keyCode === 88 && e.ctrlKey === true) ||
                      // Allow: home, end, left, right
                      (keyCode >= 35 && keyCode <= 39)) {
                      return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (keyCode < 48 || keyCode > 57)) && (keyCode < 96 || keyCode > 105)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>

            {/* Afternoon Shift */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Ca chiều</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  fullWidth
                  autoComplete="off"
                  classNames={{
                    base: "w-full",
                    inputWrapper: "w-full",
                  }}
                  errorMessage={
                    isAfternoonStartInvalid
                      ? "Vui lòng nhập thời gian hợp lệ (HH:MM)"
                      : isAfternoonTimeInvalid
                      ? "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc"
                      : undefined
                  }
                  isInvalid={isAfternoonStartInvalid || isAfternoonTimeInvalid}
                  label="Bắt đầu *"
                  placeholder="14:00"
                  type="text"
                  value={formData.afternoonStart}
                  variant="bordered"
                  maxLength={5}
                  onValueChange={(value) => handleInputChange("afternoonStart", value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    const keyCode = e.keyCode || e.which;
                    // Allow: backspace, delete, tab, escape, enter, colon
                    if ([8, 9, 27, 13, 46, 58].indexOf(keyCode) !== -1 ||
                      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                      (keyCode === 65 && e.ctrlKey === true) ||
                      (keyCode === 67 && e.ctrlKey === true) ||
                      (keyCode === 86 && e.ctrlKey === true) ||
                      (keyCode === 88 && e.ctrlKey === true) ||
                      // Allow: home, end, left, right
                      (keyCode >= 35 && keyCode <= 39)) {
                      return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (keyCode < 48 || keyCode > 57)) && (keyCode < 96 || keyCode > 105)) {
                      e.preventDefault();
                    }
                  }}
                />

                <Input
                  fullWidth
                  autoComplete="off"
                  classNames={{
                    base: "w-full",
                    inputWrapper: "w-full",
                  }}
                  errorMessage={
                    isAfternoonEndInvalid
                      ? "Vui lòng nhập thời gian hợp lệ (HH:MM)"
                      : undefined
                  }
                  isInvalid={isAfternoonEndInvalid}
                  label="Kết thúc *"
                  placeholder="18:00"
                  type="text"
                  value={formData.afternoonEnd}
                  variant="bordered"
                  maxLength={5}
                  onValueChange={(value) => handleInputChange("afternoonEnd", value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    const keyCode = e.keyCode || e.which;
                    // Allow: backspace, delete, tab, escape, enter, colon
                    if ([8, 9, 27, 13, 46, 58].indexOf(keyCode) !== -1 ||
                      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                      (keyCode === 65 && e.ctrlKey === true) ||
                      (keyCode === 67 && e.ctrlKey === true) ||
                      (keyCode === 86 && e.ctrlKey === true) ||
                      (keyCode === 88 && e.ctrlKey === true) ||
                      // Allow: home, end, left, right
                      (keyCode >= 35 && keyCode <= 39)) {
                      return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (keyCode < 48 || keyCode > 57)) && (keyCode < 96 || keyCode > 105)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
              </Form>
            </ModalBody>

            <ModalFooter className="px-4 py-4 border-t border-gray-200 bg-gray-50">
              <Button
                isDisabled={isSubmitting}
                variant="bordered"
                onPress={handleClose}
              >
                Hủy
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
                variant="solid"
                onPress={handleSubmit}
              >
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
};

export default WorkingHoursModal;

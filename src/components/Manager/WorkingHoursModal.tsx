import React, { useState, useEffect } from "react";
import { Button, Form, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import toast from "react-hot-toast";

import { managerApi } from "@/api";
import VietnameseDateInput from "@/components/Common/VietnameseDateInput";

interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string | null;
  initialWorkingHours?: {
    date?: string;
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
    date: "",
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
    if (isOpen) {
      if (initialWorkingHours) {
        // Convert date to ISO string format (YYYY-MM-DD) if exists
        const dateValue = initialWorkingHours.date 
          ? new Date(initialWorkingHours.date).toISOString().split("T")[0] 
          : "";
        
        setFormData({
          date: dateValue,
          morningStart: convertTo24Hour(initialWorkingHours.morningStart) || "08:00",
          morningEnd: convertTo24Hour(initialWorkingHours.morningEnd) || "12:00",
          afternoonStart: convertTo24Hour(initialWorkingHours.afternoonStart) || "14:00",
          afternoonEnd: convertTo24Hour(initialWorkingHours.afternoonEnd) || "18:00",
        });
      } else {
        // Set default date to today if no initial data
        const today = new Date().toISOString().split("T")[0];
        setFormData({
          date: today,
          morningStart: "08:00",
          morningEnd: "12:00",
          afternoonStart: "14:00",
          afternoonEnd: "18:00",
        });
      }
      setShowValidation(false);
    }
  }, [isOpen, initialWorkingHours]);

  // Validation
  const isDateInvalid = showValidation && !formData.date;
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
      !formData.date ||
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
        date: formData.date, // BE sẽ thêm sau
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
    <Modal
        isOpen={isOpen}
        isDismissable={false}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
        size="2xl"
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

            <ModalBody className="px-6 py-6">
              <Form autoComplete="off" className="space-y-6" onSubmit={handleFormSubmit}>
            {/* Date input */}
            <div className="w-full">
              <VietnameseDateInput
                label={
                  <>
                    Ngày bắt đầu<span className="text-red-500">*</span>
                  </>
                }
                labelOutside={true}
                value={formData.date}
                onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
                isInvalid={isDateInvalid}
                errorMessage={isDateInvalid ? "Vui lòng chọn ngày" : ""}
                className="w-full"
              />
            </div>

            {/* Row: Ca sáng và Ca chiều */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              {/* ⭐ Ca sáng */}
              <div className="pr-4 md:pr-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Ca sáng
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Bắt đầu ca sáng */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5 font-medium">
                      Giờ bắt đầu <span className="text-red-500">*</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Giờ"
                        className={`w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC] ${
                          isMorningStartInvalid || isMorningTimeInvalid ? 'border-red-500' : ''
                        }`}
                        value={formData.morningStart.split(':')[0] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentMinute = formData.morningStart.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            morningStart: timeInput
                          }));
                        }}
                        onBlur={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '');
                          if (v && v.length === 1) {
                            v = v.padStart(2, '0');
                          }
                          const currentMinute = formData.morningStart.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            morningStart: timeInput
                          }));
                        }}
                      />
                      <span className="font-semibold text-gray-600">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Phút"
                        className={`w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC] ${
                          isMorningStartInvalid || isMorningTimeInvalid ? 'border-red-500' : ''
                        }`}
                        value={formData.morningStart.split(':')[1] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentHour = formData.morningStart.split(':')[0] || '08';
                          const timeInput = currentHour + ':' + v;
                          setFormData(prev => ({
                            ...prev,
                            morningStart: timeInput
                          }));
                        }}
                      />
                    </div>
                    {(isMorningStartInvalid || isMorningTimeInvalid) && (
                      <p className="text-xs text-red-500 mt-1">
                        {isMorningStartInvalid
                          ? "Vui lòng nhập thời gian hợp lệ (HH:MM)"
                          : "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc"}
                      </p>
                    )}
                  </div>
                  
                  {/* Kết thúc ca sáng */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5 font-medium">
                      Giờ kết thúc <span className="text-red-500">*</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Giờ"
                        className={`w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC] ${
                          isMorningEndInvalid ? 'border-red-500' : ''
                        }`}
                        value={formData.morningEnd.split(':')[0] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentMinute = formData.morningEnd.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            morningEnd: timeInput
                          }));
                        }}
                        onBlur={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '');
                          if (v && v.length === 1) {
                            v = v.padStart(2, '0');
                          }
                          const currentMinute = formData.morningEnd.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            morningEnd: timeInput
                          }));
                        }}
                      />
                      <span className="font-semibold text-gray-600">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Phút"
                        className={`w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC] ${
                          isMorningEndInvalid ? 'border-red-500' : ''
                        }`}
                        value={formData.morningEnd.split(':')[1] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentHour = formData.morningEnd.split(':')[0] || '12';
                          const timeInput = currentHour + ':' + v;
                          setFormData(prev => ({
                            ...prev,
                            morningEnd: timeInput
                          }));
                        }}
                      />
                    </div>
                    {isMorningEndInvalid && (
                      <p className="text-xs text-red-500 mt-1">
                        Vui lòng nhập thời gian hợp lệ (HH:MM)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ⭐ Ca chiều */}
              <div className="pl-4 md:pl-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Ca chiều
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Bắt đầu ca chiều */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5 font-medium">
                      Giờ bắt đầu <span className="text-red-500">*</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Giờ"
                        className={`w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC] ${
                          isAfternoonStartInvalid || isAfternoonTimeInvalid ? 'border-red-500' : ''
                        }`}
                        value={formData.afternoonStart.split(':')[0] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentMinute = formData.afternoonStart.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            afternoonStart: timeInput
                          }));
                        }}
                        onBlur={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '');
                          if (v && v.length === 1) {
                            v = v.padStart(2, '0');
                          }
                          const currentMinute = formData.afternoonStart.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            afternoonStart: timeInput
                          }));
                        }}
                      />
                      <span className="font-semibold text-gray-600">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Phút"
                        className={`w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC] ${
                          isAfternoonStartInvalid || isAfternoonTimeInvalid ? 'border-red-500' : ''
                        }`}
                        value={formData.afternoonStart.split(':')[1] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentHour = formData.afternoonStart.split(':')[0] || '14';
                          const timeInput = currentHour + ':' + v;
                          setFormData(prev => ({
                            ...prev,
                            afternoonStart: timeInput
                          }));
                        }}
                      />
                    </div>
                    {(isAfternoonStartInvalid || isAfternoonTimeInvalid) && (
                      <p className="text-xs text-red-500 mt-1">
                        {isAfternoonStartInvalid
                          ? "Vui lòng nhập thời gian hợp lệ (HH:MM)"
                          : "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc"}
                      </p>
                    )}
                  </div>
                  
                  {/* Kết thúc ca chiều */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5 font-medium">
                      Giờ kết thúc <span className="text-red-500">*</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Giờ"
                        className={`w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC] ${
                          isAfternoonEndInvalid ? 'border-red-500' : ''
                        }`}
                        value={formData.afternoonEnd.split(':')[0] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentMinute = formData.afternoonEnd.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            afternoonEnd: timeInput
                          }));
                        }}
                        onBlur={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '');
                          if (v && v.length === 1) {
                            v = v.padStart(2, '0');
                          }
                          const currentMinute = formData.afternoonEnd.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            afternoonEnd: timeInput
                          }));
                        }}
                      />
                      <span className="font-semibold text-gray-600">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Phút"
                        className={`w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC] ${
                          isAfternoonEndInvalid ? 'border-red-500' : ''
                        }`}
                        value={formData.afternoonEnd.split(':')[1] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentHour = formData.afternoonEnd.split(':')[0] || '18';
                          const timeInput = currentHour + ':' + v;
                          setFormData(prev => ({
                            ...prev,
                            afternoonEnd: timeInput
                          }));
                        }}
                      />
                    </div>
                    {isAfternoonEndInvalid && (
                      <p className="text-xs text-red-500 mt-1">
                        Vui lòng nhập thời gian hợp lệ (HH:MM)
                      </p>
                    )}
                  </div>
                </div>
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
  );
};

export default WorkingHoursModal;

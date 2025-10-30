import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";

import { managerApi, ManagerDoctor, ManagerClinic } from "@/api";

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  doctors: ManagerDoctor[];
  rooms: ManagerClinic[];
}

const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  doctors,
  rooms,
}) => {
  const [formData, setFormData] = useState({
    date: "",
    shift: "",
    doctorId: "",
    roomId: "",
    maxSlots: "",
    workingHours: {
      morningStart: "08:00",
      morningEnd: "12:00",
      afternoonStart: "14:00",
      afternoonEnd: "18:00",
    },
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shiftOptions = [
    {
      key: "Morning",
      label: "Ca Sáng",
    },
    {
      key: "Afternoon",
      label: "Ca Chiều",
    },
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set default date to today
      const today = new Date().toISOString().split("T")[0];

      setFormData({
        date: today,
        shift: "",
        doctorId: "",
        roomId: "",
        maxSlots: "10", // Default
        workingHours: {
          morningStart: "08:00",
          morningEnd: "12:00",
          afternoonStart: "14:00",
          afternoonEnd: "18:00",
        },
      });
      setShowValidation(false);
    }
  }, [isOpen]);

  // Auto-fill time when shift is selected
  const handleShiftChange = (shift: string) => {
    setFormData((prev) => ({
      ...prev,
      shift: shift,
    }));
  };

  // Validation states
  const isDateInvalid = showValidation && !formData.date;
  const isShiftInvalid = showValidation && !formData.shift;
  const isDoctorInvalid = showValidation && !formData.doctorId;
  const isMaxSlotsInvalid =
    showValidation &&
    (!formData.maxSlots ||
      isNaN(Number(formData.maxSlots)) ||
      Number(formData.maxSlots) <= 0);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    // Check validation
    const hasErrors =
      !formData.date ||
      !formData.shift ||
      !formData.doctorId ||
      !formData.maxSlots ||
      isNaN(Number(formData.maxSlots)) ||
      Number(formData.maxSlots) <= 0;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduleData = {
        doctorId: formData.doctorId,
        date: formData.date,
        shift: formData.shift as "Morning" | "Afternoon",
        roomId: formData.roomId || undefined,
        maxSlots: Number(formData.maxSlots),
        workingHours: formData.workingHours,
      };

      const response = await managerApi.createSchedule(scheduleData);

      if (response.data?.status) {
        toast.success(response.data.message || "Tạo ca khám thành công");
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      toast.error(
        error.message || "Có lỗi xảy ra khi tạo ca khám. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowValidation(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        aria-label="Close modal"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClose();
          }
        }}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#39BDCC]">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/logo1.png"
            />
            <h2 className="text-2xl font-bold">Thêm ca khám mới</h2>
          </div>
          <Button
            isIconOnly
            className="text-gray-500 hover:text-gray-700"
            variant="light"
            onPress={handleClose}
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 pb-0">
          <Form
            autoComplete="off"
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                errorMessage={isDateInvalid ? "Vui lòng chọn ngày" : ""}
                isInvalid={isDateInvalid}
                label={
                  <>
                    Ngày <span className="text-red-500">*</span>
                  </>
                }
                type="date"
                value={formData.date}
                variant="bordered"
                onValueChange={(value) => handleInputChange("date", value)}
              />

              <Select
                fullWidth
                classNames={{
                  base: "w-full",
                  trigger: "w-full"
                }}
                errorMessage={isShiftInvalid ? "Vui lòng chọn ca làm việc" : ""}
                isInvalid={isShiftInvalid}
                label={
                  <>
                    Ca làm việc <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Chọn ca"
                selectedKeys={formData.shift ? [formData.shift] : []}
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleShiftChange(selectedKey);
                }}
              >
                {shiftOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                label="Giờ bắt đầu ca sáng"
                type="time"
                value={formData.workingHours.morningStart}
                variant="bordered"
                onValueChange={(value) => 
                  setFormData(prev => ({
                    ...prev,
                    workingHours: {
                      ...prev.workingHours,
                      morningStart: value
                    }
                  }))
                }
              />

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                label="Giờ kết thúc ca sáng"
                type="time"
                value={formData.workingHours.morningEnd}
                variant="bordered"
                onValueChange={(value) => 
                  setFormData(prev => ({
                    ...prev,
                    workingHours: {
                      ...prev.workingHours,
                      morningEnd: value
                    }
                  }))
                }
              />

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                label="Giờ bắt đầu ca chiều"
                type="time"
                value={formData.workingHours.afternoonStart}
                variant="bordered"
                onValueChange={(value) => 
                  setFormData(prev => ({
                    ...prev,
                    workingHours: {
                      ...prev.workingHours,
                      afternoonStart: value
                    }
                  }))
                }
              />

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                label="Giờ kết thúc ca chiều"
                type="time"
                value={formData.workingHours.afternoonEnd}
                variant="bordered"
                onValueChange={(value) => 
                  setFormData(prev => ({
                    ...prev,
                    workingHours: {
                      ...prev.workingHours,
                      afternoonEnd: value
                    }
                  }))
                }
              />

              <Select
                fullWidth
                classNames={{
                  base: "w-full",
                  trigger: "w-full"
                }}
                errorMessage={isDoctorInvalid ? "Vui lòng chọn bác sĩ" : ""}
                isInvalid={isDoctorInvalid}
                label={
                  <>
                    Bác sĩ <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Chọn bác sĩ"
                selectedKeys={formData.doctorId ? [formData.doctorId] : []}
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleInputChange("doctorId", selectedKey);
                }}
              >
                {doctors.map((doctor) => (
                  <SelectItem key={doctor._id} textValue={doctor.fullName}>
                    <div className="font-medium">{doctor.fullName}</div>
                  </SelectItem>
                ))}
              </Select>

              <Select
                fullWidth
                classNames={{
                  base: "w-full",
                  trigger: "w-full"
                }}
                label="Phòng khám (Tùy chọn)"
                placeholder="Chọn phòng"
                selectedKeys={formData.roomId ? [formData.roomId] : []}
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleInputChange("roomId", selectedKey);
                }}
              >
                {rooms.map((room) => (
                  <SelectItem key={room._id}>Phòng {room.name}</SelectItem>
                ))}
              </Select>

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                endContent={<span className="text-gray-500 text-sm">slot</span>}
                errorMessage={
                  isMaxSlotsInvalid
                    ? "Vui lòng nhập số slot tối đa (lớn hơn 0)"
                    : ""
                }
                isInvalid={isMaxSlotsInvalid}
                label={
                  <>
                    Số slot tối đa <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Ví dụ: 10"
                type="number"
                value={formData.maxSlots}
                variant="bordered"
                onValueChange={(value) => handleInputChange("maxSlots", value)}
              />
            </div>
          </Form>
        </div>

        {/* Buttons outside Form */}
        <div className="flex justify-end items-center gap-4 px-4 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
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
            {isSubmitting ? "Đang thêm..." : "Thêm ca khám"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddScheduleModal;

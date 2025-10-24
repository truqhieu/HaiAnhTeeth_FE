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
    startTime: "",
    endTime: "",
    doctorId: "",
    roomId: "",
    maxSlots: "",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shiftOptions = [
    {
      key: "Morning",
      label: "Ca Sáng (08:00 - 12:00)",
      start: "08:00",
      end: "12:00",
    },
    {
      key: "Afternoon",
      label: "Ca Chiều (13:00 - 17:00)",
      start: "13:00",
      end: "17:00",
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
        startTime: "",
        endTime: "",
        doctorId: "",
        roomId: "",
        maxSlots: "10", // Default
      });
      setShowValidation(false);
    }
  }, [isOpen]);

  // Auto-fill time when shift is selected
  const handleShiftChange = (shift: string) => {
    const selectedShift = shiftOptions.find((s) => s.key === shift);

    if (selectedShift) {
      setFormData((prev) => ({
        ...prev,
        shift: shift,
        startTime: selectedShift.start,
        endTime: selectedShift.end,
      }));
    }
  };

  // Validation states
  const isDateInvalid = showValidation && !formData.date;
  const isShiftInvalid = showValidation && !formData.shift;
  const isStartTimeInvalid = showValidation && !formData.startTime;
  const isEndTimeInvalid = showValidation && !formData.endTime;
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowValidation(true);

    // Check validation
    const hasErrors =
      !formData.date ||
      !formData.shift ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.doctorId ||
      !formData.maxSlots ||
      isNaN(Number(formData.maxSlots)) ||
      Number(formData.maxSlots) <= 0;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Tạo ISO datetime strings cho startTime và endTime
      const dateObj = new Date(formData.date);
      const [startHour, startMinute] = formData.startTime.split(":");
      const [endHour, endMinute] = formData.endTime.split(":");

      const startDateTime = new Date(dateObj);

      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const endDateTime = new Date(dateObj);

      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      const scheduleData = {
        doctorId: formData.doctorId,
        date: formData.date,
        shift: formData.shift as "Morning" | "Afternoon",
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        roomId: formData.roomId || undefined,
        maxSlots: Number(formData.maxSlots),
      };

      console.log("Creating schedule:", scheduleData);

      const response = await managerApi.createSchedule(scheduleData);

      if (response.status) {
        toast.success(response.message || "Tạo ca khám thành công");
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error("Error creating schedule:", error);
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
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39BDCC]">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/Screenshot_2025-09-19_141436-removebg-preview.png"
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
        <div className="p-6">
          <Form
            autoComplete="off"
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                fullWidth
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
                autoComplete="off"
                errorMessage={
                  isStartTimeInvalid ? "Vui lòng nhập giờ bắt đầu" : ""
                }
                isInvalid={isStartTimeInvalid}
                isReadOnly={formData.shift !== ""}
                label={
                  <>
                    Giờ bắt đầu <span className="text-red-500">*</span>
                  </>
                }
                type="time"
                value={formData.startTime}
                variant="bordered"
                onValueChange={(value) => handleInputChange("startTime", value)}
              />

              <Input
                fullWidth
                autoComplete="off"
                errorMessage={
                  isEndTimeInvalid ? "Vui lòng nhập giờ kết thúc" : ""
                }
                isInvalid={isEndTimeInvalid}
                isReadOnly={formData.shift !== ""}
                label={
                  <>
                    Giờ kết thúc <span className="text-red-500">*</span>
                  </>
                }
                type="time"
                value={formData.endTime}
                variant="bordered"
                onValueChange={(value) => handleInputChange("endTime", value)}
              />

              <Select
                fullWidth
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

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                isDisabled={isSubmitting}
                variant="bordered"
                onPress={handleClose}
              >
                Hủy
              </Button>
              <Button
                className="bg-[#39BDCC] text-white hover:bg-[#2ca6b5]"
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
                type="submit"
                variant="solid"
              >
                {isSubmitting ? "Đang thêm..." : "Thêm ca khám"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AddScheduleModal;

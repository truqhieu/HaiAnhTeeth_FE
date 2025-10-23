import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";
import { managerApi, ManagerDoctor, ManagerClinic } from "@/api";

interface Schedule {
  id: string;
  date: string;
  shift: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  doctorName: string;
  doctorId: string;
  roomName: string;
  roomId?: string;
  maxSlots: number;
  status: "available" | "unavailable" | "booked" | "cancelled";
}

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onSuccess?: () => void;
  doctors: ManagerDoctor[];
  rooms: ManagerClinic[];
}

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onSuccess,
  doctors,
  rooms,
}) => {
  const [formData, setFormData] = useState({
    shift: "",
    startTime: "",
    endTime: "",
    status: "Available" as "Available" | "Unavailable" | "Booked" | "Cancelled",
    roomId: "",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shiftOptions = [
    { key: "Morning", label: "Ca Sáng", start: "08:00", end: "12:00" },
    { key: "Afternoon", label: "Ca Chiều", start: "13:00", end: "17:00" },
  ];

  const statusOptions = [
    { key: "Available", label: "Có sẵn" },
    { key: "Unavailable", label: "Không khả dụng" },
    { key: "Booked", label: "Đã đặt" },
    { key: "Cancelled", label: "Đã hủy" },
  ];

  // Load schedule data when modal opens
  useEffect(() => {
    if (isOpen && schedule) {
      setFormData({
        shift: schedule.shift,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        status: schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1) as "Available" | "Unavailable" | "Booked" | "Cancelled",
        roomId: schedule.roomId || "",
      });
      setShowValidation(false);
    }
  }, [isOpen, schedule]);

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
  const isShiftInvalid = showValidation && !formData.shift;
  const isStartTimeInvalid = showValidation && !formData.startTime;
  const isEndTimeInvalid = showValidation && !formData.endTime;

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
      !formData.shift ||
      !formData.startTime ||
      !formData.endTime;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!schedule) return;

      // Tạo ISO datetime strings cho startTime và endTime
      const dateObj = new Date(schedule.date);
      const [startHour, startMinute] = formData.startTime.split(':');
      const [endHour, endMinute] = formData.endTime.split(':');
      
      const startDateTime = new Date(dateObj);
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      
      const endDateTime = new Date(dateObj);
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      const updateData = {
        shift: formData.shift as 'Morning' | 'Afternoon',
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: formData.status,
        roomId: formData.roomId || undefined,
      };

      console.log("Updating schedule:", updateData);

      const response = await managerApi.updateSchedule(schedule.id, updateData);

      if (response.status) {
        toast.success(response.message || 'Cập nhật ca khám thành công');
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật ca khám. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowValidation(false);
    onClose();
  };

  if (!isOpen || !schedule) return null;

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
            <div>
              <h2 className="text-2xl font-bold">Chỉnh sửa ca khám</h2>
              <p className="text-sm text-gray-600">
                {schedule.shiftName} - {schedule.doctorName}
              </p>
            </div>
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
          {/* Read-only info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Thông tin ca khám</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Ngày:</span>
                <span className="ml-2 font-medium">{new Date(schedule.date).toLocaleDateString('vi-VN')}</span>
              </div>
              <div>
                <span className="text-gray-600">Bác sĩ:</span>
                <span className="ml-2 font-medium">{schedule.doctorName}</span>
              </div>
              <div>
                <span className="text-gray-600">Số slot:</span>
                <span className="ml-2 font-medium">{schedule.maxSlots} slot</span>
              </div>
            </div>
          </div>

          <Form autoComplete="off" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                fullWidth
                errorMessage={isShiftInvalid ? "Vui lòng chọn ca làm việc" : ""}
                isInvalid={isShiftInvalid}
                label="Ca làm việc *"
                placeholder="Chọn ca"
                selectedKeys={formData.shift ? [formData.shift] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleShiftChange(selectedKey);
                }}
                variant="bordered"
              >
                {shiftOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

              <Select
                fullWidth
                label="Trạng thái"
                placeholder="Chọn trạng thái"
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("status", selectedKey);
                }}
                variant="bordered"
              >
                {statusOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

              <Input
                fullWidth
                type="time"
                autoComplete="off"
                errorMessage={isStartTimeInvalid ? "Vui lòng nhập giờ bắt đầu" : ""}
                isInvalid={isStartTimeInvalid}
                label="Giờ bắt đầu *"
                value={formData.startTime}
                onValueChange={(value) => handleInputChange("startTime", value)}
                variant="bordered"
                isReadOnly={formData.shift !== ""}
              />

              <Input
                fullWidth
                type="time"
                autoComplete="off"
                errorMessage={isEndTimeInvalid ? "Vui lòng nhập giờ kết thúc" : ""}
                isInvalid={isEndTimeInvalid}
                label="Giờ kết thúc *"
                value={formData.endTime}
                onValueChange={(value) => handleInputChange("endTime", value)}
                variant="bordered"
                isReadOnly={formData.shift !== ""}
              />

              <Select
                fullWidth
                label="Phòng khám (Tùy chọn)"
                placeholder="Chọn phòng"
                selectedKeys={formData.roomId ? [formData.roomId] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("roomId", selectedKey);
                }}
                variant="bordered"
              >
                {rooms.map((room) => (
                  <SelectItem key={room._id}>Phòng {room.name}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="bordered"
                onPress={handleClose}
                isDisabled={isSubmitting}
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
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật ca khám"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditScheduleModal;


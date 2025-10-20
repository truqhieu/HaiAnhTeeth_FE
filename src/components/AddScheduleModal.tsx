import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Select, SelectItem } from "@heroui/react";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  doctors: Doctor[];
  rooms: string[];
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
    shiftName: "",
    startTime: "",
    endTime: "",
    doctorId: "",
    room: "",
    maxPatients: "",
    status: "active",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shiftOptions = [
    { key: "Sáng", label: "Ca Sáng (08:00 - 12:00)", start: "08:00", end: "12:00" },
    { key: "Chiều", label: "Ca Chiều (13:00 - 17:00)", start: "13:00", end: "17:00" },
    { key: "Tối", label: "Ca Tối (18:00 - 21:00)", start: "18:00", end: "21:00" },
    { key: "Tùy chỉnh", label: "Tùy chỉnh thời gian", start: "", end: "" },
  ];

  const statusOptions = [
    { key: "active", label: "Đang hoạt động" },
    { key: "full", label: "Đã đầy" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set default date to today
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        date: today,
        shiftName: "",
        startTime: "",
        endTime: "",
        doctorId: "",
        room: "",
        maxPatients: "",
        status: "active",
      });
      setShowValidation(false);
    }
  }, [isOpen]);

  // Auto-fill time when shift is selected
  const handleShiftChange = (shift: string) => {
    const selectedShift = shiftOptions.find((s) => s.key === shift);
    if (selectedShift && shift !== "Tùy chỉnh") {
      setFormData((prev) => ({
        ...prev,
        shiftName: shift,
        startTime: selectedShift.start,
        endTime: selectedShift.end,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        shiftName: shift,
        startTime: "",
        endTime: "",
      }));
    }
  };

  // Validation states
  const isDateInvalid = showValidation && !formData.date;
  const isShiftNameInvalid = showValidation && !formData.shiftName;
  const isStartTimeInvalid = showValidation && !formData.startTime;
  const isEndTimeInvalid = showValidation && !formData.endTime;
  const isDoctorInvalid = showValidation && !formData.doctorId;
  const isRoomInvalid = showValidation && !formData.room;
  const isMaxPatientsInvalid =
    showValidation &&
    (!formData.maxPatients ||
      isNaN(Number(formData.maxPatients)) ||
      Number(formData.maxPatients) <= 0);

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
      !formData.shiftName ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.doctorId ||
      !formData.room ||
      !formData.maxPatients ||
      isNaN(Number(formData.maxPatients)) ||
      Number(formData.maxPatients) <= 0;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newSchedule = {
        date: formData.date,
        shiftName: formData.shiftName,
        startTime: formData.startTime,
        endTime: formData.endTime,
        doctorId: Number(formData.doctorId),
        room: formData.room,
        maxPatients: Number(formData.maxPatients),
        currentPatients: 0,
        status: formData.status,
      };

      // TODO: Gửi request lên backend
      // const response = await fetch('/api/schedules', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newSchedule),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Creating schedule:", newSchedule);

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert("Có lỗi xảy ra khi tạo ca khám. Vui lòng thử lại.");
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
          <Form autoComplete="off" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                fullWidth
                type="date"
                autoComplete="off"
                errorMessage={isDateInvalid ? "Vui lòng chọn ngày" : ""}
                isInvalid={isDateInvalid}
                label="Ngày *"
                value={formData.date}
                onValueChange={(value) => handleInputChange("date", value)}
                variant="bordered"
              />

              <Select
                fullWidth
                errorMessage={isShiftNameInvalid ? "Vui lòng chọn ca làm việc" : ""}
                isInvalid={isShiftNameInvalid}
                label="Ca làm việc *"
                placeholder="Chọn ca"
                selectedKeys={formData.shiftName ? [formData.shiftName] : []}
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
                isReadOnly={formData.shiftName !== "Tùy chỉnh" && formData.shiftName !== ""}
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
                isReadOnly={formData.shiftName !== "Tùy chỉnh" && formData.shiftName !== ""}
              />

              <Select
                fullWidth
                errorMessage={isDoctorInvalid ? "Vui lòng chọn bác sĩ" : ""}
                isInvalid={isDoctorInvalid}
                label="Bác sĩ *"
                placeholder="Chọn bác sĩ"
                selectedKeys={formData.doctorId ? [formData.doctorId] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("doctorId", selectedKey);
                }}
                variant="bordered"
              >
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id.toString()} textValue={doctor.name}>
                    <div>
                      <div className="font-medium">{doctor.name}</div>
                      <div className="text-xs text-gray-500">
                        {doctor.specialty}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              <Select
                fullWidth
                errorMessage={isRoomInvalid ? "Vui lòng chọn phòng" : ""}
                isInvalid={isRoomInvalid}
                label="Phòng khám *"
                placeholder="Chọn phòng"
                selectedKeys={formData.room ? [formData.room] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("room", selectedKey);
                }}
                variant="bordered"
              >
                {rooms.map((room) => (
                  <SelectItem key={room}>Phòng {room}</SelectItem>
                ))}
              </Select>

              <Input
                fullWidth
                type="number"
                autoComplete="off"
                errorMessage={
                  isMaxPatientsInvalid
                    ? "Vui lòng nhập số bệnh nhân tối đa (lớn hơn 0)"
                    : ""
                }
                isInvalid={isMaxPatientsInvalid}
                label="Số bệnh nhân tối đa *"
                placeholder="Ví dụ: 10"
                value={formData.maxPatients}
                onValueChange={(value) => handleInputChange("maxPatients", value)}
                variant="bordered"
                endContent={<span className="text-gray-500 text-sm">người</span>}
              />

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


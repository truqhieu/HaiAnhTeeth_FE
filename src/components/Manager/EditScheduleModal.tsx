import React, { useState, useEffect } from "react";
import { Button, Form, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import toast from "react-hot-toast";

import { managerApi, ManagerDoctor, ManagerClinic } from "@/api";

interface Schedule {
  id: string;
  date: string;
  shift: string;
  shiftName: string;
  doctorName: string;
  doctorId: string;
  roomName: string;
  roomId?: string;
  maxSlots: number;
  status: "available" | "unavailable" | "booked" | "cancelled";
  workingHours: {
    morningStart: string;
    morningEnd: string;
    afternoonStart: string;
    afternoonEnd: string;
  };
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
    status: "Available" as "Available" | "Unavailable" | "Booked" | "Cancelled",
    roomId: "",
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
    { key: "Morning", label: "Ca Sáng" },
    { key: "Afternoon", label: "Ca Chiều" },
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
        status: (schedule.status.charAt(0).toUpperCase() +
          schedule.status.slice(1)) as
          | "Available"
          | "Unavailable"
          | "Booked"
          | "Cancelled",
        roomId: schedule.roomId || "",
        workingHours: schedule.workingHours || {
          morningStart: "08:00",
          morningEnd: "12:00",
          afternoonStart: "14:00",
          afternoonEnd: "18:00",
        },
      });
      setShowValidation(false);
    }
  }, [isOpen, schedule]);

  // Auto-fill time when shift is selected
  const handleShiftChange = (shift: string) => {
    setFormData((prev) => ({
      ...prev,
      shift: shift,
    }));
  };

  // Validation states
  const isShiftInvalid = showValidation && !formData.shift;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    // Check validation
    const hasErrors = !formData.shift;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!schedule) return;

      const updateData = {
        shift: formData.shift as "Morning" | "Afternoon",
        status: formData.status,
        roomId: formData.roomId || undefined,
        workingHours: formData.workingHours,
      };

      const response = await managerApi.updateSchedule(schedule.id, updateData);

      if (response.data?.status) {
        toast.success(response.data.message || "Cập nhật ca khám thành công");
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          "Có lỗi xảy ra khi cập nhật ca khám. Vui lòng thử lại.",
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

  if (!isOpen || !schedule) return null;

  return (
    <Modal
      isOpen={isOpen}
      isDismissable={false}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      size="3xl"
      scrollBehavior="outside"
      classNames={{ base: "max-h-[90vh] rounded-2xl" }}
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
              <h2 className="text-2xl font-bold">Chỉnh sửa ca khám</h2>
              <p className="text-sm text-gray-600">
                {schedule.shiftName} - {schedule.doctorName}
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="px-4 py-4 pb-0">
            <div className="mb-7 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Thông tin ca khám
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Ngày:</span>
                  <span className="ml-2 font-medium">
                    {new Date(schedule.date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Bác sĩ:</span>
                  <span className="ml-2 font-medium">{schedule.doctorName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Số slot:</span>
                  <span className="ml-2 font-medium">
                    {schedule.maxSlots} slot
                  </span>
                </div>
              </div>
            </div>

            <Form autoComplete="off" className="space-y-7" onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
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

              <Select
                fullWidth
                classNames={{
                  base: "w-full",
                  trigger: "w-full"
                }}
                label="Trạng thái"
                placeholder="Chọn trạng thái"
                selectedKeys={formData.status ? [formData.status] : []}
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleInputChange("status", selectedKey);
                }}
              >
                {statusOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

            </div>

            {/* Row 2: Ca sáng và Ca chiều */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-4">
              {/* ⭐ Ca sáng */}
              <div className="pr-4 md:pr-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Ca sáng
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Bắt đầu ca sáng */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5 font-medium">
                      Giờ bắt đầu
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Giờ"
                        className="w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC]"
                        value={formData.workingHours.morningStart.split(':')[0] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentMinute = formData.workingHours.morningStart.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              morningStart: timeInput
                            }
                          }));
                        }}
                      />
                      <span className="font-semibold text-gray-600">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Phút"
                        className="w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC]"
                        value={formData.workingHours.morningStart.split(':')[1] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentHour = formData.workingHours.morningStart.split(':')[0] || '08';
                          const timeInput = currentHour + ':' + v;
                          setFormData(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              morningStart: timeInput
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Kết thúc ca sáng */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5 font-medium">
                      Giờ kết thúc
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Giờ"
                        className="w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC]"
                        value={formData.workingHours.morningEnd.split(':')[0] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentMinute = formData.workingHours.morningEnd.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              morningEnd: timeInput
                            }
                          }));
                        }}
                      />
                      <span className="font-semibold text-gray-600">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Phút"
                        className="w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC]"
                        value={formData.workingHours.morningEnd.split(':')[1] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentHour = formData.workingHours.morningEnd.split(':')[0] || '12';
                          const timeInput = currentHour + ':' + v;
                          setFormData(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              morningEnd: timeInput
                            }
                          }));
                        }}
                      />
                    </div>
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
                      Giờ bắt đầu
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Giờ"
                        className="w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC]"
                        value={formData.workingHours.afternoonStart.split(':')[0] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentMinute = formData.workingHours.afternoonStart.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              afternoonStart: timeInput
                            }
                          }));
                        }}
                      />
                      <span className="font-semibold text-gray-600">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Phút"
                        className="w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC]"
                        value={formData.workingHours.afternoonStart.split(':')[1] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentHour = formData.workingHours.afternoonStart.split(':')[0] || '14';
                          const timeInput = currentHour + ':' + v;
                          setFormData(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              afternoonStart: timeInput
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Kết thúc ca chiều */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5 font-medium">
                      Giờ kết thúc
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Giờ"
                        className="w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC]"
                        value={formData.workingHours.afternoonEnd.split(':')[0] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentMinute = formData.workingHours.afternoonEnd.split(':')[1] || '00';
                          const timeInput = v + ':' + currentMinute;
                          setFormData(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              afternoonEnd: timeInput
                            }
                          }));
                        }}
                      />
                      <span className="font-semibold text-gray-600">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Phút"
                        className="w-14 text-center border px-2 py-1.5 rounded-lg text-sm focus:ring-2 focus:border-transparent focus:ring-[#39BDCC]"
                        value={formData.workingHours.afternoonEnd.split(':')[1] || ''}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const currentHour = formData.workingHours.afternoonEnd.split(':')[0] || '18';
                          const timeInput = currentHour + ':' + v;
                          setFormData(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              afternoonEnd: timeInput
                            }
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">

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
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật ca khám"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default EditScheduleModal;

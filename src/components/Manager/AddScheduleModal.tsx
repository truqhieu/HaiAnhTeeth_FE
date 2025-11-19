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
  doctors: _doctors, // ⭐ Không sử dụng nữa, dùng doctorsWithoutWorkingHours thay thế
  rooms,
}) => {
  const [formData, setFormData] = useState({
    date: "",
    doctorId: "",
    workingHours: {
      morningStart: "08:00",
      morningEnd: "12:00",
      afternoonStart: "14:00",
      afternoonEnd: "18:00",
    },
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ⭐ State để lưu danh sách bác sĩ chưa có workingHours
  const [doctorsWithoutWorkingHours, setDoctorsWithoutWorkingHours] = useState<Array<{ _id: string; fullName: string; email: string }>>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // ⭐ Fetch danh sách bác sĩ chưa có workingHours khi mở modal
  useEffect(() => {
    if (isOpen) {
      // Set default date to today
      const today = new Date().toISOString().split("T")[0];

      setFormData({
        date: today,
        doctorId: "",
        workingHours: {
          morningStart: "08:00",
          morningEnd: "12:00",
          afternoonStart: "14:00",
          afternoonEnd: "18:00",
        },
      });
      setShowValidation(false);
      
      // ⭐ Fetch danh sách bác sĩ chưa có workingHours
      const fetchDoctorsWithoutWorkingHours = async () => {
        try {
          setLoadingDoctors(true);
          const response = await managerApi.getDoctorsWithoutWorkingHours();
          if (response.success && response.data && Array.isArray(response.data)) {
            setDoctorsWithoutWorkingHours(response.data);
          } else {
            setDoctorsWithoutWorkingHours([]);
          }
        } catch (error: any) {
          console.error("Error fetching doctors without working hours:", error);
          setDoctorsWithoutWorkingHours([]);
        } finally {
          setLoadingDoctors(false);
        }
      };
      
      fetchDoctorsWithoutWorkingHours();
    }
  }, [isOpen]);

  // Validation states
  const isDateInvalid = showValidation && !formData.date;
  const isDoctorInvalid = showValidation && !formData.doctorId;

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
      !formData.doctorId;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduleData = {
        doctorId: formData.doctorId,
        date: formData.date,
        workingHours: formData.workingHours,
      };

      const response = await managerApi.createSchedule(scheduleData);

      if (response.success) {
        toast.success(response.message || "Tạo lịch làm việc thành công");
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      }
    } catch (error: any) {
      toast.error(
        error.message || "Có lỗi xảy ra khi tạo lịch làm việc. Vui lòng thử lại.",
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
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/logo1.png"
            />
            <h2 className="text-2xl font-bold">Thêm lịch làm việc mới</h2>
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
        <div className="px-4 py-4 pb-4">
          <Form
            autoComplete="off"
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            {/* Row 1: Ngày và Bác sĩ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
                errorMessage={isDoctorInvalid ? "Vui lòng chọn bác sĩ" : ""}
                isInvalid={isDoctorInvalid}
                isLoading={loadingDoctors}
                label={
                  <>
                    Bác sĩ <span className="text-red-500">*</span>
                  </>
                }
                placeholder={loadingDoctors ? "Đang tải..." : doctorsWithoutWorkingHours.length === 0 ? "Không có bác sĩ nào chưa có lịch làm việc" : "Chọn bác sĩ"}
                selectedKeys={formData.doctorId ? [formData.doctorId] : []}
                variant="bordered"
                isDisabled={loadingDoctors || doctorsWithoutWorkingHours.length === 0}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("doctorId", selectedKey);
                }}
              >
                {doctorsWithoutWorkingHours.map((doctor) => (
                  <SelectItem key={doctor._id} textValue={doctor.fullName}>
                    <div className="font-medium">{doctor.fullName}</div>
                    <div className="text-xs text-gray-500">{doctor.email}</div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Row 2: Ca sáng và Ca chiều */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-4">
              {/* ⭐ Ca sáng */}
              <div className="pr-4 md:pr-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ca sáng
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Bắt đầu ca sáng */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">
                      Giờ bắt đầu
                    </label>
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
                    <label className="block text-xs text-gray-600 mb-1.5">
                      Giờ kết thúc
                    </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ca chiều
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Bắt đầu ca chiều */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">
                      Giờ bắt đầu
                    </label>
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
                    <label className="block text-xs text-gray-600 mb-1.5">
                      Giờ kết thúc
                    </label>
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
            {isSubmitting ? "Đang thêm..." : "Thêm lịch làm việc"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddScheduleModal;

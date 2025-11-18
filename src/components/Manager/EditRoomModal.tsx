import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  Input,
  Button,
  Form,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import toast from "react-hot-toast";

import { managerApi, ManagerDoctor } from "@/api";
import { Room } from "@/types";

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onSuccess?: () => void;
  doctors: ManagerDoctor[];
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  onSuccess,
  doctors,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    assignedDoctorId: "",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { key: "active", label: "Hoạt động" },
    { key: "inactive", label: "Không hoạt động" },
  ];

  // Load room data when modal opens
  useEffect(() => {
    if (isOpen && room) {
      setFormData({
        name: room.name,
        description: room.description,
        status: room.status,
        assignedDoctorId: room.assignedDoctorId || "",
      });
      setShowValidation(false);
    }
  }, [isOpen, room]);

  // Validation states
  const isNameInvalid = showValidation && !formData.name.trim();
  const isDescriptionInvalid = showValidation && !formData.description.trim();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    // Check validation
    const hasErrors = !formData.name.trim() || !formData.description.trim();

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!room?.id) {
        throw new Error("Không tìm thấy ID phòng khám");
      }

      // Prepare data for API call
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status:
          formData.status === "active"
            ? ("Active" as const)
            : ("Inactive" as const),
      };

      // Gọi API cập nhật
      const response = await managerApi.updateClinic(room.id, updateData);

      // Check cả status và success
      if (response.status || response.success) {
        // Handle assign/unassign doctor nếu có thay đổi
        const oldDoctorId = room.assignedDoctorId;
        const newDoctorId = formData.assignedDoctorId;
        let doctorChangeSuccess = true;

        // Xử lý assign/unassign doctor
        if (oldDoctorId !== newDoctorId) {
          try {
            if (newDoctorId) {
              // Assign doctor
              await managerApi.assignDoctor(room.id, newDoctorId);
            } else if (oldDoctorId) {
              // Unassign doctor
              await managerApi.unassignDoctor(room.id);
            }
          } catch (doctorError: any) {
            console.error("Error handling doctor assignment:", doctorError);
            doctorChangeSuccess = false;
            // Vẫn cho phép tiếp tục vì clinic info đã update thành công
          }
        }

        // Hiển thị toast success duy nhất
        if (doctorChangeSuccess) {
          toast.success(response.message || "Cập nhật phòng khám thành công!");
        } else {
          toast.success("Cập nhật thông tin phòng khám thành công! (Lưu ý: Không thể thay đổi bác sĩ, vui lòng thử lại)");
        }

        // Close modal and notify success để refresh data
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        throw new Error(response.message || "Không thể cập nhật phòng khám");
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          "Có lỗi xảy ra khi cập nhật phòng khám. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Chỉ ẩn validation errors, KHÔNG clear form data
    setShowValidation(false);
    onClose();
  };

  if (!isOpen || !room) return null;

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
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/logo1.png"
            />
            <div>
              <h2 className="text-2xl font-bold">Chỉnh sửa phòng khám</h2>
              <p className="text-sm text-gray-600">{room.name}</p>
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
        <div className="px-4 py-4 pb-0">
          <Form
            autoComplete="off"
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <div className="space-y-4 w-full">
              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                errorMessage={
                  isNameInvalid ? "Vui lòng nhập tên phòng khám" : ""
                }
                isInvalid={isNameInvalid}
                label={
                  <>
                    Tên phòng khám <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Ví dụ: Phòng khám tổng quát 1"
                type="text"
                value={formData.name}
                variant="bordered"
                onValueChange={(value) => handleInputChange("name", value)}
              />

              <Textarea
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                errorMessage={isDescriptionInvalid ? "Vui lòng nhập mô tả" : ""}
                isInvalid={isDescriptionInvalid}
                label={
                  <>
                    Mô tả phòng khám <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Nhập mô tả chi tiết về phòng khám"
                value={formData.description}
                variant="bordered"
                onValueChange={(value) =>
                  handleInputChange("description", value)
                }
              />

              <Select
                fullWidth
                classNames={{
                  base: "w-full",
                  trigger: "w-full",
                  description: "pl-2"
                }}
                description="Chọn 'Không có bác sĩ' để gỡ bác sĩ hiện tại"
                label="Phân công bác sĩ"
                placeholder={
                  room.assignedDoctorName
                    ? `${room.assignedDoctorName}`
                    : "Chọn bác sĩ"
                }
                selectedKeys={
                  formData.assignedDoctorId ? [formData.assignedDoctorId] : []
                }
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleInputChange("assignedDoctorId", selectedKey || "");
                }}
              >
                <SelectItem key="" value="">
                  <span className="text-gray-500 italic">Không có bác sĩ</span>
                </SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor._id} textValue={doctor.fullName}>
                    <div>
                      <div className="font-medium">{doctor.fullName}</div>
                      <div className="text-xs text-gray-500">
                        {doctor.email}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              <Select
                fullWidth
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
            {isSubmitting ? "Đang cập nhật..." : "Cập nhật phòng khám"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditRoomModal;

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Select, SelectItem, Textarea } from "@heroui/react";
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowValidation(true);

    // Check validation
    const hasErrors = !formData.name.trim() || !formData.description.trim();

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!room?.id) {
        throw new Error('Không tìm thấy ID phòng khám');
      }

      // Prepare data for API call
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status === 'active' ? 'Active' as const : 'Inactive' as const,
      };

      // Gọi API cập nhật
      const response = await managerApi.updateClinic(room.id, updateData);

      if (response.status) {
        // Handle assign/unassign doctor nếu có thay đổi
        const oldDoctorId = room.assignedDoctorId;
        const newDoctorId = formData.assignedDoctorId;

        if (oldDoctorId !== newDoctorId) {
          if (newDoctorId) {
            // Assign doctor
            await managerApi.assignDoctor(room.id, newDoctorId);
          } else if (oldDoctorId) {
            // Unassign doctor
            await managerApi.unassignDoctor(room.id);
          }
        }

        toast.success(response.message || "Cập nhật phòng khám thành công!");
        // Close modal and notify success
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || 'Không thể cập nhật phòng khám');
      }
    } catch (error: any) {
      console.error("Error updating clinic:", error);
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật phòng khám. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      status: "active",
      assignedDoctorId: "",
    });
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
              <h2 className="text-2xl font-bold">Chỉnh sửa phòng khám</h2>
              <p className="text-sm text-gray-600">
                {room.name}
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
          <Form autoComplete="off" className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Input
                fullWidth
                autoComplete="off"
                errorMessage={isNameInvalid ? "Vui lòng nhập tên phòng khám" : ""}
                isInvalid={isNameInvalid}
                label="Tên phòng khám *"
                placeholder="Ví dụ: Phòng khám tổng quát 1"
                type="text"
                value={formData.name}
                onValueChange={(value) => handleInputChange("name", value)}
                variant="bordered"
              />

              <Textarea
                fullWidth
                autoComplete="off"
                errorMessage={isDescriptionInvalid ? "Vui lòng nhập mô tả" : ""}
                isInvalid={isDescriptionInvalid}
                label="Mô tả phòng khám *"
                placeholder="Nhập mô tả chi tiết về phòng khám"
                value={formData.description}
                onValueChange={(value) => handleInputChange("description", value)}
                variant="bordered"
                minRows={4}
              />

              <Select
                fullWidth
                label="Phân công bác sĩ"
                placeholder="Chọn bác sĩ"
                selectedKeys={
                  formData.assignedDoctorId ? [formData.assignedDoctorId] : []
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("assignedDoctorId", selectedKey || "");
                }}
                variant="bordered"
                description="Chọn 'Không có bác sĩ' để gỡ bác sĩ hiện tại"
              >
                <SelectItem key="" value="">
                  <span className="text-gray-500 italic">Không có bác sĩ</span>
                </SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor._id} textValue={doctor.fullName}>
                    <div>
                      <div className="font-medium">{doctor.fullName}</div>
                      <div className="text-xs text-gray-500">{doctor.email}</div>
                    </div>
                  </SelectItem>
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
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật phòng khám"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditRoomModal;


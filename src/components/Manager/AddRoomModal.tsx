import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Textarea } from "@heroui/react";
import { managerApi } from "@/api";

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddRoomModal: React.FC<AddRoomModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        description: "",
      });
      setShowValidation(false);
    }
  }, [isOpen]);

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
      // Prepare data for API call (chỉ name và description theo backend)
      const createData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      // Gọi API tạo mới
      const response = await managerApi.createClinic(createData);

      if (response.status) {
        alert(response.message || "Thêm phòng khám mới thành công!");
        // Reset form
        handleClose();
        // Notify success
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || 'Không thể thêm phòng khám');
      }
    } catch (error: any) {
      console.error("Error creating clinic:", error);
      alert(error.message || "Có lỗi xảy ra khi tạo phòng khám. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
    });
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
            <h2 className="text-2xl font-bold">Thêm phòng mới</h2>
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
                {isSubmitting ? "Đang thêm..." : "Thêm phòng khám"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AddRoomModal;


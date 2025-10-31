import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form } from "@heroui/react";
import toast from "react-hot-toast";

import { deviceApi } from "@/api/device";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    purchaseDate: "",
    expireDate: "",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validation
  const isNameInvalid =
    showValidation && (!formData.name || formData.name.trim().length === 0);
  const isDescriptionInvalid =
    showValidation &&
    (!formData.description || formData.description.trim().length === 0);
  const isPurchaseDateInvalid = showValidation && !formData.purchaseDate;
  const isExpireDateInvalid = showValidation && !formData.expireDate;
  
  // Check if expire date is after purchase date
  const isDateRangeInvalid =
    showValidation &&
    formData.purchaseDate &&
    formData.expireDate &&
    new Date(formData.expireDate) <= new Date(formData.purchaseDate);

  const handleSubmit = async () => {
    setShowValidation(true);

    // Check if there are any errors
    const hasErrors =
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.purchaseDate ||
      !formData.expireDate ||
      (formData.purchaseDate &&
        formData.expireDate &&
        new Date(formData.expireDate) <= new Date(formData.purchaseDate));

    if (hasErrors) {
      if (
        formData.purchaseDate &&
        formData.expireDate &&
        new Date(formData.expireDate) <= new Date(formData.purchaseDate)
      ) {
        toast.error("Ngày hết hạn phải lớn hơn ngày mua thiết bị");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API call
      const createData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        purchaseDate: formData.purchaseDate,
        expireDate: formData.expireDate,
      };

      // Gọi API tạo thiết bị
      const response = await deviceApi.createDevice(createData);

      if (response.success) {
        toast.success(response.message || "Tạo thiết bị mới thành công!");
        // Reset form and close modal
        handleClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || "Không thể tạo thiết bị");
      }
    } catch (error: any) {
      toast.error(
        error.message || "Có lỗi xảy ra khi tạo thiết bị. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      purchaseDate: "",
      expireDate: "",
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
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#39BDCC]">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/logo1.png"
            />
            <div>
              <h2 className="text-2xl font-bold">Thêm thiết bị mới</h2>
              <p className="text-sm text-gray-600">
                Nhập thông tin thiết bị mới cho phòng khám
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
        <div className="px-4 py-4">
          <Form
            autoComplete="off"
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              <div className="md:col-span-2">
                <Input
                  fullWidth
                  autoComplete="off"
                  classNames={{
                    base: "w-full",
                    inputWrapper: "w-full",
                  }}
                  errorMessage={
                    isNameInvalid ? "Vui lòng nhập tên thiết bị" : ""
                  }
                  isInvalid={isNameInvalid}
                  label="Tên thiết bị *"
                  placeholder="Nhập tên thiết bị"
                  type="text"
                  value={formData.name}
                  variant="bordered"
                  onValueChange={(value) => handleInputChange("name", value)}
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  fullWidth
                  autoComplete="off"
                  classNames={{
                    base: "w-full",
                    inputWrapper: "w-full",
                  }}
                  errorMessage={
                    isDescriptionInvalid ? "Vui lòng nhập mô tả thiết bị" : ""
                  }
                  isInvalid={isDescriptionInvalid}
                  label="Mô tả thiết bị *"
                  placeholder="Nhập mô tả chi tiết về thiết bị"
                  value={formData.description}
                  variant="bordered"
                  onValueChange={(value) =>
                    handleInputChange("description", value)
                  }
                />
              </div>

              <Input
                fullWidth
                autoComplete="off"
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full",
                }}
                errorMessage={
                  isPurchaseDateInvalid ? "Vui lòng chọn ngày mua" : ""
                }
                isInvalid={isPurchaseDateInvalid}
                label="Ngày mua *"
                placeholder="Chọn ngày mua"
                type="date"
                value={formData.purchaseDate}
                variant="bordered"
                onValueChange={(value) =>
                  handleInputChange("purchaseDate", value)
                }
              />

              <Input
                fullWidth
                autoComplete="off"
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full",
                }}
                errorMessage={
                  isExpireDateInvalid
                    ? "Vui lòng chọn ngày hết hạn"
                    : isDateRangeInvalid
                    ? "Ngày hết hạn phải lớn hơn ngày mua"
                    : ""
                }
                isInvalid={isExpireDateInvalid || isDateRangeInvalid}
                label="Ngày hết hạn *"
                placeholder="Chọn ngày hết hạn"
                type="date"
                value={formData.expireDate}
                variant="bordered"
                onValueChange={(value) =>
                  handleInputChange("expireDate", value)
                }
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
            {isSubmitting ? "Đang tạo..." : "Tạo thiết bị"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddDeviceModal;


import React, { useState } from "react";
import { Input, Button, Form, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import toast from "react-hot-toast";

import { deviceApi } from "@/api/device";
import VietnameseDateInput from "@/components/Common/VietnameseDateInput";

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
    Boolean(showValidation && (!formData.name || formData.name.trim().length === 0));
  const isDescriptionInvalid =
    Boolean(
      showValidation &&
        (!formData.description || formData.description.trim().length === 0),
    );
  const isPurchaseDateInvalid = Boolean(showValidation && !formData.purchaseDate);
  const isExpireDateInvalid = Boolean(showValidation && !formData.expireDate);
  
  // Check if expire date is after purchase date
  const isDateRangeInvalid = Boolean(
    showValidation &&
      formData.purchaseDate &&
      formData.expireDate &&
      new Date(formData.expireDate) <= new Date(formData.purchaseDate),
  );

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
    // Chỉ ẩn validation errors, KHÔNG clear form data
    setShowValidation(false);
    onClose();
  };

  if (!isOpen) return null;

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
          <ModalHeader className="flex items-center justify-between gap-4 border-b border-gray-200">
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
          </ModalHeader>

          <ModalBody className="px-4 py-4">
            <Form autoComplete="off" className="space-y-5">
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

                <VietnameseDateInput
                  id="add-device-purchase-date"
                  label={
                    <>
                      Ngày mua <span className="text-red-500">*</span>
                    </>
                  }
                  value={formData.purchaseDate}
                  placeholder="dd/mm/yyyy"
                  isInvalid={isPurchaseDateInvalid}
                  errorMessage={
                    isPurchaseDateInvalid ? "Vui lòng chọn ngày mua" : ""
                  }
                  onChange={(value) => handleInputChange("purchaseDate", value)}
                />

                <VietnameseDateInput
                  id="add-device-expire-date"
                  label={
                    <>
                      Ngày hết hạn <span className="text-red-500">*</span>
                    </>
                  }
                  value={formData.expireDate}
                  minDate={formData.purchaseDate || undefined}
                  placeholder="dd/mm/yyyy"
                  isInvalid={isExpireDateInvalid || isDateRangeInvalid}
                  errorMessage={
                    isExpireDateInvalid
                      ? "Vui lòng chọn ngày hết hạn"
                      : isDateRangeInvalid
                      ? "Ngày hết hạn phải lớn hơn ngày mua"
                      : ""
                  }
                  onChange={(value) => handleInputChange("expireDate", value)}
                />
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
              {isSubmitting ? "Đang tạo..." : "Tạo thiết bị"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default AddDeviceModal;


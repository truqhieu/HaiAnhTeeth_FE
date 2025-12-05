import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  Form,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
} from "@heroui/react";
import toast from "react-hot-toast";

import { deviceApi, Device } from "@/api/device";
import VietnameseDateInput from "@/components/Common/VietnameseDateInput";

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  onSuccess?: () => void;
}

const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  isOpen,
  onClose,
  device,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    purchaseDate: "",
    expireDate: "",
    status: "Active" as "Active" | "Inactive",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOriginallyExpired, setIsOriginallyExpired] = useState(false);

  const statusOptions = [
    { key: "Active", label: "Hoạt động" },
    { key: "Inactive", label: "Không hoạt động" },
  ];

  // Load device data when modal opens
  useEffect(() => {
    if (isOpen && device) {
      const expireDate = device.expireDate.split("T")[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expireDateObj = new Date(expireDate);
      const wasExpired = expireDateObj < today;
      
      setFormData({
        name: device.name,
        description: device.description,
        purchaseDate: device.purchaseDate.split("T")[0],
        expireDate: expireDate,
        status: device.status,
      });
      setIsOriginallyExpired(wasExpired);
      setShowValidation(false);
    }
  }, [isOpen, device]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Check if current expire date in form is valid (not expired)
  const isCurrentExpireDateValid = () => {
    if (!formData.expireDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expireDateObj = new Date(formData.expireDate);
    
    return expireDateObj >= today;
  };

  // Disable status field if device was originally expired AND current expire date is still not valid
  const isStatusDisabled = isOriginallyExpired && !isCurrentExpireDateValid();

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
      if (!device?._id) {
        throw new Error("Không tìm thấy ID thiết bị");
      }

      // Prepare data for API call
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        purchaseDate: formData.purchaseDate,
        expireDate: formData.expireDate,
        status: formData.status,
      };

      console.log("📤 Sending update data:", updateData);
      console.log("📤 Device ID:", device._id);

      // Gọi API cập nhật
      const response = await deviceApi.updateDevice(device._id, updateData);
      
      console.log("📥 Response from server:", response);

      if (response.success) {
        toast.success(response.message || "Cập nhật thiết bị thành công!");
        // Close modal and notify success
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || "Không thể cập nhật thiết bị");
      }
    } catch (error: any) {
      console.error("❌ Error updating device:", error);
      toast.error(
        error.message ||
          "Có lỗi xảy ra khi cập nhật thiết bị. Vui lòng thử lại.",
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

  if (!isOpen || !device) return null;

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
                <h2 className="text-2xl font-bold">Chỉnh sửa thiết bị</h2>
                <p className="text-sm text-gray-600">
                  {device.name} - ID: {device._id}
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
                  id="edit-device-purchase-date"
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
                  id="edit-device-expire-date"
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

                <Tooltip
                  isDisabled={!isStatusDisabled}
                  content="Không thể thay đổi trạng thái thiết bị đã hết hạn. Vui lòng cập nhật ngày hết hạn hợp lệ trước."
                  placement="bottom"
                  className="max-w-xs"
                >
                  <div className="w-full">
                    <Select
                      fullWidth
                      classNames={{
                        base: "w-full",
                        trigger: "w-full",
                      }}
                      isDisabled={isStatusDisabled}
                      label="Trạng thái *"
                      placeholder="Chọn trạng thái"
                      selectedKeys={formData.status ? [formData.status] : []}
                      variant="bordered"
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as "Active" | "Inactive";
                        handleInputChange("status", selectedKey);
                      }}
                    >
                      {statusOptions.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </Tooltip>
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
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật thiết bị"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default EditDeviceModal;


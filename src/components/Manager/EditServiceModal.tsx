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

import { managerApi } from "@/api";
import { Service } from "@/types";

interface EditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onSuccess?: () => void;
}

const EditServiceModal: React.FC<EditServiceModalProps> = ({
  isOpen,
  onClose,
  service,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "",
    status: "active",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category mapping - giống ServiceManagement
  const categoryOptions = [
    { key: "Khám", label: "Khám" },
    { key: "Tư vấn", label: "Tư vấn" },
  ];

  // Reverse mapping để gửi lên backend
  const categoryReverseMap: { [key: string]: string } = {
    Khám: "Examination",
    "Tư vấn": "Consultation",
  };

  const statusOptions = [
    { key: "active", label: "Hoạt động" },
    { key: "inactive", label: "Không hoạt động" },
  ];

  // Load service data when modal opens
  useEffect(() => {
    if (isOpen && service) {
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price.toString(),
        duration: service.duration.toString(),
        category: service.category,
        status: service.status,
      });
      setShowValidation(false);
    }
  }, [isOpen, service]);

  // Validation states
  const isNameInvalid = showValidation && !formData.name.trim();
  const isDescriptionInvalid = showValidation && !formData.description.trim();
  const isPriceInvalid =
    showValidation &&
    (!formData.price ||
      isNaN(Number(formData.price)) ||
      Number(formData.price) <= 0);
  const isDurationInvalid =
    showValidation &&
    (!formData.duration ||
      isNaN(Number(formData.duration)) ||
      Number(formData.duration) <= 0);
  const isCategoryInvalid = showValidation && !formData.category;

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
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.price ||
      isNaN(Number(formData.price)) ||
      Number(formData.price) <= 0 ||
      !formData.duration ||
      isNaN(Number(formData.duration)) ||
      Number(formData.duration) <= 0 ||
      !formData.category;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!service?.id) {
        throw new Error("Không tìm thấy ID dịch vụ");
      }

      // Prepare data for API call
      const updateData = {
        serviceName: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        durationMinutes: Number(formData.duration),
        category: categoryReverseMap[formData.category] as
          | "Examination"
          | "Consultation",
        status: formData.status === "active" ? "Active" : "Inactive",
      };

      // Gọi API cập nhật
      const response = await managerApi.updateService(service.id, updateData);

      if (response.success || response.data) {
        toast.success(response.message || "Cập nhật dịch vụ thành công!");
        // Close modal and notify success
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || "Không thể cập nhật dịch vụ");
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          "Có lỗi xảy ra khi cập nhật dịch vụ. Vui lòng thử lại.",
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

  if (!isOpen || !service) return null;

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
              <h2 className="text-2xl font-bold">Chỉnh sửa dịch vụ</h2>
              <p className="text-sm text-gray-600">
                {service.name} - ID: {service.id}
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
        <div className="px-4 py-4 pb-0">
          <Form
            autoComplete="off"
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              <div className="md:col-span-2">
                <Input
                  fullWidth
                  classNames={{
                    base: "w-full",
                    inputWrapper: "w-full"
                  }}
                  autoComplete="off"
                  errorMessage={
                    isNameInvalid ? "Vui lòng nhập tên dịch vụ" : ""
                  }
                  isInvalid={isNameInvalid}
                  label="Tên dịch vụ *"
                  placeholder="Nhập tên dịch vụ"
                  type="text"
                  value={formData.name}
                  variant="bordered"
                  onValueChange={(value) => handleInputChange("name", value)}
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  fullWidth
                  classNames={{
                    base: "w-full",
                    inputWrapper: "w-full"
                  }}
                  autoComplete="off"
                  errorMessage={
                    isDescriptionInvalid ? "Vui lòng nhập mô tả dịch vụ" : ""
                  }
                  isInvalid={isDescriptionInvalid}
                  label="Mô tả dịch vụ *"
                  minRows={3}
                  placeholder="Nhập mô tả chi tiết về dịch vụ"
                  value={formData.description}
                  variant="bordered"
                  onValueChange={(value) =>
                    handleInputChange("description", value)
                  }
                />
              </div>

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                errorMessage={
                  isPriceInvalid ? "Vui lòng nhập giá hợp lệ (lớn hơn 0)" : ""
                }
                isInvalid={isPriceInvalid}
                label="Giá dịch vụ (VND) *"
                placeholder="Nhập giá dịch vụ"
                startContent={<span className="text-gray-500 text-sm">₫</span>}
                type="number"
                value={formData.price}
                variant="bordered"
                onValueChange={(value) => handleInputChange("price", value)}
              />

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                endContent={<span className="text-gray-500 text-sm">phút</span>}
                errorMessage={
                  isDurationInvalid
                    ? "Vui lòng nhập thời gian hợp lệ (lớn hơn 0)"
                    : ""
                }
                isInvalid={isDurationInvalid}
                label="Thời gian (phút) *"
                placeholder="Nhập thời gian thực hiện"
                type="number"
                value={formData.duration}
                variant="bordered"
                onValueChange={(value) => handleInputChange("duration", value)}
              />

              <Select
                fullWidth
                classNames={{
                  base: "w-full",
                  trigger: "w-full"
                }}
                errorMessage={isCategoryInvalid ? "Vui lòng chọn danh mục" : ""}
                isInvalid={isCategoryInvalid}
                label="Danh mục *"
                placeholder="Chọn danh mục"
                selectedKeys={formData.category ? [formData.category] : []}
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleInputChange("category", selectedKey);
                }}
              >
                {categoryOptions.map((option) => (
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
            {isSubmitting ? "Đang cập nhật..." : "Cập nhật dịch vụ"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditServiceModal;

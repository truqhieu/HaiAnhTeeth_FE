import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Select, SelectItem, Textarea } from "@heroui/react";
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
    'Khám': 'Examination',
    'Tư vấn': 'Consultation'
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
  const isPriceInvalid = showValidation && (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0);
  const isDurationInvalid = showValidation && (!formData.duration || isNaN(Number(formData.duration)) || Number(formData.duration) <= 0);
  const isCategoryInvalid = showValidation && !formData.category;

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
        throw new Error('Không tìm thấy ID dịch vụ');
      }

      // Prepare data for API call
      const updateData = {
        serviceName: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        durationMinutes: Number(formData.duration),
        category: categoryReverseMap[formData.category] as 'Examination' | 'Consultation',
      };

      // Gọi API cập nhật
      const response = await managerApi.updateService(service.id, updateData);

      if (response.status) {
        toast.success(response.message || "Cập nhật dịch vụ thành công!");
        // Close modal and notify success
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || 'Không thể cập nhật dịch vụ');
      }
    } catch (error: any) {
      console.error("Error updating service:", error);
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật dịch vụ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "",
      category: "",
      status: "active",
    });
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
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39BDCC]">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/Screenshot_2025-09-19_141436-removebg-preview.png"
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
        <div className="p-6">
          <Form autoComplete="off" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  fullWidth
                  autoComplete="off"
                  errorMessage={isNameInvalid ? "Vui lòng nhập tên dịch vụ" : ""}
                  isInvalid={isNameInvalid}
                  label="Tên dịch vụ *"
                  placeholder="Nhập tên dịch vụ"
                  type="text"
                  value={formData.name}
                  onValueChange={(value) => handleInputChange("name", value)}
                  variant="bordered"
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  fullWidth
                  autoComplete="off"
                  errorMessage={isDescriptionInvalid ? "Vui lòng nhập mô tả dịch vụ" : ""}
                  isInvalid={isDescriptionInvalid}
                  label="Mô tả dịch vụ *"
                  placeholder="Nhập mô tả chi tiết về dịch vụ"
                  value={formData.description}
                  onValueChange={(value) => handleInputChange("description", value)}
                  variant="bordered"
                  minRows={3}
                />
              </div>

              <Input
                fullWidth
                autoComplete="off"
                errorMessage={isPriceInvalid ? "Vui lòng nhập giá hợp lệ (lớn hơn 0)" : ""}
                isInvalid={isPriceInvalid}
                label="Giá dịch vụ (VND) *"
                placeholder="Nhập giá dịch vụ"
                type="number"
                value={formData.price}
                onValueChange={(value) => handleInputChange("price", value)}
                variant="bordered"
                startContent={
                  <span className="text-gray-500 text-sm">₫</span>
                }
              />

              <Input
                fullWidth
                autoComplete="off"
                errorMessage={isDurationInvalid ? "Vui lòng nhập thời gian hợp lệ (lớn hơn 0)" : ""}
                isInvalid={isDurationInvalid}
                label="Thời gian (phút) *"
                placeholder="Nhập thời gian thực hiện"
                type="number"
                value={formData.duration}
                onValueChange={(value) => handleInputChange("duration", value)}
                variant="bordered"
                endContent={
                  <span className="text-gray-500 text-sm">phút</span>
                }
              />

              <Select
                fullWidth
                errorMessage={isCategoryInvalid ? "Vui lòng chọn danh mục" : ""}
                isInvalid={isCategoryInvalid}
                label="Danh mục *"
                placeholder="Chọn danh mục"
                selectedKeys={formData.category ? [formData.category] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("category", selectedKey);
                }}
                variant="bordered"
              >
                {categoryOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
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
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật dịch vụ"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditServiceModal;

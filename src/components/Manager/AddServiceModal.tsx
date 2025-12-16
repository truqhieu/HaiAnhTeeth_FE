import React, { useState } from "react";
import {
  Input,
  Button,
  Form,
  Select,
  SelectItem,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import toast from "react-hot-toast";

import { managerApi } from "@/api";

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "",
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

  // Validation states
  const isNameInvalid = showValidation && !formData.name.trim();
  const isDescriptionInvalid = showValidation && !formData.description.trim();
  const isPriceInvalid =
    showValidation &&
    (!formData.price ||
      isNaN(Number(formData.price)));
  const isDurationInvalid =
    showValidation &&
    (!formData.duration ||
      isNaN(Number(formData.duration)) ||
      Number(formData.duration) <= 0);
  const isCategoryInvalid = showValidation && !formData.category;

  // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
  const normalizeText = (text: string): string => {
    return text.trim().replace(/\s+/g, ' ');
  };

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
      !formData.duration ||
      isNaN(Number(formData.duration)) ||
      Number(formData.duration) <= 0 ||
      !formData.category;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API call
      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const createData = {
        serviceName: normalizeText(formData.name),
        description: normalizeText(formData.description),
        price: Number(formData.price),
        durationMinutes: Number(formData.duration),
        category: categoryReverseMap[formData.category] as
          | "Examination"
          | "Consultation",
      };

      // Gọi API tạo mới
      const response = await managerApi.createService(createData);

      if (response.success || response.data) {
        toast.success(response.message || "Thêm dịch vụ mới thành công!");
        // Reset form
        handleClose();
        // Notify success
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || "Không thể thêm dịch vụ");
      }
    } catch (error: any) {
      toast.error(
        error.message || "Có lỗi xảy ra khi thêm dịch vụ. Vui lòng thử lại.",
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
          <ModalHeader className="flex items-center gap-3 border-b border-gray-200">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/logo1.png"
            />
            <div>
              <h2 className="text-2xl font-bold">Thêm dịch vụ mới</h2>
              <p className="text-sm text-gray-600">
                Nhập thông tin dịch vụ nha khoa
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="px-4 py-4 pb-0">
            <Form autoComplete="off" className="space-y-5" onSubmit={handleFormSubmit}>
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
                  label={
                    <>
                      Tên dịch vụ <span className="text-red-500">*</span>
                    </>
                  }
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
                  label={
                    <>
                      Mô tả dịch vụ <span className="text-red-500">*</span>
                    </>
                  }
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
                  isPriceInvalid ? "Vui lòng nhập giá hợp lệ" : ""
                }
                isInvalid={isPriceInvalid}
                label={
                  <>
                    Giá dịch vụ (VND) <span className="text-red-500">*</span>
                  </>
                }
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
                label={
                  <>
                    Thời gian (phút) <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Nhập thời gian thực hiện"
                type="number"
                value={formData.duration}
                variant="bordered"
                onValueChange={(value) => handleInputChange("duration", value)}
              />

              <div className="md:col-span-2">
                <Select
                  fullWidth
                  classNames={{
                    base: "w-full",
                    trigger: "w-full"
                  }}
                  errorMessage={
                    isCategoryInvalid ? "Vui lòng chọn danh mục" : ""
                  }
                  isInvalid={isCategoryInvalid}
                  label={
                    <>
                      Danh mục <span className="text-red-500">*</span>
                    </>
                  }
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
              </div>
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
              {isSubmitting ? "Đang thêm..." : "Thêm dịch vụ"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default AddServiceModal;

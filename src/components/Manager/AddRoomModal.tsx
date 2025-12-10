import React, { useState, useEffect } from "react";
import { Input, Button, Form, Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import toast from "react-hot-toast";

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
    const hasErrors = !formData.name.trim() || !formData.description.trim();

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API call (chỉ name và description theo backend)
      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const createData = {
        name: normalizeText(formData.name),
        description: normalizeText(formData.description),
      };

      // Gọi API tạo mới
      const response = await managerApi.createClinic(createData);

      if ((response as any).success) {
        toast.success(response.message || "Thêm phòng khám mới thành công!");
        // Reset form
        handleClose();
        // Notify success
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.message || "Không thể thêm phòng khám");
      }
    } catch (error: any) {
      toast.error(
        error.message || "Có lỗi xảy ra khi tạo phòng khám. Vui lòng thử lại.",
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
      size="md"
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
            <h2 className="text-2xl font-bold">Thêm phòng mới</h2>
          </ModalHeader>

          <ModalBody className="px-4 py-4 pb-0">
            <Form autoComplete="off" className="space-y-5" onSubmit={handleFormSubmit}>
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
            </div>
            </Form>
          </ModalBody>

          <ModalFooter className="px-4 py-4 border-t border-gray-200 bg-gray-50">
            <Button isDisabled={isSubmitting} variant="bordered" onPress={handleClose}>
              Hủy
            </Button>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              variant="solid"
              onPress={handleSubmit}
            >
              {isSubmitting ? "Đang thêm..." : "Thêm phòng khám"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default AddRoomModal;

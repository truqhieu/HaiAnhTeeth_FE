import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalBody, ModalFooter } from "@heroui/react";
import { Input, Button, Textarea, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";

import { promotionApi, type Promotion } from "@/api/promotion";

interface EditPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotion: Promotion | null;
  onSuccess?: () => void;
}

const EditPromotionModal: React.FC<EditPromotionModalProps> = ({
  isOpen,
  onClose,
  promotion,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discountType: "Percent" as "Percent" | "Fixed",
    discountValue: 0,
    applyToAll: true,
    startDate: "",
    endDate: "",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title,
        description: promotion.description,
        discountType: promotion.discountType === "Fix" ? "Fixed" : "Percent",
        discountValue: promotion.discountValue,
        applyToAll: promotion.applyToAll,
        startDate: promotion.startDate.split("T")[0],
        endDate: promotion.endDate.split("T")[0],
      });
    }
  }, [promotion]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validation
  const isTitleInvalid =
    showValidation && (!formData.title || formData.title.trim().length === 0);
  const isDescriptionInvalid =
    showValidation &&
    (!formData.description || formData.description.trim().length === 0);
  const isDiscountValueInvalid = showValidation && formData.discountValue <= 0;
  const isPercentInvalid =
    showValidation &&
    formData.discountType === "Percent" &&
    formData.discountValue > 100;
  const isStartDateInvalid = showValidation && !formData.startDate;
  const isEndDateInvalid = showValidation && !formData.endDate;

  // Check if end date is after start date
  const isDateRangeInvalid =
    showValidation &&
    formData.startDate &&
    formData.endDate &&
    new Date(formData.endDate) <= new Date(formData.startDate);

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!promotion) return;

    setShowValidation(true);

    // Check if there are any errors
    const hasErrors =
      !formData.title.trim() ||
      !formData.description.trim() ||
      formData.discountValue <= 0 ||
      (formData.discountType === "Percent" && formData.discountValue > 100) ||
      !formData.startDate ||
      !formData.endDate ||
      (formData.startDate &&
        formData.endDate &&
        new Date(formData.endDate) <= new Date(formData.startDate));

    if (hasErrors) {
      if (
        formData.startDate &&
        formData.endDate &&
        new Date(formData.endDate) <= new Date(formData.startDate)
      ) {
        toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert date to ISO format and discountType
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        discountType: formData.discountType === "Fixed" ? "Fix" : "Percent",
        discountValue: formData.discountValue,
        applyToAll: formData.applyToAll,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      const response = await promotionApi.updatePromotion(
        promotion._id,
        updateData as any,
      );

      if (response.success) {
        toast.success("Cập nhật ưu đãi thành công");
        onSuccess?.();
        handleClose();
      } else {
        toast.error(response.message || "Đã xảy ra lỗi khi cập nhật ưu đãi");
      }
    } catch (error: any) {
      console.error("❌ Error updating promotion:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi cập nhật ưu đãi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setShowValidation(false);
    onClose();
  };

  return (
    <Modal
      size="2xl"
      isOpen={isOpen}
      onClose={handleClose}
      isDismissable={!isSubmitting}
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalBody className="p-6">
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="title"
              >
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <Input
                fullWidth
                id="title"
                placeholder="Ví dụ: Ưu đãi Quốc Khánh 2/9"
                value={formData.title}
                variant="bordered"
                isInvalid={isTitleInvalid}
                errorMessage={
                  isTitleInvalid ? "Vui lòng nhập tiêu đề ưu đãi" : ""
                }
                onValueChange={(value) => handleInputChange("title", value)}
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="description"
              >
                Mô tả <span className="text-red-500">*</span>
              </label>
              <Textarea
                fullWidth
                id="description"
                minRows={3}
                placeholder="Mô tả chi tiết về chương trình ưu đãi..."
                value={formData.description}
                variant="bordered"
                isInvalid={isDescriptionInvalid}
                errorMessage={
                  isDescriptionInvalid ? "Vui lòng nhập mô tả" : ""
                }
                onValueChange={(value) => handleInputChange("description", value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="discountType"
                >
                  Loại giảm giá <span className="text-red-500">*</span>
                </label>
                <Select
                  className="w-full"
                  id="discountType"
                  selectedKeys={[formData.discountType]}
                  variant="bordered"
                  disallowEmptySelection
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as "Percent" | "Fixed";
                    handleInputChange("discountType", selected);
                  }}
                >
                  <SelectItem key="Percent">Phần trăm (%)</SelectItem>
                  <SelectItem key="Fixed">Số tiền cố định (đ)</SelectItem>
                </Select>
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="discountValue"
                >
                  Giá trị <span className="text-red-500">*</span>
                </label>
                <Input
                  fullWidth
                  id="discountValue"
                  min="0"
                  placeholder={
                    formData.discountType === "Percent" ? "0-100" : "Số tiền"
                  }
                  type="number"
                  value={formData.discountValue.toString()}
                  variant="bordered"
                  isInvalid={isDiscountValueInvalid || isPercentInvalid}
                  errorMessage={
                    isDiscountValueInvalid
                      ? "Giá trị giảm giá phải lớn hơn 0"
                      : isPercentInvalid
                      ? "Phần trăm giảm giá không được vượt quá 100%"
                      : ""
                  }
                  onValueChange={(value) =>
                    handleInputChange("discountValue", Number(value))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="startDate"
                >
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <Input
                  fullWidth
                  id="startDate"
                  min={today}
                  type="date"
                  value={formData.startDate}
                  variant="bordered"
                  isInvalid={isStartDateInvalid}
                  errorMessage={
                    isStartDateInvalid ? "Vui lòng chọn ngày bắt đầu" : ""
                  }
                  onValueChange={(value) => handleInputChange("startDate", value)}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="endDate"
                >
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <Input
                  fullWidth
                  id="endDate"
                  min={formData.startDate || today}
                  type="date"
                  value={formData.endDate}
                  variant="bordered"
                  isInvalid={isEndDateInvalid || isDateRangeInvalid}
                  errorMessage={
                    isEndDateInvalid
                      ? "Vui lòng chọn ngày kết thúc"
                      : isDateRangeInvalid
                      ? "Ngày kết thúc phải sau ngày bắt đầu"
                      : ""
                  }
                  onValueChange={(value) => handleInputChange("endDate", value)}
                />
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Hiện tại chỉ hỗ trợ ưu đãi áp dụng cho
                tất cả dịch vụ. Tính năng chọn dịch vụ cụ thể sẽ được bổ sung sau.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <div className="flex justify-end gap-4 w-full">
            <Button
              variant="bordered"
              onPress={handleClose}
              isDisabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              isLoading={isSubmitting}
              onPress={handleSubmit}
            >
              Cập nhật
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditPromotionModal;


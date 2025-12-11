import React, { useState, useEffect } from "react";
import { Input, Button, Textarea, Select, SelectItem, Checkbox, CheckboxGroup, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import toast from "react-hot-toast";

import { promotionApi, type Promotion } from "@/api/promotion";
import { serviceApi, type Service } from "@/api/service";
import VietnameseDateInput from "@/components/Common/VietnameseDateInput";

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
    applicableServices: [] as string[],
    startDate: "",
    endDate: "",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Category mapping
  const categoryMap: { [key: string]: string } = {
    Examination: "Khám",
    Consultation: "Tư vấn",
  };

  // Fetch services when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  useEffect(() => {
    if (promotion) {
      // 🔧 Convert applicableServices to array of IDs if it's array of objects
      let serviceIds: string[] = [];
      if (promotion.applicableServices && Array.isArray(promotion.applicableServices)) {
        serviceIds = promotion.applicableServices.map((item: any) => {
          // If item is object with _id, extract _id
          if (typeof item === 'object' && item._id) {
            return item._id;
          }
          // If item is already a string ID, use it
          return item;
        });
      }
      
      setFormData({
        title: promotion.title,
        description: promotion.description,
        discountType: promotion.discountType === "Fix" ? "Fixed" : "Percent",
        discountValue: promotion.discountValue,
        applyToAll: promotion.applyToAll,
        applicableServices: serviceIds, // ✅ Now always array of string IDs
        startDate: promotion.startDate.split("T")[0],
        endDate: promotion.endDate.split("T")[0],
      });
    }
  }, [promotion]);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const response = await serviceApi.get({ limit: 1000, status: "Active" });
      if (response.success && response.data) {
        setServices(response.data);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Không thể tải danh sách dịch vụ");
    } finally {
      setLoadingServices(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validation
  const isTitleInvalid =
    Boolean(showValidation && (!formData.title || formData.title.trim().length === 0));
  const isDescriptionInvalid =
    Boolean(
      showValidation &&
        (!formData.description || formData.description.trim().length === 0),
    );
  const isDiscountValueInvalid = Boolean(showValidation && formData.discountValue <= 0);
  const isPercentInvalid =
    Boolean(
      showValidation &&
        formData.discountType === "Percent" &&
        formData.discountValue > 100,
    );
  const isStartDateInvalid = Boolean(showValidation && !formData.startDate);
  const isEndDateInvalid = Boolean(showValidation && !formData.endDate);
  const isServicesInvalid = Boolean(
    showValidation && !formData.applyToAll && formData.applicableServices.length === 0,
  );

  // Check if end date is before start date (same-day is allowed)
  const isDateRangeInvalid = Boolean(
    showValidation &&
      formData.startDate &&
      formData.endDate &&
      new Date(formData.endDate) < new Date(formData.startDate),
  );

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
        new Date(formData.endDate) < new Date(formData.startDate)) ||
      (!formData.applyToAll && formData.applicableServices.length === 0);

    if (hasErrors) {
      if (
        formData.startDate &&
        formData.endDate &&
        new Date(formData.endDate) < new Date(formData.startDate)
      ) {
        toast.error("Ngày kết thúc không được trước ngày bắt đầu");
      } else if (!formData.applyToAll && formData.applicableServices.length === 0) {
        toast.error("Vui lòng chọn ít nhất một dịch vụ");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const normalizeText = (text: string): string => {
        return text.trim().replace(/\s+/g, ' ');
      };

      // Convert date to YYYY-MM-DD format (backend expects this format)
      // VietnameseDateInput already returns YYYY-MM-DD format, so we can use it directly
      const updateData: any = {
        title: normalizeText(formData.title),
        description: normalizeText(formData.description),
        discountType: formData.discountType === "Fixed" ? "Fix" : "Percent",
        discountValue: formData.discountValue,
        applyToAll: formData.applyToAll,
        startDate: formData.startDate, // Already in YYYY-MM-DD format from VietnameseDateInput
        endDate: formData.endDate,     // Already in YYYY-MM-DD format from VietnameseDateInput
      };

      // Only include serviceIds if not applying to all
      // Backend expects "serviceIds", not "applicableServices"
      if (!formData.applyToAll) {
        updateData.serviceIds = formData.applicableServices;
      }

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
      size="4xl"
      scrollBehavior="outside"
      classNames={{
        base: "max-h-[90vh] rounded-2xl",
      }}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <img
                alt="Logo"
                className="h-8 w-auto object-contain"
                src="/logo1.png"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa ưu đãi</h2>
                <p className="text-sm text-gray-600">Cập nhật thông tin chương trình ưu đãi</p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="px-6 py-4 space-y-4">
            <Input
              fullWidth
              id="title"
              label={
                <>
                  Tiêu đề <span className="text-red-500">*</span>
                </>
              }
              placeholder="Ví dụ: Ưu đãi Quốc Khánh 2/9"
              value={formData.title}
              variant="bordered"
              isInvalid={isTitleInvalid}
              errorMessage={
                isTitleInvalid ? "Vui lòng nhập tiêu đề ưu đãi" : ""
              }
              onValueChange={(value) => handleInputChange("title", value)}
            />

            <Textarea
              fullWidth
              id="description"
              label={
                <>
                  Mô tả <span className="text-red-500">*</span>
                </>
              }
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

            <div className="grid grid-cols-2 gap-4">
              <Select
                className="w-full"
                id="discountType"
                label={
                  <>
                    Loại giảm giá <span className="text-red-500">*</span>
                  </>
                }
                selectedKeys={[formData.discountType]}
                variant="bordered"
                disallowEmptySelection
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as "Percent" | "Fixed";
                  handleInputChange("discountType", selected);
                }}
                popoverProps={{
                  shouldCloseOnInteractOutside: (element) => {
                    return !element.closest('[role="listbox"]');
                  }
                }}
              >
                <SelectItem key="Percent">Phần trăm (%)</SelectItem>
                <SelectItem key="Fixed">Số tiền cố định (đ)</SelectItem>
              </Select>

              <Input
                fullWidth
                id="discountValue"
                label={
                  <>
                    Giá trị <span className="text-red-500">*</span>
                  </>
                }
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

            <div className="grid grid-cols-2 gap-4">
              <VietnameseDateInput
                id="startDate"
                label={
                  <>
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </>
                }
                value={formData.startDate}
                minDate={today}
                placeholder="dd/mm/yyyy"
                isInvalid={isStartDateInvalid}
                errorMessage={isStartDateInvalid ? "Vui lòng chọn ngày bắt đầu" : ""}
                onChange={(value) => handleInputChange("startDate", value)}
              />

              <VietnameseDateInput
                id="endDate"
                label={
                  <>
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </>
                }
                value={formData.endDate}
                minDate={formData.startDate || today}
                placeholder="dd/mm/yyyy"
                isInvalid={isEndDateInvalid || isDateRangeInvalid}
                errorMessage={
                  isEndDateInvalid
                    ? "Vui lòng chọn ngày kết thúc"
                    : isDateRangeInvalid
                    ? "Ngày kết thúc không được trước ngày bắt đầu"
                    : ""
                }
                onChange={(value) => handleInputChange("endDate", value)}
              />
            </div>

            <div>
              <p className="block text-sm font-semibold text-gray-700 mb-3">
                Phạm vi áp dụng <span className="text-red-500">*</span>
              </p>
              <div className="space-y-3">
                <Checkbox
                  isSelected={formData.applyToAll}
                  onValueChange={(checked) => {
                    handleInputChange("applyToAll", checked);
                    if (checked) {
                      handleInputChange("applicableServices", []);
                    }
                  }}
                >
                  <span className="text-sm font-medium">Áp dụng cho tất cả dịch vụ</span>
                </Checkbox>

                {!formData.applyToAll && (
                  <div className="ml-6 mt-3">
                    {loadingServices ? (
                      <div className="flex items-center gap-2 py-4">
                        <Spinner size="sm" />
                        <span className="text-sm text-gray-600">Đang tải danh sách dịch vụ...</span>
                      </div>
                    ) : (
                      <div className={`border rounded-lg p-4 max-h-60 overflow-y-auto ${isServicesInvalid ? 'border-red-500' : 'border-gray-300'}`}>
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Chọn dịch vụ áp dụng: ({formData.applicableServices.length} đã chọn)
                        </p>
                        <CheckboxGroup
                          value={formData.applicableServices}
                          onValueChange={(value) => handleInputChange("applicableServices", value)}
                        >
                          {services.map((service) => (
                            <Checkbox key={service._id} value={service._id}>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{service.serviceName}</span>
                                <span className="text-xs text-gray-500">
                                  {service.price.toLocaleString()}đ - {categoryMap[service.category] || service.category}
                                </span>
                              </div>
                            </Checkbox>
                          ))}
                        </CheckboxGroup>
                        {isServicesInvalid && (
                          <p className="text-xs text-red-500 mt-2">
                            Vui lòng chọn ít nhất một dịch vụ
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
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
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default EditPromotionModal;


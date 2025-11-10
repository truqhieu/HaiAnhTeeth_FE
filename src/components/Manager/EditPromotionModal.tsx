import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Textarea, Select, SelectItem, Checkbox, CheckboxGroup, Spinner } from "@heroui/react";
import toast from "react-hot-toast";

import { promotionApi, type Promotion } from "@/api/promotion";
import { serviceApi, type Service } from "@/api/service";

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
  const isServicesInvalid = showValidation && !formData.applyToAll && formData.applicableServices.length === 0;

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
        new Date(formData.endDate) <= new Date(formData.startDate)) ||
      (!formData.applyToAll && formData.applicableServices.length === 0);

    if (hasErrors) {
      if (
        formData.startDate &&
        formData.endDate &&
        new Date(formData.endDate) <= new Date(formData.startDate)
      ) {
        toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      } else if (!formData.applyToAll && formData.applicableServices.length === 0) {
        toast.error("Vui lòng chọn ít nhất một dịch vụ");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert date to ISO format and discountType
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        discountType: formData.discountType === "Fixed" ? "Fix" : "Percent",
        discountValue: formData.discountValue,
        applyToAll: formData.applyToAll,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        aria-label="Close modal"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        onClick={!isSubmitting ? handleClose : undefined}
        onKeyDown={(e) => {
          if (!isSubmitting && (e.key === "Enter" || e.key === " ")) {
            handleClose();
          }
        }}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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
          <Button
            isIconOnly
            className="text-gray-500 hover:text-gray-700"
            variant="light"
            onPress={handleClose}
            isDisabled={isSubmitting}
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
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
                  popoverProps={{
                    shouldCloseOnInteractOutside: (element) => {
                      // Don't close modal when clicking on select dropdown
                      return !element.closest('[role="listbox"]');
                    }
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Phạm vi áp dụng <span className="text-red-500">*</span>
              </label>
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
                                  {service.price.toLocaleString()}đ - {service.category}
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-4">
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
        </div>
      </div>
    </div>
  );
};

export default EditPromotionModal;


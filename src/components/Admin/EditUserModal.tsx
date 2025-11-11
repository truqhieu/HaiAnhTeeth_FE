import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";

import { adminApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "active",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chỉ cho phép thay đổi role của bác sĩ và điều dưỡng
  const roleOptions = [
    { key: "Bác sĩ", label: "Bác sĩ" },
    { key: "Điều dưỡng", label: "Điều dưỡng" },
  ];

  const statusOptions = [
    { key: "active", label: "Hoạt động" },
    { key: "inactive", label: "Không hoạt động" },
  ];

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      });
      setShowValidation(false);
    }
  }, [isOpen, user]);

  // Validation functions
  const validateEmail = (value: string): boolean =>
    value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;

  // Kiểm tra xem có được phép thay đổi role không
  const canChangeRole = user
    ? user.role === "Bác sĩ" || user.role === "Điều dưỡng"
    : false;

  // Kiểm tra xem admin có đang chỉnh sửa chính mình không
  const isEditingSelf = currentUser && user && currentUser._id === user.id;
  const isCurrentUserAdmin = currentUser?.role === "Admin";

  // Validation states
  const isNameInvalid = showValidation && !formData.name;
  const isEmailInvalid =
    showValidation && (!formData.email || !validateEmail(formData.email));
  const isRoleInvalid = canChangeRole && showValidation && !formData.role;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    // Check validation - phone is optional now
    const hasErrors =
      !formData.name ||
      !formData.email ||
      !validateEmail(formData.email) ||
      (canChangeRole && !formData.role);

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user?.id) {
        toast.error("Không tìm thấy ID người dùng");

        return;
      }

      // Prepare data for API call - only include phone if it's not empty
      const updateData: any = {
        fullName: formData.name,
      };

      if (formData.phone && formData.phone.trim() !== "") {
        updateData.phoneNumber = formData.phone;
      }

      // Call API to update user info
      const response = await adminApi.updateAccount(user.id, updateData);

      // Backend returns 'status' instead of 'success'
      const isSuccess = response.success || (response.data as any)?.status;

      if (!isSuccess) {
        toast.error(response.message || "Có lỗi xảy ra khi cập nhật tài khoản");

        return;
      }

      // Handle status change separately if status changed
      let statusChangeSuccess = true;
      if (user.status !== formData.status) {
        // Ngăn admin tự disable chính mình
        if (
          isEditingSelf &&
          isCurrentUserAdmin &&
          formData.status === "inactive"
        ) {
          toast.error("Bạn không thể tự khóa tài khoản của chính mình");
          setIsSubmitting(false);
          return;
        }

        try {
          if (formData.status === "inactive") {
            // Lock account
            const lockResponse = await adminApi.lockAccount(user.id);
            if (lockResponse.success || (lockResponse as any).status) {
              // Success - toast sẽ hiện ở cuối
            } else {
              throw new Error(lockResponse.message || "Không thể khóa tài khoản");
            }
          } else {
            // Unlock account
            const unlockResponse = await adminApi.unlockAccount(user.id);
            if (unlockResponse.success || (unlockResponse as any).status) {
              // Success - toast sẽ hiện ở cuối
            } else {
              throw new Error(unlockResponse.message || "Không thể mở khóa tài khoản");
            }
          }
        } catch (statusError: any) {
          console.error("Error updating account status:", statusError);
          toast.error(
            statusError.message || "Có lỗi khi cập nhật trạng thái tài khoản",
          );
          statusChangeSuccess = false;
          // Không return, vẫn đóng modal vì basic info đã update
        }
      }

      // Hiển thị toast success duy nhất
      if (statusChangeSuccess) {
        toast.success("Cập nhật tài khoản thành công!");
      }

      // Close modal and notify success để refresh data
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      toast.error(
        error.message ||
          "Có lỗi xảy ra khi cập nhật tài khoản. Vui lòng thử lại.",
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

  if (!isOpen || !user) return null;

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
      <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/logo1.png"
            />
            <div>
              <h2 className="text-2xl font-bold">Chỉnh sửa tài khoản</h2>
              <p className="text-sm text-gray-600">
                {user?.name} - {user?.role}
                {!canChangeRole && (
                  <span className="ml-2 text-orange-600">
                    (Không thể thay đổi role)
                  </span>
                )}
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
              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                errorMessage={isNameInvalid ? "Vui lòng nhập họ và tên" : ""}
                isInvalid={isNameInvalid}
                label={
                  <>
                    Họ và tên <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Nhập họ và tên"
                type="text"
                value={formData.name}
                variant="bordered"
                onValueChange={(value) => handleInputChange("name", value)}
              />

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                errorMessage={
                  isEmailInvalid
                    ? formData.email === ""
                      ? "Vui lòng nhập email"
                      : "Vui lòng nhập email hợp lệ"
                    : ""
                }
                isInvalid={isEmailInvalid}
                label={
                  <>
                    Email <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Nhập email"
                type="email"
                value={formData.email}
                variant="bordered"
                onValueChange={(value) => handleInputChange("email", value)}
              />

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                label="Số điện thoại"
                placeholder="Nhập số điện thoại"
                type="tel"
                value={formData.phone}
                variant="bordered"
                onValueChange={(value) => handleInputChange("phone", value)}
              />

              {canChangeRole ? (
              <Select
                fullWidth
                classNames={{
                  base: "w-full",
                  trigger: "w-full"
                }}
                errorMessage={isRoleInvalid ? "Vui lòng chọn vai trò" : ""}
                  isInvalid={isRoleInvalid}
                  label={
                    <>
                      Vai trò <span className="text-red-500">*</span>
                    </>
                  }
                  placeholder="Chọn vai trò"
                  selectedKeys={formData.role ? [formData.role] : []}
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    handleInputChange("role", selectedKey);
                  }}
                >
                  {roleOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>
              ) : (
                <Input
                  fullWidth
                  isReadOnly
                  label="Vai trò"
                  value={formData.role}
                  variant="bordered"
                />
              )}

              <Select
                fullWidth
                isDisabled={(isEditingSelf && isCurrentUserAdmin) || false}
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
            {isSubmitting ? "Đang cập nhật..." : "Cập nhật tài khoản"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Select, SelectItem } from "@heroui/react";

interface User {
  id: number;
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
  const canChangeRole = user ? (user.role === "Bác sĩ" || user.role === "Điều dưỡng") : false;

  // Validation states
  const isNameInvalid = showValidation && !formData.name;
  const isEmailInvalid =
    showValidation && (!formData.email || !validateEmail(formData.email));
  const isPhoneInvalid = showValidation && !formData.phone;
  const isRoleInvalid = canChangeRole && showValidation && !formData.role;

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
      !formData.name ||
      !formData.email ||
      !validateEmail(formData.email) ||
      !formData.phone ||
      (canChangeRole && !formData.role);

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API call
      const updateData = {
        id: user?.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
      };

      // TODO: Gửi request lên backend để cập nhật user
      // const response = await fetch(`/api/users/${user?.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updateData),
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Không thể cập nhật tài khoản');
      // }

      // Giả lập API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Updating user:", updateData);

      // Close modal and notify success
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Có lỗi xảy ra khi cập nhật tài khoản. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      status: "active",
    });
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
        <div className="p-6">
          <Form autoComplete="off" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                fullWidth
                autoComplete="off"
                errorMessage={isNameInvalid ? "Vui lòng nhập họ và tên" : ""}
                isInvalid={isNameInvalid}
                label="Họ và tên *"
                placeholder="Nhập họ và tên"
                type="text"
                value={formData.name}
                onValueChange={(value) => handleInputChange("name", value)}
                variant="bordered"
              />

              <Input
                fullWidth
                autoComplete="off"
                errorMessage={
                  isEmailInvalid
                    ? formData.email === ""
                      ? "Vui lòng nhập email"
                      : "Vui lòng nhập email hợp lệ"
                    : ""
                }
                isInvalid={isEmailInvalid}
                label="Email *"
                placeholder="Nhập email"
                type="email"
                value={formData.email}
                onValueChange={(value) => handleInputChange("email", value)}
                variant="bordered"
              />

              <Input
                fullWidth
                autoComplete="off"
                errorMessage={isPhoneInvalid ? "Vui lòng nhập số điện thoại" : ""}
                isInvalid={isPhoneInvalid}
                label="Số điện thoại *"
                placeholder="Nhập số điện thoại"
                type="tel"
                value={formData.phone}
                onValueChange={(value) => handleInputChange("phone", value)}
                variant="bordered"
              />

              {canChangeRole ? (
                <Select
                  fullWidth
                  errorMessage={isRoleInvalid ? "Vui lòng chọn vai trò" : ""}
                  isInvalid={isRoleInvalid}
                  label="Vai trò *"
                  placeholder="Chọn vai trò"
                  selectedKeys={formData.role ? [formData.role] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleInputChange("role", selectedKey);
                  }}
                  variant="bordered"
                >
                  {roleOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>
              ) : (
                <Input
                  fullWidth
                  label="Vai trò"
                  value={formData.role}
                  variant="bordered"
                  isReadOnly
                />
              )}

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
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật tài khoản"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;

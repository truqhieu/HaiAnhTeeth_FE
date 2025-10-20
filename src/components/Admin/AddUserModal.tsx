import React, { useState } from "react";
import { XMarkIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Select, SelectItem } from "@heroui/react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    confirmPassword: "",
    status: "active",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = [
    { key: "Bác sĩ", label: "Bác sĩ" },
    { key: "Điều dưỡng", label: "Điều dưỡng" },
    { key: "Lễ Tân", label: "Lễ Tân" },
    { key: "Bệnh nhân", label: "Bệnh nhân" },
    { key: "Manager", label: "Manager" },
  ];

  const statusOptions = [
    { key: "active", label: "Hoạt động" },
    { key: "inactive", label: "Không hoạt động" },
  ];

  // Validation functions
  const validateEmail = (value: string): boolean =>
    value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;

  const getPasswordErrors = (): string[] => {
    const errors: string[] = [];
    const { password } = formData;

    if (password.length > 0 && password.length < 4) {
      errors.push("Mật khẩu phải có ít nhất 4 ký tự.");
    }
    if (password.length > 0 && (password.match(/[A-Z]/g) || []).length < 1) {
      errors.push("Mật khẩu phải có ít nhất 1 chữ cái viết hoa.");
    }
    if (
      password.length > 0 &&
      (password.match(/[^a-z0-9]/gi) || []).length < 1
    ) {
      errors.push("Mật khẩu phải có ít nhất 1 ký tự đặc biệt.");
    }

    return errors;
  };

  // Validation states
  const isNameInvalid = showValidation && !formData.name;
  const isEmailInvalid =
    showValidation && (!formData.email || !validateEmail(formData.email));
  const isPhoneInvalid = showValidation && !formData.phone;
  const isRoleInvalid = showValidation && !formData.role;
  const isPasswordInvalid =
    showValidation && (!formData.password || getPasswordErrors().length > 0);
  const isConfirmPasswordInvalid =
    showValidation &&
    (!formData.confirmPassword || formData.password !== formData.confirmPassword);

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
      !formData.role ||
      !formData.password ||
      getPasswordErrors().length > 0 ||
      !formData.confirmPassword ||
      formData.password !== formData.confirmPassword;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Gửi request lên backend để tạo user mới
      // const response = await fetch('/api/users', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Không thể tạo tài khoản');
      // }

      // Giả lập API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Creating user:", formData);

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        password: "",
        confirmPassword: "",
        status: "active",
      });
      setShowValidation(false);

      // Close modal and notify success
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.");
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
      password: "",
      confirmPassword: "",
      status: "active",
    });
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
            <h2 className="text-2xl font-bold">Thêm mới tài khoản</h2>
          </div>
          <Button
            isIconOnly
            className="text-gray-random-500 hover:text-gray-700"
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

            <div className="space-y-4">
              <Input
                fullWidth
                autoComplete="new-password"
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? (
                      <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                }
                errorMessage={
                  isPasswordInvalid ? (
                    !formData.password ? (
                      "Vui lòng nhập mật khẩu"
                    ) : (
                      <ul className="list-disc list-inside">
                        {getPasswordErrors().map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    )
                  ) : undefined
                }
                isInvalid={isPasswordInvalid}
                label="Mật khẩu *"
                labelPlacement="outside"
                placeholder="Nhập mật khẩu"
                type={isPasswordVisible ? "text" : "password"}
                value={formData.password}
                onValueChange={(value) => handleInputChange("password", value)}
                variant="bordered"
              />

              <Input
                fullWidth
                autoComplete="new-password"
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={() =>
                      setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                    }
                  >
                    {isConfirmPasswordVisible ? (
                      <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                }
                errorMessage={
                  isConfirmPasswordInvalid
                    ? !formData.confirmPassword
                      ? "Vui lòng xác nhận mật khẩu"
                      : "Mật khẩu không khớp."
                    : undefined
                }
                isInvalid={isConfirmPasswordInvalid}
                label="Xác nhận mật khẩu *"
                labelPlacement="outside"
                placeholder="Nhập lại mật khẩu"
                type={isConfirmPasswordVisible ? "text" : "password"}
                value={formData.confirmPassword}
                onValueChange={(value) =>
                  handleInputChange("confirmPassword", value)
                }
                variant="bordered"
              />
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
                {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;

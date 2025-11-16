import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";

import { adminApi } from "@/api";

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
    address: "",
    dob: "",
    specialization: "",
    yearsOfExperience: "",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = [
    { key: "Doctor", label: "Bác sĩ" },
    { key: "Nurse", label: "Điều dưỡng" },
    { key: "Staff", label: "Lễ Tân" },
    { key: "Manager", label: "Quản lý" },
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

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Validate age based on role
  const validateAge = (dob: string, role: string): { isValid: boolean; errorMessage: string } => {
    if (!dob || !role) {
      return { isValid: true, errorMessage: "" };
    }

    const age = calculateAge(dob);
    let minAge = 0;
    let roleName = "";

    switch (role) {
      case "Doctor":
        minAge = 27;
        roleName = "Bác sĩ";
        break;
      case "Nurse":
        minAge = 22;
        roleName = "Điều dưỡng";
        break;
      case "Staff":
        minAge = 18;
        roleName = "Lễ tân";
        break;
      case "Manager":
        minAge = 27;
        roleName = "Quản lý";
        break;
      default:
        return { isValid: true, errorMessage: "" };
    }

    if (age < minAge) {
      return {
        isValid: false,
        errorMessage: `${roleName} phải từ ${minAge} tuổi trở lên.`,
      };
    }

    return { isValid: true, errorMessage: "" };
  };

  // Format date from yyyy-mm-dd to dd/mm/yyyy
  const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
    (!formData.confirmPassword ||
      formData.password !== formData.confirmPassword);
  const isAddressInvalid = showValidation && !formData.address;
  const ageValidation = validateAge(formData.dob, formData.role);
  const isDobInvalid = showValidation && (!formData.dob || !ageValidation.isValid);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    // Validate age
    const ageValidationResult = validateAge(formData.dob, formData.role);
    if (!ageValidationResult.isValid) {
      toast.error(ageValidationResult.errorMessage);
      return;
    }

    // Check validation
    const hasErrors =
      !formData.name ||
      !formData.email ||
      !validateEmail(formData.email) ||
      !formData.phone ||
      !formData.role ||
      !formData.address ||
      !formData.dob ||
      !formData.password ||
      getPasswordErrors().length > 0 ||
      !formData.confirmPassword ||
      formData.password !== formData.confirmPassword;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Format date to dd/mm/yyyy before sending
      const formattedDob = formatDateToDDMMYYYY(formData.dob);

      // Call API to create new user
      const response = await adminApi.createAccount({
        fullName: formData.name,
        email: formData.email,
        passwordHash: formData.password,
        role: formData.role,
        phoneNumber: formData.phone,
        address: formData.address,
        dob: formattedDob,
        specialization: formData.specialization || undefined,
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
      });

      // Backend returns 'status' instead of 'success'
      const isSuccess = response.success || (response.data as any)?.status;

      if (isSuccess) {
        toast.success(response.message || "Tạo tài khoản thành công!");

        // Reset form CHỈ KHI TẠO THÀNH CÔNG
        setFormData({
          name: "",
          email: "",
          phone: "",
          role: "",
          password: "",
          confirmPassword: "",
          status: "active",
          address: "",
          dob: "",
          specialization: "",
          yearsOfExperience: "",
        });
        setShowValidation(false);

        // Close modal and notify success
        if (onSuccess) {
          onSuccess();
        }
        
        // Đóng modal sau khi tạo thành công
        onClose();
      } else {
        toast.error(response.message || "Có lỗi xảy ra khi tạo tài khoản");
      }
    } catch (error: any) {
      toast.error(
        error.message || "Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.",
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
      <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/logo1.png"
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
                errorMessage={
                  isPhoneInvalid ? "Vui lòng nhập số điện thoại" : ""
                }
                isInvalid={isPhoneInvalid}
                label={
                  <>
                    Số điện thoại <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Nhập số điện thoại"
                type="tel"
                value={formData.phone}
                variant="bordered"
                onValueChange={(value) => handleInputChange("phone", value)}
              />

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                errorMessage={
                  isAddressInvalid ? "Vui lòng nhập địa chỉ" : ""
                }
                isInvalid={isAddressInvalid}
                label={
                  <>
                    Địa chỉ <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Nhập địa chỉ"
                type="text"
                value={formData.address}
                variant="bordered"
                onValueChange={(value) => handleInputChange("address", value)}
              />

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="off"
                errorMessage={
                  isDobInvalid
                    ? !formData.dob
                      ? "Vui lòng nhập ngày sinh"
                      : ageValidation.errorMessage
                    : ""
                }
                isInvalid={isDobInvalid}
                label={
                  <>
                    Ngày sinh <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Chọn ngày sinh"
                type="date"
                value={formData.dob}
                variant="bordered"
                onValueChange={(value) => handleInputChange("dob", value)}
              />

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

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="new-password"
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
                label={
                  <>
                    Mật khẩu <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Nhập mật khẩu"
                type="password"
                value={formData.password}
                variant="bordered"
                onValueChange={(value) => handleInputChange("password", value)}
              />

              <Input
                fullWidth
                classNames={{
                  base: "w-full",
                  inputWrapper: "w-full"
                }}
                autoComplete="new-password"
                errorMessage={
                  isConfirmPasswordInvalid
                    ? !formData.confirmPassword
                      ? "Vui lòng xác nhận mật khẩu"
                      : "Mật khẩu không khớp."
                    : undefined
                }
                isInvalid={isConfirmPasswordInvalid}
                label={
                  <>
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Nhập lại mật khẩu"
                type="password"
                value={formData.confirmPassword}
                variant="bordered"
                onValueChange={(value) =>
                  handleInputChange("confirmPassword", value)
                }
              />

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

              {/* Show specialization and years of experience only for Doctor role */}
              {formData.role === "Doctor" && (
                <>
                  <Input
                    fullWidth
                    classNames={{
                      base: "w-full",
                      inputWrapper: "w-full"
                    }}
                    autoComplete="off"
                    label="Chuyên khoa"
                    placeholder="Nhập chuyên khoa (VD: Nha khoa thẩm mỹ)"
                    type="text"
                    value={formData.specialization}
                    variant="bordered"
                    onValueChange={(value) => handleInputChange("specialization", value)}
                  />

                  <Input
                    fullWidth
                    classNames={{
                      base: "w-full",
                      inputWrapper: "w-full"
                    }}
                    autoComplete="off"
                    label="Số năm kinh nghiệm"
                    placeholder="Nhập số năm kinh nghiệm"
                    type="number"
                    value={formData.yearsOfExperience}
                    variant="bordered"
                    onValueChange={(value) => handleInputChange("yearsOfExperience", value)}
                  />
                </>
              )}
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
            {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;

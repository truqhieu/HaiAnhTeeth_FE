import React, { forwardRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import {
  Input,
  Button,
  Form,
  Select,
  SelectItem,
} from "@heroui/react";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import viLocale from "@/utils/viLocale";
import { authApi } from "@/api";

registerLocale("vi", viLocale as any);
setDefaultLocale("vi");

const SIGNUP_DATE_PICKER_PORTAL_ID = "signup-date-picker-portal";

const ensureSignupDatePickerPortal = () => {
  if (typeof document === "undefined") return;
  if (!document.getElementById(SIGNUP_DATE_PICKER_PORTAL_ID)) {
    const portalRoot = document.createElement("div");
    portalRoot.id = SIGNUP_DATE_PICKER_PORTAL_ID;
    portalRoot.style.position = "relative";
    portalRoot.style.zIndex = "9999";
    document.body.appendChild(portalRoot);
  }
};

const formatDateToISO = (date: Date | null) => {
  if (!date) return "";
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().split("T")[0];
};

const parseDateValue = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

interface BirthdateInputProps {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: React.ReactNode;
  onClear?: () => void;
}

const BirthdateInput = forwardRef<HTMLInputElement, BirthdateInputProps>(
  ({ value, onClick, placeholder, isInvalid, errorMessage, onClear }, ref) => (
    <Input
      ref={ref}
      readOnly
      value={value || ""}
      placeholder={placeholder}
      onClick={onClick}
      label={
        <>
          Ngày sinh <span className="text-red-500">*</span>
        </>
      }
      labelPlacement="inside"
      variant="bordered"
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      classNames={{
        label: "text-base text-gray-700",
        input: "bg-white",
        inputWrapper: "cursor-pointer bg-gray-100",
      }}
      size="lg"
      startContent={<CalendarIcon className="w-5 h-5 text-gray-400" />}
      endContent={
        value ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClear?.();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        ) : null
      }
    />
  ),
);

BirthdateInput.displayName = "BirthdateInput";

const SignupForm = () => {
  const navigate = useNavigate();

  // --- States ---
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [birthdate, setBirthdate] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitted, setSubmitted] = React.useState<any>(null);
  const [showValidation, setShowValidation] = React.useState(false);

  useEffect(() => {
    ensureSignupDatePickerPortal();
  }, []);

  // --- Validation ---
  const validateEmail = (value: string): boolean =>
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);

  const getPasswordErrors = (): string[] => {
    const errors: string[] = [];

    if (password.length < 4) errors.push("Mật khẩu phải có ít nhất 4 ký tự.");
    if (!/[A-Z]/.test(password)) errors.push("Phải có ít nhất 1 chữ hoa.");
    if (!/[^a-zA-Z0-9]/.test(password))
      errors.push("Phải có ít nhất 1 ký tự đặc biệt.");

    return errors;
  };

  const isNameInvalid = showValidation && !name;
  const isEmailInvalid = showValidation && (!email || !validateEmail(email));
  const isGenderInvalid = showValidation && !gender;
  const isBirthdateInvalid = showValidation && !birthdate;
  const isPasswordInvalid =
    showValidation && (!password || getPasswordErrors().length > 0);
  const isConfirmPasswordInvalid =
    showValidation && (!confirmPassword || confirmPassword !== password);

  // --- Submit handler ---
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowValidation(true);
    setError("");

    const hasErrors =
      !name ||
      !email ||
      !validateEmail(email) ||
      !gender ||
      !birthdate ||
      !password ||
      getPasswordErrors().length > 0 ||
      !confirmPassword ||
      confirmPassword !== password;

    if (hasErrors) return;

    setIsLoading(true);
    try {
      const formattedBirthdate = birthdate
        ? new Date(birthdate).toISOString()
        : "";

      const genderMap: Record<string, string> = { Nam: "Male", Nữ: "Female" };

      const response = await authApi.register({
        fullName: name,
        email,
        gender: genderMap[gender] || gender,
        dateOfBirth: formattedBirthdate,
        password,
      });

      if (response.success) {
        setSubmitted({ name, email });
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.message || "Đăng ký thất bại");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối đến máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  // Render content chung
  const renderFormContent = () => (
    <>
      {/* Header */}
      <div className="flex flex-col items-center mb-6 md:mb-8">
        <img
          alt="Logo"
          className="h-16 md:h-20 w-auto mb-3 md:mb-4 object-contain"
          src="/logo1.png"
        />
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800">Đăng ký</h2>
        <p className="text-gray-500 text-base md:text-lg mt-2 text-center">
          Tạo tài khoản mới để sử dụng hệ thống nha khoa
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 p-4 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <Form autoComplete="off" className="space-y-5" onSubmit={onSubmit}>
        <Input
          fullWidth
          errorMessage={isNameInvalid ? "Vui lòng nhập họ và tên" : ""}
          isInvalid={isNameInvalid}
          label={
            <>
              Họ và tên <span className="text-red-500">*</span>
            </>
          }
          placeholder="Nhập họ và tên của bạn"
          size="lg"
          value={name}
          onValueChange={setName}
        />

        <Input
          fullWidth
          errorMessage={
            isEmailInvalid
              ? email === ""
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
          placeholder="Nhập email của bạn"
          size="lg"
          type="email"
          value={email}
          onValueChange={setEmail}
        />

        <Select
          fullWidth
          className="text-base"
          errorMessage={isGenderInvalid ? "Vui lòng chọn giới tính" : ""}
          isInvalid={isGenderInvalid}
          label={
            <>
              Giới tính <span className="text-red-500">*</span>
            </>
          }
          placeholder="Chọn giới tính"
          selectedKeys={gender ? [gender] : []}
          size="lg"
          onSelectionChange={(keys) => setGender(Array.from(keys)[0] as string)}
        >
          <SelectItem key="Nam">Nam</SelectItem>
          <SelectItem key="Nữ">Nữ</SelectItem>
        </Select>

        <div className="w-full">
          <DatePicker
            selected={parseDateValue(birthdate)}
            onChange={(date) => setBirthdate(formatDateToISO(date))}
            dateFormat="dd/MM/yyyy"
            locale="vi"
            calendarStartDay={1}
            showPopperArrow={false}
            popperPlacement="bottom-start"
            popperClassName="z-[9999]"
            popperProps={{
              strategy: "fixed",
            }}
            portalId={SIGNUP_DATE_PICKER_PORTAL_ID}
            wrapperClassName="w-full"
            customInput={
              <BirthdateInput
                placeholder="dd/mm/yyyy"
                isInvalid={isBirthdateInvalid}
                errorMessage={
                  isBirthdateInvalid ? "Vui lòng chọn ngày sinh" : undefined
                }
                onClear={() => setBirthdate("")}
              />
            }
          />
        </div>

        <Input
          fullWidth
          errorMessage={
            isPasswordInvalid
              ? getPasswordErrors().map((e, i) => <div key={i}>{e}</div>)
              : ""
          }
          isInvalid={isPasswordInvalid}
          label={
            <>
              Mật khẩu <span className="text-red-500">*</span>
            </>
          }
          placeholder="Nhập mật khẩu"
          size="lg"
          type="password"
          value={password}
          onValueChange={setPassword}
        />

        <Input
          fullWidth
          errorMessage={
            isConfirmPasswordInvalid
              ? !confirmPassword
                ? "Vui lòng xác nhận mật khẩu"
                : "Mật khẩu không khớp."
              : ""
          }
          isInvalid={isConfirmPasswordInvalid}
          label={
            <>
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </>
          }
          placeholder="Nhập lại mật khẩu"
          size="lg"
          type="password"
          value={confirmPassword}
          onValueChange={setConfirmPassword}
        />

        <Button
          className="w-full py-4 text-lg font-semibold text-white bg-[#39BDCC] hover:bg-[#2ca6b5] transition-all duration-300 rounded-xl shadow-md hover:shadow-lg"
          isDisabled={isLoading}
          isLoading={isLoading}
          type="submit"
        >
          {!isLoading && <UserIcon className="w-6 h-6 mr-2" />}
          {isLoading ? "Đang đăng ký..." : "Đăng ký"}
        </Button>
      </Form>

      {submitted && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg text-sm text-green-700">
          ✅ Đăng ký thành công!
          <br />
          Kiểm tra email <strong>{submitted.email}</strong> để kích hoạt tài
          khoản.
        </div>
      )}

      {/* Back to Home */}
      <div className="mt-6 flex flex-col items-center space-y-2">
        <div className="mt-8 flex justify-center">
          <Button
            color="default"
            variant="flat"
            size="lg"
            onPress={() => navigate("/")}
            className="flex items-center gap-2 font-semibold text-gray-700 hover:text-[#39BDCC] transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Trở về trang chủ
          </Button>
        </div>

        <p className="text-sm md:text-base text-gray-600">
          Đã có tài khoản?{" "}
          <button
            className="text-[#39BDCC] hover:underline font-semibold"
            onClick={() => navigate("/login")}
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </>
  );

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#b3f0f5] via-[#d9fafa] to-[#e0fdfd] p-4">
      <div className="bg-white shadow-2xl rounded-3xl px-8 py-8 md:px-10 md:py-10 w-full max-w-lg relative">
        {renderFormContent()}
      </div>
    </div>
  );
};

export default SignupForm;

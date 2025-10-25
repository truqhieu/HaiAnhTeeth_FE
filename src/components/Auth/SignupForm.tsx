import React from "react";
import { useNavigate } from "react-router-dom";
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";
import { DatePicker, Input, Button, Form, Select, SelectItem } from "@heroui/react";
import { authApi } from "@/api";

const SignupForm = () => {
  const navigate = useNavigate();

  // --- States ---
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [birthdate, setBirthdate] = React.useState<any>(null);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitted, setSubmitted] = React.useState<any>(null);
  const [showValidation, setShowValidation] = React.useState(false);

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
        ? new Date(birthdate.year, birthdate.month - 1, birthdate.day).toISOString()
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
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(response.message || "Đăng ký thất bại");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối đến máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#b3f0f5] via-[#d9fafa] to-[#e0fdfd]">
      <div className="bg-white shadow-2xl rounded-3xl px-10 py-10 w-full max-w-lg relative">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 mt-8">
          <img
            alt="Logo"
            className="h-20 w-auto mb-4 object-contain"
            src="/logo1.png"
          />
          <h2 className="text-4xl font-extrabold text-gray-800">Đăng ký</h2>
          <p className="text-gray-500 text-lg mt-2 text-center">
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
            label="Họ và tên *"
            placeholder="Nhập họ và tên của bạn"
            size="lg"
            value={name}
            onValueChange={setName}
            isInvalid={isNameInvalid}
            errorMessage={isNameInvalid ? "Vui lòng nhập họ và tên" : ""}
          />

          <Input
            fullWidth
            type="email"
            label="Email *"
            placeholder="Nhập email của bạn"
            size="lg"
            value={email}
            onValueChange={setEmail}
            isInvalid={isEmailInvalid}
            errorMessage={
              isEmailInvalid
                ? email === ""
                  ? "Vui lòng nhập email"
                  : "Vui lòng nhập email hợp lệ"
                : ""
            }
          />

          <Select
            label="Giới tính *"
            placeholder="Chọn giới tính"
            selectedKeys={gender ? [gender] : []}
            onSelectionChange={(keys) => setGender(Array.from(keys)[0] as string)}
            isInvalid={isGenderInvalid}
            errorMessage={isGenderInvalid ? "Vui lòng chọn giới tính" : ""}
            fullWidth
            size="lg"
            className="text-base"
          >
            <SelectItem key="Nam">Nam</SelectItem>
            <SelectItem key="Nữ">Nữ</SelectItem>
          </Select>

          <DatePicker
            label="Ngày sinh *"
            value={birthdate}
            onChange={setBirthdate}
            isInvalid={isBirthdateInvalid}
            errorMessage={
              isBirthdateInvalid ? "Vui lòng chọn ngày sinh" : undefined
            }
          />

          <Input
            fullWidth
            label="Mật khẩu *"
            placeholder="Nhập mật khẩu"
            size="lg"
            type={isPasswordVisible ? "text" : "password"}
            value={password}
            onValueChange={setPassword}
            isInvalid={isPasswordInvalid}
            endContent={
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                {isPasswordVisible ? (
                  <EyeSlashIcon className="w-6 h-6 text-gray-400" />
                ) : (
                  <EyeIcon className="w-6 h-6 text-gray-400" />
                )}
              </button>
            }
            errorMessage={
              isPasswordInvalid
                ? getPasswordErrors().map((e, i) => <div key={i}>{e}</div>)
                : ""
            }
          />

          <Input
            fullWidth
            label="Xác nhận mật khẩu *"
            placeholder="Nhập lại mật khẩu"
            size="lg"
            type={isConfirmPasswordVisible ? "text" : "password"}
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            isInvalid={isConfirmPasswordInvalid}
            endContent={
              <button
                type="button"
                onClick={() =>
                  setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                }
              >
                {isConfirmPasswordVisible ? (
                  <EyeSlashIcon className="w-6 h-6 text-gray-400" />
                ) : (
                  <EyeIcon className="w-6 h-6 text-gray-400" />
                )}
              </button>
            }
            errorMessage={
              isConfirmPasswordInvalid
                ? !confirmPassword
                  ? "Vui lòng xác nhận mật khẩu"
                  : "Mật khẩu không khớp."
                : ""
            }
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
            Kiểm tra email <strong>{submitted.email}</strong> để kích hoạt tài khoản.
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

          <p className="text-base text-gray-600">
            Đã có tài khoản?{" "}
            <button
              className="text-[#39BDCC] hover:underline font-semibold"
              onClick={() => navigate("/login")}
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;

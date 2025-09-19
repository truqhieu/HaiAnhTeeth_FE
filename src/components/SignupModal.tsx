import React from "react";
import { UserIcon, EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { DatePicker, Input, Button, Form } from "@heroui/react";
import { useAuthModal } from "@/contexts/AuthModalContext";

const SignupModal = () => {
  const { isSignupModalOpen, closeModals, openLoginModal } = useAuthModal();
  const [email, setEmail] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [gender, setGender] = React.useState<string>("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [birthdate, setBirthdate] = React.useState<any>(null);
  const [submitted, setSubmitted] = React.useState<any>(null);
  const [showValidation, setShowValidation] = React.useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = React.useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isSignupModalOpen) {
      setEmail("");
      setName("");
      setGender("");
      setPassword("");
      setConfirmPassword("");
      setBirthdate(null);
      setSubmitted(null);
      setShowValidation(false);
      setIsPasswordVisible(false);
      setIsConfirmPasswordVisible(false);
    }
  }, [isSignupModalOpen]);

  // Xác thực email
  const validateEmail = (value: string): boolean =>
    value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;

  // Xác thực mật khẩu
  const getPasswordErrors = (): string[] => {
    const errors: string[] = [];
    if (password.length > 0 && password.length < 4) {
      errors.push("Mật khẩu phải có ít nhất 4 ký tự.");
    }
    if (password.length > 0 && (password.match(/[A-Z]/g) || []).length < 1) {
      errors.push("Mật khẩu phải có ít nhất 1 chữ cái viết hoa.");
    }
    if (password.length > 0 && (password.match(/[^a-z0-9]/gi) || []).length < 1) {
      errors.push("Mật khẩu phải có ít nhất 1 ký tự đặc biệt.");
    }
    return errors;
  };

  // Validation states
  const isNameInvalid = showValidation && !name;
  const isEmailInvalid = showValidation && (!email || !validateEmail(email));
  const isGenderInvalid = showValidation && !gender;
  const isBirthdateInvalid = showValidation && !birthdate;
  const isPasswordInvalid = showValidation && (!password || getPasswordErrors().length > 0);
  const isConfirmPasswordInvalid = showValidation && (!confirmPassword || password !== confirmPassword);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowValidation(true);
    
    // Kiểm tra validation cho tất cả các trường
    const hasErrors = 
      !name ||
      !email || 
      !validateEmail(email) || 
      !gender || 
      !birthdate ||
      !password ||
      getPasswordErrors().length > 0 || 
      !confirmPassword ||
      password !== confirmPassword;
    
    if (hasErrors) {
      return;
    }
    
    const data = { name, email, gender, birthdate, password };
    setSubmitted(data);
    console.log("Đăng ký thành công:", data);
    
    // Close modal after successful signup
    setTimeout(() => {
      closeModals();
    }, 2000);
  };

  const handleSwitchToLogin = () => {
    setEmail("");
    setName("");
    setGender("");
    setPassword("");
    setConfirmPassword("");
    setBirthdate(null);
    setSubmitted(null);
    setShowValidation(false);
    openLoginModal();
  };

  if (!isSignupModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModals}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Đăng ký</h2>
          <Button 
            isIconOnly 
            variant="light" 
            onPress={closeModals}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <Form className="space-y-4" onSubmit={onSubmit} autoComplete="off">
            <Input 
              label="Họ và tên *" 
              type="text" 
              name="name" 
              value={name}
              onValueChange={setName}
              fullWidth 
              autoComplete="off"
              placeholder="Nhập họ và tên của bạn"
              isInvalid={isNameInvalid}
              errorMessage={isNameInvalid ? "Vui lòng nhập họ và tên" : undefined}
            />

            <Input
              label="Email *"
              type="email"
              value={email}
              onValueChange={setEmail}
              name="email"
              fullWidth
              autoComplete="off"
              placeholder="Nhập email của bạn"
              isInvalid={isEmailInvalid}
              errorMessage={
                isEmailInvalid 
                  ? email === "" 
                    ? "Vui lòng nhập email" 
                    : "Vui lòng nhập email hợp lệ"
                  : undefined
              }
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Giới tính *</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={gender === "Nam" ? "solid" : "bordered"}
                  color={gender === "Nam" ? "primary" : isGenderInvalid ? "danger" : "default"}
                  className={`w-full ${gender === "Nam" ? "bg-[#39BDCC] text-white" : ""} ${isGenderInvalid ? "border-danger-500" : ""}`}
                  onPress={() => setGender("Nam")}
                >
                  Nam
                </Button>
                <Button
                  variant={gender === "Nữ" ? "solid" : "bordered"}
                  color={gender === "Nữ" ? "primary" : isGenderInvalid ? "danger" : "default"}
                  className={`w-full ${gender === "Nữ" ? "bg-[#39BDCC] text-white" : ""} ${isGenderInvalid ? "border-danger-500" : ""}`}
                  onPress={() => setGender("Nữ")}
                >
                  Nữ
                </Button>
              </div>
              {isGenderInvalid && (
                <p className="text-tiny text-danger">Vui lòng chọn giới tính</p>
              )}
            </div>

            <DatePicker 
              label="Ngày sinh *" 
              name="birthdate" 
              value={birthdate}
              onChange={setBirthdate}
              fullWidth 
              isInvalid={isBirthdateInvalid}
              errorMessage={isBirthdateInvalid ? "Vui lòng chọn ngày sinh" : undefined}
            />

            <Input
              label="Mật khẩu *"
              labelPlacement="outside"
              name="password"
              placeholder="Nhập mật khẩu"
              value={password}
              type={isPasswordVisible ? "text" : "password"}
              onValueChange={setPassword}
              fullWidth
              autoComplete="new-password"
              isInvalid={isPasswordInvalid}
              errorMessage={
                isPasswordInvalid ? (
                  !password ? "Vui lòng nhập mật khẩu" : (
                    <ul className="list-disc list-inside">
                      {getPasswordErrors().map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  )
                ) : undefined
              }
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
            />

            <Input
              label="Xác nhận mật khẩu *"
              labelPlacement="outside"
              name="confirm-password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              type={isConfirmPasswordVisible ? "text" : "password"}
              onValueChange={setConfirmPassword}
              fullWidth
              autoComplete="new-password"
              isInvalid={isConfirmPasswordInvalid}
              errorMessage={
                isConfirmPasswordInvalid ? (
                  !confirmPassword ? "Vui lòng xác nhận mật khẩu" : "Mật khẩu không khớp."
                ) : undefined
              }
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                >
                  {isConfirmPasswordVisible ? (
                    <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              }
            />

            <Button
              type="submit"
              variant="solid"
              className="w-full flex items-center justify-center text-white bg-[#39BDCC] hover:bg-[#2ca6b5]"
            >
              <UserIcon className="w-5 h-5 mr-2" />
              Đăng ký
            </Button>
          </Form>

          {submitted && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded text-center text-sm text-green-700">
              ✅ Đăng ký thành công! Chào mừng {submitted.name}
            </div>
          )}

          <p className="mt-4 text-center text-sm">
            Bạn đã có tài khoản?{" "}
            <button 
              onClick={handleSwitchToLogin}
              className="text-blue-500 hover:underline"
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;

import React from "react";
import { LockClosedIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form } from "@heroui/react";
import { useAuthModal } from "@/contexts/AuthModalContext";

const LoginModal = () => {
  const { isLoginModalOpen, closeModals, openSignupModal } = useAuthModal();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Random names để tránh autofill
  const [randomNames] = React.useState({
    email: `email_${Math.random().toString(36).substring(7)}`,
    password: `password_${Math.random().toString(36).substring(7)}`
  });

  // Prevent autofill on component mount
  React.useEffect(() => {
    if (isLoginModalOpen) {
      const timer = setTimeout(() => {
        setEmail("");
        setPassword("");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoginModalOpen]);

  const validateEmail = (value: string): boolean =>
    value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;

  const isInvalidEmail = React.useMemo(() => {
    if (email === "") return false;
    return validateEmail(email) ? false : true;
  }, [email]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = { email, password };
    console.log("Đăng nhập đã gửi:", data);
    closeModals();
  };

  const handleSwitchToSignup = () => {
    setEmail("");
    setPassword("");
    openSignupModal();
  };

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModals}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39BDCC]">
          <div className="flex items-center space-x-3">
    <img
      src="/Screenshot_2025-09-19_141436-removebg-preview.png"
      alt="Logo"
      className="h-8 w-auto object-contain"
    />
    <h2 className="text-2xl font-bold">Đăng nhập</h2>
  </div>
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
        <div className="p-6">
          <Form className="space-y-4" onSubmit={onSubmit} autoComplete="off">
            {/* Hidden dummy inputs để ngăn autofill */}
            <input type="text" style={{ display: "none" }} />
            <input type="password" style={{ display: "none" }} />
            
            <Input
              label="Email *"
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onValueChange={setEmail}
              isInvalid={isInvalidEmail}
              errorMessage={isInvalidEmail ? "Vui lòng nhập email hợp lệ" : ""}
              fullWidth
              autoComplete="off"
              name={randomNames.email}
              id={randomNames.email}
            />

            <Input
              label="Mật khẩu *"
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onValueChange={setPassword}
              fullWidth
              autoComplete="new-password"
              name={randomNames.password}
              id={randomNames.password}
            />

            <Button
              type="submit"
              variant="solid"
              className="w-full flex items-center justify-center text-white bg-[#39BDCC] hover:bg-[#2ca6b5]"
            >
              <LockClosedIcon className="w-5 h-5 mr-2" />
              Đăng nhập
            </Button>
          </Form>

          <p className="mt-4 text-center text-sm">
            Bạn chưa có tài khoản?{" "}
            <button 
              onClick={handleSwitchToSignup}
              className="text-blue-500 hover:underline"
            >
              Đăng ký
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
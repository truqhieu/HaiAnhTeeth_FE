import React from "react";
import { LockClosedIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form } from "@heroui/react";

import { useAuthModal } from "@/contexts/AuthModalContext";

const LoginModal = () => {
  const {
    isLoginModalOpen,
    closeModals,
    openSignupModal,
    openForgotPasswordModal,
  } = useAuthModal();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Random names để tránh autofill
  const [randomNames] = React.useState({
    email: `email_${Math.random().toString(36).substring(7)}`,
    password: `password_${Math.random().toString(36).substring(7)}`,
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

    // TODO: Gửi data lên server
    // eslint-disable-next-line no-console
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
        aria-label="Close modal"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        onClick={closeModals}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            closeModals();
          }
        }}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39BDCC]">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/Screenshot_2025-09-19_141436-removebg-preview.png"
            />
            <h2 className="text-2xl font-bold">Đăng nhập</h2>
          </div>
          <Button
            isIconOnly
            className="text-gray-500 hover:text-gray-700"
            variant="light"
            onPress={closeModals}
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6">
          <Form autoComplete="off" className="space-y-4" onSubmit={onSubmit}>
            {/* Hidden dummy inputs để ngăn autofill */}
            <input style={{ display: "none" }} type="text" />
            <input style={{ display: "none" }} type="password" />

            <Input
              fullWidth
              autoComplete="off"
              errorMessage={isInvalidEmail ? "Vui lòng nhập email hợp lệ" : ""}
              id={randomNames.email}
              isInvalid={isInvalidEmail}
              label="Email *"
              name={randomNames.email}
              placeholder="Nhập email của bạn"
              type="email"
              value={email}
              onValueChange={setEmail}
            />

            <Input
              fullWidth
              autoComplete="new-password"
              id={randomNames.password}
              label="Mật khẩu *"
              name={randomNames.password}
              placeholder="Nhập mật khẩu của bạn"
              type="password"
              value={password}
              onValueChange={setPassword}
            />

            <div className="text-right mb-2">
              <button
                className="text-sm text-blue-500 hover:underline"
                type="button"
                onClick={openForgotPasswordModal}
              >
                Quên mật khẩu?
              </button>
            </div>

            <Button
              className="w-full flex items-center justify-center text-white bg-[#39BDCC] hover:bg-[#2ca6b5]"
              type="submit"
              variant="solid"
            >
              <LockClosedIcon className="w-5 h-5 mr-2" />
              Đăng nhập
            </Button>
          </Form>

          <p className="mt-4 text-center text-sm">
            Bạn chưa có tài khoản?{" "}
            <button
              className="text-blue-500 hover:underline"
              onClick={handleSwitchToSignup}
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

import React from "react";
import { LockClosedIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form } from "@heroui/react";

import { useAuthModal } from "@/contexts/AuthModalContext";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/api";

const LoginModal = () => {
  const {
    isLoginModalOpen,
    closeModals,
    openSignupModal,
    openForgotPasswordModal,
  } = useAuthModal();
  const { login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

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
        setError("");
        setIsLoading(false);
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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.data?.user && response.data?.token) {
        // eslint-disable-next-line no-console
        console.log("Đăng nhập thành công:", response.data);
        
        // Update auth state
        login(response.data.user, response.data.token);
        
        // Close modal
        closeModals();
        
        // Redirect based on user role
        const role = response.data.user.role;
        if (role === "Admin") {
          window.location.href = "/admin/accounts";
        } else if (role === "Manager") {
          window.location.href = "/manager/rooms";
        }
        // Patient stays on homepage - no redirect
      } else {
        setError(response.message || "Đăng nhập thất bại");
      }
    } catch (error: any) {
      setError(error.message || "Lỗi kết nối đến server");
    } finally {
      setIsLoading(false);
    }
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
              src="/logo1.png"
              style={{height: '32px', width: '32px'}}
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
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
              {error}
            </div>
          )}
          
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
              isDisabled={isLoading || !email || !password}
              isLoading={isLoading}
              type="submit"
              variant="solid"
            >
              {!isLoading && <LockClosedIcon className="w-5 h-5 mr-2" />}
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
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

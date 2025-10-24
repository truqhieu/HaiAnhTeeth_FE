import React from "react";
import { EnvelopeIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form } from "@heroui/react";

import { useAuthModal } from "@/contexts/AuthModalContext";
import { authApi } from "@/api";

const ForgotPasswordModal = () => {
  const { isForgotPasswordModalOpen, closeModals, openLoginModal } =
    useAuthModal();
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Random names để tránh autofill
  const [randomNames] = React.useState({
    email: `email_${Math.random().toString(36).substring(7)}`,
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isForgotPasswordModalOpen) {
      const timer = setTimeout(() => {
        setEmail("");
        setSubmitted(false);
        setIsLoading(false);
        setError("");
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isForgotPasswordModalOpen]);

  const validateEmail = (value: string): boolean =>
    value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;

  const isInvalidEmail = React.useMemo(() => {
    if (email === "") return false;

    return validateEmail(email) ? false : true;
  }, [email]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword({ email });

      if (response.success) {
        setSubmitted(true);
        // eslint-disable-next-line no-console
        console.log("Yêu cầu reset mật khẩu thành công:", response.data);

        // Auto close after 5 seconds
        setTimeout(() => {
          closeModals();
          setSubmitted(false);
        }, 5000);
      } else {
        setError(response.message || "Gửi yêu cầu thất bại");
      }
    } catch (error: any) {
      setError(error.message || "Lỗi kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setEmail("");
    setSubmitted(false);
    openLoginModal();
  };

  if (!isForgotPasswordModalOpen) return null;

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
            <h2 className="text-2xl font-bold">Quên mật khẩu</h2>
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
          {!submitted ? (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                  {error}
                </div>
              )}

              <p className="text-sm text-gray-600 mb-4">
                Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn hướng dẫn
                đặt lại mật khẩu.
              </p>

              <Form
                autoComplete="off"
                className="space-y-4"
                onSubmit={onSubmit}
              >
                {/* Hidden dummy inputs để ngăn autofill */}
                <input style={{ display: "none" }} type="text" />

                <Input
                  fullWidth
                  autoComplete="off"
                  errorMessage={
                    isInvalidEmail ? "Vui lòng nhập email hợp lệ" : ""
                  }
                  id={randomNames.email}
                  isInvalid={isInvalidEmail}
                  label={
                    <>
                      Email <span className="text-red-500">*</span>
                    </>
                  }
                  name={randomNames.email}
                  placeholder="Nhập email của bạn"
                  type="email"
                  value={email}
                  onValueChange={setEmail}
                />

                <Button
                  className="w-full flex items-center justify-center text-white bg-[#39BDCC] hover:bg-[#2ca6b5]"
                  isDisabled={!email || isInvalidEmail || isLoading}
                  isLoading={isLoading}
                  type="submit"
                  variant="solid"
                >
                  {!isLoading && <EnvelopeIcon className="w-5 h-5 mr-2" />}
                  {isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                </Button>
              </Form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-100 border border-green-300 rounded text-center">
                <div className="text-green-700 text-lg font-semibold mb-2">
                  ✅ Thành công!
                </div>
                <p className="text-sm text-green-600 mb-2">
                  Chúng tôi đã gửi email chứa link đặt lại mật khẩu đến{" "}
                  <strong>{email}</strong>
                </p>
                <p className="text-xs text-green-600">
                  Vui lòng kiểm tra hộp thư và click vào link trong email để
                  tiếp tục.
                </p>
                <p className="text-xs text-green-500 mt-2 italic">
                  Link sẽ hết hạn sau 10 phút.
                </p>
              </div>
            </div>
          )}

          <p className="mt-4 text-center text-sm">
            <button
              className="text-blue-500 hover:underline"
              onClick={handleBackToLogin}
            >
              ← Quay lại đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;

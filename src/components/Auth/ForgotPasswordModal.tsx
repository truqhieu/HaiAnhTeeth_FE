// File: ForgotPasswordModal.tsx (THEO PHONG CÁCH LOGINFORM)

import React from "react";
import { useNavigate } from "react-router-dom";
import { EnvelopeIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form } from "@heroui/react";
import { authApi } from "@/api";

const ForgotPasswordModal = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const validateEmail = (value: string): boolean =>
    value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;

  const isInvalidEmail = React.useMemo(() => {
    if (email === "") return false;
    return !validateEmail(email);
  }, [email]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword({ email });
      if (response.success) {
        setSubmitted(true);
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
    navigate("/login");
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
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800">Quên mật khẩu</h2>
        <p className="text-gray-500 text-base md:text-lg mt-2 text-center">
          {!submitted
            ? "Nhập email để nhận hướng dẫn đặt lại mật khẩu"
            : "Kiểm tra email của bạn"}
        </p>
      </div>

      {!submitted ? (
        <>
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
              autoComplete="off"
              errorMessage={
                isInvalidEmail ? "Vui lòng nhập email hợp lệ" : ""
              }
              isInvalid={isInvalidEmail}
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

            <Button
              className="w-full py-4 text-lg font-semibold text-white bg-[#39BDCC] hover:bg-[#2ca6b5] transition-all duration-300 rounded-xl"
              isDisabled={!email || isInvalidEmail || isLoading}
              isLoading={isLoading}
              type="submit"
              variant="solid"
            >
              {!isLoading && <EnvelopeIcon className="w-6 h-6 mr-2" />}
              {isLoading ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </Form>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-6 bg-green-100 border border-green-300 rounded-lg text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-500 rounded-full p-3">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-green-800 text-2xl font-bold mb-3">
              Email đã được gửi!
            </h3>
            <p className="text-gray-700 text-base mb-2">
              Chúng tôi đã gửi email chứa link đặt lại mật khẩu đến
            </p>
            <p className="text-[#39BDCC] font-semibold text-lg mb-3">
              {email}
            </p>
            <p className="text-sm text-gray-600">
              Vui lòng kiểm tra hộp thư và click vào link trong email để tiếp
              tục.
            </p>
          </div>

          <div className="bg-blue-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-2">
              📧 Không nhận được email?
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Kiểm tra thư mục spam/junk</li>
              <li>Đảm bảo email đã nhập chính xác</li>
              <li>Chờ vài phút và làm mới hộp thư</li>
            </ul>
          </div>
        </div>
      )}

      {/* Back to Login */}
      <p className="mt-6 text-center text-sm md:text-base text-gray-600">
        <button
          className="text-[#39BDCC] hover:underline font-semibold"
          onClick={handleBackToLogin}
        >
          ← Quay lại đăng nhập
        </button>
      </p>

      {/* Back to Home */}
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
    </>
  );

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#b3f0f5] via-[#d9fafa] to-[#e0fdfd] p-4">
      <div className="bg-white shadow-2xl rounded-3xl px-8 py-8 md:px-10 md:py-10 w-full max-w-lg">
        {renderFormContent()}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
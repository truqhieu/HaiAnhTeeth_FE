import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { Input, Button, Form } from "@heroui/react";

import { authApi } from "@/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showValidation, setShowValidation] = React.useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  // Xác thực mật khẩu
  const getPasswordErrors = (): string[] => {
    const errors: string[] = [];

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
  const isPasswordInvalid =
    showValidation && (!password || getPasswordErrors().length > 0);
  const isConfirmPasswordInvalid =
    showValidation && (!confirmPassword || password !== confirmPassword);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowValidation(true);

    // Kiểm tra validation
    const hasErrors =
      !password ||
      getPasswordErrors().length > 0 ||
      !confirmPassword ||
      password !== confirmPassword;

    if (hasErrors) {
      return;
    }

    if (!token) {
      setSubmitStatus("error");
      setErrorMessage("Token không hợp lệ. Vui lòng kiểm tra lại link.");

      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authApi.resetPassword({
        token,
        email,
        newPassword: password,
      });

      if (!result.success) {
        throw new Error(result.message || "Không thể đặt lại mật khẩu");
      }

      // eslint-disable-next-line no-console
      console.log("Reset password successful:", result);

      setSubmitStatus("success");

      // Redirect về trang chủ sau 3 giây
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra. Vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kiểm tra token có tồn tại không
  if (!token || !email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Link không hợp lệ
          </h2>
          <p className="text-gray-600 mb-6">
            Token không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu link đặt lại
            mật khẩu mới.
          </p>
          <Button
            className="w-full bg-[#39BDCC] text-white hover:bg-[#2ca6b5]"
            onPress={() => navigate("/")}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // Hiển thị thành công
  if (submitStatus === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Đặt lại mật khẩu thành công!
          </h2>
          <p className="text-gray-600 mb-6">
            Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển về trang chủ
            sau vài giây...
          </p>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39BDCC]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 py-12">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-center p-6 border-b border-[#39BDCC]">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/Screenshot_2025-09-19_141436-removebg-preview.png"
            />
            <h2 className="text-2xl font-bold text-gray-800">
              Đặt lại mật khẩu
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Vui lòng nhập mật khẩu mới của bạn. Mật khẩu phải đáp ứng các yêu
            cầu bảo mật.
          </p>

          <Form autoComplete="off" className="space-y-4" onSubmit={onSubmit}>
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
                  !password ? (
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
                  Mật khẩu mới <span className="text-red-500">*</span>
                </>
              }
              labelPlacement="outside"
              name="password"
              placeholder="Nhập mật khẩu mới"
              type={isPasswordVisible ? "text" : "password"}
              value={password}
              onValueChange={setPassword}
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
                  ? !confirmPassword
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
              labelPlacement="outside"
              name="confirm-password"
              placeholder="Nhập lại mật khẩu mới"
              type={isConfirmPasswordVisible ? "text" : "password"}
              value={confirmPassword}
              onValueChange={setConfirmPassword}
            />

            {submitStatus === "error" && (
              <div className="p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                <div className="flex items-center">
                  <XCircleIcon className="w-5 h-5 mr-2" />
                  {errorMessage}
                </div>
              </div>
            )}

            <Button
              className="w-full flex items-center justify-center text-white bg-[#39BDCC] hover:bg-[#2ca6b5]"
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              type="submit"
              variant="solid"
            >
              {!isSubmitting && <LockClosedIcon className="w-5 h-5 mr-2" />}
              {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Button>
          </Form>

          <div className="mt-6 text-center">
            <button
              className="text-sm text-blue-500 hover:underline"
              onClick={() => navigate("/")}
            >
              ← Quay về trang chủ
            </button>
          </div>
        </div>
      </div>

      {/* Thông tin bổ sung */}
      <div className="mt-6 max-w-md w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          Yêu cầu mật khẩu:
        </h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Ít nhất 4 ký tự</li>
          <li>• Ít nhất 1 chữ cái viết hoa</li>
          <li>• Ít nhất 1 ký tự đặc biệt</li>
        </ul>
      </div>
    </div>
  );
};

export default ResetPassword;

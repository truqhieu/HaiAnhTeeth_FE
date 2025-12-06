import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  // Debug: Log URL parameters
  React.useEffect(() => {
    console.log("🔍 Reset Password Page - URL Parameters:");
    console.log("  Token:", token);
    console.log("  Email:", email);
    console.log("  Full URL:", window.location.href);
  }, [token, email]);

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
        email: email ?? "",
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
          : "Có lỗi xảy ra. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kiểm tra token có tồn tại không
  if (!token || !email) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#b3f0f5] via-[#d9fafa] to-[#e0fdfd]">
        <div className="bg-white shadow-2xl rounded-3xl px-10 py-10 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-red-100 rounded-full p-4 mb-4">
              <XCircleIcon className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-800">
              Link không hợp lệ
            </h2>
            <p className="text-gray-500 text-lg mt-2 text-center">
              Token không tồn tại hoặc đã hết hạn
            </p>
          </div>

          <p className="text-gray-600 text-base mb-6 text-center">
            Vui lòng yêu cầu link đặt lại mật khẩu mới.
          </p>

          <Button
            className="w-full py-4 text-lg font-semibold text-white bg-[#39BDCC] hover:bg-[#2ca6b5] transition-all duration-300 rounded-xl"
            onPress={() => navigate("/")}
          >
            Về trang chủ
          </Button>

          <div className="mt-8 flex justify-center">
            <Button
              color="default"
              variant="flat"
              size="lg"
              onPress={() => navigate("/forgot-password")}
              className="flex items-center gap-2 font-semibold text-gray-700 hover:text-[#39BDCC] transition"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Yêu cầu link mới
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị thành công
  if (submitStatus === "success") {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#b3f0f5] via-[#d9fafa] to-[#e0fdfd]">
        <div className="bg-white shadow-2xl rounded-3xl px-10 py-10 w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-800">
              Thành công!
            </h2>
            <p className="text-gray-500 text-lg mt-2 text-center">
              Mật khẩu đã được cập nhật
            </p>
          </div>

          <div className="p-6 bg-green-100 border border-green-300 rounded-lg text-center mb-6">
            <p className="text-gray-700 text-base">
              Mật khẩu của bạn đã được cập nhật thành công. Bạn sẽ được chuyển
              về trang chủ sau vài giây...
            </p>
          </div>

          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#39BDCC]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#b3f0f5] via-[#d9fafa] to-[#e0fdfd]">
      <div className="bg-white shadow-2xl rounded-3xl px-10 py-10 w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img
            alt="Logo"
            className="h-20 w-auto mb-4 object-contain"
            src="/logo1.png"
          />
          <h2 className="text-4xl font-extrabold text-gray-800">
            Đặt lại mật khẩu
          </h2>
          <p className="text-gray-500 text-lg mt-2 text-center">
            Vui lòng nhập mật khẩu mới của bạn
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            Yêu cầu mật khẩu:
          </h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Ít nhất 4 ký tự</li>
            <li>• Ít nhất 1 chữ cái viết hoa</li>
            <li>• Ít nhất 1 ký tự đặc biệt</li>
          </ul>
        </div>

        {/* Error */}
        {submitStatus === "error" && (
          <div className="mb-5 p-4 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 mr-2" />
              {errorMessage}
            </div>
          </div>
        )}

        {/* Form */}
        <Form autoComplete="off" className="space-y-6" onSubmit={onSubmit}>
          <Input
            fullWidth
            autoComplete="new-password"
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
            name="password"
            placeholder="Nhập mật khẩu mới"
            size="lg"
            type="password"
            value={password}
            onValueChange={setPassword}
          />

          <Input
            fullWidth
            autoComplete="new-password"
            errorMessage={
              isConfirmPasswordInvalid
                ? !confirmPassword
                  ? "Vui lòng xác nhận mật khẩu"
                  : "Mật khẩu không khớp"
                : undefined
            }
            isInvalid={isConfirmPasswordInvalid}
            label={
              <>
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </>
            }
            name="confirm-password"
            placeholder="Nhập lại mật khẩu mới"
            size="lg"
            type="password"
            value={confirmPassword}
            onValueChange={setConfirmPassword}
          />

          <Button
            className="w-full py-4 text-lg font-semibold text-white bg-[#39BDCC] hover:bg-[#2ca6b5] transition-all duration-300 rounded-xl"
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            type="submit"
            variant="solid"
          >
            {!isSubmitting && <LockClosedIcon className="w-6 h-6 mr-2" />}
            {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </Button>
        </Form>

        {/* Back to Login */}
        <p className="mt-6 text-center text-base text-gray-600">
          <button
            className="text-[#39BDCC] hover:underline font-semibold"
            onClick={() => navigate("/login")}
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
      </div>
    </div>
  );
};

export default ResetPassword;
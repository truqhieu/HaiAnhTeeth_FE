import React from "react";
import { useNavigate } from "react-router-dom";
import { LockClosedIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form } from "@heroui/react";

import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/api";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [emailTouched, setEmailTouched] = React.useState(false);

  const validateEmail = (value: string): boolean =>
    value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;

  const isInvalidEmail = React.useMemo(() => {
    if (!emailTouched || email === "") return false;

    return !validateEmail(email);
  }, [email, emailTouched]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.data?.user && response.data?.token) {
        const loginUser = {
          ...response.data.user,
          _id: response.data.user._id || response.data.user.id || "",
        };

        login(loginUser as any, response.data.token);

        try {
          const profileResponse = await authApi.getProfile();

          if (profileResponse.success && profileResponse.data?.user) {
            const normalizedUser = {
              ...profileResponse.data.user,
              _id:
                profileResponse.data.user._id ||
                profileResponse.data.user.id ||
                "",
            };

            updateUser(normalizedUser as any);
          }
        } catch (profileError) {
          console.warn("Could not load full profile:", profileError);
        }

        const role = response.data.user.role?.toLowerCase();

        if (role === "admin") navigate("/admin/accounts");
        else if (role === "manager") navigate("/manager/dashboard");
        else if (role === "staff") navigate("/staff/dashboard");
        else if (role === "doctor") navigate("/doctor/schedule");
        else if (role === "nurse") navigate("/nurse/schedule");
        else navigate("/");
      } else {
        setError(response.message || "Đăng nhập thất bại");
      }
    } catch (error: any) {
      setError(error.message || "Không thể kết nối đến máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#b3f0f5] via-[#d9fafa] to-[#e0fdfd] p-4">
      <div className="bg-white shadow-2xl rounded-3xl px-8 py-8 md:px-10 md:py-10 w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 md:mb-8">
          <img
            alt="Logo"
            className="h-16 md:h-20 w-auto mb-3 md:mb-4 object-contain"
            src="/logo1.png"
          />
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800">Đăng nhập</h2>
          <p className="text-gray-500 text-base md:text-lg mt-2 text-center">
            Chào mừng bạn quay lại với hệ thống nha khoa
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
            autoComplete="off"
            errorMessage={isInvalidEmail ? "Vui lòng nhập email hợp lệ" : ""}
            isInvalid={isInvalidEmail}
            label={
              <>
                Email <span className="text-red-500">*</span>
              </>
            }
            placeholder="Nhập email của bạn"
            size="lg"
            value={email}
            onValueChange={setEmail}
            onBlur={() => setEmailTouched(true)}
          />

          <Input
            fullWidth
            autoComplete="new-password"
            label={
              <>
                Mật khẩu <span className="text-red-500">*</span>
              </>
            }
            placeholder="Nhập mật khẩu của bạn"
            size="lg"
            type="password"
            value={password}
            onValueChange={setPassword}
            classNames={{
              inputWrapper: "group-data-[focus=true]:ring-2 group-data-[focus=true]:ring-[#39BDCC]"
            }}
          />

          <div className="text-right">
            <button
              className="text-base text-[#39BDCC] hover:underline font-semibold"
              type="button"
              onClick={() => navigate("/reset-password")}
            >
              Quên mật khẩu?
            </button>
          </div>

          <Button
            className="w-full py-4 text-lg font-semibold text-white bg-[#39BDCC] hover:bg-[#2ca6b5] transition-all duration-300 rounded-xl"
            isDisabled={isLoading || !email || !password}
            isLoading={isLoading}
            type="submit"
            variant="solid"
          >
            {!isLoading && <LockClosedIcon className="w-6 h-6 mr-2" />}
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </Form>

        {/* Signup and Links */}
        <div className="mt-6 space-y-3">
          <p className="text-center text-sm md:text-base text-gray-600">
            Bạn chưa có tài khoản?{" "}
            <button
              className="text-[#39BDCC] hover:underline font-semibold"
              onClick={() => navigate("/signup")}
            >
              Đăng ký ngay
            </button>
          </p>
          <p className="text-center text-sm md:text-base text-gray-600">
            Bạn quên mật khẩu?{" "}
            <button
              className="text-[#39BDCC] hover:underline font-semibold"
              onClick={() => navigate("/forgot-password")}
            >
              Đặt lại mật khẩu
            </button>
          </p>
        </div>

        {/* ✅ Nút trở về trang chủ */}
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

export default LoginForm;
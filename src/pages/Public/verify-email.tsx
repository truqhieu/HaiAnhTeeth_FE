import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Spinner } from "@heroui/react"; // <-- dùng thư viện bạn đang có
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

import { authApi } from "@/api"; // dùng authApi.verifyEmail if available

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<
    "waiting" | "loading" | "success" | "error" | "expired"
  >("waiting");
  const [message, setMessage] = useState<string>("");

  // tránh gọi nhiều lần / tránh setState khi unmounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    // trạng thái ban đầu: chờ 3s trước khi gọi API
    setStatus("loading");
    setMessage("Đang xác thực email của bạn...");

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    // nếu thiếu token/email thì sẽ báo lỗi SAU 3s (theo yêu cầu của bạn)
    const timer = setTimeout(async () => {
      if (!isMounted.current) return;

      if (!token || !email) {
        setStatus("error");
        setMessage("Link xác thực không hợp lệ hoặc thiếu thông tin.");
        return;
      }

      try {
        // Nếu bạn có authApi.verifyEmail(token, email), dùng nó.
        // Nếu không, thay thế bằng axios.get(...)
        const result = await authApi.verifyEmail(token, email);
        // console.log("verify result", result);

        if (!isMounted.current) return;

        const msg = (result.message || "").toLowerCase();

        if (result.success) {
          setStatus("success");
          setMessage(result.message || "Xác thực email thành công! Đang chuyển hướng...");

          // Nếu API trả token + user thì tự login trước khi redirect
          if (result.data?.token && result.data?.user) {
            try {
              // nếu bạn có context login, bạn có thể gọi login(result.data.user, result.data.token)
              // import { useAuth } from "@/contexts/AuthContext"; const { login } = useAuth();
              // login(result.data.user, result.data.token);
            } catch (err) {
              // ignore login error client-side
            }
          }

          setTimeout(() => {
            if (!isMounted.current) return;
            navigate("/", { replace: true });
          }, 1500);
          return;
        }

        // Trường hợp backend nói "already verified" -> coi là success
        if (msg.includes("đã xác thực") || msg.includes("already verified") || msg.includes("already verified")) {
          setStatus("success");
          setMessage("Email của bạn đã được xác thực trước đó. Đang chuyển hướng...");
          setTimeout(() => {
            if (!isMounted.current) return;
            navigate("/", { replace: true });
          }, 1200);
          return;
        }

        // Token expired
        if (msg.includes("hết hạn") || msg.includes("expired")) {
          setStatus("expired");
          setMessage(result.message || "Link xác thực đã hết hạn.");
          return;
        }

        // Mọi lỗi khác -> error
        setStatus("error");
        setMessage(result.message || "Xác thực email thất bại.");
      } catch (err: any) {
        if (!isMounted.current) return;
        // Nếu server trả lỗi chi tiết trong err.response?.data, lấy ra
        const serverMessage =
          err?.response?.data?.message || err?.message || "Lỗi kết nối đến server";
        setStatus("error");
        setMessage(serverMessage);
      }
    }, 3000); // ⏳ chờ 3 giây trước khi gọi API

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {status === "loading" && (
          <div className="text-center">
            <Spinner
              className="mx-auto mb-4"
              color="primary"
              label="Đang xác thực email..."
              size="lg"
            />
            <h2 className="text-xl font-semibold text-gray-800">Đang xác thực</h2>
            <p className="text-gray-600 mt-2">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thành công!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button className="w-full bg-green-500 text-white" onPress={() => navigate("/")}>
              Về trang chủ
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <XCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thất bại</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button className="w-full bg-blue-500 text-white" onPress={() => navigate("/")}>
                Về trang chủ
              </Button>
              <Button className="w-full" variant="bordered" onPress={() => window.location.reload()}>
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {status === "expired" && (
          <div className="text-center">
            <ExclamationTriangleIcon className="w-20 h-20 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Link đã hết hạn</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button className="w-full bg-blue-500 text-white" onPress={() => navigate("/")}>
              Về trang chủ & Đăng ký lại
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

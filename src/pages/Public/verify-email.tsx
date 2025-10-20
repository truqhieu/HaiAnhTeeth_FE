import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button, Spinner } from "@heroui/react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/api";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired"
  >("loading");
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        setStatus("error");
        setMessage("Link xác thực không hợp lệ. Thiếu thông tin.");
        return;
      }

      try {
          const result = await authApi.verifyEmail(token, email);

        if (result.success) {
          setStatus("success");
          setMessage(result.message || "Xác thực email thành công!");
          setUserData(result.data);

          // Tự động login nếu có token
          if (result.data?.token && result.data?.user) {
            login(result.data.user, result.data.token);

            // Redirect sau 2 giây
            setTimeout(() => {
              const role = result.data.user.role;
              if (role === "Admin") {
                navigate("/admin/accounts");
              } else if (role === "Manager") {
                navigate("/manager/rooms");
              } else {
                navigate("/");
              }
            }, 2000);
          } else {
            // Nếu không có token, redirect về login sau 3 giây
            setTimeout(() => {
              navigate("/");
            }, 3000);
          }
        } else {
          if (
            result.message?.includes("hết hạn") ||
            result.message?.includes("expired")
          ) {
            setStatus("expired");
          } else {
            setStatus("error");
          }
          setMessage(result.message || "Xác thực email thất bại");
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Lỗi kết nối đến server");
      }
    };

    verifyEmail();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Loading */}
        {status === "loading" && (
          <div className="text-center">
            <Spinner
              className="mx-auto mb-4"
              color="primary"
              label="Đang xác thực email..."
              size="lg"
            />
            <p className="text-gray-600 mt-4">Vui lòng đợi một chút...</p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="text-center">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Xác thực thành công!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>

            {userData?.user && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  Chào mừng <strong>{userData.user.fullName}</strong>!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Đang tự động đăng nhập...
                </p>
              </div>
            )}

            <Button
              className="w-full bg-green-500 text-white hover:bg-green-600"
              onPress={() => navigate("/")}
            >
              Về trang chủ
            </Button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="text-center">
            <XCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Xác thực thất bại
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="space-y-3">
              <Button
                className="w-full bg-blue-500 text-white hover:bg-blue-600"
                onPress={() => navigate("/")}
              >
                Về trang chủ
              </Button>
              <Button
                className="w-full"
                variant="bordered"
                onPress={() => window.location.reload()}
              >
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* Expired */}
        {status === "expired" && (
          <div className="text-center">
            <ExclamationTriangleIcon className="w-20 h-20 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Link đã hết hạn
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-800">
                Link xác thực chỉ có hiệu lực trong 24 giờ.
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Vui lòng đăng ký lại hoặc yêu cầu gửi lại email xác thực.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-blue-500 text-white hover:bg-blue-600"
                onPress={() => navigate("/")}
              >
                Về trang chủ & Đăng ký lại
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;


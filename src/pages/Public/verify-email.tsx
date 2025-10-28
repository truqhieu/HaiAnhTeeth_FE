import { useEffect, useState, useRef } from "react";
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
  const { login, user: currentUser } = useAuth();

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired"
  >("loading");
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState<any>(null);

  const isVerified = useRef(false);
  const isMounted = useRef(true);
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null);
  const errorCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    const verifyEmail = async () => {
      if (isVerified.current) return;

      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        if (!isVerified.current) {
          setStatus("error");
          setMessage("Link xác thực không hợp lệ hoặc đã hết hạn.");
        }

        return;
      }

      try {
        const result = await authApi.verifyEmail(token, email);

        console.log("Kết quả verify:", result);

        if (!isMounted.current) return;

        if (result.success) {
          isVerified.current = true;

          setStatus("success");
          setMessage(result.message || "Xác thực email thành công!");
          setUserData(result.data);

          if (result.data?.token && result.data?.user) {
            const { user, token } = result.data;

            login(user as any, token);

            // ✅ Redirect ngay lập tức với window.location để reset URL
            redirectTimeout.current = setTimeout(() => {
              if (!isMounted.current) return;
              const role = user?.role;

              if (role?.toLowerCase() === "admin") window.location.href = "/admin/accounts";
              else if (role?.toLowerCase() === "manager")
                window.location.href = "/manager/rooms";
              else window.location.href = "/";
            }, 2000);
          } else {
            redirectTimeout.current = setTimeout(() => {
              if (isMounted.current) window.location.href = "/";
            }, 3000);
          }

          return;
        }

        const msg = result.message?.toLowerCase() || "";

        if (msg.includes("đã xác thực") || msg.includes("already verified")) {
          setStatus("success");
          setMessage("Email của bạn đã được xác thực trước đó!");
          isVerified.current = true;

          if (result.data?.token && result.data?.user) {
            const { user, token } = result.data;

            login(user as any, token);
            redirectTimeout.current = setTimeout(() => {
              if (!isMounted.current) return;
              const role = user?.role;

              if (role?.toLowerCase() === "admin") window.location.href = "/admin/accounts";
              else if (role?.toLowerCase() === "manager")
                window.location.href = "/manager/rooms";
              else window.location.href = "/";
            }, 2000);
          }

          return;
        }

        if (msg.includes("hết hạn") || msg.includes("expired")) {
          // ✅ Delay 3 giây rồi mới hiển thị popup hết hạn
          errorCheckTimeout.current = setTimeout(() => {
            if (isMounted.current) {
              setStatus("expired");
              setMessage(result.message || "Link xác thực đã hết hạn");
            }
          }, 3000);

          return;
        }

        // ✅ Delay 3 giây rồi mới hiển thị popup lỗi
        errorCheckTimeout.current = setTimeout(() => {
          if (isMounted.current) {
            setStatus("error");
            setMessage(result.message || "Xác thực email thất bại");
          }
        }, 3000);
      } catch (error: any) {
        if (!isMounted.current) return;
        // ✅ Delay 3 giây rồi mới hiển thị popup lỗi kết nối
        errorCheckTimeout.current = setTimeout(() => {
          if (isMounted.current) {
            setStatus("error");
            setMessage(error.message || "Lỗi kết nối đến server");
          }
        }, 3000);
      }
    };

    verifyEmail();

    return () => {
      isMounted.current = false;
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
      if (errorCheckTimeout.current) {
        clearTimeout(errorCheckTimeout.current);
      }
    };
  }, [searchParams, login, navigate]);

  // ✅ Nếu đang loading error và user đã login thành công → redirect luôn
  if (status === "loading" && currentUser) {
    redirectTimeout.current = setTimeout(() => {
      if (isMounted.current) {
        const role = currentUser?.role;

        if (role?.toLowerCase() === "admin") window.location.href = "/admin/accounts";
        else if (role?.toLowerCase() === "manager") window.location.href = "/manager/rooms";
        else window.location.href = "/";
      }
    }, 500);
  }

  if (isVerified.current && status === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-gray-600 text-sm">Đang chuyển hướng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 transition-all duration-300">
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
              onPress={() => (window.location.href = "/")}
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
                onPress={() => (window.location.href = "/")}
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

            <Button
              className="w-full bg-blue-500 text-white hover:bg-blue-600"
              onPress={() => (window.location.href = "/")}
            >
              Về trang chủ & Đăng ký lại
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

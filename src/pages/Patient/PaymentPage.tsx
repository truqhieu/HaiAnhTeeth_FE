import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import { Button, Spinner } from "@heroui/react";

import { paymentApi } from "@/api";

interface PaymentStatus {
  payment: {
    _id: string;
    appointmentId: string;
    amount: number;
    status: "Pending" | "Completed" | "Failed" | "Cancelled" | "Expired";
    QRurl?: string;
    expiresAt?: string;
  };
  appointment?: {
    _id: string;
    status: string;
    promotionId?: {
      _id: string;
      title: string;
      discountType: string;
      discountValue: number;
    } | null;
    originalPrice?: number;
    finalPrice?: number;
    discountAmount?: number;
  };
  confirmed?: boolean;
  expired?: boolean;
}

const PaymentPage = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();

  const [paymentData, setPaymentData] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment info khi mount
  useEffect(() => {
    if (!paymentId) return;
    const fetchPaymentInfo = async () => {
      try {
        setLoading(true);
        const res = await paymentApi.checkPaymentStatus(paymentId);

        if (res.data) {
        setPaymentData(res.data);
        setError(null);
        } else {
          setError("Không thể lấy thông tin thanh toán");
        }

        console.log("💳 Payment Status:", res.data);

        // Nếu thanh toán thành công, không polling nữa
        if (res.data?.confirmed) {
          console.log("✅ Thanh toán đã xác nhận!");
          // Auto redirect sau 3 giây
          setTimeout(() => {
            navigate("/patient/appointments");
          }, 3000);
        }
      } catch (err: any) {
        console.error("Lỗi lấy thông tin thanh toán:", err);
        setError(err.message || "Lỗi lấy thông tin thanh toán");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [paymentId, navigate]);

  // Polling để check status thanh toán mỗi 5 giây
  useEffect(() => {
    if (!paymentId) return;
    // ⭐ Chỉ polling nếu thanh toán chưa thành công, chưa hết hạn và chưa bị hủy
    if (
      !paymentData?.confirmed &&
      !paymentData?.expired &&
      paymentData?.payment?.status === "Pending"
    ) {
      const interval = setInterval(async () => {
        try {
          setCheckingStatus(true);
          const res = await paymentApi.checkPaymentStatus(paymentId);

          if (res.data) {
          setPaymentData(res.data);
          }
          setPollingCount((prev) => prev + 1);

          console.log(
            "🔄 Check #" + (pollingCount + 1) + " - Status:",
            res.data?.payment?.status,
          );

          // ⭐ Nếu thanh toán thành công, stop polling và redirect
          if (res.data?.confirmed) {
            console.log("✅ Thanh toán đã được xác nhận!");
            clearInterval(interval);
            setTimeout(() => {
              navigate("/patient/appointments");
            }, 2000);
          }

          // ⭐ Nếu thanh toán đã hết hạn hoặc bị hủy, stop polling
          if (
            res.data?.expired ||
            res.data?.payment?.status === "Cancelled" ||
            res.data?.payment?.status === "Expired"
          ) {
            console.log("⏰ Thanh toán đã hết hạn hoặc bị hủy!");
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Lỗi khi check status:", err);
        } finally {
          setCheckingStatus(false);
        }
      }, 5000); // Check mỗi 5 giây

      return () => clearInterval(interval);
    }
  }, [paymentId, paymentData?.confirmed, paymentData?.payment?.status, navigate, pollingCount]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN");
  };

  // Early return nếu không có paymentId
  if (!paymentId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <XCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Lỗi
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Không tìm thấy ID thanh toán
          </p>
          <Button
            className="w-full bg-blue-500 text-white hover:bg-blue-600"
            onPress={() => navigate("/")}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <Spinner color="primary" label="Đang tải thông tin thanh toán..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !paymentData?.payment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <XCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Lỗi
          </h1>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <Button
            className="w-full bg-blue-500 text-white hover:bg-blue-600"
            onPress={() => navigate("/")}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // ⭐ Cancelled/Expired state - thanh toán đã hết hạn hoặc bị hủy
  if (
    paymentData.expired ||
    paymentData.payment.status === "Cancelled" ||
    paymentData.payment.status === "Expired"
  ) {
    const isCancelled = paymentData.payment.status === "Cancelled";
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <XCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isCancelled ? "Thanh toán đã bị hủy" : "Thanh toán đã hết hạn"}
          </h1>
          <p className="text-gray-600 mb-4">
            {isCancelled
              ? "Thanh toán này đã bị hủy do không thanh toán trong thời gian quy định."
              : "Thời gian thanh toán đã hết hạn. Vui lòng đặt lịch lại nếu bạn vẫn muốn sử dụng dịch vụ."}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              ⚠️ {isCancelled
                ? "Lịch hẹn của bạn đã bị hủy. Vui lòng đặt lịch mới."
                : "Vui lòng quay lại và đặt lịch hẹn mới."}
            </p>
          </div>
          <Button
            className="w-full bg-blue-500 text-white hover:bg-blue-600"
            onPress={() => navigate("/")}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // Success state - thanh toán đã hoàn tất
  if (paymentData.confirmed && paymentData.payment.status === "Completed") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Thanh toán thành công!
          </h1>
          <p className="text-gray-600 mb-2">
            Lịch hẹn của bạn đã được xác nhận
          </p>
          {/* ⭐ Hiển thị giá promotion nếu có */}
          {paymentData.appointment?.promotionId && paymentData.appointment.originalPrice && paymentData.appointment.originalPrice > paymentData.payment.amount ? (
            <div className="text-sm mb-6">
              <p className="text-gray-500 line-through mb-1">
                Giá gốc: {formatCurrency(paymentData.appointment.originalPrice)} VND
              </p>
              <p className="text-green-600 font-semibold">
                Đã thanh toán: {formatCurrency(paymentData.payment.amount)} VND
              </p>
              <p className="text-xs text-green-600 mt-1">
                🎉 {paymentData.appointment.promotionId.title}
                {paymentData.appointment.discountAmount && (
                  <span> - Đã tiết kiệm {formatCurrency(paymentData.appointment.discountAmount)} VND</span>
                )}
              </p>
            </div>
          ) : (
          <p className="text-sm text-gray-500 mb-6">
            Số tiền: {formatCurrency(paymentData.payment.amount)} VND
          </p>
          )}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              ✅ Đơn hàng của bạn đã được lưu và sẽ được xử lý ngay. Hãy chờ
              liên hệ từ phòng khám.
            </p>
          </div>
          <Button
            className="w-full bg-green-500 text-white hover:bg-green-600"
            onPress={() => navigate("/patient/appointments")}
          >
            Xem lịch hẹn của tôi
          </Button>
        </div>
      </div>
    );
  }

  // Pending state - chờ thanh toán
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <ClockIcon className="w-16 h-16 text-blue-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Thanh toán qua Sepay
          </h1>
          <p className="text-gray-600">
            Quét mã QR bên dưới để hoàn tất thanh toán
          </p>
        </div>

        {/* Amount */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 text-center mb-1">
            Số tiền cần thanh toán
          </p>
          {/* ⭐ Hiển thị giá promotion nếu có */}
          {paymentData.appointment?.promotionId && paymentData.appointment.originalPrice && paymentData.appointment.originalPrice > paymentData.payment.amount ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 line-through mb-1">
                {formatCurrency(paymentData.appointment.originalPrice)} VND
              </p>
              <p className="text-3xl font-bold text-red-600 mb-2">
                {formatCurrency(paymentData.payment.amount)} VND
              </p>
              <div className="text-xs text-green-600 font-medium">
                🎉 {paymentData.appointment.promotionId.title}
                {paymentData.appointment.discountAmount && (
                  <span> - Giảm {formatCurrency(paymentData.appointment.discountAmount)} VND</span>
                )}
              </div>
            </div>
          ) : (
          <p className="text-3xl font-bold text-blue-600 text-center">
            {formatCurrency(paymentData.payment.amount)} VND
          </p>
          )}
        </div>

        {/* QR Code */}
        {paymentData.payment.QRurl ? (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <img
              alt="Payment QR Code"
              className="w-full rounded-lg"
              src={paymentData.payment.QRurl}
            />
            <p className="text-xs text-gray-500 text-center mt-2">
              Mã QR từ Sepay Banking
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 mb-6 text-center">
            <p className="text-gray-500">Đang tải mã QR...</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-amber-800 mb-2">
            📱 Cách thanh toán:
          </h3>
          <ol className="text-sm text-amber-700 space-y-1">
            <li>1. Mở ứng dụng ngân hàng của bạn</li>
            <li>2. Quét mã QR trên màn hình này</li>
            <li>3. Kiểm tra số tiền và xác nhận</li>
            <li>4. Hệ thống sẽ tự động cập nhật khi nhận được thanh toán</li>
          </ol>
        </div>

        {/* Status Check */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {checkingStatus ? (
            <>
              <Spinner color="primary" size="sm" />
              <span className="text-sm text-gray-600">
                Đang kiểm tra thanh toán...
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-500">
              Kiểm tra mỗi 5 giây (Lần {pollingCount})
            </span>
          )}
        </div>

        {/* Expiry Info */}
        {paymentData.payment.expiresAt && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 text-center">
            <p className="text-xs text-orange-800">
              ⏰ Hạn thanh toán:{" "}
              {new Date(paymentData.payment.expiresAt).toLocaleString("vi-VN")}
            </p>
          </div>
        )}

        {/* Manual Check Button */}
        <Button
          className="w-full bg-blue-500 text-white hover:bg-blue-600"
          isDisabled={checkingStatus}
          onPress={async () => {
            try {
              setCheckingStatus(true);
              const res = await paymentApi.checkPaymentStatus(paymentId);

              if (res.data) {
              setPaymentData(res.data);
                if (res.data.confirmed) {
                navigate("/patient/appointments");
                }
              }
            } finally {
              setCheckingStatus(false);
            }
          }}
        >
          {checkingStatus ? "Đang kiểm tra..." : "Kiểm tra ngay"}
        </Button>

        {/* Back Button */}
        <Button
          className="w-full mt-3"
          variant="bordered"
          onPress={() => navigate("/")}
        >
          Quay lại
        </Button>
      </div>
    </div>
  );
};

export default PaymentPage;

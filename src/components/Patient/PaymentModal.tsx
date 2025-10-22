import React, { useState, useEffect } from 'react';
import {
  QrCodeIcon,
  ViewfinderCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'; // Sử dụng outline icons cho thanh lịch
import { paymentApi } from '@/api'; // Import API vừa tạo

type PaymentStatus = 'pending' | 'checking' | 'success' | 'error' | 'expired';
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Prop mới để nhận paymentId từ context
  paymentId: string | null;
}

// Hằng số thời gian đếm ngược (10 phút * 60 giây)
const COUNTDOWN_SECONDS = 10 * 60;

/**
 * Helper function để định dạng giây thành MM:SS
 */
const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return {
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, paymentId }) => {
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { minutes, seconds } = formatTime(timeLeft);

  /**
   * Logic đếm ngược
   * 1. Chỉ chạy khi modal được mở (isOpen)
   * 2. Reset lại 10 phút mỗi khi modal mở
   * 3. Dừng lại và gọi onClose() khi hết giờ
   * 4. Dọn dẹp (clear interval) khi component unmount hoặc modal đóng
   */
  useEffect(() => {
    // Không làm gì nếu modal đang đóng
    if (!isOpen || !paymentId) {
      setStatus('pending');
      return;
    }

    // Reset lại thời gian mỗi khi mở modal
    setTimeLeft(COUNTDOWN_SECONDS);
    setStatus('pending'); // Reset trạng thái
    setErrorMessage(null); // Reset lỗi

    // Bắt đầu đếm ngược
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(intervalId); // Dừng đếm ngược
          onClose(); // Tự động đóng modal khi hết giờ
          setStatus('expired');
          return 0;
        }
        return prevTime - 1; // Giảm 1 giây
      });
    }, 1000); // Cập nhật mỗi giây

    // Hàm dọn dẹp:
    // Chạy khi component unmount hoặc khi `isOpen` thay đổi (từ true -> false)
    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen, paymentId, onClose]); // Phụ thuộc vào `isOpen` và `onClose`

   /**
   * Logic kiểm tra thanh toán
   * 1. Chỉ chạy khi modal mở, có paymentId và chưa thành công
   * 2. Gọi API checkPaymentStatus mỗi 5 giây
   * 3. Nếu thành công, hiển thị màn hình success và dừng kiểm tra
   * 4. Nếu lỗi, hiển thị lỗi và dừng kiểm tra
   */
  useEffect(() => {
    if (!isOpen || !paymentId || status === 'success' || status === 'error') {
      return;
    }

    const checkStatus = async () => {
      try {
        setStatus('checking');
        console.log(`🔍 Checking payment status for ID: ${paymentId}...`);
        const response = await paymentApi.checkPaymentStatus(paymentId);

        if (response.success && response.data?.confirmed) {
          console.log('✅ Payment confirmed!', response.data);
          setStatus('success');
          // Tự động đóng modal sau 5 giây
          setTimeout(() => {
            onClose();
          }, 5000);
        } else {
          // Vẫn đang chờ, không làm gì cả, lần check tiếp theo sẽ chạy
          console.log('...Payment not yet confirmed.');
          setStatus('pending');
        }
      } catch (error: any) {
        console.error('❌ Error checking payment status:', error);
        setErrorMessage(error.message || 'Lỗi kết nối khi kiểm tra thanh toán.');
        setStatus('error');
      }
    };

    // Gọi lần đầu tiên ngay lập tức
    checkStatus();
    // Sau đó gọi mỗi 5 giây
    const paymentIntervalId = setInterval(checkStatus, 5000);

    // Dọn dẹp khi modal đóng hoặc paymentId thay đổi
    return () => {
      clearInterval(paymentIntervalId);
    };
  }, [isOpen, paymentId, onClose, status]);
  // Không render gì nếu modal không mở
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 transition-all duration-300">
        {/* Tiêu đề chính */}
        <div className="text-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Thanh toán cho buổi tư vấn của bạn
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Vui lòng hoàn thành thanh toán trong thời gian quy định để xác nhận
            lịch hẹn tư vấn của bạn.
          </p>
        </div>

        {/* Thân Modal (Chia 2 cột) */}
        <div className={`grid grid-cols-1 ${status === 'success' ? '' : 'md:grid-cols-2'} gap-8 p-8`}>
          
          {/* --- TRẠNG THÁI THÀNH CÔNG --- */}
          {status === 'success' && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <CheckCircleIcon className="w-24 h-24 text-green-500 mb-6" />
              <h2 className="text-3xl font-bold text-gray-800">Thanh toán thành công!</h2>
              <p className="text-gray-600 mt-3">
                Lịch hẹn của bạn đã được xác nhận. Chúng tôi sẽ liên hệ với bạn sớm nhất.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Cửa sổ này sẽ tự động đóng sau 5 giây.
              </p>
              <button
                onClick={onClose}
                className="w-full max-w-xs px-6 py-3 mt-8 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Đóng ngay
              </button>
            </div>
          )}

          {/* --- TRẠNG THÁI LỖI --- */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center text-center p-8 md:col-span-2">
              <ExclamationTriangleIcon className="w-24 h-24 text-red-500 mb-6" />
              <h2 className="text-3xl font-bold text-gray-800">Đã có lỗi xảy ra</h2>
              <p className="text-red-600 bg-red-50 rounded-md p-3 mt-3">
                {errorMessage || 'Không thể kiểm tra trạng thái thanh toán.'}
              </p>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Đóng
                </button>
                <a href="#" className="px-6 py-3 bg-[#39BDCC] text-white rounded-lg font-semibold hover:bg-[#2ca6b5] transition">
                  Liên hệ hỗ trợ
                </a>
              </div>
            </div>
          )}

          {['pending', 'checking'].includes(status) && (<>
            {/* Cột trái: QR và Đếm ngược */}
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800">
              Quét mã QR để thanh toán
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Giao dịch sẽ hết hạn sau:
            </p>

            {/* Đồng hồ đếm ngược */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg w-20 h-20">
                <span className="text-3xl font-bold text-[#39BDCC]">{minutes}</span>
                <span className="text-xs text-gray-500">Phút</span>
              </div>
              <span className="text-3xl font-bold text-gray-400">:</span>
              <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg w-20 h-20">
                <span className="text-3xl font-bold text-[#39BDCC]">{seconds}</span>
                <span className="text-xs text-gray-500">Giây</span>
              </div>
            </div>

            {/* Mã QR (Sử dụng placeholder) */}
            <div className="p-2 border bg-white rounded-lg shadow-md">
              <img
                // TODO: Thay bằng API tạo QR động với nội dung thanh toán từ backend
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=APPOINTMENT ${paymentId?.slice(-8).toUpperCase()}`}
                alt="Mã QR thanh toán"
                className="w-48 h-48"
              />
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Vui lòng kiểm tra lại thông tin và xác nhận thanh toán trên ứng
              dụng của bạn.
            </p>
            {/* Trạng thái đang kiểm tra */}
            {status === 'checking' && (
              <div className="flex items-center text-sm text-blue-600 mt-4">
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                Đang kiểm tra giao dịch...
              </div>
            )}
            {/* Nút Hủy */}
            <button
              onClick={onClose}
              className="w-full px-6 py-3 mt-6 bg-pink-50 text-pink-700 rounded-lg font-semibold hover:bg-pink-100 transition"
            >
              Hủy giao dịch
            </button>
          </div>

          {/* Cột phải: Hướng dẫn */}
          <div className="pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">
              Hướng dẫn thanh toán
            </h3>
            
            <ul className="space-y-5">
              {/* Bước 1 */}
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                  <QrCodeIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Bước 1</h4>
                  <p className="text-sm text-gray-500">
                    Mở ứng dụng Ngân hàng/Ví điện tử trên điện thoại.
                  </p>
                </div>
              </li>
              
              {/* Bước 2 */}
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                  <ViewfinderCircleIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Bước 2</h4>
                  <p className="text-sm text-gray-500">
                    Chọn tính năng quét mã QR.
                  </p>
                </div>
              </li>
              
              {/* Bước 3 */}
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Bước 3</h4>
                  <p className="text-sm text-gray-500">
                    Kiểm tra lại thông tin và xác nhận thanh toán trên ứng dụng
                    của bạn.
                  </p>
                  
                </div>
              </li>
              
              {/* Bước 4 */}
              <li className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                  <ArrowPathIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Bước 4</h4>
                  <p className="text-sm text-gray-500">
                    Hệ thống đang kiểm tra giao dịch, vui lòng chờ trong giây
                    lát.
                  </p>
                </div>
              </li>
            </ul>

            {/* Hỗ trợ */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Gặp sự cố khi thanh toán?{' '}
                <a
                  href="#"
                  className="font-semibold text-[#39BDCC] hover:underline"
                >
                  Liên hệ hỗ trợ
                </a>
              </p>
            </div>
          </div>
          </>)}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
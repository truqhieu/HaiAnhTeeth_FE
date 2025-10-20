import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const Footer = () => {
  return (
    <footer className="bg-white text-black py-8 top-0 border-t border-[#39BDCC]">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cột 1: Thông tin liên hệ */}
        <div>
          <img
            alt="Logo Hải Anh"
            className="h-12 w-auto mb-4"
            src="/Screenshot_2025-09-19_141436-removebg-preview.png"
          />
          <h3 className="text-lg font-semibold mb-2">
            Phòng khám răng hàm mặt Hải Anh
          </h3>
          <div className="space-y-2">
            <p className="flex items-center">
              <MapPinIcon className="w-5 h-5 mr-2 text-gray-600" />
              <span>Số 55 Phố Yên Ninh, Phường Ba Đình, Thành phố Hà Nội</span>
            </p>
            <p className="flex items-center">
              <PhoneIcon className="w-5 h-5 mr-2 text-gray-600" />
              <span>024 3927 5568</span>
            </p>
            <p className="flex items-center">
              <EnvelopeIcon className="w-5 h-5 mr-2 text-gray-600" />
              <span>info@haianhteeth.vn</span>
            </p>
          </div>
        </div>

        {/* Cột 2: Về chúng tôi */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Về chúng tôi</h3>
          <ul className="space-y-2">
            <li>Giới thiệu về phòng khám</li>
            <li>Chuyên khoa</li>
            <li>Tin tức</li>
            <li>Tuyển dụng</li>
            <li>Hướng dẫn khám chữa bệnh</li>
            <li>Bác sĩ tại phòng khám Yên Ninh</li>
            <li>Bác sĩ tại phòng khám Phúc Trọng</li>
            <li>Minh</li>
          </ul>
        </div>

        {/* Cột 3: Chăm sóc khách hàng */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Chăm sóc khách hàng</h3>
          <ul className="space-y-2">
            <li>Chính sách bảo mật</li>
            <li>Hướng dẫn thanh toán</li>
            <li>Trưng bày trưng bày</li>
            <li>Câu hỏi thường gặp</li>
            <li>Phòng khám</li>
            <li>Thông tin đặt lịch</li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

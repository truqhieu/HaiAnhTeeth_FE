import React from "react";
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { FaFacebook, FaYoutube, FaInstagram, FaTiktok } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer className="w-full relative overflow-hidden">
      {/* Decorative SVG wave at top */}
      <div className="absolute inset-x-0 -top-1 pointer-events-none z-0">
        <svg viewBox="0 0 1440 120" className="w-full h-24" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,32 C240,96 480,0 720,32 C960,64 1200,8 1440,48 L1440,0 L0,0 Z"
            fill="#022D2D"
            opacity="0.95"
          />
        </svg>
      </div>

      {/* Background gradient + subtle blobs */}
      <div
        className="absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "linear-gradient(135deg, #d6eef1ff 0%, #9adce3ff 35%, #96d6deff 100%)",
        }}
      />
      <div className="absolute -right-40 -top-32 w-[420px] h-[420px] rounded-full opacity-10 bg-white blur-3xl transform rotate-12 -z-10" />
      <div className="absolute -left-40 -bottom-28 w-[360px] h-[360px] rounded-full opacity-8 bg-black blur-2xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10 relative text-black">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Cột 1: Thông tin liên hệ */}
          <div className="flex flex-col">
            <img
              alt="Logo Hải Anh"
              className="h-16 w-auto mb-6"
              src="/logo3.png"
            />
            <h3 className="text-xl font-bold text-black mb-4">
              Phòng khám răng hàm mặt Hải Anh
            </h3>
            <div className="space-y-3 flex-grow">
              <div className="flex items-start group">
                <MapPinIcon className="w-5 h-5 mr-3 mt-1 text-black flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-black/90 leading-relaxed text-sm">
                  Tổ Dân phố Đoàn Kết, Thị trấn Sơn Dương, huyện Sơn Dương, tỉnh Tuyên Quang, Vietnam 02073
                </span>
              </div>
              <a
                href="tel:0243927568"
                className="flex items-center group hover:text-black transition-colors"
              >
                <PhoneIcon className="w-5 h-5 mr-3 text-black flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-black font-medium text-sm">
                  033 828 1982
                </span>
              </a>
              <a
                href="mailto:info@haianhteeth.vn"
                className="flex items-center group hover:text-black transition-colors"
              >
                <EnvelopeIcon className="w-5 h-5 mr-3 text-black flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-black font-medium text-sm">
                  huaminhhai82@gmail.com
                </span>
              </a>
            </div>
          </div>

          {/* Cột 2: Về chúng tôi */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-black mb-4 pb-2 border-b-2 border-black/20 inline-block">
              Về chúng tôi
            </h3>
            <ul className="space-y-2.5 mt-4 flex-grow">
              {[
                "Giới thiệu về phòng khám",
                "Chuyên khoa",
                "Tin tức",
                "Tuyển dụng",
                "Hướng dẫn khám chữa bệnh",
                "Bác sĩ tại phòng khám Yên Ninh",
                "Bác sĩ tại phòng khám Phúc Trọng",
              ].map((item, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="text-black/80 hover:text-black hover:translate-x-1 inline-block transition-all duration-200 text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: Chăm sóc khách hàng */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-black mb-4 pb-2 border-b-2 border-black/20 inline-block">
              Chăm sóc khách hàng
            </h3>
            <ul className="space-y-2.5 mt-4 flex-grow">
              {[
                "Chính sách bảo mật",
                "Hướng dẫn thanh toán",
                "Câu hỏi thường gặp",
                "Phòng khám",
                "Thông tin đặt lịch",
              ].map((item, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="text-black/80 hover:text-black hover:translate-x-1 inline-block transition-all duration-200 text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4: Kết nối với chúng tôi */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-black mb-4 pb-2 border-b-2 border-black/20 inline-block">
              Kết nối với chúng tôi
            </h3>
            <p className="text-black/80 text-sm mb-6">
              Theo dõi chúng tôi trên mạng xã hội để cập nhật thông tin mới nhất
            </p>
            <div className="flex gap-4 mt-2">
              <a
                href="https://www.facebook.com/nhakhoahaianhtuyenquang"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white border-2 border-white/20 rounded-full flex items-center justify-center hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all duration-300 group shadow-sm"
                aria-label="Facebook"
              >
                <FaFacebook className="w-6 h-6 text-[#1877F2] group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-black/10">
          <p className="text-center text-black/70 text-sm">
            © {new Date().getFullYear()} Phòng khám răng hàm mặt Hải Anh. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

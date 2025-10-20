import { useState } from "react";
import {
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";

// THAY ĐỔI 1: Import `useBookingModal` và `BookingModal`
import { useBookingModal } from "@/contexts/BookingModalContext";
import { BookingModal } from "@/components"; // Giữ lại cho "Đặt lịch khám"

const Home = () => {
  // THAY ĐỔI 2: Lấy hàm `openBookingModal` từ context
  const { openBookingModal } = useBookingModal();

  const images = [
    "/your-banner.jpg",
    "/your-banner-2.jpg",
    "/your-banner-3.jpg",
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const handlePrev = () =>
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1,
    );

  const handleNext = () =>
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1,
    );

  // THAY ĐỔI 3: State cho modal "Đặt lịch khám" (không phải tư vấn)
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative w-full h-[500px] bg-gray-200">
        <img
          alt="Banner"
          className="w-full h-full object-cover"
          src={images[currentImageIndex]}
        />

        {/* Nút trái */}
        <button
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-[#39BDCC] p-2 rounded-full shadow hover:bg-gray-100"
          onClick={handlePrev}
        >
          &#8249;
        </button>

        {/* Nút phải */}
        <button
          className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-[#39BDCC] p-2 rounded-full shadow hover:bg-gray-100"
          onClick={handleNext}
        >
          &#8250;
        </button>

        {/* Box nổi với icon */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md px-8 py-4 flex space-x-12">
          <button
            className="text-[#39BDCC] font-medium hover:underline cursor-pointer flex items-center space-x-2"
            onClick={() => setIsBookingOpen(true)}
          >
            <CalendarIcon className="w-5 h-5 text-[#39BDCC]" />
            <span>Đặt lịch khám</span>
          </button>
          <a
            className="text-[#39BDCC] font-medium hover:underline flex items-center space-x-2"
            href="#doctor"
          >
            <UserIcon className="w-5 h-5 text-[#39BDCC]" />
            <span>Tìm bác sĩ</span>
          </a>
          <a
            className="text-[#39BDCC] font-medium hover:underline flex items-center space-x-2"
            href="#feedback"
          >
            <ChatBubbleLeftIcon className="w-5 h-5 text-[#39BDCC]" />
            <span>Góp ý</span>
          </a>
          <button
            className="text-[#39BDCC] font-medium hover:underline cursor-pointer flex items-center space-x-2"
            // THAY ĐỔI 4: Sử dụng `openBookingModal` để mở modal tư vấn
            onClick={openBookingModal}
          >
            <CalendarIcon className="w-5 h-5 text-[#39BDCC]" />
            <span>Đặt lịch tư vấn online</span>
          </button>
        </div>
      </div>
      {/* THAY ĐỔI 5: Chỉ giữ lại modal "Đặt lịch khám" ở đây.
          Modal tư vấn và thanh toán đã được quản lý bởi BookingModalProvider. */}
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      {/* Section dưới banner (sử dụng container) */}
      <div className="max-w-6xl mx-auto py-20 px-6 space-y-16">
        {/* Card 1 - Text trái, ảnh phải */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-md text-center md:text-left md:mr-auto">
            <h3 className="text-xl font-semibold text-[#39BDCC]">Dịch vụ 1</h3>
            <p className="text-gray-500">
              {" "}
              Mô tả ngắn gọn về dịch vụ 1. Thông tin giới thiệu sẽ nằm ở
              đây.{" "}
            </p>
          </div>{" "}
          <img
            alt="Card 1"
            className="w-56 h-56 object-cover rounded-md shadow md:ml-auto mt-6 md:mt-0"
            src="/card1.jpg"
          />
        </div>{" "}
        {/* Card 2 - Ảnh trái, text phải */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <img
            alt="Card 2"
            className="w-56 h-56 object-cover rounded-md shadow md:mr-auto mb-6 md:mb-0"
            src="/card2.jpg"
          />
          <div className="max-w-md text-center md:text-left md:ml-auto">
            <h3 className="text-xl font-semibold text-[#39BDCC]">Dịch vụ 2</h3>
            <p className="text-gray-500">
              {" "}
              Mô tả ngắn gọn về dịch vụ 2. Thông tin giới thiệu sẽ nằm ở
              đây.{" "}
            </p>
          </div>
        </div>{" "}
        {/* Card 3 - Text trái, ảnh phải */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-md text-center md:text-left md:mr-auto">
            <h3 className="text-xl font-semibold text-[#39BDCC]">Dịch vụ 3</h3>
            <p className="text-gray-500">
              {" "}
              Mô tả ngắn gọn về dịch vụ 3. Thông tin giới thiệu sẽ nằm ở
              đây.{" "}
            </p>
          </div>{" "}
          <img
            alt="Card 3"
            className="w-56 h-56 object-cover rounded-md shadow md:ml-auto mt-6 md:mt-0"
            src="/card3.jpg"
          />
        </div>{" "}
        {/* Card 4 - Ảnh trái, text phải */}{" "}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <img
            alt="Card 4"
            className="w-56 h-56 object-cover rounded-md shadow md:mr-auto mb-6 md:mb-0"
            src="/card4.jpg"
          />
          <div className="max-w-md text-center md:text-left md:ml-auto">
            <h3 className="text-xl font-semibold text-[#39BDCC]">Dịch vụ 4</h3>
            <p className="text-gray-500">
              {" "}
              Mô tả ngắn gọn về dịch vụ 4. Thông tin giới thiệu sẽ nằm ở
              đây.{" "}
            </p>
          </div>
        </div>
      </div>
      {/* Section đội ngũ bác sĩ */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center text-[#39BDCC] mb-8">
          {" "}
          Đội ngũ bác sĩ{" "}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <img
            alt="Doctor 1"
            className="w-full h-48 object-cover rounded-lg"
            src="/doctor1.jpg"
          />
          <img
            alt="Doctor 2"
            className="w-full h-48 object-cover rounded-lg"
            src="/doctor2.jpg"
          />
          <img
            alt="Doctor 3"
            className="w-full h-48 object-cover rounded-lg"
            src="/doctor3.jpg"
          />
          <img
            alt="Doctor 4"
            className="w-full h-48 object-cover rounded-lg"
            src="/doctor4.jpg"
          />
        </div>{" "}
      </div>{" "}
      {/* Form đặt lịch */}{" "}
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-[#39BDCC]">
            Request Appointment
          </h2>
          <p className="text-gray-600 text-lg">Quick & easy booking</p>{" "}
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600" htmlFor="name">
              Name
            </label>
            <input
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#39BDCC]"
              id="name"
              placeholder="Jane Smith"
              type="text"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600" htmlFor="email">
              Email
            </label>
            <input
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#39BDCC]"
              id="email"
              placeholder="jane@framer.com"
              type="email"
            />
          </div>{" "}
          <div>
            {" "}
            <label className="block text-sm text-gray-600" htmlFor="message">
              Message
            </label>
            <textarea
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#39BDCC]"
              id="message"
              placeholder="Your message..."
              rows={4}
            />
          </div>
          <button
            className="w-full bg-black text-white py-2 rounded-md font-medium hover:bg-gray-800"
            type="submit"
          >
            {" "}
            Submit{" "}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;

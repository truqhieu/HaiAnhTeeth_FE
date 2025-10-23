import { useState } from "react";
import {
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { useBookingModal } from "@/contexts/BookingModalContext";

const Home = () => {


  const images = [
    "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/566204463_122193638510359809_5577540246052546034_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=103&ccb=1-7&_nc_sid=833d8c&_nc_ohc=HJocOZy1OzIQ7kNvwFzJ4kO&_nc_oc=Adlr3PH49XeMVBwfqmLMna5YTHQhU2ZYQEPusr_HGV2pfSwArjaPCpyDCwT1eMNbWmI&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=Dttcniqd_4S8scHPaPnxcw&oh=00_AfcPtXDO_oUR5oCdoukdKOgnyB-ngA7UdapOL97Ca1SXrg&oe=68FF8213",
    "https://scontent.fhan14-5.fna.fbcdn.net/v/t39.30808-6/561145387_122192341532359809_300409251944642402_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=2NbXa8V9e2kQ7kNvwFJClFB&_nc_oc=AdkZwuRDXIT7YpYdSkJiqtNZUNlFZaQ7K62e0SxTiIBvkCqFKKKwm0yE6asfFIwkXiw&_nc_zt=23&_nc_ht=scontent.fhan14-5.fna&_nc_gid=mQCQe9wYq4JQk8wmZsKcYg&oh=00_AfdtiR4SmFrVxl1xhvExkFlR5cJAMg_9wBKx3cuJCm8iVw&oe=68FF8C90",
    "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/555076308_122190721040359809_5009409531579541387_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=oqTWmsqj1EwQ7kNvwGZ8BlS&_nc_oc=AdkOALoyNRgI9RWeooD57j2tcHiUB2N08bu_N-YQll_klpiMkiblBrP-n-V5d0quUcs&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=zZmHitR5FR62-TdHjxKNGQ&oh=00_AfdqHtbujk0WfULM7GiPZI0pX9iN2JRD-IiKdrHy5OofxA&oe=68FF71AB",
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

  // Sử dụng context để mở modal
  const { openBookingModal } = useBookingModal();

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
          onClick={openBookingModal}
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
            onClick={openBookingModal}
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
        </div>
      </div>
      {/* KHÔNG cần render BookingModal ở đây nữa,
          vì nó đã được quản lý bởi BookingModalProvider. */}
      {/* Section dưới banner - Tăng padding-top để box không bị che */}
      <div className="max-w-6xl mx-auto pt-24 pb-16 px-6 space-y-14">
        {/* Card 1 - Text trái, ảnh phải */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 max-w-lg text-center md:text-left">
            <h3 className="text-2xl font-semibold text-[#39BDCC] mb-3">Dịch vụ 1</h3>
            <p className="text-gray-600 leading-relaxed">
              Mô tả ngắn gọn về dịch vụ 1. Thông tin giới thiệu sẽ nằm ở đây.
            </p>
          </div>
          <img
            alt="Card 1"
            className="w-48 h-48 md:w-52 md:h-52 object-cover rounded-lg shadow-md flex-shrink-0"
            src="https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/555076308_122190721040359809_5009409531579541387_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=oqTWmsqj1EwQ7kNvwGZ8BlS&_nc_oc=AdkOALoyNRgI9RWeooD57j2tcHiUB2N08bu_N-YQll_klpiMkiblBrP-n-V5d0quUcs&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=zZmHitR5FR62-TdHjxKNGQ&oh=00_AfdqHtbujk0WfULM7GiPZI0pX9iN2JRD-IiKdrHy5OofxA&oe=68FF71AB"
          />
        </div>

        {/* Card 2 - Ảnh trái, text phải */}
        <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8">
          <div className="flex-1 max-w-lg text-center md:text-left">
            <h3 className="text-2xl font-semibold text-[#39BDCC] mb-3">Dịch vụ 2</h3>
            <p className="text-gray-600 leading-relaxed">
              Mô tả ngắn gọn về dịch vụ 2. Thông tin giới thiệu sẽ nằm ở đây.
            </p>
          </div>
          <img
            alt="Card 2"
            className="w-48 h-48 md:w-52 md:h-52 object-cover rounded-lg shadow-md flex-shrink-0"
            src="https://scontent.fhan14-4.fna.fbcdn.net/v/t39.30808-6/553068952_122190134954359809_8353379584978656470_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_ohc=l278OBuf71kQ7kNvwF8WyY_&_nc_oc=AdnAULq5Y4Se2BOaH4p95zlUdBFDqW1daV41RnmcBOEOeVklyRzMQmfisPOYA--1eNc&_nc_zt=23&_nc_ht=scontent.fhan14-4.fna&_nc_gid=dFRVrKjeRYdaTjsGNXeT-g&oh=00_AfcAxqJdelMjrqyV5O3cVNLX38RW6SZTJ_Bjx3mv0NjRtg&oe=68FF771B"
          />
        </div>

        {/* Card 3 - Text trái, ảnh phải */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 max-w-lg text-center md:text-left">
            <h3 className="text-2xl font-semibold text-[#39BDCC] mb-3">Dịch vụ 3</h3>
            <p className="text-gray-600 leading-relaxed">
              Mô tả ngắn gọn về dịch vụ 3. Thông tin giới thiệu sẽ nằm ở đây.
            </p>
          </div>
          <img
            alt="Card 3"
            className="w-48 h-48 md:w-52 md:h-52 object-cover rounded-lg shadow-md flex-shrink-0"
            src="https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/548260292_122189545454359809_8477717599939397988_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=UUADYr0OLswQ7kNvwHqyYHQ&_nc_oc=Adm0u22TUEjm26SI4ElPJOPQS9g0w_Vj12046yglurCd8ItwLyxRYRlMTaf7fikgsQU&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=KASGy301gaZErmzldIj2tQ&oh=00_AfcyCcAlLjWUdcajycmOYpblxj-7X6YHHIAMnXp1gAxhvg&oe=68FF82BA"
          />
        </div>

        {/* Card 4 - Ảnh trái, text phải */}
        <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8">
          <div className="flex-1 max-w-lg text-center md:text-left">
            <h3 className="text-2xl font-semibold text-[#39BDCC] mb-3">Dịch vụ 4</h3>
            <p className="text-gray-600 leading-relaxed">
              Mô tả ngắn gọn về dịch vụ 4. Thông tin giới thiệu sẽ nằm ở đây.
            </p>
          </div>
          <img
            alt="Card 4"
            className="w-48 h-48 md:w-52 md:h-52 object-cover rounded-lg shadow-md flex-shrink-0"
            src="/card4.jpg"
          />
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

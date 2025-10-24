import { useState } from "react";
import {
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  HeartIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useBookingModal } from "@/contexts/BookingModalContext";

const Home = () => {
  // Sử dụng context để mở modal
  const { openBookingModal } = useBookingModal();
  const images = [
    "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/566204463_122193638510359809_5577540246052546034_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=103&ccb=1-7&_nc_sid=833d8c&_nc_ohc=HJocOZy1OzIQ7kNvwFzJ4kO&_nc_oc=Adlr3PH49XeMVBwfqmLMna5YTHQhU2ZYQEPusr_HGV2pfSwArjaPCpyDCwT1eMNbWmI&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=Dttcniqd_4S8scHPaPnxcw&oh=00_AfcPtXDO_oUR5oCdoukdKOgnyB-ngA7UdapOL97Ca1SXrg&oe=68FF8213",
    "https://scontent.fhan14-5.fna.fbcdn.net/v/t39.30808-6/561145387_122192341532359809_300409251944642402_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=2NbXa8V9e2kQ7kNvwFJClFB&_nc_oc=AdkZwuRDXIT7YpYdSkJiqtNZUNlFZaQ7K62e0SxTiIBvkCqFKKKwm0yE6asfFIwkXiw&_nc_zt=23&_nc_ht=scontent.fhan14-5.fna&_nc_gid=mQCQe9wYq4JQk8wmZsKcYg&oh=00_AfdtiR4SmFrVxl1xhvExkFlR5cJAMg_9wBKx3cuJCm8iVw&oe=68FF8C90",
    "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/555076308_122190721040359809_5009409531579541387_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=oqTWmsqj1EwQ7kNvwGZ8BlS&_nc_oc=AdkOALoyNRgI9RWeooD57j2tcHiUB2N08bu_N-YQll_klpiMkiblBrP-n-V5d0quUcs&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=zZmHitR5FR62-TdHjxKNGQ&oh=00_AfdqHtbujk0WfULM7GiPZI0pX9iN2JRD-IiKdrHy5OofxA&oe=68FF71AB",
  ];

  const services = [
    {
      title: "Khám Sức Khỏe Tổng Quát",
      description: "Chương trình khám sức khỏe toàn diện với đội ngũ bác sĩ chuyên môn cao, trang thiết bị hiện đại, giúp phát hiện sớm các nguy cơ về sức khỏe.",
      image: "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/555076308_122190721040359809_5009409531579541387_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=oqTWmsqj1EwQ7kNvwGZ8BlS&_nc_oc=AdkOALoyNRgI9RWeooD57j2tcHiUB2N08bu_N-YQll_klpiMkiblBrP-n-V5d0quUcs&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=zZmHitR5FR62-TdHjxKNGQ&oh=00_AfdqHtbujk0WfULM7GiPZI0pX9iN2JRD-IiKdrHy5OofxA&oe=68FF71AB",
      icon: <CheckCircleIcon className="w-6 h-6" />,
    },
    {
      title: "Chăm Sóc Răng Miệng",
      description: "Dịch vụ nha khoa toàn diện từ khám tổng quát, điều trị, đến thẩm mỹ nha khoa với công nghệ tiên tiến và không đau.",
      image: "https://scontent.fhan14-4.fna.fbcdn.net/v/t39.30808-6/553068952_122190134954359809_8353379584978656470_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_ohc=l278OBuf71kQ7kNvwF8WyY_&_nc_oc=AdnAULq5Y4Se2BOaH4p95zlUdBFDqW1daV41RnmcBOEOeVklyRzMQmfisPOYA--1eNc&_nc_zt=23&_nc_ht=scontent.fhan14-4.fna&_nc_gid=dFRVrKjeRYdaTjsGNXeT-g&oh=00_AfcAxqJdelMjrqyV5O3cVNLX38RW6SZTJ_Bjx3mv0NjRtg&oe=68FF771B",
      icon: <SparklesIcon className="w-6 h-6" />,
    },
    {
      title: "Tư Vấn Dinh Dưỡng",
      description: "Chuyên gia dinh dưỡng tư vấn chế độ ăn uống khoa học, phù hợp với từng đối tượng, giúp cải thiện sức khỏe một cách toàn diện.",
      image: "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/548260292_122189545454359809_8477717599939397988_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=UUADYr0OLswQ7kNvwHqyYHQ&_nc_oc=Adm0u22TUEjm26SI4ElPJOPQS9g0w_Vj12046yglurCd8ItwLyxRYRlMTaf7fikgsQU&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=KASGy301gaZErmzldIj2tQ&oh=00_AfcyCcAlLjWUdcajycmOYpblxj-7X6YHHIAMnXp1gAxhvg&oe=68FF82BA",
      icon: <HeartIcon className="w-6 h-6" />,
    },
    {
      title: "Khám Chuyên Khoa",
      description: "Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm, tận tâm chăm sóc và điều trị các bệnh lý chuyên sâu với phương pháp hiện đại.",
      image: "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/555076308_122190721040359809_5009409531579541387_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=oqTWmsqj1EwQ7kNvwGZ8BlS&_nc_oc=AdkOALoyNRgI9RWeooD57j2tcHiUB2N08bu_N-YQll_klpiMkiblBrP-n-V5d0quUcs&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=zZmHitR5FR62-TdHjxKNGQ&oh=00_AfdqHtbujk0WfULM7GiPZI0pX9iN2JRD-IiKdrHy5OofxA&oe=68FF71AB",
      icon: <ShieldCheckIcon className="w-6 h-6" />,
    },
  ];

  const doctors = [
    { name: "BS. Nguyễn Văn A", specialty: "Nội Khoa", image: "/doctor1.jpg" },
    { name: "BS. Trần Thị B", specialty: "Nha Khoa", image: "/doctor2.jpg" },
    { name: "BS. Lê Minh C", specialty: "Tim Mạch", image: "/doctor3.jpg" },
    { name: "BS. Phạm Thu D", specialty: "Da Liễu", image: "/doctor4.jpg" },
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrev = () =>
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );

  const handleNext = () =>
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section with Enhanced Banner */}
      <div className="relative w-full h-[550px] bg-gradient-to-r from-gray-900 to-gray-800 mb-20">
        <div className="absolute inset-0 transition-opacity duration-700">
          <img
            alt="Banner"
            className="w-full h-full object-cover opacity-80"
            src={images[currentImageIndex]}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Navigation Buttons with Better Styling */}
        <button
          className="absolute top-1/2 left-6 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#39BDCC] p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 z-10"
          onClick={handlePrev}
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        <button
          className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#39BDCC] p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 z-10"
          onClick={handleNext}
          aria-label="Next image"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        {/* Image Indicators */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              onClick={() => setCurrentImageIndex(index)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>

        {/* Enhanced Quick Action Box - Positioned at bottom */}
      <div className="absolute -bottom-6 md:-bottom-12 lg:-bottom-16 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-xl px-3 py-3 flex items-center justify-between gap-4 max-w-[680px] w-fit z-30 border border-gray-100 transition-all duration-300">
        <button
          className="group flex flex-col items-center space-y-2 hover:scale-105 transition-transform duration-300 w-28 md:w-32 lg:w-36"
          onClick={openBookingModal}
        >
          <div className="bg-[#39BDCC]/10 p-3 rounded-full group-hover:bg-[#39BDCC] transition-colors duration-300">
            <CalendarIcon className="w-8 h-8 md:w-9 md:h-9 text-[#39BDCC] group-hover:text-white transition-colors" />
          </div>
          <span className="text-base md:text-lg font-semibold text-gray-700 group-hover:text-[#39BDCC] transition-colors whitespace-nowrap truncate">
            Đặt lịch khám
          </span>
        </button>

        <a
          className="group flex flex-col items-center space-y-2 hover:scale-105 transition-transform duration-300 w-28 md:w-32 lg:w-36"
          href="#doctor"
        >
          <div className="bg-[#39BDCC]/10 p-3 rounded-full group-hover:bg-[#39BDCC] transition-colors duration-300">
            <UserIcon className="w-8 h-8 md:w-9 md:h-9 text-[#39BDCC] group-hover:text-white transition-colors" />
          </div>
          <span className="text-base md:text-lg font-semibold text-gray-700 group-hover:text-[#39BDCC] transition-colors whitespace-nowrap truncate">
            Tìm bác sĩ
          </span>
        </a>

        <a
          className="group flex flex-col items-center space-y-2 hover:scale-105 transition-transform duration-300 w-28 md:w-32 lg:w-36"
          href="#feedback"
        >
          <div className="bg-[#39BDCC]/10 p-3 rounded-full group-hover:bg-[#39BDCC] transition-colors duration-300">
            <ChatBubbleLeftIcon className="w-8 h-8 md:w-9 md:h-9 text-[#39BDCC] group-hover:text-white transition-colors" />
          </div>
          <span className="text-base md:text-lg font-semibold text-gray-700 group-hover:text-[#39BDCC] transition-colors whitespace-nowrap truncate">
            Góp ý
          </span>
        </a>
      </div>
      </div>

      {/* Services Section with Enhanced Design */}
      <div className="max-w-7xl mx-auto pt-24 pb-20 px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Dịch Vụ Của Chúng Tôi
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Chúng tôi cung cấp các dịch vụ y tế chất lượng cao với đội ngũ chuyên môn
            và trang thiết bị hiện đại
          </p>
        </div>

        <div className="space-y-24">
          {services.map((service, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } items-center gap-12 group`}
            >
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center space-x-3 bg-[#39BDCC]/10 px-4 py-2 rounded-full">
                  <div className="text-[#39BDCC]">{service.icon}</div>
                  <span className="text-sm font-semibold text-[#39BDCC]">
                    Dịch vụ {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="text-3xl font-bold text-gray-900 group-hover:text-[#39BDCC] transition-colors">
                  {service.title}
                </h3>

                <p className="text-lg text-gray-600 leading-relaxed">
                  {service.description}
                </p>

                <button className="inline-flex items-center space-x-2 text-[#39BDCC] font-semibold hover:gap-4 transition-all group/btn">
                  <span>Tìm hiểu thêm</span>
                  <ChevronRightIcon className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex-1 max-w-lg">
                <div className="relative overflow-hidden rounded-3xl shadow-2xl group-hover:shadow-3xl transition-shadow duration-500">
                  <img
                    alt={service.title}
                    className="w-full h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                    src={service.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#39BDCC]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Doctor Team Section */}
      <div id="doctor" className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Đội Ngũ Bác Sĩ
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm và chuyên nghiệp
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {doctors.map((doctor, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                <div className="relative h-72 overflow-hidden">
                  <img
                    alt={doctor.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    src={doctor.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {doctor.name}
                  </h3>
                  <p className="text-[#39BDCC] font-medium mb-4">
                    {doctor.specialty}
                  </p>
                  <button className="w-full py-2 px-4 bg-[#39BDCC]/10 text-[#39BDCC] rounded-lg font-semibold hover:bg-[#39BDCC] hover:text-white transition-colors duration-300">
                    Xem hồ sơ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Contact Form Section */}
      <div id="feedback" className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Đặt Lịch Khám
            </h2>
            <p className="text-lg text-gray-600">
              Điền thông tin để chúng tôi liên hệ và hỗ trợ bạn
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-xl">
            <button
              onClick={openBookingModal}
              className="w-full bg-gradient-to-r from-[#39BDCC] to-[#2da5b3] text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <CalendarIcon className="w-6 h-6" />
              <span>Mở Form Đặt Lịch Khám</span>
            </button>

            <p className="text-center text-sm text-gray-500 mt-6">
              Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
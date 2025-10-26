import { useState, SyntheticEvent } from "react";
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
type ImageErrorType = 'banner' | 'service' | 'doctor';

const Home = () => {
  const { openBookingModal } = useBookingModal();

  // Khôi phục URL ảnh gốc của bạn
  const images = [
    "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/566204463_122193638510359809_566204463_122193638510359809_5577540246052546034_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=103&ccb=1-7&_nc_sid=833d8c&_nc_ohc=HJocOZy1OzIQ7kNvwFzJ4kO&_nc_oc=Adlr3PH49XeMVBwfqmLMna5YTHQhU2ZYQEPusr_HGV2pfSwArjaPCpyDCwT1eMNbWmI&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=Dttcniqd_4S8scHPaPnxcw&oh=00_AfcPtXDO_oUR5oCdoukdKOgnyB-ngA7UdapOL97Ca1SXrg&oe=68FF8213",
    "https://scontent.fhan14-5.fna.fbcdn.net/v/t39.30808-6/561145387_122192341532359809_300409251944642402_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=2NbXa8V9e2kQ7kNvwFJClFB&_nc_oc=AdkZwuRDXIT7YpYdSkJiqtNZUNlFZaQ7K62e0SxTiIBvkCqFKKKwm0yE6asfFIwkXiw&_nc_zt=23&_nc_ht=scontent.fhan14-5.fna&_nc_gid=mQCQe9wYq4JQk8wmZsKcYg&oh=00_AfdtiR4SmFrVxl1xhvExkFlR5cJAMg_9wBKx3cuJCm8iVw&oe=68FF8C90",
    "https://scontent.fhan14-3.fna.fbcdn.net/v/t39.30808-6/555076308_122190721040359809_5009409531579541387_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=oqTWmsqj1EwQ7kNvwGZ8BlS&_nc_oc=AdkOALoyNRgI9RWeooD57j2tcHiUB2N08bu_N-YQll_klpiMkiblBrP-n-V5d0quUcs&_nc_zt=23&_nc_ht=scontent.fhan14-3.fna&_nc_gid=zZmHitR5FR62-TdHjxKNGQ&oh=00_AfdqHtbujk0WfULM7GiPZI0pX9iN2JRD-IiKdrHy5OofxA&oe=68FF71AB",
  ];

  const services = [
    {
      title: "Bọc Răng Sứ Cao Cấp",
      description:
        "Dịch vụ bọc răng sứ chất lượng cao, sử dụng vật liệu an toàn và công nghệ tiên tiến, mang lại nụ cười tự nhiên và bền đẹp.",
      image: "./Bocrangsu.jpg", // Giữ nguyên ảnh gốc của bạn
      icon: <CheckCircleIcon className="w-6 h-6" />,
    },
    {
      title: "Cấy Ghép Implant",
      description:
        "Dịch vụ cấy ghép Implant chất lượng cao, sử dụng công nghệ tiên tiến và vật liệu an toàn, mang lại giải pháp phục hồi răng hiệu quả và bền vững.",
      image: "./cayimplent.jpg", // Giữ nguyên ảnh gốc của bạn
      icon: <SparklesIcon className="w-6 h-6" />,
    },
    {
      title: "Nhổ răng không đau",
      description:
        "Cam kết mang lại trải nghiệm nhổ răng nhẹ nhàng, không đau với kỹ thuật hiện đại và đội ngũ bác sĩ tận tâm.",
      image: "./Nhorang.jpg", // Giữ nguyên ảnh gốc của bạn
      icon: <HeartIcon className="w-6 h-6" />,
    },
    {
      title: "Niềng Răng Thẩm Mỹ",
      description:
        "Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm sử dụng công nghệ hiện đại để mang lại nụ cười tự tin và khỏe mạnh cho khách hàng.",
      image: "./Niengrang.jpg", // Giữ nguyên ảnh gốc của bạn
      icon: <ShieldCheckIcon className="w-6 h-6" />,
    },
  ];

  // Chỉ còn 2 thẻ bác sĩ như yêu cầu
  const doctors = [
    { name: "BS. Hải Anh", specialty: "Răng hàm mặt", image: "./HaiAnhdoctor.png" },
    { name: "BS. Trần Thị B", specialty: "Nha Khoa", image: "/doctor2.jpg" }
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

  // Hàm xử lý lỗi ảnh với placeholder mới cho từng loại
  const handleImageError = (
    e: SyntheticEvent<HTMLImageElement, Event>, // Thêm kiểu cho 'e'
    type: ImageErrorType // Thêm kiểu cho 'type'
  ) => {
    let placeholderUrl: string;
    switch (type) {
      case 'banner':
        placeholderUrl = 'https://placehold.co/1920x550/e0f2f7/4dd0e1?text=Banner+Image'; // Placeholder màu xanh nhạt
        break;
      case 'service':
        placeholderUrl = 'https://placehold.co/600x400/e0f2f7/4dd0e1?text=Service+Image'; // Placeholder màu xanh nhạt
        break;
      case 'doctor':
        placeholderUrl = 'https://placehold.co/400x500/e0f2f7/4dd0e1?text=Doctor+Image'; // Placeholder màu xanh nhạt
        break;
      default:
        placeholderUrl = 'https://placehold.co/600x400/cccccc/999999?text=Image+Error';
    }
    // Ép kiểu e.target thành HTMLImageElement để truy cập .src và .onerror
    const target = e.target as HTMLImageElement;
    target.src = placeholderUrl;
    target.onerror = null; // Ngăn chặn loop vô hạn nếu cả placeholder cũng lỗi
  };

  return (
    <>
      {/* Nền gradient cố định: 
          - fixed: Giữ cố định trên màn hình
          - inset-0: Căng ra 4 cạnh (top, left, right, bottom = 0)
          - -z-10: Đặt ở lớp dưới cùng để nội dung đè lên
          - h-screen w-full: Đảm bảo phủ hết màn hình
          - bg-gradient-to-b...: Hiệu ứng gradient
      */}
      <div className="fixed inset-0 -z-10 h-screen w-full bg-gradient-to-b from-white to-[#39bdcc]/20" />

      {/* Nội dung có thể cuộn (đã bỏ class gradient) */}
      <div className="flex flex-col w-full min-h-screen">
        
        {/* Div thông báo tùy chỉnh (thay cho alert) */}
        <div id="modal-alert" className="hidden fixed top-5 right-5 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[9999]">
          Modal đặt lịch sẽ được mở tại đây!
        </div>

        {/* Hero Section with Enhanced Banner */}
        <div className="relative w-full h-[550px] bg-gradient-to-r from-gray-900 to-gray-800 mb-20">
          <div className="absolute inset-0 transition-opacity duration-700">
            <img
              alt="Banner"
              className="w-full h-full object-cover opacity-80"
              src={images[currentImageIndex]}
              onError={(e) => handleImageError(e, 'banner')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Navigation Buttons with Better Styling */}
          <button
            aria-label="Previous image"
            className="absolute top-1/2 left-6 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#39BDCC] p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 z-10"
            onClick={handlePrev}
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <button
            aria-label="Next image"
            className="absolute top-1/2 right-6 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#39BDCC] p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 z-10"
            onClick={handleNext}
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>

          {/* Image Indicators */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                aria-label={`Go to image ${index + 1}`}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>

          {/* Enhanced Quick Action Box - Positioned at bottom */}
          <div className="absolute -bottom-6 md:-bottom-12 lg:-bottom-16 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-xl px-3 py-3 flex items-center justify-between gap-4 max-w-[680px] w-fit z-30 border border-gray-100 transition-all duration-300">
            <button
              className="group flex flex-col items-center space-y-2 transform-gpu will-change-transform transition-transform duration-300 w-28 md:w-32 lg:w-36 hover:scale-110 hover:-translate-y-1 hover:shadow-xl hover:z-20 cursor-pointer"
              onClick={openBookingModal}
              aria-label="Đặt lịch khám"
            >
              <div className="bg-[#39BDCC]/10 p-3 rounded-full transition-colors duration-300 transform-gpu group-hover:scale-110 group-hover:bg-[#39BDCC]">
                <CalendarIcon className="w-8 h-8 md:w-9 md:h-9 text-[#39BDCC] transition-colors duration-300 group-hover:text-white" />
              </div>
              <span className="text-base md:text-lg font-semibold text-gray-700 group-hover:text-[#39BDCC] transition-all duration-200 whitespace-nowrap truncate">
                Đặt lịch khám
              </span>
            </button>

            <a
              className="group flex flex-col items-center space-y-2 transform-gpu will-change-transform transition-transform duration-300 w-28 md:w-32 lg:w-36 hover:scale-110 hover:-translate-y-1 hover:shadow-xl hover:z-20 cursor-pointer"
              href="#doctor"
              aria-label="Tìm bác sĩ"
            >
              <div className="bg-[#39BDCC]/10 p-3 rounded-full transition-colors duration-300 transform-gpu group-hover:scale-110 group-hover:bg-[#39BDCC]">
                <UserIcon className="w-8 h-8 md:w-9 md:h-9 text-[#39BDCC] transition-colors duration-300 group-hover:text-white" />
              </div>
              <span className="text-base md:text-lg font-semibold text-gray-700 group-hover:text-[#39BDCC] transition-all duration-200 whitespace-nowrap truncate">
                Tìm bác sĩ
              </span>
            </a>

            <a
              className="group flex flex-col items-center space-y-2 transform-gpu will-change-transform transition-transform duration-300 w-28 md:w-32 lg:w-36 hover:scale-110 hover:-translate-y-1 hover:shadow-xl hover:z-20 cursor-pointer"
              href="#feedback"
              aria-label="Góp ý"
            >
              <div className="bg-[#39BDCC]/10 p-3 rounded-full transition-colors duration-300 transform-gpu group-hover:scale-110 group-hover:bg-[#39BDCC]">
                <ChatBubbleLeftIcon className="w-8 h-8 md:w-9 md:h-9 text-[#39BDCC] transition-colors duration-300 group-hover:text-white" />
              </div>
              <span className="text-base md:text-lg font-semibold text-gray-700 group-hover:text-[#39BDCC] transition-all duration-200 whitespace-nowrap truncate">
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
              Chúng tôi cung cấp các dịch vụ y tế chất lượng cao với đội ngũ
              chuyên môn và trang thiết bị hiện đại
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
                      onError={(e) => handleImageError(e, 'service')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#39BDCC]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Doctor Team Section with Gradient Background */}
        <div
          className="py-20" // Bỏ bg-gradient-to-b from-white to-cyan-50 vì đã có ở div ngoài cùng
          id="doctor"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Đội Ngũ Bác Sĩ
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm và chuyên nghiệp
              </p>
            </div>

            {/* Grid chỉ với 2 cột cho 2 bác sĩ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto"> 
              {doctors.map((doctor, index) => (
                <div
                  key={index}
                  className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  {/* Image */}
                  <img
                    alt={doctor.name}
                    className="w-full h-96 object-cover object-top transform group-hover:scale-110 transition-transform duration-700"
                    src={doctor.image}
                    onError={(e) => handleImageError(e, 'doctor')}
                  />
                  
                  {/* Overlay Gradient for text */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* Text Content */}
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-1">
                      {doctor.name}
                    </h3>
                    <p className="text-cyan-300 font-medium text-lg mb-4">
                      {doctor.specialty}
                    </p>
                    
                    {/* Button */}
                    <button className="w-full py-3 px-4 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold border border-white/30 hover:bg-white/30 transition-colors duration-300">
                      Xem hồ sơ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Contact Form Section */}
        <div className="py-20 bg-transparent" id="feedback"> {/* Đổi bg-white thành bg-transparent */}
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Đặt Lịch Khám
              </h2>
              <p className="text-lg text-gray-600">
                Điền thông tin để chúng tôi liên hệ và hỗ trợ bạn
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-xl"> {/* Đổi from-gray-50 thành from-white */}
              <button
                className="w-full bg-gradient-to-r from-[#39BDCC] to-[#2da5b3] text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center space-x-3"
                onClick={openBookingModal}
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
    </>
  );
};

export default Home;


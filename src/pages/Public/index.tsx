import { useState, useEffect, SyntheticEvent } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useBookingModal } from "@/contexts/BookingModalContext";
import { blogApi, type Blog } from "@/api/blog";
type ImageErrorType = 'banner' | 'service';

const Home = () => {
  const { openBookingModal } = useBookingModal();
  const navigate = useNavigate();

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
      image: "./Bocrangsu.jpg",
    },
    {
      title: "Cấy Ghép Implant",
      description:
        "Dịch vụ cấy ghép Implant chất lượng cao, sử dụng công nghệ tiên tiến và vật liệu an toàn, mang lại giải pháp phục hồi răng hiệu quả và bền vững.",
      image: "./cayimplent.jpg",
    },
    {
      title: "Nhổ răng không đau",
      description:
        "Cam kết mang lại trải nghiệm nhổ răng nhẹ nhàng, không đau với kỹ thuật hiện đại và đội ngũ bác sĩ tận tâm.",
      image: "./Nhorang.jpg",
    },
    {
      title: "Niềng Răng Thẩm Mỹ",
      description:
        "Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm sử dụng công nghệ hiện đại để mang lại nụ cười tự tin và khỏe mạnh cho khách hàng.",
      image: "./Niengrang.jpg",
    },
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [latestBlogs, setLatestBlogs] = useState<Blog[]>([]);
  const [isBlogLoading, setIsBlogLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);

  const handlePrev = () =>
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1,
    );

  const handleNext = () =>
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1,
    );

  useEffect(() => {
    const fetchLatestBlogs = async () => {
      try {
        setIsBlogLoading(true);
        setBlogError(null);

        const response = await blogApi.getPublicBlogs({
          page: 1,
          limit: 3,
          status: "Published",
          sort: "desc",
        });

        if (response.status && Array.isArray(response.data)) {
          // Loại bỏ blog có category "Promotions"
          const filteredBlogs = response.data.filter(
            (blog: any) => blog.category !== "Promotions"
          );
          setLatestBlogs(filteredBlogs.slice(0, 3));
        } else {
          setLatestBlogs([]);
        }
      } catch (error: any) {
        console.error("❌ Error fetching latest blogs:", error);
        setBlogError(error.message || "Không thể tải tin tức");
      } finally {
        setIsBlogLoading(false);
      }
    };

    fetchLatestBlogs();
  }, []);

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

          {/* Enhanced Booking Button - Positioned at bottom */}
          <div className="absolute -bottom-8 md:-bottom-12 lg:-bottom-14 left-1/2 transform -translate-x-1/2 z-30">
            <button
              className="group bg-white shadow-2xl rounded-2xl px-8 md:px-10 py-5 md:py-6 flex items-center gap-4 md:gap-5 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(57,189,204,0.4)] hover:scale-105 hover:-translate-y-2 border-2 border-[#39BDCC]/20 hover:border-[#39BDCC]"
              onClick={openBookingModal}
              aria-label="Đặt lịch khám"
            >
              <div className="bg-gradient-to-br from-[#39BDCC] to-[#2da5b3] p-4 md:p-5 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <CalendarIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-xl md:text-2xl font-bold text-gray-900 group-hover:text-[#39BDCC] transition-colors duration-300">
                  Đặt lịch khám
                </span>
                <span className="block text-sm md:text-base text-gray-500 mt-1">
                  Nhanh chóng & tiện lợi
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Services Section with Enhanced Design */}
        <div className="max-w-7xl mx-auto pt-24 pb-20 px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Dịch Vụ Nổi Bật
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
                } items-center gap-12`}
              >
                <div className="flex-1 space-y-6">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {service.title}
                  </h3>

                  <p className="text-lg text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="flex-1 max-w-lg">
                  <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                    <img
                      alt={service.title}
                      className="w-full h-[400px] object-cover"
                      src={service.image}
                      onError={(e) => handleImageError(e, 'service')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Blogs Section */}
        <div className="max-w-7xl mx-auto pb-24 px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
            <div>
              <p className="text-sm font-semibold text-[#39BDCC] uppercase tracking-widest">
                Tin tức
              </p>
              <h2 className="text-4xl font-bold text-gray-900 mt-2">
                Chia sẻ từ Hải Anh Teeth
              </h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl">
                Những bài viết mới nhất về sức khỏe răng miệng, dịch vụ nổi bật và câu chuyện khách hàng.
              </p>
            </div>
            <button
              className="self-start md:self-auto bg-[#39BDCC] text-white font-semibold px-6 py-3 rounded-full shadow-md hover:bg-[#2ca6b5] transition-all"
              onClick={() => navigate("/news")}
            >
              Xem tất cả tin tức
            </button>
          </div>

          <div className="min-h-[220px]">
            {isBlogLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-[#39BDCC]/30 border-t-[#39BDCC] rounded-full animate-spin" />
              </div>
            ) : blogError ? (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                {blogError}
              </div>
            ) : latestBlogs.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                Hiện chưa có bài viết nào.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestBlogs.map((blog) => (
                  <div
                    key={blog._id}
                    className="bg-white rounded-3xl shadow-lg overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/news/${blog._id}`)}
                  >
                    {blog.thumbnailUrl ? (
                      <div className="h-56 w-full overflow-hidden">
                        <img
                          src={blog.thumbnailUrl}
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                      </div>
                    ) : (
                      <div className="h-56 w-full bg-gradient-to-r from-[#39BDCC]/20 to-[#2ca6b5]/20 flex items-center justify-center text-[#39BDCC] font-semibold">
                        Hải Anh Teeth
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-[#39BDCC]/10 text-[#39BDCC] rounded-full">
                        {blog.category}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {blog.content}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(blog.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                        {blog.authorUserId?.name && (
                          <span className="font-semibold text-gray-700">
                            {blog.authorUserId.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default Home;


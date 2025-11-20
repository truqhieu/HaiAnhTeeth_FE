import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Spinner,
  Chip,
  Pagination,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  SparklesIcon,
  TagIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { blogApi, Blog } from "@/api/blog";

const PromotionsPage = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchBlogs();
  }, [currentPage]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchBlogs();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        status: "Published", // Chỉ lấy blog đã publish
        category: "Promotions", // Chỉ lấy blog có category "Promotions"
        sort: "desc",
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await blogApi.getPublicBlogs(params);

      if (response.status && response.data) {
        setBlogs(response.data);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error("❌ Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    return "danger"; // Màu đỏ cho Promotions
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                Ưu đãi đặc biệt
              </h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Khám phá các chương trình ưu đãi hấp dẫn dành cho bạn
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <Card className="shadow-xl border-0">
          <CardBody className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Search Input */}
              <Input
                placeholder="Tìm kiếm ưu đãi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />
                }
                classNames={{
                  input: "text-base",
                  inputWrapper:
                    "border-2 border-gray-200 hover:border-[#39BDCC] data-[focus=true]:border-[#39BDCC] h-14 bg-default-100",
                }}
              />

            </div>
          </CardBody>
        </Card>
      </div>

      {/* Blogs List */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" label="Đang tải ưu đãi..." />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20">
            <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">Không tìm thấy ưu đãi nào</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Tìm thấy <span className="font-semibold text-[#39BDCC]">{total}</span> ưu đãi
              </p>
            </div>

            {/* Blogs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Card
                  key={blog._id}
                  isPressable
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onPress={() => navigate(`/news/${blog._id}`)}
                >
                  {/* Thumbnail */}
                  {blog.thumbnailUrl && (
                    <div className="relative h-48 overflow-hidden rounded-t-3xl">
                      <img
                        src={blog.thumbnailUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      <span className="absolute top-3 left-3 inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] bg-white/80 text-[#39BDCC] rounded-full shadow">
                        Ưu đãi
                      </span>
                    </div>
                  )}

                  <CardBody className="p-4">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {blog.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {blog.content}
                    </p>

                    {/* Date Range - Hiển thị nếu có startDate và endDate */}
                    {(blog.startDate || blog.endDate) && (
                      <div className="mb-4 pt-3 border-t border-gray-200">
                        {blog.startDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span className="font-medium">Bắt đầu:</span>
                            <span>{formatDate(blog.startDate)}</span>
                          </div>
                        )}
                        {blog.endDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ClockIcon className="w-4 h-4" />
                            <span className="font-medium">Kết thúc:</span>
                            <span>{formatDate(blog.endDate)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{formatDate(blog.createdAt)}</span>
                      </div>
                      {blog.authorUserId && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          <span>{blog.authorUserId.name}</span>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <Pagination
                  total={totalPages}
                  page={currentPage}
                  onChange={setCurrentPage}
                  showControls
                  color="primary"
                  size="lg"
                  classNames={{
                    wrapper: "gap-2",
                    item: "w-10 h-10 text-base",
                    cursor: "bg-[#39BDCC] text-white font-semibold",
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PromotionsPage;



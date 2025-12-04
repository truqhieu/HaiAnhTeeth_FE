import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Spinner,
  Chip,
  Button,
  Pagination,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { blogApi, Blog } from "@/api/blog";

const NewsPage = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;

const categories = [
    { value: "all", label: "Tất cả danh mục" },
    { value: "News", label: "Tin tức" },
    { value: "Health Tips", label: "Mẹo sức khỏe" },
    { value: "Medical Services", label: "Dịch vụ y tế" },
    { value: "Patient Stories", label: "Câu chuyện bệnh nhân" },
    { value: "Recruitment", label: "Tuyển dụng" },
  ];

const CATEGORY_LABELS: Record<string, string> = {
  News: "Tin tức",
  "Health Tips": "Mẹo sức khỏe",
  "Medical Services": "Dịch vụ y tế",
  "Patient Stories": "Câu chuyện bệnh nhân",
  Promotions: "Ưu đãi",
  Recruitment: "Tuyển dụng",
};

const getCategoryLabel = (category: string) => CATEGORY_LABELS[category] || category;

  useEffect(() => {
    fetchBlogs();
  }, [categoryFilter, currentPage]);

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
        sort: "desc", // Mới nhất trước
      };

      if (categoryFilter !== "all") {
        params.category = categoryFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await blogApi.getPublicBlogs(params);

      if (response.status && response.data) {
        // Loại bỏ blog có category "Promotions"
        const filteredBlogs = response.data.filter(
          (blog) => blog.category !== "Promotions"
        );
        setBlogs(filteredBlogs);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error("❌ Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, "primary" | "success" | "warning" | "danger" | "secondary"> = {
      "News": "primary",
      "Health Tips": "success",
      "Medical Services": "secondary",
      "Patient Stories": "warning",
      "Recruitment": "primary",
    };
    return colors[category] || "default";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Tin tức
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Cập nhật những thông tin mới nhất về dịch vụ, sức khỏe răng miệng
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <Card className="shadow-xl border-0">
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <Input
                placeholder="Tìm kiếm tin tức..."
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

              {/* Category Filter */}
              <Select
                placeholder="Lọc theo danh mục"
                selectedKeys={[categoryFilter]}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                classNames={{
                  trigger:
                    "border-2 border-gray-200 hover:border-[#39BDCC] data-[focus=true]:border-[#39BDCC] h-14 bg-default-100",
                  value: "text-base",
                }}
              >
                {categories.map((cat) => (
                  <SelectItem key={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Blog List */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" label="Đang tải tin tức..." />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">Không tìm thấy tin tức nào</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Tìm thấy <span className="font-semibold text-[#39BDCC]">{blogs.length}</span> tin tức
              </p>
            </div>

            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Card
                  key={blog._id}
                  isPressable
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onPress={() => navigate(`/news/${blog._id}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden rounded-t-3xl">
                    {blog.thumbnailUrl ? (
                      <img
                        src={blog.thumbnailUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[#39BDCC]/20 to-[#2ca6b5]/20 flex items-center justify-center text-[#39BDCC] font-semibold">
                        Hải Anh Teeth
                      </div>
                    )}
                    <span className="absolute top-3 left-3 inline-flex px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] bg-white/80 text-[#39BDCC] rounded-full shadow">
                      {getCategoryLabel(blog.category)}
                    </span>
                  </div>

                  <CardBody className="p-4">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {blog.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {blog.content}
                    </p>

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

export default NewsPage;



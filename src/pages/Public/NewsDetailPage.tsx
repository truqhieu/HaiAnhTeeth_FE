import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Spinner,
  Chip,
  Button,
} from "@heroui/react";
import {
  CalendarIcon,
  UserIcon,
  TagIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { blogApi, Blog } from "@/api/blog";

const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBlogDetail(id);
    }
  }, [id]);

  const fetchBlogDetail = async (blogId: string) => {
    try {
      setLoading(true);
      const response = await blogApi.getPublicBlogDetail(blogId);

      if (response.success && response.data) {
        setBlog(response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching blog detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, "primary" | "success" | "warning" | "danger" | "secondary"> = {
      "News": "primary",
      "Health Tips": "success",
      "Medical Services": "secondary",
      "Promotions": "danger",
      "Patient Stories": "warning",
      "Recruitment": "primary",
    };
    return colors[category] || "default";
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      "News": "Tin tức",
      "Health Tips": "Mẹo sức khỏe",
      "Medical Services": "Dịch vụ y tế",
      "Promotions": "Ưu đãi",
      "Patient Stories": "Câu chuyện bệnh nhân",
      "Recruitment": "Tuyển dụng",
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Đang tải tin tức..." />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl text-gray-500 mb-4">Không tìm thấy tin tức</p>
        <Button
          color="primary"
          onPress={() => navigate("/news")}
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Button
            variant="light"
            onPress={() => navigate("/news")}
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
            className="mb-6"
          >
            Quay lại
          </Button>

          {/* Category */}
          <div className="mb-4">
            <Chip
              color={getCategoryColor(blog.category)}
              size="md"
              variant="flat"
              startContent={<TagIcon className="w-4 h-4" />}
            >
              {getCategoryLabel(blog.category)}
            </Chip>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {blog.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              <span>{formatDate(blog.createdAt)}</span>
            </div>
            {blog.authorUserId && (
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                <span>Bởi {blog.authorUserId.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card className="shadow-lg">
          <CardBody className="p-8">
            {/* Thumbnail */}
            {blog.thumbnailUrl && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img
                  src={blog.thumbnailUrl}
                  alt={blog.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Summary */}
            <div className="mb-8 p-6 bg-blue-50 border-l-4 border-[#39BDCC] rounded-r-lg">
              <p className="text-lg text-gray-800 font-medium leading-relaxed">
                {blog.summary}
              </p>
            </div>

            {/* TODO: Add full content when available from backend */}
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 leading-relaxed">
                {blog.summary}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            color="primary"
            size="lg"
            onPress={() => navigate("/news")}
            startContent={<ArrowLeftIcon className="w-5 h-5" />}
          >
            Quay lại danh sách tin tức
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;



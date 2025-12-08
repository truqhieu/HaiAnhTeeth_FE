import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  Image,
  Pagination,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { blogApi, type Blog } from "@/api/blog";
import { AddBlogModal, EditBlogModal } from "@/components/Manager";

const CATEGORIES = [
  { value: "News", label: "Tin tức" },
  { value: "Health Tips", label: "Mẹo sức khỏe" },
  { value: "Medical Services", label: "Dịch vụ y tế" },
  { value: "Promotions", label: "Khuyến mãi" },
  { value: "Patient Stories", label: "Câu chuyện bệnh nhân" },
  { value: "Recruitment", label: "Tuyển dụng" },
];

const BlogManagement = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBlogs();
  }, [categoryFilter, statusFilter, currentPage]);

  // Debounce search term
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

      // Khi chọn "Tất cả trạng thái", fetch cả Published và Hidden rồi merge
      if (statusFilter === "all") {
        const [publishedRes, hiddenRes] = await Promise.all([
          blogApi.getAllBlogs({
            page: currentPage,
            limit: itemsPerPage,
            sort: "desc",
            category: categoryFilter !== "all" ? categoryFilter : undefined,
            status: "Published",
            search: searchTerm.trim() || undefined,
          }),
          blogApi.getAllBlogs({
            page: currentPage,
            limit: itemsPerPage,
            sort: "desc",
            category: categoryFilter !== "all" ? categoryFilter : undefined,
            status: "Hidden",
            search: searchTerm.trim() || undefined,
          }),
        ]);

        // Merge và sort theo createdAt
        const allBlogs = [
          ...(publishedRes.data || []),
          ...(hiddenRes.data || []),
        ].sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // desc
        });

        // Tính toán pagination cho merged results
        const totalMerged = (publishedRes.total || 0) + (hiddenRes.total || 0);
        const totalPagesMerged = Math.ceil(totalMerged / itemsPerPage);
        
        // Paginate merged results
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedBlogs = allBlogs.slice(startIndex, endIndex);

        setBlogs(paginatedBlogs);
        setTotal(totalMerged);
        setTotalPages(totalPagesMerged);
      } else {
        // Khi chọn status cụ thể, fetch như bình thường
        const params: any = {
          page: currentPage,
          limit: itemsPerPage,
          sort: "desc",
        };

        if (categoryFilter !== "all") {
          params.category = categoryFilter;
        }

        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const response = await blogApi.getAllBlogs(params);

        if (response.status && response.data) {
          setBlogs(response.data);
          setTotal(response.total || 0);
          setTotalPages(response.totalPages || 1);
        } else {
          toast.error("Không thể tải danh sách blog");
        }
      }
    } catch (error) {
      console.error("❌ Error fetching blogs:", error);
      toast.error("Đã xảy ra lỗi khi tải danh sách blog");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAddModalOpen(true);
  };

  const handleEdit = (blog: Blog) => {
    setSelectedBlog(blog);
    setIsEditModalOpen(true);
  };

  const handleDelete = (blog: Blog) => {
    setSelectedBlog(blog);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBlog) return;

    try {
      setIsProcessing(true);

      const response = await blogApi.deleteBlog(selectedBlog._id);

      if (response.success) {
        toast.success("Xóa blog thành công");
        setIsDeleteModalOpen(false);
        setSelectedBlog(null);
        fetchBlogs();
      } else {
        toast.error(response.message || "Đã xảy ra lỗi khi xóa blog");
      }
    } catch (error: any) {
      console.error("❌ Error deleting blog:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi xóa blog");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string): "success" | "default" => {
    return status === "Published" ? "success" : "default";
  };

  const getStatusText = (status: string): string => {
    return status === "Published" ? "Đã xuất bản" : "Đã ẩn";
  };

  const getCategoryLabel = (category: string): string => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = [
    { key: "stt", label: "STT" },
    { key: "thumbnail", label: "Ảnh" },
    { key: "title", label: "Tiêu đề" },
    { key: "category", label: "Thể loại" },
    { key: "status", label: "Trạng thái" },
    { key: "createdAt", label: "Ngày tạo" },
    { key: "actions", label: "Hành động" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý bài viết</h1>
        </div>
        <p className="text-gray-600 mt-2">
          Quản lý các bài viết cho website
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Input
              className="w-full"
              placeholder="Tìm kiếm theo tiêu đề..."
              startContent={
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              }
              value={searchTerm}
              variant="bordered"
              onValueChange={setSearchTerm}
            />
          </div>

          {/* Category Filter */}
          <Select
            className="w-48"
            placeholder="Thể loại"
            selectedKeys={[categoryFilter]}
            variant="bordered"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setCategoryFilter(selected);
            }}
          >
            <>
              <SelectItem key="all" textValue="Tất cả thể loại">Tất cả thể loại</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} textValue={cat.label}>{cat.label}</SelectItem>
              ))}
            </>
          </Select>

          {/* Status Filter */}
          <Select
            className="w-48"
            placeholder="Trạng thái"
            selectedKeys={[statusFilter]}
            variant="bordered"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setStatusFilter(selected);
            }}
          >
            <SelectItem key="all">Tất cả trạng thái</SelectItem>
            <SelectItem key="Published">Đã xuất bản</SelectItem>
            <SelectItem key="Hidden">Đã ẩn</SelectItem>
          </Select>
        </div>

        <Button
          className="bg-blue-600 text-white hover:bg-blue-700"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={handleAdd}
        >
          Thêm bài viết
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table
            aria-label="Bảng quản lý blog"
            classNames={{
              wrapper: "shadow-none",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  className="bg-white text-gray-700 font-semibold text-sm uppercase tracking-wider"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent="Không có blog nào" items={blogs}>
              {(blog) => (
                <TableRow key={blog._id}>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {(currentPage - 1) * itemsPerPage +
                        blogs.indexOf(blog) +
                        1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Image
                      alt={blog.title}
                      className="w-16 h-16 object-cover rounded-md"
                      src={blog.thumbnailUrl}
                      fallbackSrc="https://placehold.co/64x64/e0f2f7/4dd0e1?text=Blog"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="py-1 max-w-xs">
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {blog.title}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                        {blog.summary || blog.content}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip color="primary" size="sm" variant="flat">
                      {getCategoryLabel(blog.category)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(blog.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(blog.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatDate(blog.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Tooltip content="Chỉnh sửa blog">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-8 h-8 text-blue-600 hover:bg-blue-50"
                          onPress={() => handleEdit(blog)}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Xóa blog">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-8 h-8 text-red-600 hover:bg-red-50"
                          onPress={() => handleDelete(blog)}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-4">
          <p className="text-sm text-gray-500">
            Hiển thị{" "}
            {total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} đến{" "}
            {total === 0
              ? 0
              : Math.min((currentPage - 1) * itemsPerPage + blogs.length, total)}{" "}
            trong tổng số {total} blog
          </p>
          <Pagination
            page={currentPage}
            total={totalPages}
            onChange={setCurrentPage}
            showControls
            color="primary"
          />
        </div>
      )}

      {/* Add Blog Modal */}
      <AddBlogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchBlogs}
      />

      {/* Edit Blog Modal */}
      <EditBlogModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBlog(null);
        }}
        blog={selectedBlog}
        onSuccess={fetchBlogs}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isDismissable={!isProcessing}
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Xóa blog</ModalHeader>
          <ModalBody>
            {selectedBlog && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Bạn có chắc chắn muốn xóa blog này?
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {selectedBlog.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedBlog.content}
                  </p>
                </div>
                <p className="text-sm text-red-600">
                  <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác!
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => {
                setIsDeleteModalOpen(false);
                setSelectedBlog(null);
              }}
            >
              Hủy
            </Button>
            <Button
              className="bg-red-600 text-white"
              isLoading={isProcessing}
              onPress={confirmDelete}
            >
              Xác nhận xóa
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default BlogManagement;


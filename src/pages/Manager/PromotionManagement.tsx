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
  Textarea,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// Define types locally (no backend API yet)
interface Promotion {
  _id: string;
  title: string;
  description: string;
  discountType: "Percent" | "Fixed";
  discountValue: number;
  applyToAll: boolean;
  applicableServices?: string[];
  startDate: string;
  endDate: string;
  status: "Active" | "Expired" | "Scheduled";
  createdAt: string;
  updatedAt?: string;
}

interface CreatePromotionData {
  title: string;
  description: string;
  discountType: "Percent" | "Fixed";
  discountValue: number;
  applyToAll: boolean;
  applicableServices?: string[];
  startDate: string;
  endDate: string;
}

// Mock data for demo
const MOCK_PROMOTIONS: Promotion[] = [
  {
    _id: "671120000000000000000017",
    title: "Ưu đãi Quốc Khánh 2/9",
    description: "Giảm 50% cho tất cả dịch vụ từ 2/9 đến 5/9.",
    discountType: "Percent",
    discountValue: 50,
    applyToAll: true,
    startDate: "2025-09-02T00:00:00.000Z",
    endDate: "2025-09-05T23:59:00.000Z",
    status: "Expired",
    createdAt: "2025-08-30T09:00:00.000Z",
  },
  {
    _id: "671120000000000000000018",
    title: "Khuyến mãi tháng 11",
    description: "Giảm 30% cho dịch vụ làm răng.",
    discountType: "Percent",
    discountValue: 30,
    applyToAll: true,
    startDate: "2025-11-01T00:00:00.000Z",
    endDate: "2025-11-30T23:59:00.000Z",
    status: "Active",
    createdAt: "2025-10-25T09:00:00.000Z",
  },
  {
    _id: "671120000000000000000019",
    title: "Giáng sinh vui vẻ",
    description: "Giảm 100,000đ cho mọi dịch vụ.",
    discountType: "Fixed",
    discountValue: 100000,
    applyToAll: true,
    startDate: "2025-12-20T00:00:00.000Z",
    endDate: "2025-12-26T23:59:00.000Z",
    status: "Scheduled",
    createdAt: "2025-10-29T09:00:00.000Z",
  },
];

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CreatePromotionData>({
    title: "",
    description: "",
    discountType: "Percent",
    discountValue: 0,
    applyToAll: true,
    applicableServices: [],
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchPromotions();
  }, [statusFilter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);

      // Simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filteredPromotions = [...MOCK_PROMOTIONS];

      // Filter by status
      if (statusFilter !== "all") {
        filteredPromotions = filteredPromotions.filter(
          (p) => p.status === statusFilter,
        );
      }

      // Filter by search term
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();

        filteredPromotions = filteredPromotions.filter(
          (p) =>
            p.title.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search),
        );
      }

      setPromotions(filteredPromotions);
    } catch {
      toast.error("Đã xảy ra lỗi khi tải danh sách ưu đãi");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchPromotions();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      discountType: "Percent",
      discountValue: 0,
      applyToAll: true,
      applicableServices: [],
      startDate: "",
      endDate: "",
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      applyToAll: promotion.applyToAll,
      applicableServices: promotion.applicableServices || [],
      startDate: promotion.startDate.split("T")[0],
      endDate: promotion.endDate.split("T")[0],
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsDeleteModalOpen(true);
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề ưu đãi");

      return false;
    }

    if (!formData.description.trim()) {
      toast.error("Vui lòng nhập mô tả");

      return false;
    }

    if (formData.discountValue <= 0) {
      toast.error("Giá trị giảm giá phải lớn hơn 0");

      return false;
    }

    if (
      formData.discountType === "Percent" &&
      formData.discountValue > 100
    ) {
      toast.error("Phần trăm giảm giá không được vượt quá 100%");

      return false;
    }

    if (!formData.startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu");

      return false;
    }

    if (!formData.endDate) {
      toast.error("Vui lòng chọn ngày kết thúc");

      return false;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end <= start) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");

      return false;
    }

    return true;
  };

  const handleSubmitAdd = async () => {
    if (!validateForm()) return;

    try {
      setIsProcessing(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        "Tạo ưu đãi thành công! (Chưa kết nối backend - dữ liệu demo)",
      );
      setIsAddModalOpen(false);
      resetForm();
      // Don't fetch - just close modal in demo mode
    } catch {
      toast.error("Đã xảy ra lỗi khi tạo ưu đãi");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedPromotion || !validateForm()) return;

    try {
      setIsProcessing(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        "Cập nhật ưu đãi thành công! (Chưa kết nối backend - dữ liệu demo)",
      );
      setIsEditModalOpen(false);
      setSelectedPromotion(null);
      resetForm();
      // Don't fetch - just close modal in demo mode
    } catch {
      toast.error("Đã xảy ra lỗi khi cập nhật ưu đãi");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPromotion) return;

    try {
      setIsProcessing(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        "Xóa ưu đãi thành công! (Chưa kết nối backend - dữ liệu demo)",
      );
      setIsDeleteModalOpen(false);
      setSelectedPromotion(null);
      // Don't fetch - just close modal in demo mode
    } catch {
      toast.error("Đã xảy ra lỗi khi xóa ưu đãi");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (
    status: string,
  ): "success" | "warning" | "danger" => {
    switch (status) {
      case "Active":
        return "success";
      case "Scheduled":
        return "warning";
      case "Expired":
        return "danger";
      default:
        return "warning";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "Active":
        return "Đang áp dụng";
      case "Scheduled":
        return "Sắp diễn ra";
      case "Expired":
        return "Đã hết hạn";
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDiscount = (type: string, value: number) => {
    return type === "Percent" ? `${value}%` : `${value.toLocaleString()}đ`;
  };

  const columns = [
    { key: "title", label: "Tiêu đề" },
    { key: "discount", label: "Giảm giá" },
    { key: "duration", label: "Thời gian áp dụng" },
    { key: "scope", label: "Phạm vi" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hành động" },
  ];

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý ưu đãi</h1>
        <p className="text-gray-600 mt-2">
          Tạo và quản lý các chương trình ưu đãi cho dịch vụ
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              onValueChange={setSearchTerm}
            />
          </div>

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
            <SelectItem key="all">Tất cả</SelectItem>
            <SelectItem key="Active">Đang áp dụng</SelectItem>
            <SelectItem key="Scheduled">Sắp diễn ra</SelectItem>
            <SelectItem key="Expired">Đã hết hạn</SelectItem>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            startContent={<MagnifyingGlassIcon className="w-5 h-5" />}
            onPress={handleSearch}
          >
            Tìm kiếm
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={handleAdd}
          >
            Thêm ưu đãi
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table
            aria-label="Bảng quản lý ưu đãi"
            classNames={{
              wrapper: "shadow-none",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  className="bg-gray-50 text-gray-700 font-semibold text-sm uppercase tracking-wider"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent="Không có ưu đãi nào" items={promotions}>
              {(promotion) => (
                <TableRow key={promotion._id}>
                  <TableCell>
                    <div className="py-1">
                      <p className="font-medium text-gray-900">
                        {promotion.title}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {promotion.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TagIcon className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-green-600 text-lg">
                        {formatDiscount(
                          promotion.discountType,
                          promotion.discountValue,
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-gray-900 font-medium">
                        {formatDate(promotion.startDate)}
                      </p>
                      <p className="text-gray-500">
                        đến {formatDate(promotion.endDate)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={promotion.applyToAll ? "primary" : "default"}
                      size="sm"
                      variant="flat"
                    >
                      {promotion.applyToAll
                        ? "Tất cả dịch vụ"
                        : "Dịch vụ chỉ định"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(promotion.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(promotion.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                        size="sm"
                        variant="flat"
                        onPress={() => handleEdit(promotion)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        className="bg-red-50 text-red-600 hover:bg-red-100"
                        size="sm"
                        variant="flat"
                        onPress={() => handleDelete(promotion)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isDismissable={!isProcessing}
        isOpen={isAddModalOpen || isEditModalOpen}
        size="2xl"
        onOpenChange={(open) => {
          if (!open && !isProcessing) {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedPromotion(null);
            resetForm();
          }
        }}
      >
        <ModalContent>
          <ModalHeader className="px-4 py-4 border-b">
            {isAddModalOpen ? "Thêm ưu đãi mới" : "Chỉnh sửa ưu đãi"}
          </ModalHeader>
          <ModalBody className="px-4 py-4">
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="title"
                >
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <Input
                  fullWidth
                  classNames={{ base: "w-full", inputWrapper: "w-full" }}
                  id="title"
                  placeholder="Ví dụ: Ưu đãi Quốc Khánh 2/9"
                  value={formData.title}
                  variant="bordered"
                  onValueChange={(value) =>
                    setFormData({ ...formData, title: value })
                  }
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-2"
                  htmlFor="description"
                >
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <Textarea
                  fullWidth
                  classNames={{ base: "w-full", inputWrapper: "w-full" }}
                  id="description"
                  minRows={3}
                  placeholder="Mô tả chi tiết về chương trình ưu đãi..."
                  value={formData.description}
                  variant="bordered"
                  onValueChange={(value) =>
                    setFormData({ ...formData, description: value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="discountType"
                  >
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <Select
                    classNames={{ base: "w-full", trigger: "w-full" }}
                    id="discountType"
                    selectedKeys={[formData.discountType]}
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as
                        | "Percent"
                        | "Fixed";

                      setFormData({ ...formData, discountType: selected });
                    }}
                  >
                    <SelectItem key="Percent">Phần trăm (%)</SelectItem>
                    <SelectItem key="Fixed">Số tiền cố định (đ)</SelectItem>
                  </Select>
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="discountValue"
                  >
                    Giá trị <span className="text-red-500">*</span>
                  </label>
                  <Input
                    fullWidth
                    classNames={{ base: "w-full", inputWrapper: "w-full" }}
                    id="discountValue"
                    min="0"
                    placeholder={
                      formData.discountType === "Percent"
                        ? "0-100"
                        : "Số tiền"
                    }
                    type="number"
                    value={formData.discountValue.toString()}
                    variant="bordered"
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        discountValue: Number(value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="startDate"
                  >
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <Input
                    fullWidth
                    classNames={{ base: "w-full", inputWrapper: "w-full" }}
                    id="startDate"
                    min={today}
                    type="date"
                    value={formData.startDate}
                    variant="bordered"
                    onValueChange={(value) =>
                      setFormData({ ...formData, startDate: value })
                    }
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="endDate"
                  >
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <Input
                    fullWidth
                    classNames={{ base: "w-full", inputWrapper: "w-full" }}
                    id="endDate"
                    min={formData.startDate || today}
                    type="date"
                    value={formData.endDate}
                    variant="bordered"
                    onValueChange={(value) =>
                      setFormData({ ...formData, endDate: value })
                    }
                  />
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Hiện tại chỉ hỗ trợ ưu đãi áp dụng
                  cho tất cả dịch vụ. Tính năng chọn dịch vụ cụ thể sẽ được bổ
                  sung sau.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="px-4 py-4 border-t">
            <Button
              color="default"
              variant="light"
              onPress={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedPromotion(null);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 text-white"
              isLoading={isProcessing}
              onPress={isAddModalOpen ? handleSubmitAdd : handleSubmitEdit}
            >
              {isAddModalOpen ? "Thêm ưu đãi" : "Cập nhật"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isDismissable={!isProcessing}
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Xóa ưu đãi</ModalHeader>
          <ModalBody>
            {selectedPromotion && (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Bạn có chắc chắn muốn xóa ưu đãi này?
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {selectedPromotion.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedPromotion.description}
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
                setSelectedPromotion(null);
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

export default PromotionManagement;


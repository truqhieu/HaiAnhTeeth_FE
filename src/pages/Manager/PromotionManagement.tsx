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
  Pagination,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { promotionApi, type Promotion } from "@/api/promotion";
import { AddPromotionModal, EditPromotionModal } from "@/components";
import DateRangePicker from "@/components/Common/DateRangePicker";

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPromotions();
  }, [statusFilter, currentPage, dateFilter.startDate, dateFilter.endDate]);

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchPromotions();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        sort: "desc",
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (dateFilter.startDate) {
        params.startDate = dateFilter.startDate;
      }

      if (dateFilter.endDate) {
        params.endDate = dateFilter.endDate;
      }

      const response = await promotionApi.getAllPromotions(params);

      if (response.success && response.data) {
        setPromotions(response.data);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      } else {
        toast.error("Không thể tải danh sách ưu đãi");
      }
    } catch (error) {
      console.error("❌ Error fetching promotions:", error);
      toast.error("Đã xảy ra lỗi khi tải danh sách ưu đãi");
    } finally {
      setLoading(false);
    }
  };


  const handleAdd = () => {
    setIsAddModalOpen(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsEditModalOpen(true);
  };

  const handleDelete = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPromotion) return;

    try {
      setIsProcessing(true);

      const response = await promotionApi.deletePromotion(selectedPromotion._id);

      if (response.success) {
        toast.success("Xóa ưu đãi thành công");
        setIsDeleteModalOpen(false);
        setSelectedPromotion(null);
        fetchPromotions();
      } else {
        toast.error(response.message || "Đã xảy ra lỗi khi xóa ưu đãi");
      }
    } catch (error: any) {
      console.error("❌ Error deleting promotion:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi xóa ưu đãi");
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
      case "Upcoming":
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
      case "Upcoming":
        return "Sắp diễn ra";
      case "Expired":
        return "Đã hết hạn";
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const iso = new Date(dateString).toISOString().split("T")[0];
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatDiscount = (type: string, value: number) => {
    return type === "Percent" ? `${value}%` : `${value.toLocaleString()}đ`;
  };

  const handleDateRangeChange = (start: string | null, end: string | null) => {
    setDateFilter({
      startDate: start,
      endDate: end,
    });
    setCurrentPage(1);
  };

  const columns = [
    { key: "stt", label: "STT" },
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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-1 lg:items-end">
          {/* Search */}
          <div className="relative w-full min-w-[240px] lg:flex-[1.4]">
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

          {/* Status Filter */}
          <Select
            className="w-full sm:w-56 min-w-[220px] lg:flex-[0.6]"
            placeholder="Trạng thái"
            selectedKeys={[statusFilter]}
            variant="bordered"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;

              setStatusFilter(selected);
              setCurrentPage(1);
            }}
          >
            <SelectItem key="all">Tất cả trạng thái</SelectItem>
            <SelectItem key="Active">Đang áp dụng</SelectItem>
            <SelectItem key="Upcoming">Sắp diễn ra</SelectItem>
            <SelectItem key="Expired">Đã hết hạn</SelectItem>
          </Select>

          <div className="w-full sm:w-56 min-w-[220px] lg:flex-[0.7]">
            <DateRangePicker
              startDate={dateFilter.startDate}
              endDate={dateFilter.endDate}
              onDateChange={handleDateRangeChange}
              placeholder="Chọn khoảng thời gian áp dụng"
            />
          </div>
        </div>

        <div className="flex w-full justify-end lg:w-auto">
          <Button
            className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700"
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
                  className="bg-white text-gray-700 font-semibold text-sm uppercase tracking-wider"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent="Không có ưu đãi nào" items={promotions}>
              {(promotion) => (
                <TableRow key={promotion._id}>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {(currentPage - 1) * itemsPerPage +
                        promotions.indexOf(promotion) +
                        1}
                    </span>
                  </TableCell>
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
                    {promotion.applyToAll ? (
                      <Chip
                        color="primary"
                        size="sm"
                        variant="flat"
                      >
                        Tất cả dịch vụ
                      </Chip>
                    ) : (
                      <Tooltip
                        content={
                          <div className="max-w-xs">
                            <p className="font-semibold mb-2">Dịch vụ áp dụng:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {promotion.services && promotion.services.length > 0 ? (
                                promotion.services.map((serviceId: any, idx: number) => (
                                  <li key={idx} className="text-xs">
                                    {typeof serviceId === 'object' && serviceId?.serviceName 
                                      ? serviceId.serviceName 
                                      : `Dịch vụ ${idx + 1}`}
                                  </li>
                                ))
                              ) : (
                                <li className="text-xs">Chưa có dịch vụ nào</li>
                              )}
                            </ul>
                          </div>
                        }
                      >
                        <Chip
                          color="default"
                          size="sm"
                          variant="flat"
                          className="cursor-pointer"
                        >
                          {promotion.services?.length || 0} dịch vụ
                        </Chip>
                      </Tooltip>
                    )}
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
                    <div className="flex items-center gap-3">
                      <Tooltip content="Chỉnh sửa ưu đãi">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-8 h-8 text-blue-600 hover:bg-blue-50"
                          onPress={() => handleEdit(promotion)}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Button>
                      </Tooltip>
                      <Tooltip 
                        content={
                          promotion.status === "Active"
                            ? "Không thể xóa ưu đãi đang áp dụng"
                            : "Xóa ưu đãi"
                        }
                      >
                        <span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="min-w-8 h-8 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            onPress={() => handleDelete(promotion)}
                            isDisabled={promotion.status === "Active"}
                          >
                            <TrashIcon className="w-5 h-5" />
                          </Button>
                        </span>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {!loading && total > 0 && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị{" "}
              {promotions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} đến{" "}
              {promotions.length === 0
                ? 0
                : Math.min((currentPage - 1) * itemsPerPage + promotions.length, total)}{" "}
              trong tổng số {total} ưu đãi
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
      </div>

      {/* Add Promotion Modal */}
      <AddPromotionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchPromotions}
      />

      {/* Edit Promotion Modal */}
      <EditPromotionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPromotion(null);
        }}
        promotion={selectedPromotion}
        onSuccess={fetchPromotions}
      />

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
                  <div className="mt-2">
                    <Chip
                      color={getStatusColor(selectedPromotion.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(selectedPromotion.status)}
                    </Chip>
                  </div>
                </div>
                {selectedPromotion.status === "Expired" && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý:</strong> Ưu đãi đã hết hạn này và các liên kết liên quan sẽ bị xóa.
                    </p>
                  </div>
                )}
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


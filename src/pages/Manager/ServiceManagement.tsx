import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
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
  Tooltip,
} from "@heroui/react";
import toast from "react-hot-toast";

import { AddServiceModal, EditServiceModal } from "@/components";
import { DateRangePicker } from "@/components/Common";
import { managerApi, ManagerService } from "@/api";
import { Service } from "@/types";

const ServiceManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{startDate: string | null, endDate: string | null}>({
    startDate: null,
    endDate: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Category mapping từ backend enum sang tiếng Việt
  const categoryMap: { [key: string]: string } = {
    Examination: "Khám",
    Consultation: "Tư vấn",
  };

  // Reverse mapping để gửi lên backend
  const categoryReverseMap: { [key: string]: string } = {
    Khám: "Examination",
    "Tư vấn": "Consultation",
  };

  // Fetch services from API
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await managerApi.getAllServices({
        page: currentPage,
        limit: itemsPerPage,
        status:
          statusFilter !== "all"
            ? statusFilter === "active"
              ? "Active"
              : "Inactive"
            : undefined,
        category:
          categoryFilter !== "all"
            ? categoryReverseMap[categoryFilter]
            : undefined,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        // Map API data to local Service interface
        const mappedServices: Service[] = response.data.map(
          (service: ManagerService) => ({
            id: service._id,
            name: service.serviceName,
            description: service.description,
            price: service.price,
            duration: service.durationMinutes,
            category: categoryMap[service.category] || service.category,
            status:
              service.status === "Active"
                ? ("active" as const)
                : ("inactive" as const),
          }),
        );

        setServices(mappedServices);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error: any) {
      console.error("❌ Error fetching services:", error);
      toast.error(error.message || "Không thể tải danh sách dịch vụ");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchServices();
  }, [currentPage, statusFilter, categoryFilter]);

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchServices();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const statusOptions = [
    { key: "all", label: "Tất cả trạng thái" },
    { key: "active", label: "Hoạt động" },
    { key: "inactive", label: "Không hoạt động" },
  ];

  const categoryOptions = [
    { key: "all", label: "Tất cả danh mục" },
    { key: "Khám", label: "Khám" },
    { key: "Tư vấn", label: "Tư vấn" },
  ];

  // Pagination info
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, total);
  const currentServices = services;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);

    if (service) {
      setSelectedService(service);
      setIsEditModalOpen(true);
    }
  };

  const handleEditSuccess = () => {
    // Refresh service list after successful edit
    if (statusFilter !== "all") {
      setStatusFilter("all");
      // fetchServices will be triggered by useEffect
    } else {
      // If already on "all", manually fetch
      fetchServices();
    }
    setIsEditModalOpen(false);
    setSelectedService(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedService(null);
  };

  const handleAddNew = () => {
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    // Refresh service list after successful addition
    fetchServices();
    setIsAddModalOpen(false);
  };

  const handleDelete = (serviceId: string, serviceName: string) => {
    setServiceToDelete({ id: serviceId, name: serviceName });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const response = await managerApi.deleteService(serviceToDelete.id);

      if ((response as any).status || response.success) {
        toast.success(response.message || "Xóa dịch vụ thành công!");
        // Refresh list
        fetchServices();
        setIsDeleteModalOpen(false);
        setServiceToDelete(null);
      } else {
        throw new Error(response.message || "Không thể xóa dịch vụ");
      }
    } catch (error: any) {
      toast.error(
        error.message || "Có lỗi xảy ra khi xóa dịch vụ. Vui lòng thử lại.",
      );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }

    return `${hours} giờ ${remainingMinutes} phút`;
  };

  const columns = [
    { key: "stt", label: "STT" },
    { key: "name", label: "Tên dịch vụ" },
    { key: "description", label: "Mô tả" },
    { key: "category", label: "Danh mục" },
    { key: "price", label: "Giá" },
    { key: "duration", label: "Thời gian" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Thao tác" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Quản lý dịch vụ phòng khám
        </h1>
        <p className="text-gray-600 mt-2">
          Quản lý các dịch vụ nha khoa và thông tin chi tiết
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Input
              className="w-full"
              placeholder="Tìm kiếm dịch vụ..."
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
            placeholder="Chọn danh mục"
            selectedKeys={categoryFilter ? [categoryFilter] : []}
            variant="bordered"
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;

              setCategoryFilter(selectedKey);
              // Reset to page 1 when filter changes
              if (currentPage !== 1) {
                setCurrentPage(1);
              }
            }}
          >
            {categoryOptions.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>

          {/* Status Filter */}
          <Select
            className="w-48"
            placeholder="Chọn trạng thái"
            selectedKeys={statusFilter ? [statusFilter] : []}
            variant="bordered"
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;

              setStatusFilter(selectedKey);
              // Reset to page 1 when filter changes
              if (currentPage !== 1) {
                setCurrentPage(1);
              }
            }}
          >
            {statusOptions.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Add New Button */}
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={handleAddNew}
        >
          Thêm dịch vụ mới
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table
            aria-label="Bảng quản lý dịch vụ"
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
            <TableBody
              emptyContent="Không tìm thấy dịch vụ"
              items={currentServices}
            >
              {(service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {(currentPage - 1) * itemsPerPage +
                        currentServices.indexOf(service) +
                        1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {service.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {service.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      className="bg-blue-100 text-blue-800"
                      size="sm"
                      variant="flat"
                    >
                      {service.category}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(service.price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900">
                      {formatDuration(service.duration)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={service.status === "active" ? "success" : "default"}
                      size="sm"
                      variant="flat"
                    >
                      {service.status === "active"
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Tooltip content="Chỉnh sửa dịch vụ">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-8 h-8 text-blue-600 hover:bg-blue-50"
                          onPress={() => handleEdit(service.id)}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Xóa dịch vụ">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-8 h-8 text-red-600 hover:bg-red-50"
                          onPress={() => handleDelete(service.id, service.name)}
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

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} đến {endIndex} trong tổng số {total} dịch vụ
          </div>

          <div className="flex items-center space-x-2">
            {/* Previous button */}
            <Button
              isDisabled={currentPage === 1}
              size="sm"
              variant="bordered"
              onPress={() => handlePageChange(currentPage - 1)}
            >
              ←
            </Button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                className="min-w-8"
                color={currentPage === page ? "primary" : "default"}
                size="sm"
                variant={currentPage === page ? "solid" : "bordered"}
                onPress={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}

            {/* Next button */}
            <Button
              isDisabled={currentPage === totalPages}
              size="sm"
              variant="bordered"
              onPress={() => handlePageChange(currentPage + 1)}
            >
              →
            </Button>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      <AddServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Service Modal */}
      <EditServiceModal
        isOpen={isEditModalOpen}
        service={selectedService}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Xác nhận xóa</ModalHeader>
              <ModalBody>
                <p>
                  Bạn có chắc chắn muốn xóa dịch vụ <strong>"{serviceToDelete?.name}"</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">Hành động này không thể hoàn tác.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Hủy
                </Button>
                <Button color="danger" onPress={confirmDelete}>
                  Xóa
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ServiceManagement;

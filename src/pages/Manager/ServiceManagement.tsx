import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";
import { AddServiceModal, EditServiceModal } from "@/components";
import { managerApi, ManagerService } from "@/api";
import { Service } from "@/types";

const ServiceManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Category mapping từ backend enum sang tiếng Việt
  const categoryMap: { [key: string]: string } = {
    'Examination': 'Khám',
    'Consultation': 'Tư vấn'
  };

  // Reverse mapping để gửi lên backend
  const categoryReverseMap: { [key: string]: string } = {
    'Khám': 'Examination',
    'Tư vấn': 'Consultation'
  };

  // Fetch services from API
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await managerApi.getAllServices({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? (statusFilter === 'active' ? 'Active' : 'Inactive') : undefined,
        category: categoryFilter !== 'all' ? categoryReverseMap[categoryFilter] : undefined,
        search: searchTerm || undefined,
      });

      if (response.status && response.data) {
        // Map API data to local Service interface
        const mappedServices: Service[] = response.data.map((service: ManagerService) => ({
          id: service._id,
          name: service.serviceName,
          description: service.description,
          price: service.price,
          duration: service.durationMinutes,
          category: categoryMap[service.category] || service.category,
          status: service.status === 'Active' ? 'active' as const : 'inactive' as const,
        }));
        
        setServices(mappedServices);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error: any) {
      console.error('❌ Error fetching services:', error);
      toast.error(error.message || 'Không thể tải danh sách dịch vụ');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const statusOptions = [
    { key: "all", label: "Tất cả" },
    { key: "active", label: "Hoạt động" },
    { key: "inactive", label: "Không hoạt động" },
  ];

  const categoryOptions = [
    { key: "all", label: "Tất cả" },
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
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setIsEditModalOpen(true);
    }
  };

  const handleEditSuccess = () => {
    // Refresh service list after successful edit
    fetchServices();
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

  const handleDelete = async (serviceId: string, serviceName: string) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa dịch vụ "${serviceName}"?\n\nHành động này không thể hoàn tác.`
    );

    if (!confirmDelete) return;

    try {
      const response = await managerApi.deleteService(serviceId);

      if ((response as any).status || response.success) {
        toast.success(response.message || "Xóa dịch vụ thành công!");
        // Refresh list
        fetchServices();
      } else {
        throw new Error(response.message || 'Không thể xóa dịch vụ');
      }
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast.error(error.message || "Có lỗi xảy ra khi xóa dịch vụ. Vui lòng thử lại.");
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
              placeholder="Tìm kiếm dịch vụ..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              }
              className="w-full"
              variant="bordered"
            />
          </div>

          {/* Category Filter */}
          <Select
            placeholder="Chọn danh mục"
            selectedKeys={categoryFilter ? [categoryFilter] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              setCategoryFilter(selectedKey);
              // Reset to page 1 when filter changes
              if (currentPage !== 1) {
                setCurrentPage(1);
              }
            }}
            className="w-48"
            variant="bordered"
          >
            {categoryOptions.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>

          {/* Status Filter */}
          <Select
            placeholder="Chọn trạng thái"
            selectedKeys={statusFilter ? [statusFilter] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              setStatusFilter(selectedKey);
              // Reset to page 1 when filter changes
              if (currentPage !== 1) {
                setCurrentPage(1);
              }
            }}
            className="w-48"
            variant="bordered"
          >
            {statusOptions.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Add New Button */}
        <Button
          className="bg-green-600 text-white hover:bg-green-700 px-6 py-2"
          onPress={handleAddNew}
          startContent={<PlusIcon className="w-5 h-5" />}
        >
          Thêm dịch vụ mới
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên dịch vụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentServices.map((service, index) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate">{service.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatPrice(service.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(service.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        service.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {service.status === "active" ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(service.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Chỉnh sửa dịch vụ"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id, service.name)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Xóa dịch vụ"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Đang tải dữ liệu...</div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && currentServices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Không tìm thấy dịch vụ</div>
            <div className="text-gray-400 text-sm mt-2">
              Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} đến {endIndex} trong{" "}
            {total} kết quả
          </div>

          <div className="flex items-center space-x-2">
            {/* Previous button */}
            <Button
              isDisabled={currentPage === 1}
              variant="bordered"
              size="sm"
              onPress={() => handlePageChange(currentPage - 1)}
            >
              ←
            </Button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "solid" : "bordered"}
                color={currentPage === page ? "primary" : "default"}
                size="sm"
                onPress={() => handlePageChange(page)}
                className="min-w-8"
              >
                {page}
              </Button>
            ))}

            {/* Next button */}
            <Button
              isDisabled={currentPage === totalPages}
              variant="bordered"
              size="sm"
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
        onClose={handleCloseEditModal}
        service={selectedService}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default ServiceManagement;

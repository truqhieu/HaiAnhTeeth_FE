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
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { deviceApi } from "@/api/device";
import type { Device } from "@/api/device";
import { AddDeviceModal, EditDeviceModal } from "@/components";

const DeviceManagement = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [statusFilter, currentPage]);

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchDevices();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchDevices = async () => {
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

      const response = await deviceApi.getAllDevices(params);

      if (response.success && response.data) {
        setDevices(response.data);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      } else {
        toast.error("Không thể tải danh sách thiết bị");
      }
    } catch (error) {
      console.error("❌ Error fetching devices:", error);
      toast.error("Đã xảy ra lỗi khi tải danh sách thiết bị");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (currentPage === 1) {
      fetchDevices();
    } else {
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddNew = () => {
    setIsAddModalOpen(true);
  };

  const handleEdit = (device: Device) => {
    setSelectedDevice(device);
    setIsEditModalOpen(true);
  };

  const handleDelete = (device: Device) => {
    setDeviceToDelete({ id: device._id, name: device.name });
    setIsDeleteModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddSuccess = () => {
    fetchDevices();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDevice(null);
  };

  const handleEditSuccess = () => {
    fetchDevices();
  };

  const confirmDelete = async () => {
    if (!deviceToDelete) return;

    try {
      setIsProcessing(true);

      const response = await deviceApi.deleteDevice(deviceToDelete.id);

      if (response.success) {
        toast.success(response.message || "Xóa thiết bị thành công");
        setIsDeleteModalOpen(false);
        setDeviceToDelete(null);
        fetchDevices();
      } else {
        toast.error(response.message || "Không thể xóa thiết bị");
      }
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi khi xóa thiết bị");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string): "success" | "danger" => {
    return status === "Active" ? "success" : "danger";
  };

  const getStatusText = (status: string): string => {
    return status === "Active" ? "Hoạt động" : "Không hoạt động";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const columns = [
    { key: "stt", label: "STT" },
    { key: "name", label: "Tên thiết bị" },
    { key: "description", label: "Mô tả" },
    { key: "dates", label: "Thời gian" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hành động" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Quản lý thiết bị
        </h1>
        <p className="text-gray-600 mt-2">
          Quản lý danh sách thiết bị trong phòng khám
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Input
              className="w-full"
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
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
            <SelectItem key="Active">Hoạt động</SelectItem>
            <SelectItem key="Inactive">Không hoạt động</SelectItem>
          </Select>
        </div>

        <Button
          className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={handleAddNew}
        >
          Thêm thiết bị mới
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
            aria-label="Bảng quản lý thiết bị"
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
            <TableBody emptyContent="Không có thiết bị nào" items={devices}>
              {(device) => (
                <TableRow key={device._id}>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {(currentPage - 1) * itemsPerPage + devices.indexOf(device) + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-gray-900">
                      {device.name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-800 max-w-xs line-clamp-2">
                      {device.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="py-1">
                      <div className="flex items-center gap-2 text-gray-900 text-sm">
                        <CalendarIcon className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Mua:</span>
                        <span>{formatDate(device.purchaseDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-900 text-sm mt-1">
                        <CalendarIcon className="w-4 h-4 text-red-500" />
                        <span className="font-medium">Hết hạn:</span>
                        <span>{formatDate(device.expireDate)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(device.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(device.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Chỉnh sửa thiết bị"
                        onClick={() => handleEdit(device)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Xóa thiết bị"
                        onClick={() => handleDelete(device)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Device Modal */}
      <EditDeviceModal
        device={selectedDevice}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isDismissable={!isProcessing}
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Xác nhận xóa thiết bị
          </ModalHeader>
          <ModalBody>
            {deviceToDelete && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">Tên thiết bị</p>
                      <p className="font-medium text-gray-900">
                        {deviceToDelete.name}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700">
                  Bạn có chắc chắn muốn xóa thiết bị này? Hành động này không
                  thể hoàn tác.
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
                setDeviceToDelete(null);
              }}
            >
              Hủy
            </Button>
            <Button
              className="bg-red-600 text-white"
              isLoading={isProcessing}
              onPress={confirmDelete}
            >
              Xóa thiết bị
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-4 sm:mb-0">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
            {Math.min(currentPage * itemsPerPage, total)} trong tổng số {total}{" "}
            thiết bị
          </div>
          <div className="flex gap-2">
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
    </div>
  );
};

export default DeviceManagement;


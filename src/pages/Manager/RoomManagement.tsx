import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
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

import { AddRoomModal, EditRoomModal } from "@/components";
import { managerApi, ManagerClinic, ManagerDoctor } from "@/api";
import { Room } from "@/types";

const RoomManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [doctors, setDoctors] = useState<ManagerDoctor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available doctors
  const fetchDoctors = async () => {
    try {
      const response = await managerApi.getAvailableDoctors();

      if (response.success && response.data) {
        setDoctors(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Fetch clinic rooms
  const fetchClinics = async () => {
    setIsLoading(true);
    try {
      const response = await managerApi.getAllClinics({
        page: currentPage,
        limit: itemsPerPage,
        status:
          statusFilter !== "all"
            ? statusFilter === "active"
              ? "Active"
              : "Inactive"
            : undefined,
        search: searchTerm || undefined,
      });

      if (response.status && response.data) {
        // Map API data to local Room interface
        const mappedRooms: Room[] = response.data.map(
          (clinic: ManagerClinic) => {
            // Backend populate assignedDoctorId thành object {_id, fullName}
            let doctorId = null;
            let doctorName = undefined;

            if (clinic.assignedDoctorId) {
              if (typeof clinic.assignedDoctorId === "object") {
                // Populated object
                doctorId = (clinic.assignedDoctorId as any)._id;
                doctorName = (clinic.assignedDoctorId as any).fullName;
              } else {
                // Chỉ có string ID (không populate)
                doctorId = clinic.assignedDoctorId;
              }
            }

            return {
              id: clinic._id,
              name: clinic.name,
              description: clinic.description,
              status:
                clinic.status === "Active"
                  ? ("active" as const)
                  : ("inactive" as const),
              assignedDoctorId: doctorId,
              assignedDoctorName: doctorName,
            };
          },
        );

        setRooms(mappedRooms);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error: any) {
      console.error("❌ Error fetching clinics:", error);
      toast.error(error.message || "Không thể tải danh sách phòng khám");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchClinics();
    fetchDoctors();
  }, [currentPage, statusFilter]);

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchClinics();
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

  // Pagination info
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, total);
  const currentRooms = rooms;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);

    if (room) {
      setSelectedRoom(room);
      setIsEditModalOpen(true);
    }
  };


  const handleAddNew = () => {
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    // Refresh room list after successful add
    fetchClinics();
    setIsAddModalOpen(false);
  };

  const handleEditSuccess = () => {
    // Refresh room list after successful edit
    fetchClinics();
    fetchDoctors(); // Refresh doctors list nếu có assign/unassign
    setIsEditModalOpen(false);
    setSelectedRoom(null);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRoom(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "inactive":
        return "Không hoạt động";
      default:
        return status;
    }
  };

  const columns = [
    { key: "stt", label: "STT" },
    { key: "name", label: "Tên phòng khám" },
    { key: "description", label: "Mô tả" },
    { key: "doctor", label: "Bác sĩ phụ trách" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Thao tác" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý phòng khám</h1>
        <p className="text-gray-600 mt-2">
          Quản lý các phòng khám và phân công bác sĩ
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Input
              className="w-full"
              placeholder="Tìm kiếm phòng khám..."
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
          Thêm phòng mới
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
            aria-label="Bảng quản lý phòng khám"
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
              emptyContent="Không tìm thấy phòng khám"
              items={currentRooms}
            >
              {(room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {(currentPage - 1) * itemsPerPage +
                        currentRooms.indexOf(room) +
                        1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {room.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {room.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    {room.assignedDoctorId ? (
                      <span className="font-medium text-blue-600 text-sm">
                        {room.assignedDoctorName || "BS. (Đang tải...)"}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-sm">
                        Chưa phân công
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={room.status === "active" ? "success" : "default"}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(room.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Tooltip content="Chỉnh sửa phòng khám">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-8 h-8 text-blue-600 hover:bg-blue-50"
                          onPress={() => handleEdit(room.id)}
                        >
                          <PencilIcon className="w-5 h-5" />
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
            Hiển thị {startIndex + 1} đến {endIndex} trong tổng số {total} phòng khám
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

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Room Modal */}
      <EditRoomModal
        doctors={doctors}
        isOpen={isEditModalOpen}
        room={selectedRoom}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />

    </div>
  );
};

export default RoomManagement;

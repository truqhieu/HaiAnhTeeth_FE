import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Select, SelectItem } from "@heroui/react";
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
      if (response.status && response.data) {
        setDoctors(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
    }
  };

  // Fetch clinic rooms
  const fetchClinics = async () => {
    setIsLoading(true);
    try {
      const response = await managerApi.getAllClinics({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? (statusFilter === 'active' ? 'Active' : 'Inactive') : undefined,
        search: searchTerm || undefined,
      });

      if (response.status && response.data) {
        // Map API data to local Room interface
        const mappedRooms: Room[] = response.data.map((clinic: ManagerClinic) => {
          // Backend populate assignedDoctorId thành object {_id, fullName}
          let doctorId = null;
          let doctorName = undefined;
          
          if (clinic.assignedDoctorId) {
            if (typeof clinic.assignedDoctorId === 'object') {
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
            status: clinic.status === 'Active' ? 'active' as const : 'inactive' as const,
            assignedDoctorId: doctorId,
            assignedDoctorName: doctorName,
          };
        });
        
        setRooms(mappedRooms);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error: any) {
      console.error('❌ Error fetching clinics:', error);
      toast.error(error.message || 'Không thể tải danh sách phòng khám');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchClinics();
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const statusOptions = [
    { key: "all", label: "Tất cả" },
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

  const handleDelete = async (roomId: string, roomName: string) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa phòng khám "${roomName}"?\n\nHành động này không thể hoàn tác.`
    );

    if (!confirmDelete) return;

    try {
      const response = await managerApi.deleteClinic(roomId);

      if ((response as any).status || response.success) {
        toast.success(response.message || "Xóa phòng khám thành công!");
        // Refresh list
        fetchClinics();
        fetchDoctors(); // Refresh doctors list vì có thể doctor được unassign
      } else {
        throw new Error(response.message || 'Không thể xóa phòng khám');
      }
    } catch (error: any) {
      console.error("Error deleting clinic:", error);
      toast.error(error.message || "Có lỗi xảy ra khi xóa phòng khám. Vui lòng thử lại.");
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

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Quản lý phòng khám
        </h1>
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
              placeholder="Tìm kiếm phòng khám..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              }
              className="w-full"
              variant="bordered"
            />
          </div>

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
          Thêm phòng mới
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
                  Tên phòng khám
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bác sĩ phụ trách
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
              {currentRooms.map((room, index) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {room.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate">{room.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {room.assignedDoctorId ? (
                      <div className="font-medium text-blue-600">
                        {room.assignedDoctorName || "BS. (Đang tải...)"}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Chưa phân công</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                        room.status
                      )}`}
                    >
                      {getStatusText(room.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(room.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Chỉnh sửa phòng khám"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id, room.name)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Xóa phòng khám"
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
        {!isLoading && currentRooms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Không tìm thấy phòng khám</div>
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

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Room Modal */}
      <EditRoomModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        room={selectedRoom}
        onSuccess={handleEditSuccess}
        doctors={doctors}
      />
    </div>
  );
};

export default RoomManagement;


import { useState } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { AddRoomModal, EditRoomModal } from "@/components";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

interface Room {
  id: number;
  roomNumber: string;
  roomName: string;
  floor: number;
  status: "available" | "occupied" | "maintenance";
  assignedDoctor: Doctor | null;
  capacity: number;
  equipment: string[];
}

const RoomManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Mock data - Danh sách bác sĩ
  const doctors: Doctor[] = [
    { id: 1, name: "BS. Nguyễn Văn A", specialty: "Nha khoa tổng quát" },
    { id: 2, name: "BS. Trần Thị B", specialty: "Chỉnh nha" },
    { id: 3, name: "BS. Lê Văn C", specialty: "Phẫu thuật" },
    { id: 4, name: "BS. Phạm Thị D", specialty: "Nha chu" },
    { id: 5, name: "BS. Hoàng Văn E", specialty: "Implant" },
  ];

  // Mock data - Danh sách phòng
  const [rooms] = useState<Room[]>([
    {
      id: 1,
      roomNumber: "101",
      roomName: "Phòng khám tổng quát 1",
      floor: 1,
      status: "available",
      assignedDoctor: doctors[0],
      capacity: 1,
      equipment: ["Ghế nha khoa", "Máy X-quang", "Đèn chiếu"],
    },
    {
      id: 2,
      roomNumber: "102",
      roomName: "Phòng khám tổng quát 2",
      floor: 1,
      status: "occupied",
      assignedDoctor: doctors[1],
      capacity: 1,
      equipment: ["Ghế nha khoa", "Máy cạo vôi"],
    },
    {
      id: 3,
      roomNumber: "201",
      roomName: "Phòng phẫu thuật 1",
      floor: 2,
      status: "available",
      assignedDoctor: doctors[2],
      capacity: 2,
      equipment: ["Ghế phẫu thuật", "Máy X-quang", "Đèn mổ", "Máy hút"],
    },
    {
      id: 4,
      roomNumber: "202",
      roomName: "Phòng phẫu thuật 2",
      floor: 2,
      status: "maintenance",
      assignedDoctor: null,
      capacity: 2,
      equipment: ["Ghế phẫu thuật", "Máy X-quang"],
    },
    {
      id: 5,
      roomNumber: "301",
      roomName: "Phòng chỉnh nha",
      floor: 3,
      status: "available",
      assignedDoctor: doctors[1],
      capacity: 1,
      equipment: ["Ghế nha khoa", "Máy scan 3D"],
    },
  ]);

  const statusOptions = [
    { key: "all", label: "Tất cả" },
    { key: "available", label: "Sẵn sàng" },
    { key: "occupied", label: "Đang sử dụng" },
    { key: "maintenance", label: "Bảo trì" },
  ];

  const floorOptions = [
    { key: "all", label: "Tất cả" },
    { key: "1", label: "Tầng 1" },
    { key: "2", label: "Tầng 2" },
    { key: "3", label: "Tầng 3" },
  ];

  // Filter rooms based on search, status and floor
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.assignedDoctor?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || room.status === statusFilter;
    const matchesFloor =
      floorFilter === "all" || room.floor.toString() === floorFilter;
    return matchesSearch && matchesStatus && matchesFloor;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRooms = filteredRooms.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (roomId: number) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = (roomId: number) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      const confirmDelete = window.confirm(
        `Bạn có chắc chắn muốn xóa phòng ${room.roomNumber} - ${room.roomName}?`
      );
      if (confirmDelete) {
        // TODO: Call API to delete room
        console.log("Delete room:", roomId);
        // After successful deletion, refresh the list
      }
    }
  };

  const handleAddNew = () => {
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    // TODO: Refresh room list after successful add
    console.log("Room added successfully");
  };

  const handleEditSuccess = () => {
    // TODO: Refresh room list after successful edit
    console.log("Room updated successfully");
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
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-blue-100 text-blue-800";
      case "maintenance":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Sẵn sàng";
      case "occupied":
        return "Đang sử dụng";
      case "maintenance":
        return "Bảo trì";
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
              placeholder="Tìm kiếm phòng, bác sĩ..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              }
              className="w-full"
              variant="bordered"
            />
          </div>

          {/* Floor Filter */}
          <Select
            placeholder="Chọn tầng"
            selectedKeys={floorFilter ? [floorFilter] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              setFloorFilter(selectedKey);
            }}
            className="w-48"
            variant="bordered"
          >
            {floorOptions.map((option) => (
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
                  Số phòng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên phòng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tầng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bác sĩ phụ trách
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sức chứa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thiết bị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {room.roomNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {room.roomName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Tầng {room.floor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {room.assignedDoctor ? (
                      <div>
                        <div className="font-medium">{room.assignedDoctor.name}</div>
                        <div className="text-xs text-gray-500">
                          {room.assignedDoctor.specialty}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Chưa phân công</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {room.capacity} người
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {room.equipment.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {room.equipment.slice(0, 2).map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800"
                            >
                              {item}
                            </span>
                          ))}
                          {room.equipment.length > 2 && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                              +{room.equipment.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Chưa có</span>
                      )}
                    </div>
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(room.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Chỉnh sửa phòng"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Xóa phòng"
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

        {/* Empty state */}
        {currentRooms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Không tìm thấy phòng</div>
            <div className="text-gray-400 text-sm mt-2">
              Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredRooms.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} đến{" "}
            {Math.min(endIndex, filteredRooms.length)} trong{" "}
            {filteredRooms.length} kết quả
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
        doctors={doctors}
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


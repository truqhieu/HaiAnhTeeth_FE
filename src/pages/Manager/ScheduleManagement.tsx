import { useState } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { AddScheduleModal, EditScheduleModal } from "@/components";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

interface Schedule {
  id: number;
  date: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  doctor: Doctor;
  room: string;
  maxPatients: number;
  currentPatients: number;
  status: "active" | "full" | "cancelled";
}

const ScheduleManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Mock data - Danh sách bác sĩ
  const doctors: Doctor[] = [
    { id: 1, name: "BS. Nguyễn Văn A", specialty: "Nha khoa tổng quát" },
    { id: 2, name: "BS. Trần Thị B", specialty: "Chỉnh nha" },
    { id: 3, name: "BS. Lê Văn C", specialty: "Phẫu thuật" },
    { id: 4, name: "BS. Phạm Thị D", specialty: "Nha chu" },
    { id: 5, name: "BS. Hoàng Văn E", specialty: "Implant" },
  ];

  // Mock data - Danh sách phòng
  const rooms = ["101", "102", "201", "202", "301"];

  // Mock data - Lịch làm việc
  const [schedules] = useState<Schedule[]>([
    {
      id: 1,
      date: "2025-10-20",
      shiftName: "Sáng",
      startTime: "08:00",
      endTime: "12:00",
      doctor: doctors[0],
      room: "101",
      maxPatients: 10,
      currentPatients: 7,
      status: "active",
    },
    {
      id: 2,
      date: "2025-10-20",
      shiftName: "Chiều",
      startTime: "13:00",
      endTime: "17:00",
      doctor: doctors[0],
      room: "101",
      maxPatients: 10,
      currentPatients: 10,
      status: "full",
    },
    {
      id: 3,
      date: "2025-10-20",
      shiftName: "Sáng",
      startTime: "08:00",
      endTime: "12:00",
      doctor: doctors[1],
      room: "102",
      maxPatients: 8,
      currentPatients: 5,
      status: "active",
    },
    {
      id: 4,
      date: "2025-10-20",
      shiftName: "Chiều",
      startTime: "13:00",
      endTime: "17:00",
      doctor: doctors[2],
      room: "201",
      maxPatients: 6,
      currentPatients: 3,
      status: "active",
    },
    {
      id: 5,
      date: "2025-10-21",
      shiftName: "Sáng",
      startTime: "08:00",
      endTime: "12:00",
      doctor: doctors[1],
      room: "102",
      maxPatients: 8,
      currentPatients: 0,
      status: "active",
    },
    {
      id: 6,
      date: "2025-10-21",
      shiftName: "Tối",
      startTime: "18:00",
      endTime: "21:00",
      doctor: doctors[3],
      room: "102",
      maxPatients: 6,
      currentPatients: 0,
      status: "cancelled",
    },
  ]);

  const statusOptions = [
    { key: "all", label: "Tất cả" },
    { key: "active", label: "Đang hoạt động" },
    { key: "full", label: "Đã đầy" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.shiftName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || schedule.date === dateFilter;
    const matchesStatus = statusFilter === "all" || schedule.status === statusFilter;
    return matchesSearch && matchesDate && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchedules = filteredSchedules.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (scheduleId: number) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule) {
      setSelectedSchedule(schedule);
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = (scheduleId: number) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule) {
      const confirmDelete = window.confirm(
        `Bạn có chắc chắn muốn xóa ca khám ${schedule.shiftName} - ${schedule.doctor.name}?`
      );
      if (confirmDelete) {
        // TODO: Call API to delete schedule
        console.log("Delete schedule:", scheduleId);
      }
    }
  };

  const handleAddNew = () => {
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    console.log("Schedule added successfully");
  };

  const handleEditSuccess = () => {
    console.log("Schedule updated successfully");
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSchedule(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "full":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Đang hoạt động";
      case "full":
        return "Đã đầy";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Quản lý lịch làm việc
        </h1>
        <p className="text-gray-600 mt-2">
          Quản lý ca khám và phân công bác sĩ theo từng ca
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Tìm kiếm bác sĩ, phòng, ca..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              }
              className="w-full"
              variant="bordered"
            />
          </div>

          {/* Date Filter */}
          <Input
            type="date"
            placeholder="Chọn ngày"
            value={dateFilter}
            onValueChange={setDateFilter}
            className="w-48"
            variant="bordered"
            startContent={
              <CalendarIcon className="w-5 h-5 text-gray-400" />
            }
          />

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
          Thêm ca khám mới
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ca làm việc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bác sĩ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bệnh nhân
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
              {currentSchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">
                      {new Date(schedule.date).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(schedule.date).toLocaleDateString("vi-VN", {
                        weekday: "long",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      {schedule.shiftName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.startTime} - {schedule.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{schedule.doctor.name}</div>
                      <div className="text-xs text-gray-500">
                        {schedule.doctor.specialty}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    Phòng {schedule.room}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {schedule.currentPatients}/{schedule.maxPatients}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              schedule.currentPatients >= schedule.maxPatients
                                ? "bg-red-500"
                                : schedule.currentPatients >= schedule.maxPatients * 0.7
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${
                                (schedule.currentPatients / schedule.maxPatients) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                        schedule.status
                      )}`}
                    >
                      {getStatusText(schedule.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(schedule.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Chỉnh sửa ca khám"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Xóa ca khám"
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
        {currentSchedules.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Không tìm thấy ca khám</div>
            <div className="text-gray-400 text-sm mt-2">
              Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredSchedules.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} đến{" "}
            {Math.min(endIndex, filteredSchedules.length)} trong{" "}
            {filteredSchedules.length} kết quả
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

      {/* Add Schedule Modal */}
      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSuccess={handleAddSuccess}
        doctors={doctors}
        rooms={rooms}
      />

      {/* Edit Schedule Modal */}
      <EditScheduleModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        schedule={selectedSchedule}
        onSuccess={handleEditSuccess}
        doctors={doctors}
        rooms={rooms}
      />
    </div>
  );
};

export default ScheduleManagement;


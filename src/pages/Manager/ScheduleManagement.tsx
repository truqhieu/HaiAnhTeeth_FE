import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";

import { AddScheduleModal, EditScheduleModal } from "@/components";
import {
  managerApi,
  ManagerSchedule,
  ManagerDoctor,
  ManagerClinic,
} from "@/api";

interface Schedule {
  id: string;
  date: string;
  shift: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  doctorName: string;
  doctorId: string;
  roomName: string;
  roomId?: string;
  maxSlots: number;
  status: "available" | "unavailable" | "booked" | "cancelled";
}

const ScheduleManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<{ id: string; description: string } | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<ManagerDoctor[]>([]);
  const [rooms, setRooms] = useState<ManagerClinic[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Shift mapping
  const shiftMap: { [key: string]: string } = {
    Morning: "Sáng",
    Afternoon: "Chiều",
  };

  // Fetch available doctors
  const fetchDoctors = async () => {
    try {
      const response = await managerApi.getAvailableDoctorsForSchedule();

      if (response.status && response.data) {
        setDoctors(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Fetch all clinics (rooms)
  const fetchRooms = async () => {
    try {
      const response = await managerApi.getAllClinics({ limit: 100 }); // Get all rooms

      if (response.status && response.data) {
        setRooms(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
    }
  };

  // Fetch schedules
  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await managerApi.getAllSchedules({
        page: currentPage,
        limit: itemsPerPage,
        shift: shiftFilter !== "all" ? shiftFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.status && response.data) {
        // Map API data to local Schedule interface
        const mappedSchedules: Schedule[] = response.data.map(
          (schedule: ManagerSchedule) => {
            // Extract doctor info
            let doctorName = "";
            let doctorId = "";

            if (schedule.doctorUserId) {
              if (typeof schedule.doctorUserId === "object") {
                doctorId = schedule.doctorUserId._id;
                doctorName = schedule.doctorUserId.fullName;
              } else {
                doctorId = schedule.doctorUserId;
              }
            }

            // Extract room info
            let roomName = "";
            let roomId = "";

            if (schedule.roomId) {
              if (typeof schedule.roomId === "object") {
                roomId = schedule.roomId._id;
                roomName =
                  schedule.roomId.name || schedule.roomId.roomName || "";
              } else {
                roomId = schedule.roomId;
              }
            }

            // Format times
            const startTime = new Date(schedule.startTime).toLocaleTimeString(
              "vi-VN",
              { hour: "2-digit", minute: "2-digit" },
            );
            const endTime = new Date(schedule.endTime).toLocaleTimeString(
              "vi-VN",
              { hour: "2-digit", minute: "2-digit" },
            );

            return {
              id: schedule._id,
              date: schedule.date,
              shift: schedule.shift,
              shiftName: shiftMap[schedule.shift] || schedule.shift,
              startTime,
              endTime,
              doctorName,
              doctorId,
              roomName,
              roomId,
              maxSlots: schedule.maxSlots,
              status: schedule.status.toLowerCase() as
                | "available"
                | "unavailable"
                | "booked"
                | "cancelled",
            };
          },
        );

        setSchedules(mappedSchedules);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error: any) {
      console.error("❌ Error fetching schedules:", error);
      toast.error(error.message || "Không thể tải danh sách lịch làm việc");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchSchedules();
    fetchDoctors();
    fetchRooms();
  }, [currentPage, shiftFilter, statusFilter]);

  // OLD MOCK DATA - Removed
  /* const [schedules] = useState<Schedule[]>([
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
  */

  const shiftOptions = [
    { key: "all", label: "Tất cả ca" },
    { key: "Morning", label: "Ca sáng" },
    { key: "Afternoon", label: "Ca chiều" },
  ];

  const statusOptions = [
    { key: "all", label: "Tất cả trạng thái" },
    { key: "Available", label: "Có sẵn" },
    { key: "Unavailable", label: "Không khả dụng" },
    { key: "Booked", label: "Đã đặt" },
    { key: "Cancelled", label: "Đã hủy" },
  ];

  // Client-side filter schedules (for search by name/room)
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.shiftName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Use filtered schedules for display
  const currentSchedules = filteredSchedules;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, total);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);

    if (schedule) {
      setSelectedSchedule(schedule);
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);

    if (schedule) {
      setScheduleToDelete({ id: scheduleId, description: `${schedule.shiftName} - ${schedule.doctorName}` });
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;

    try {
      const response = await managerApi.deleteSchedule(scheduleToDelete.id);

      if (response.status) {
        toast.success(response.message || "Xóa ca khám thành công");
        fetchSchedules(); // Reload list
        setIsDeleteModalOpen(false);
        setScheduleToDelete(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa ca khám");
    }
  };

  const handleAddNew = () => {
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    console.log("Schedule added successfully");
    fetchSchedules(); // Reload list
    setIsAddModalOpen(false);
  };

  const handleEditSuccess = () => {
    console.log("Schedule updated successfully");
    fetchSchedules(); // Reload list
    setIsEditModalOpen(false);
    setSelectedSchedule(null);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSchedule(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800";
      case "unavailable":
        return "bg-gray-100 text-gray-800";
      case "booked":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "Có sẵn";
      case "unavailable":
        return "Không khả dụng";
      case "booked":
        return "Đã đặt";
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
              className="w-full"
              placeholder="Tìm kiếm bác sĩ, phòng, ca..."
              startContent={
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              }
              value={searchTerm}
              variant="bordered"
              onValueChange={setSearchTerm}
            />
          </div>

          {/* Shift Filter */}
          <Select
            className="w-48"
            placeholder="Chọn ca làm việc"
            selectedKeys={shiftFilter ? [shiftFilter] : []}
            variant="bordered"
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;

              setShiftFilter(selectedKey);
              setCurrentPage(1); // Reset to page 1 when filter changes
            }}
          >
            {shiftOptions.map((option) => (
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
              setCurrentPage(1); // Reset to page 1 when filter changes
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
          Thêm ca khám mới
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
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
                  Số slot tối đa
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
              {isLoading ? (
                <tr>
                  <td
                    className="px-6 py-12 text-center text-gray-500"
                    colSpan={8}
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      <span className="ml-3">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : currentSchedules.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center" colSpan={8}>
                    <div className="text-gray-500 text-lg">
                      Không tìm thấy ca khám
                    </div>
                    <div className="text-gray-400 text-sm mt-2">
                      Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                    </div>
                  </td>
                </tr>
              ) : (
                currentSchedules.map((schedule) => (
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
                      <div className="font-medium text-blue-600">
                        {schedule.doctorName || "Chưa có bác sĩ"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {schedule.roomName
                        ? `Phòng ${schedule.roomName}`
                        : "Chưa có phòng"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-sm font-medium">
                        {schedule.maxSlots} slot
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                          schedule.status,
                        )}`}
                      >
                        {getStatusText(schedule.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Chỉnh sửa ca khám"
                          onClick={() => handleEdit(schedule.id)}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Xóa ca khám"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} đến {endIndex} trong {total} kết quả
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

      {/* Add Schedule Modal */}
      <AddScheduleModal
        doctors={doctors}
        isOpen={isAddModalOpen}
        rooms={rooms}
        onClose={handleCloseAddModal}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Schedule Modal */}
      <EditScheduleModal
        doctors={doctors}
        isOpen={isEditModalOpen}
        rooms={rooms}
        schedule={selectedSchedule}
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
                  Bạn có chắc chắn muốn xóa ca khám <strong>"{scheduleToDelete?.description}"</strong>?
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

export default ScheduleManagement;

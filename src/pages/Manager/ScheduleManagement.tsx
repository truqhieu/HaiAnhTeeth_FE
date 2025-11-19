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

import { AddScheduleModal, EditScheduleModal } from "@/components";
import WorkingHoursModal from "@/components/Manager/WorkingHoursModal";
import { DateRangePicker } from "@/components/Common";
import {
  managerApi,
  ManagerSchedule,
  ManagerClinic,
} from "@/api";
import type { DoctorWithWorkingHours } from "@/api/manager";

interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

const ScheduleManagement = () => {
  // State for doctors
  const [doctors, setDoctors] = useState<DoctorWithWorkingHours[]>([]);
  const [rooms, setRooms] = useState<ManagerClinic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isWorkingHoursModalOpen, setIsWorkingHoursModalOpen] = useState(false);
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] = useState<ManagerSchedule | null>(null);
  const [selectedScheduleForDelete] = useState<{ id: string; description: string } | null>(null);
  const [selectedDoctorForWorkingHours, setSelectedDoctorForWorkingHours] = useState<{ id: string; workingHours: any } | null>(null);

  // Fetch doctors with working hours
  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Fetching doctors at:", new Date().toISOString());
      const response = await managerApi.getDoctorsWithWorkingHours();

      console.log("🔍 fetchDoctors response:", response);

      // Backend trả về: { success: true, message: ..., data: [...] }
      // authenticatedApiCall trả về object này trực tiếp
      if (response.success && response.data && Array.isArray(response.data)) {
        console.log("✅ Setting doctors:", response.data);
        setDoctors(response.data);
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback: nếu không có success field nhưng có data array
        console.log("✅ Setting doctors (fallback):", response.data);
        setDoctors(response.data);
      } else {
        console.log("❌ No doctors found or invalid response structure");
        console.log("Response structure:", response);
        setDoctors([]);
      }
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
      toast.error("Lỗi khi tải danh sách bác sĩ");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all clinics (rooms)
  const fetchRooms = async () => {
    try {
      const response = await managerApi.getAllClinics({ limit: 100 });

      if (response.data) {
        setRooms(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchDoctors();
    fetchRooms();
  }, []);

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter((doctor) =>
    doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle edit doctor working hours
  const handleEditDoctorWorkingHours = (doctorId: string, workingHours: any) => {
    setSelectedDoctorForWorkingHours({ id: doctorId, workingHours });
    setIsWorkingHoursModalOpen(true);
  };

  // Handle working hours update success
  const handleWorkingHoursSuccess = () => {
    fetchDoctors(); // Reload list
    setIsWorkingHoursModalOpen(false);
    setSelectedDoctorForWorkingHours(null);
  };

  // Handle add schedule
  const handleAddSchedule = () => {
    setIsAddModalOpen(true);
  };

  // Handle edit schedule
  const handleEditSchedule = (scheduleId: string) => {
    // This will be handled by the new logic
    console.log("Edit schedule:", scheduleId);
  };

  // Handle delete schedule
  const handleDeleteSchedule = (scheduleId: string) => {
    // This will be handled by the new logic
    console.log("Delete schedule:", scheduleId);
  };

  const columns = [
    { key: "doctor", label: "Tên bác sĩ" },
    { key: "morning", label: "Ca sáng" },
    { key: "afternoon", label: "Ca chiều" },
    { key: "updatedAt", label: "Thời gian cập nhật" },
    { key: "actions", label: "Hành động" },
  ];

  // Format date for display
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Chưa cập nhật";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Chưa cập nhật";
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý lịch làm việc bác sĩ
        </h1>
        <p className="text-gray-600">
          Quản lý ca khám và phân công bác sĩ theo từng ca
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm bác sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
              className="max-w-md"
            />
          </div>

          {/* Date Range Picker */}
          <div className="flex-1 min-w-[260px]">
            <DateRangePicker
              value={dateRange}
              onChange={({ startDate, endDate }) =>
                setDateRange({ startDate, endDate })
              }
              placeholder="Chọn khoảng thời gian"
            />
          </div>

          {/* Add Button */}
          <div className="flex-shrink-0 flex gap-2">
            <Button
              color="secondary"
              variant="bordered"
              onPress={fetchDoctors}
              isLoading={isLoading}
            >
              Refresh
            </Button>
            <Button
              color="primary"
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={handleAddSchedule}
            >
              Thêm lịch làm việc
            </Button>
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table
            aria-label="Bảng quản lý lịch làm việc"
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
              emptyContent="Không có bác sĩ nào"
              items={filteredDoctors}
            >
              {(doctor) => (
                <TableRow key={doctor._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {doctor.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{doctor.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {doctor.workingHours?.morningStart && doctor.workingHours?.morningEnd ? (
                        <Chip
                          className="bg-orange-100 text-orange-800"
                          size="sm"
                          variant="flat"
                        >
                          {doctor.workingHours.morningStart} - {doctor.workingHours.morningEnd}
                        </Chip>
                      ) : (
                        <span className="text-gray-400 text-sm">Chưa có lịch làm việc</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {doctor.workingHours?.afternoonStart && doctor.workingHours?.afternoonEnd ? (
                        <Chip
                          className="bg-blue-100 text-blue-800"
                          size="sm"
                          variant="flat"
                        >
                          {doctor.workingHours.afternoonStart} - {doctor.workingHours.afternoonEnd}
                        </Chip>
                      ) : (
                        <span className="text-gray-400 text-sm">Chưa có lịch làm việc</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {formatDate(doctor.workingHoursUpdatedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip content="Chỉnh sửa giờ làm việc">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="min-w-8 h-8 text-blue-600 hover:bg-blue-50"
                        onPress={() =>
                          handleEditDoctorWorkingHours(
                            doctor._id,
                            doctor.workingHours
                          )
                        }
                      >
                        <PencilIcon className="w-5 h-5" />
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Schedule Modal */}
      <AddScheduleModal
        doctors={doctors}
        isOpen={isAddModalOpen}
        rooms={rooms}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchDoctors();
        }}
      />

      {/* Edit Schedule Modal */}
      {selectedScheduleForEdit && (
        <EditScheduleModal
          schedule={selectedScheduleForEdit}
          doctors={doctors}
          isOpen={isEditModalOpen}
          rooms={rooms}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedScheduleForEdit(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedScheduleForEdit(null);
            fetchDoctors();
          }}
        />
      )}


      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        size="sm"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Xác nhận xóa</ModalHeader>
              <ModalBody>
                <p>
                  Bạn có chắc chắn muốn xóa ca khám <strong>&quot;{selectedScheduleForDelete?.description}&quot;</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">Hành động này không thể hoàn tác.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Hủy
                </Button>
                <Button color="danger" onPress={onClose}>
                  Xóa
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Working Hours Modal */}
      {selectedDoctorForWorkingHours && (
        <WorkingHoursModal
          isOpen={isWorkingHoursModalOpen}
          onClose={() => {
            setIsWorkingHoursModalOpen(false);
            setSelectedDoctorForWorkingHours(null);
          }}
          doctorId={selectedDoctorForWorkingHours.id}
          initialWorkingHours={selectedDoctorForWorkingHours.workingHours}
          onSuccess={handleWorkingHoursSuccess}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;

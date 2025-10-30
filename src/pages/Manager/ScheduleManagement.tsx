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
} from "@heroui/react";
import toast from "react-hot-toast";

import { AddScheduleModal, EditScheduleModal } from "@/components";
import WorkingHoursModal from "@/components/Manager/WorkingHoursModal";
import { DateRangePicker } from "@/components/Common";
import {
  managerApi,
  ManagerSchedule,
  ManagerClinic,
  DoctorWithWorkingHours,
} from "@/api";

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

      // Check for both possible response structures
      if (response.data?.success && response.data.data) {
        console.log("✅ Setting doctors (success structure):", response.data.data);
        setDoctors(response.data.data);
      } else if (response.data?.status && response.data.data) {
        console.log("✅ Setting doctors (status structure):", response.data.data);
        setDoctors(response.data.data);
      } else if (response.data?.data) {
        // Fallback: if neither success nor status is present but data exists
        console.log("✅ Setting doctors (fallback):", response.data.data);
        setDoctors(response.data.data);
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

  // Handle working hours update
  const handleWorkingHoursUpdate = async (workingHours: any) => {
    if (!selectedDoctorForWorkingHours) return;

    try {
      const response = await managerApi.updateDoctorWorkingHours(
        selectedDoctorForWorkingHours.id,
        workingHours
      );

      if (response.data?.status) {
        toast.success("Cập nhật giờ làm việc thành công");
        fetchDoctors(); // Reload list
        setIsWorkingHoursModalOpen(false);
        setSelectedDoctorForWorkingHours(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật giờ làm việc");
    }
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

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quản lý lịch làm việc
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
          <div className="flex-1">
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
              Thêm ca khám mới
            </Button>
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ca làm việc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian làm việc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên bác sĩ
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
                    colSpan={4}
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      <span className="ml-3">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center" colSpan={4}>
                    <div className="text-gray-500 text-lg">
                      Không có bác sĩ nào
                    </div>
                    <div className="text-gray-400 text-sm mt-2">
                      Hãy thêm bác sĩ vào hệ thống
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Ca sáng
                          </span>
                          <span className="text-sm text-gray-600">
                            {doctor.workingHours.morningStart} - {doctor.workingHours.morningEnd}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Ca chiều
                          </span>
                          <span className="text-sm text-gray-600">
                            {doctor.workingHours.afternoonStart} - {doctor.workingHours.afternoonEnd}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-800">
                          Sáng: {doctor.workingHours.morningStart} - {doctor.workingHours.morningEnd}
                        </div>
                        <div className="font-medium text-gray-800">
                          Chiều: {doctor.workingHours.afternoonStart} - {doctor.workingHours.afternoonEnd}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium text-blue-600">
                        {doctor.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {doctor.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditDoctorWorkingHours(doctor._id, doctor.workingHours)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Chỉnh sửa giờ làm việc"
                        >
                          <PencilIcon className="h-4 w-4" />
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

      {/* Working Hours Modal */}
      {selectedDoctorForWorkingHours && (
        <WorkingHoursModal
          isOpen={isWorkingHoursModalOpen}
          onClose={() => {
            setIsWorkingHoursModalOpen(false);
            setSelectedDoctorForWorkingHours(null);
          }}
          onSubmit={handleWorkingHoursUpdate}
          initialWorkingHours={selectedDoctorForWorkingHours.workingHours}
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
    </div>
  );
};

export default ScheduleManagement;

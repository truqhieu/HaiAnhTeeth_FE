import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Button,
  Chip,
} from "@heroui/react";
import { EyeIcon, UserIcon } from "@heroicons/react/24/outline";
import { doctorApi, type DoctorAppointment } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import AppointmentDetailModal from "./AppointmentDetailModal";
import PatientDetailModal from "./PatientDetailModal";

const DoctorSchedule = () => {
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await doctorApi.getAppointmentsSchedule();
      
      if (res.success && res.data) {
        setAppointments(res.data);
      } else {
        setError(res.message || "Lỗi lấy danh sách lịch khám");
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err.message || "Lỗi khi tải lịch khám");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
    }
  }, [isAuthenticated]);

  const handleViewAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsAppointmentModalOpen(true);
  };

  const handleViewPatient = (appointmentId: string) => {
    // Note: Backend cần patientId, không phải appointmentId
    // Để đơn giản, ta sẽ lưu appointmentId và trong modal sẽ extract patientId
    setSelectedPatientId(appointmentId);
    setIsPatientModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "success";
      case "CheckedIn":
        return "primary";
      case "Completed":
        return "default";
      case "Finalized":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Approved":
        return "Đã xác nhận";
      case "CheckedIn":
        return "Đã nhận";
      case "Completed":
        return "Hoàn thành";
      case "Finalized":
        return "Đã kết thúc";
      default:
        return status;
    }
  };

  const getModeText = (mode: string) => {
    switch (mode) {
      case "Online":
        return "Trực tuyến";
      case "Offline":
        return "Tại phòng khám";
      default:
        return mode;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const columns = [
    { key: "date", label: "Ngày" },
    { key: "time", label: "Giờ" },
    { key: "patient", label: "Bệnh nhân" },
    { key: "service", label: "Dịch vụ" },
    { key: "mode", label: "Hình thức" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hành động" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Vui lòng đăng nhập để xem lịch khám</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="Đang tải lịch khám..." size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lịch khám của tôi</h1>
          <p className="text-gray-600">Danh sách ca khám trong 2 tuần tới</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <Table aria-label="Bảng lịch khám của bác sĩ">
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={appointments} emptyContent="Không có lịch khám nào">
            {(appointment) => (
              <TableRow key={appointment.appointmentId}>
                <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                <TableCell>
                  {appointment.startTime} - {appointment.endTime}
                </TableCell>
                <TableCell className="font-medium">{appointment.patientName}</TableCell>
                <TableCell>{appointment.serviceName}</TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">
                    {getModeText(appointment.mode)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={getStatusColor(appointment.status)}>
                    {getStatusText(appointment.status)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<EyeIcon className="w-4 h-4" />}
                      onPress={() => handleViewAppointment(appointment.appointmentId)}
                    >
                      Chi tiết
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="secondary"
                      startContent={<UserIcon className="w-4 h-4" />}
                      onPress={() => handleViewPatient(appointment.appointmentId)}
                    >
                      Bệnh nhân
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <AppointmentDetailModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        appointmentId={selectedAppointmentId}
      />
      
      <PatientDetailModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        appointmentId={selectedPatientId}
      />
    </div>
  );
};

export default DoctorSchedule;


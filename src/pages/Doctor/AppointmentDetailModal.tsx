import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Chip,
} from "@heroui/react";
import { doctorApi, type AppointmentDetail } from "@/api";

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string | null;
}

const AppointmentDetailModal = ({
  isOpen,
  onClose,
  appointmentId,
}: AppointmentDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointmentDetail();
    }
  }, [isOpen, appointmentId]);

  const fetchAppointmentDetail = async () => {
    if (!appointmentId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await doctorApi.getAppointmentDetail(appointmentId);

      if (res.success && res.data) {
        setAppointment(res.data);
      } else {
        setError(res.message || "Lỗi lấy chi tiết lịch hẹn");
      }
    } catch (err: any) {
      console.error("Error fetching appointment detail:", err);
      setError(err.message || "Lỗi khi tải chi tiết lịch hẹn");
    } finally {
      setLoading(false);
    }
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
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">Chi tiết lịch hẹn</h3>
            </ModalHeader>
            <ModalBody>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner label="Đang tải..." />
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              ) : appointment ? (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex gap-2">
                    <Chip size="lg" color={getStatusColor(appointment.status)}>
                      {getStatusText(appointment.status)}
                    </Chip>
                    <Chip size="lg" variant="flat">
                      {getModeText(appointment.mode)}
                    </Chip>
                  </div>

                  {/* Patient Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Thông tin bệnh nhân
                    </h4>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="text-gray-600 w-32">Họ tên:</span>
                        <span className="font-medium">{appointment.patientName}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-32">Email:</span>
                        <span className="font-medium">{appointment.patientEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Thông tin lịch hẹn
                    </h4>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="text-gray-600 w-32">Dịch vụ:</span>
                        <span className="font-medium">{appointment.serviceName}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-32">Ngày:</span>
                        <span className="font-medium">
                          {formatDate(appointment.appointmentDate)}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-32">Giờ:</span>
                        <span className="font-medium">
                          {appointment.startTime} - {appointment.endTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Service Description */}
                  {appointment.serviceDescription && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Mô tả dịch vụ
                      </h4>
                      <p className="text-gray-600">{appointment.serviceDescription}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Không có dữ liệu
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="primary" variant="light" onPress={onClose}>
                Đóng
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AppointmentDetailModal;



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
  Card,
  CardBody,
  Divider,
} from "@heroui/react";
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
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

  const getStatusColor = (status: string): "success" | "warning" | "primary" | "danger" | "default" => {
    switch (status) {
      case "Approved":
        return "success";
      case "CheckedIn":
        return "primary";
      case "Completed":
        return "primary";
      case "Finalized":
        return "success";
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
    if (!dateString || dateString === "Chưa có") return "Chưa có";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <h3 className="text-2xl font-bold text-gray-900">Chi tiết lịch hẹn</h3>
              <p className="text-sm text-gray-600 font-normal">Thông tin đầy đủ về ca khám</p>
            </ModalHeader>
            <ModalBody className="py-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" label="Đang tải..." />
                </div>
              ) : error ? (
                <Card className="bg-danger-50 border-danger-200">
                  <CardBody className="text-center py-8">
                    <p className="text-danger-700 text-lg">{error}</p>
                  </CardBody>
                </Card>
              ) : appointment ? (
                <div className="space-y-6">
                  {/* Status & Mode */}
                  <div className="flex gap-3 flex-wrap">
                    <Chip 
                      size="lg" 
                      color={getStatusColor(appointment.status)}
                      variant="flat"
                      classNames={{
                        base: "px-4 py-2",
                        content: "text-base font-semibold"
                      }}
                    >
                      {getStatusText(appointment.status)}
                    </Chip>
                    <Chip 
                      size="lg" 
                      variant="flat"
                      color={appointment.mode === "Online" ? "secondary" : "default"}
                      startContent={
                        appointment.mode === "Online" ? 
                          <VideoCameraIcon className="w-5 h-5" /> : 
                          <BuildingOfficeIcon className="w-5 h-5" />
                      }
                      classNames={{
                        base: "px-4 py-2",
                        content: "text-base font-semibold"
                      }}
                    >
                      {getModeText(appointment.mode)}
                    </Chip>
                  </div>

                  <Divider />

                  {/* Patient Info */}
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                    <CardBody className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <UserIcon className="w-6 h-6 text-blue-600" />
                        <h4 className="font-bold text-lg text-gray-800">Thông tin bệnh nhân</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-gray-600 w-32 font-medium">Họ tên:</span>
                          <span className="font-semibold text-gray-900 flex-1">{appointment.patientName}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-gray-600 w-32 font-medium">Email:</span>
                          <span className="text-gray-700 flex-1">{appointment.patientEmail}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Appointment Info */}
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
                    <CardBody className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarIcon className="w-6 h-6 text-green-600" />
                        <h4 className="font-bold text-lg text-gray-800">Thông tin lịch hẹn</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-gray-600 w-32 font-medium">Dịch vụ:</span>
                          <span className="font-semibold text-gray-900 flex-1">{appointment.serviceName}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-gray-600 w-32 font-medium">Ngày:</span>
                          <span className="text-gray-700 flex-1">
                            {formatDate(appointment.appointmentDate)}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-gray-600 w-32 font-medium">Giờ:</span>
                          <div className="flex items-center gap-2 flex-1">
                            <ClockIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700 font-semibold">
                              {appointment.startTime} - {appointment.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Service Description */}
                  {appointment.serviceDescription && (
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
                      <CardBody className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                          <h4 className="font-bold text-lg text-gray-800">Mô tả dịch vụ</h4>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{appointment.serviceDescription}</p>
                      </CardBody>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">Không có dữ liệu</p>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="border-t bg-gray-50">
              <Button 
                color="primary" 
                variant="flat" 
                onPress={onClose}
                size="lg"
                className="font-semibold"
              >
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

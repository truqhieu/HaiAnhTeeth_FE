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
import { doctorApi, type PatientDetail } from "@/api";

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string | null;
}

const PatientDetailModal = ({
  isOpen,
  onClose,
  appointmentId,
}: PatientDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientDetail | null>(null);

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchPatientDetail();
    }
  }, [isOpen, appointmentId]);

  const fetchPatientDetail = async () => {
    if (!appointmentId) return;

    try {
      setLoading(true);
      setError(null);

      // Bước 1: Lấy appointment detail để lấy patientId
      const appointmentRes =
        await doctorApi.getAppointmentDetail(appointmentId);

      if (!appointmentRes.success || !appointmentRes.data) {
        throw new Error("Không thể lấy thông tin lịch hẹn");
      }

      const patientId = appointmentRes.data.patientId;

      if (!patientId || patientId === "N/A" || patientId === "Trống") {
        throw new Error("Không tìm thấy thông tin bệnh nhân");
      }

      // Bước 2: Lấy patient detail
      const patientRes = await doctorApi.getPatientDetail(patientId);

      if (patientRes.success && patientRes.data) {
        setPatient(patientRes.data);
      } else {
        setError(patientRes.message || "Lỗi lấy thông tin bệnh nhân");
      }
    } catch (err: any) {
      console.error("Error fetching patient detail:", err);
      setError(err.message || "Lỗi khi tải thông tin bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  const getGenderText = (gender: string) => {
    switch (gender) {
      case "Male":
        return "Nam";
      case "Female":
        return "Nữ";
      case "Other":
        return "Khác";
      default:
        return gender;
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case "Male":
        return "primary";
      case "Female":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === "N/A" || dateString === "Trống") return "Trống";
    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (dateString: string): number | null => {
    if (!dateString || dateString === "N/A" || dateString === "Trống") return null;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <h3 className="text-2xl font-bold text-gray-900">Hồ sơ bệnh nhân</h3>
              <p className="text-sm text-gray-600 font-normal">Thông tin chi tiết về bệnh nhân</p>
            </ModalHeader>
            <ModalBody className="py-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" label="Đang tải..." />
                </div>
              ) : error ? (
                <Card className="bg-danger-50 border-danger-200">
                  <CardBody className="text-center py-8">
                    <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-danger-500" />
                    <p className="text-danger-700 text-lg font-semibold">{error}</p>
                  </CardBody>
                </Card>
              ) : patient ? (
                <div className="space-y-6">
                  {/* Patient Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-40">Ngày sinh:</span>
                        <span className="font-medium">
                          {formatDate(patient.dateOfBirth)}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-40">Giới tính:</span>
                        <span className="font-medium">
                          {getGenderText(patient.gender)}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-40">Trạng thái:</span>
                        <Chip
                          size="sm"
                          color={patient.status === "Active" ? "success" : "default"}
                        >
                          {patient.status === "Active" ? "Đang hoạt động" : patient.status}
                        </Chip>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  {/* Basic Info */}
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                    <CardBody className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                        <h4 className="font-bold text-lg text-gray-800">Thông tin cơ bản</h4>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-40">Số điện thoại:</span>
                        <span className="font-medium">{patient.phoneNumber}</span>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Contact Info */}
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
                    <CardBody className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <PhoneIcon className="w-6 h-6 text-green-600" />
                        <h4 className="font-bold text-lg text-gray-800">Thông tin liên hệ</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <EnvelopeIcon className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 font-medium">Email</p>
                            <p className="text-gray-900 font-semibold break-all">{patient.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <PhoneIcon className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 font-medium">Số điện thoại</p>
                            <p className="text-gray-900 font-semibold">{patient.phoneNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPinIcon className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 font-medium">Địa chỉ</p>
                            <p className="text-gray-900 font-semibold">{patient.address}</p>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Emergency Contact */}
                  {patient.emergencyContact && patient.emergencyContact !== "N/A" && patient.emergencyContact !== "Trống" && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-3">
                        Liên hệ khẩn cấp
                      </h4>
                      {typeof patient.emergencyContact === "object" ? (
                        <div className="space-y-2">
                          <div className="flex">
                            <span className="text-gray-600 w-40">Họ tên:</span>
                            <span className="font-medium">
                              {patient.emergencyContact.name || "Trống"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-600 w-40">Số điện thoại:</span>
                            <span className="font-medium">
                              {patient.emergencyContact.phone || "Trống"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="text-gray-600 w-40">Mối quan hệ:</span>
                            <span className="font-medium">
                              {patient.emergencyContact.relationship || "Trống"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600">Chưa có thông tin</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Không có dữ liệu</p>
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

export default PatientDetailModal;


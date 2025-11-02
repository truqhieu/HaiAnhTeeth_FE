import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Thêm import này
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
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  DocumentTextIcon, // Thêm icon này
} from "@heroicons/react/24/outline";
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
  const navigate = useNavigate(); // Thêm hook này
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null); // Lưu patientId

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

      const appointmentRes = await doctorApi.getAppointmentDetail(appointmentId);

      if (!appointmentRes.success || !appointmentRes.data) {
        throw new Error("Không thể lấy thông tin lịch hẹn");
      }

      const patientId = appointmentRes.data.patientId;
      setCurrentPatientId(patientId); // Lưu patientId

      if (!patientId || patientId === "N/A" || patientId === "Trống") {
        throw new Error("Không tìm thấy thông tin bệnh nhân");
      }

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

  // Thêm hàm xử lý mở hồ sơ khám bệnh
  const handleOpenMedicalRecord = () => {
    if (appointmentId) {
      onClose(); // Đóng modal trước
      navigate(`/doctor/medical-record/${appointmentId}`); // Chuyển đến trang hồ sơ với appointmentId
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
    if (!dateString || dateString === "N/A" || dateString === "Trống") return "Chưa có thông tin";
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
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Hồ sơ bệnh nhân</h3>
                  <p className="text-sm text-gray-600 font-normal">Thông tin chi tiết về bệnh nhân</p>
                </div>
                {/* Nút mở hồ sơ khám bệnh */}
                {patient && currentPatientId && (
                  <Button
                    color="primary"
                    variant="shadow"
                    startContent={<DocumentTextIcon className="w-5 h-5" />}
                    onPress={handleOpenMedicalRecord}
                    className="font-semibold"
                  >
                    Mở hồ sơ khám bệnh
                  </Button>
                )}
              </div>
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
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{patient.fullName}</h2>
                        <div className="flex gap-2 mt-2">
                          <Chip 
                            size="md" 
                            color={getGenderColor(patient.gender)}
                            variant="flat"
                          >
                            {getGenderText(patient.gender)}
                          </Chip>
                          <Chip
                            size="md"
                            color={patient.status === "Active" ? "success" : "default"}
                            variant="flat"
                            startContent={patient.status === "Active" ? <CheckBadgeIcon className="w-4 h-4" /> : null}
                          >
                            {patient.status === "Active" ? "Đang hoạt động" : patient.status}
                          </Chip>
                        </div>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 font-medium">Ngày sinh</p>
                          <p className="text-gray-900 font-semibold">{formatDate(patient.dateOfBirth)}</p>
                        </div>
                        {calculateAge(patient.dateOfBirth) && (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 font-medium">Tuổi</p>
                            <p className="text-gray-900 font-semibold">{calculateAge(patient.dateOfBirth)} tuổi</p>
                          </div>
                        )}
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
                  {patient.emergencyContact && 
                   patient.emergencyContact !== "N/A" && 
                   patient.emergencyContact !== "Trống" && 
                   typeof patient.emergencyContact === "object" && (
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm">
                      <CardBody className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                          <h4 className="font-bold text-lg text-gray-800">Liên hệ khẩn cấp</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <span className="text-gray-600 w-32 font-medium">Họ tên:</span>
                            <span className="text-gray-900 font-semibold flex-1">
                              {patient.emergencyContact.name || "Chưa có thông tin"}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-600 w-32 font-medium">Số điện thoại:</span>
                            <span className="text-gray-900 font-semibold flex-1">
                              {patient.emergencyContact.phone || "Chưa có thông tin"}
                            </span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-gray-600 w-32 font-medium">Mối quan hệ:</span>
                            <span className="text-gray-900 font-semibold flex-1">
                              {patient.emergencyContact.relationship || "Chưa có thông tin"}
                            </span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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

export default PatientDetailModal;
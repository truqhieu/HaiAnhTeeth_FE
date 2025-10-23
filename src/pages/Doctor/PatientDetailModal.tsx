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
      const appointmentRes = await doctorApi.getAppointmentDetail(appointmentId);

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

  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === "N/A" || dateString === "Trống") return "Trống";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">Thông tin bệnh nhân</h3>
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
              ) : patient ? (
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Thông tin cơ bản
                    </h4>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="text-gray-600 w-40">Họ tên:</span>
                        <span className="font-medium">{patient.fullName}</span>
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

                  {/* Contact Info */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Thông tin liên hệ
                    </h4>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="text-gray-600 w-40">Email:</span>
                        <span className="font-medium">{patient.email}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-40">Số điện thoại:</span>
                        <span className="font-medium">{patient.phoneNumber}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-40">Địa chỉ:</span>
                        <span className="font-medium">{patient.address}</span>
                      </div>
                    </div>
                  </div>

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

export default PatientDetailModal;


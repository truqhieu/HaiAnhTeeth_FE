import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Textarea,
  Spinner,
  Chip,
  Divider,
} from "@heroui/react";
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  HeartIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import defaultLayout from "@/layouts/default";

// Type definitions
interface MedicalRecord {
  symptoms: string;
  diagnosis: string;
  treatmentPlan: string;
  prescription: string;
  nursingNotes: string;
}

interface PatientInfo {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
}

const MedicalRecordPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord>({
    symptoms: "",
    diagnosis: "",
    treatmentPlan: "",
    prescription: "",
    nursingNotes: "",
  });
  const userRole = user?.role?.toLowerCase();
  const isDoctor = userRole === "doctor";
  const isNurse = userRole === "nurse";
   console.log("=== MEDICAL RECORD PAGE DEBUG ===");
  console.log("Current URL:", window.location.pathname);
  console.log("User from context:", user);
  console.log("User role:", user?.role);
  console.log("isDoctor:", user?.role === "doctor");
  console.log("isNurse:", user?.role === "nurse");

  useEffect(() => {
    if (patientId) {
      fetchMedicalRecord();
    }
  }, [patientId]);

  const fetchMedicalRecord = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API calls
      // const patientRes = await api.getPatientDetail(patientId);
      // const recordRes = await api.getMedicalRecord(patientId);

      // Mock data for now
      setTimeout(() => {
        setPatientInfo({
          fullName: "Nguyễn Văn A",
          gender: "Male",
          dateOfBirth: "1990-01-15",
          email: "nguyenvana@email.com",
          phoneNumber: "0123456789",
        });

        setMedicalRecord({
          symptoms: "Bệnh nhân báo cáo đau răng ở góc phần tư trên bên phải.",
          diagnosis: "Sâu răng.",
          treatmentPlan: "Trám răng và kiểm tra định kỳ.",
          prescription: "Thuốc giảm đau khi cần thiết. Paracetamol 500mg, uống 1-2 viên khi đau.",
          nursingNotes: "Bệnh nhân đã được hướng dẫn vệ sinh răng miệng đúng cách.",
        });

        setLoading(false);
      }, 1000);
    } catch (err: any) {
      console.error("Error fetching medical record:", err);
      setError(err.message || "Lỗi khi tải hồ sơ khám bệnh");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // TODO: Replace with actual API call
      // await api.updateMedicalRecord(patientId, medicalRecord);

      // Mock save
      setTimeout(() => {
        setSuccess("Lưu hồ sơ khám bệnh thành công!");
        setSaving(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }, 1000);
    } catch (err: any) {
      console.error("Error saving medical record:", err);
      setError(err.message || "Lỗi khi lưu hồ sơ khám bệnh");
      setSaving(false);
    }
  };

  const handleChange = (field: keyof MedicalRecord, value: string) => {
    setMedicalRecord(prev => ({
      ...prev,
      [field]: value,
    }));
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
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (dateString: string): number => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" label="Đang tải hồ sơ khám bệnh..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="light"
          startContent={<ArrowLeftIcon className="w-5 h-5" />}
          onPress={() => navigate(-1)}
          className="mb-4"
        >
          Quay lại
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hồ Sơ Khám Bệnh</h1>
            <p className="text-gray-600 mt-1">
              Mã bệnh nhân: <span className="font-semibold">#{patientId}</span>
            </p>
          </div>
          <Chip 
            color={isDoctor ? "primary" : "secondary"} 
            variant="flat" 
            size="lg"
            startContent={isDoctor ? <UserIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
          >
            {isDoctor ? "Bác sĩ" : "Điều dưỡng"}
          </Chip>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Card className="bg-success-50 border-success-200 mb-6">
          <CardBody className="flex flex-row items-center gap-3 py-3">
            <CheckCircleIcon className="w-6 h-6 text-success-600" />
            <p className="text-success-700 font-semibold">{success}</p>
          </CardBody>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-danger-50 border-danger-200 mb-6">
          <CardBody className="flex flex-row items-center gap-3 py-3">
            <span className="text-danger-600 text-lg">⚠️</span>
            <p className="text-danger-700">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Patient Info Card */}
      {patientInfo && (
        <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Thông tin bệnh nhân</h3>
              </div>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Họ và tên</p>
                <p className="text-gray-900 font-semibold text-lg">{patientInfo.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Giới tính</p>
                <p className="text-gray-900 font-semibold">{getGenderText(patientInfo.gender)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Tuổi</p>
                <p className="text-gray-900 font-semibold">{calculateAge(patientInfo.dateOfBirth)} tuổi</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Ngày sinh</p>
                <p className="text-gray-900 font-semibold">{formatDate(patientInfo.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Email</p>
                <p className="text-gray-900 font-semibold">{patientInfo.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Số điện thoại</p>
                <p className="text-gray-900 font-semibold">{patientInfo.phoneNumber}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Divider className="my-6" />

      {/* Medical Record Form */}
      <div className="space-y-6">
        {/* Symptoms - Doctor only */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-6 h-6 text-purple-600" />
              <h4 className="font-bold text-lg text-gray-800">Triệu chứng</h4>
              {!isDoctor && (
                <Chip size="sm" variant="flat" color="default" className="ml-2">
                  Chỉ xem
                </Chip>
              )}
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4">
            <Textarea
              value={medicalRecord.symptoms}
              onChange={(e) => handleChange("symptoms", e.target.value)}
              placeholder="Mô tả các triệu chứng của bệnh nhân..."
              minRows={3}
              maxRows={6}
              disabled={!isDoctor}
              variant={isDoctor ? "bordered" : "flat"}
              classNames={{
                input: isDoctor ? "" : "bg-white",
              }}
            />
          </CardBody>
        </Card>

        {/* Diagnosis - Doctor only */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
              <BeakerIcon className="w-6 h-6 text-green-600" />
              <h4 className="font-bold text-lg text-gray-800">Chẩn đoán</h4>
              {!isDoctor && (
                <Chip size="sm" variant="flat" color="default" className="ml-2">
                  Chỉ xem
                </Chip>
              )}
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4">
            <Textarea
              value={medicalRecord.diagnosis}
              onChange={(e) => handleChange("diagnosis", e.target.value)}
              placeholder="Ghi chẩn đoán bệnh..."
              minRows={3}
              maxRows={6}
              disabled={!isDoctor}
              variant={isDoctor ? "bordered" : "flat"}
              classNames={{
                input: isDoctor ? "" : "bg-white",
              }}
            />
          </CardBody>
        </Card>

        {/* Treatment Plan - Doctor only */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              <h4 className="font-bold text-lg text-gray-800">Kế hoạch điều trị</h4>
              {!isDoctor && (
                <Chip size="sm" variant="flat" color="default" className="ml-2">
                  Chỉ xem
                </Chip>
              )}
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4">
            <Textarea
              value={medicalRecord.treatmentPlan}
              onChange={(e) => handleChange("treatmentPlan", e.target.value)}
              placeholder="Mô tả kế hoạch điều trị chi tiết..."
              minRows={4}
              maxRows={8}
              disabled={!isDoctor}
              variant={isDoctor ? "bordered" : "flat"}
              classNames={{
                input: isDoctor ? "" : "bg-white",
              }}
            />
          </CardBody>
        </Card>

        {/* Prescription - Doctor only */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
              <PencilSquareIcon className="w-6 h-6 text-orange-600" />
              <h4 className="font-bold text-lg text-gray-800">Đơn thuốc</h4>
              {!isDoctor && (
                <Chip size="sm" variant="flat" color="default" className="ml-2">
                  Chỉ xem
                </Chip>
              )}
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4">
            <Textarea
              value={medicalRecord.prescription}
              onChange={(e) => handleChange("prescription", e.target.value)}
              placeholder="Kê đơn thuốc (tên thuốc, liều lượng, cách dùng)..."
              minRows={3}
              maxRows={6}
              disabled={!isDoctor}
              variant={isDoctor ? "bordered" : "flat"}
              classNames={{
                input: isDoctor ? "" : "bg-white",
              }}
            />
          </CardBody>
        </Card>

        {/* Nursing Notes - Both Doctor and Nurse can edit */}
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
              <HeartIcon className="w-6 h-6 text-pink-600" />
              <h4 className="font-bold text-lg text-gray-800">Ghi chú điều dưỡng</h4>
              {(isDoctor || isNurse) && (
                <Chip size="sm" variant="flat" color="success" className="ml-2">
                  Có thể chỉnh sửa
                </Chip>
              )}
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4">
            <Textarea
              value={medicalRecord.nursingNotes}
              onChange={(e) => handleChange("nursingNotes", e.target.value)}
              placeholder="Ghi chú của điều dưỡng về quá trình chăm sóc bệnh nhân..."
              minRows={3}
              maxRows={6}
              disabled={!isDoctor && !isNurse}
              variant={(isDoctor || isNurse) ? "bordered" : "flat"}
              classNames={{
                input: (isDoctor || isNurse) ? "" : "bg-white",
              }}
            />
          </CardBody>
        </Card>

        {/* Action Buttons */}
        {(isDoctor || isNurse) && (
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="flat"
              color="default"
              size="lg"
              onPress={() => navigate(-1)}
            >
              Hủy
            </Button>
            <Button
              color={isDoctor ? "primary" : "secondary"}
              size="lg"
              onPress={handleSave}
              isLoading={saving}
              startContent={!saving && <CheckCircleIcon className="w-5 h-5" />}
              className="font-semibold"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

MedicalRecordPage.getLayout = defaultLayout;

export default MedicalRecordPage;
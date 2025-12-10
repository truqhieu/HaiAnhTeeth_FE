import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { medicalRecordApi, type MedicalRecord, type MedicalRecordDisplay } from "@/api/medicalRecord";
import { Spinner, Card, CardBody, CardHeader, Button } from "@heroui/react";
import { UserIcon, BeakerIcon, DocumentTextIcon, PencilSquareIcon, HeartIcon, ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const PatientMedicalRecord: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [display, setDisplay] = useState<MedicalRecordDisplay | null>(null);

  const calcAge = (dob?: string | null): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
      age--;
    }
    return age < 0 ? 0 : age;
  };

  useEffect(() => {
    const load = async () => {
      if (!appointmentId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await medicalRecordApi.getMedicalRecordForPatient(appointmentId);
        
        if (res.success && res.data) {
          setRecord(res.data.record);
          setDisplay(res.data.display);
        } else {
          setError(res.message || "Không thể tải hồ sơ khám bệnh");
        }
      } catch (e: any) {
        setError(e.message || "Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId]);

  if (loading) return (
    <div className="flex items-center justify-center h-96"><Spinner label="Đang tải hồ sơ..." /></div>
  );

  if (error) return (
    <div className="p-6 text-center">
      <div className="text-red-600 mb-4">{error}</div>
      <Button onClick={() => navigate(-1)} color="default" variant="flat">
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Quay lại
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#39BDCC] to-[#2ca6b5] flex items-center justify-center shadow-md">
                <DocumentTextIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hồ sơ khám bệnh</h1>
                {display?.doctorName && (
                  <p className="text-sm text-gray-600 mt-1">
                    Bác sĩ: <span className="font-medium">{display.doctorName}</span>
                  </p>
                )}
              </div>
            </div>
            <Button 
              onClick={() => navigate("/patient/medical-records")} 
              color="default" 
              variant="flat"
              className="border border-gray-300"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>

        {/* Patient info */}
        <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#39BDCC] to-[#2ca6b5] flex items-center justify-center shadow-sm">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Thông tin bệnh nhân</h3>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 font-medium">Họ và tên</p>
              <p className="text-gray-900 font-semibold text-lg">{display?.patientName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Giới tính</p>
              <p className="text-gray-900 font-semibold">{display?.gender || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Tuổi</p>
              <p className="text-gray-900 font-semibold">{(() => {
                const ageFromBE = display?.patientAge ?? null;
                const fallback = calcAge(display?.patientDob ?? null);
                const age = ageFromBE && ageFromBE > 0 ? ageFromBE : (fallback ?? 0);
                return age || '-';
              })()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Số điện thoại</p>
              <p className="text-gray-900 font-semibold">{display?.phoneNumber || '-'}</p>
            </div>
            <div className="lg:col-span-2">
              <p className="text-sm text-gray-600 font-medium">Email</p>
              <p className="text-gray-900 font-semibold break-all">{display?.email || '-'}</p>
            </div>
            <div className="lg:col-span-2">
              <p className="text-sm text-gray-600 font-medium">Địa chỉ</p>
              <p className="text-gray-900 font-semibold">{display?.address || '-'}</p>
            </div>
            <div className="lg:col-span-2">
              <p className="text-sm text-gray-600 font-medium">Bác sĩ điều trị</p>
              <p className="text-gray-900 font-semibold">{display?.doctorName || '-'}</p>
            </div>
          </div>
        </CardBody>
      </Card>

        {/* Additional Services (read-only) */}
        <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-teal-600" />
            <h4 className="font-semibold text-gray-800">Dịch vụ bổ sung</h4>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          {display?.additionalServices && display.additionalServices.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {display.additionalServices.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-teal-200 shadow-sm"
                >
                  <span className="font-medium text-gray-800">{s.serviceName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600">Không có dịch vụ bổ sung</div>
          )}
        </CardBody>
      </Card>

        {/* Diagnosis (read-only) */}
        <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <BeakerIcon className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-800">Chẩn đoán</h4>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <div className="text-gray-900 whitespace-pre-wrap">
            {record?.diagnosis || (
              <span className="text-gray-500 italic">Chưa có thông tin chẩn đoán</span>
            )}
          </div>
        </CardBody>
      </Card>

        {/* Conclusion (read-only) */}
        <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Kết luận - Hướng dẫn</h4>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <div className="text-gray-900 whitespace-pre-wrap">
            {record?.conclusion || (
              <span className="text-gray-500 italic">Chưa có thông tin kết luận</span>
            )}
          </div>
        </CardBody>
      </Card>

        {/* Prescription (read-only) */}
        <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-gray-800">Đơn thuốc</h4>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          {(() => {
            // ⭐ Ưu tiên prescriptions (array), fallback về prescription (object) nếu không có
            const prescriptionsList = record?.prescriptions && record.prescriptions.length > 0
              ? record.prescriptions
              : (record?.prescription ? [record.prescription] : []);
            
            if (prescriptionsList.length === 0) {
              return <div className="text-gray-600">Chưa có đơn thuốc</div>;
            }
            
            return (
              <div className="space-y-4">
                {prescriptionsList.map((prescription, index) => {
                  const hasPrescription = prescription.medicine || prescription.dosage || prescription.duration;
                  if (!hasPrescription) return null;
                  
                  return (
                    <div key={index} className={index > 0 ? "border-t border-gray-200 pt-4" : ""}>
                      {prescriptionsList.length > 1 && (
                        <p className="text-sm font-semibold text-gray-700 mb-3">Đơn thuốc {index + 1}</p>
                      )}
                      <div className="space-y-3">
                        {prescription.medicine && (
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-1">Thuốc</p>
                            <p className="text-gray-900">{prescription.medicine}</p>
                          </div>
                        )}
                        {prescription.dosage && (
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-1">Liều dùng</p>
                            <p className="text-gray-900">{prescription.dosage}</p>
                          </div>
                        )}
                        {prescription.duration && (
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-1">Thời gian sử dụng</p>
                            <p className="text-gray-900">{prescription.duration}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardBody>
      </Card>

        {/* Nurse note (read-only) */}
        <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-pink-600" />
            <h4 className="font-semibold text-gray-800">Ghi chú điều dưỡng</h4>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <div className="text-gray-900 whitespace-pre-wrap">
            {record?.nurseNote || (
              <span className="text-gray-500 italic">Chưa có ghi chú</span>
            )}
          </div>
        </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default PatientMedicalRecord;

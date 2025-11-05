import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { medicalRecordApi, type MedicalRecord, type MedicalRecordDisplay } from "@/api/medicalRecord";
import { Spinner, Button, Card, CardBody, Textarea, Input, CardHeader } from "@heroui/react";
import { UserIcon, BeakerIcon, DocumentTextIcon, PencilSquareIcon, HeartIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import defaultLayout from "@/layouts/default";

const MedicalRecordPage = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [display, setDisplay] = useState<MedicalRecordDisplay | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state - doctor có thể chỉnh sửa nhiều trường hơn
  const [diagnosis, setDiagnosis] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [prescription, setPrescription] = useState({
    medicine: "",
    dosage: "",
    duration: "",
  });
  const [nurseNote, setNurseNote] = useState("");

  const userRole = user?.role?.toLowerCase();
  const isDoctor = userRole === "doctor";
  const isNurse = userRole === "nurse";

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
      if (!appointmentId) {
        setError("Thiếu thông tin appointment. Vui lòng truy cập từ lịch hẹn.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await medicalRecordApi.getOrCreateByAppointment(appointmentId, user?.role);
        if (res.success && res.data) {
          setRecord(res.data.record);
          setDisplay(res.data.display);
          setDiagnosis(res.data.record.diagnosis || "");
          setConclusion(res.data.record.conclusion || "");
          setPrescription({
            medicine: res.data.record.prescription?.medicine || "",
            dosage: res.data.record.prescription?.dosage || "",
            duration: res.data.record.prescription?.duration || "",
        });
          setNurseNote(res.data.record.nurseNote || "");
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

  const onSave = async () => {
    if (!appointmentId) {
      toast.error("Thiếu thông tin appointment");
      return;
    }

    setSaving(true);
    try {
      if (isNurse) {
        const res = await medicalRecordApi.updateNurseNote(appointmentId, nurseNote);
        if (res.success && res.data) {
          setRecord(res.data);
          toast.success("Đã lưu ghi chú điều dưỡng");
          navigate(-1);
        } else {
          setError(res.message || "Lưu thất bại");
        }
      } else if (isDoctor) {
        // Doctor có thể update toàn bộ record
        const res = await medicalRecordApi.updateMedicalRecordForDoctor(appointmentId, {
          diagnosis,
          conclusion,
          prescription,
          nurseNote,
        });
        if (res.success && res.data) {
          setRecord(res.data);
          toast.success("Đã lưu hồ sơ khám bệnh");
          navigate(-1);
        } else {
          setError(res.message || "Lưu thất bại");
        }
      }
    } catch (e: any) {
      setError(e.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96"><Spinner label="Đang tải hồ sơ..." /></div>
  );

  if (error) return (
    <div className="p-6 text-center text-red-600">{error}</div>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Patient info */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
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
            </div>
          </CardBody>
        </Card>

      {/* Additional Services (read only) */}
      <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 opacity-70">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-teal-600" />
            <h4 className="font-semibold text-gray-800">Dịch vụ bổ sung</h4>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          {display?.additionalServices && display.additionalServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {display.additionalServices.map((s) => (
                <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-white border">
                  <span className="font-medium text-gray-800">{s.serviceName}</span>
                  {typeof s.price === 'number' && (
                    <span className="text-gray-600">{s.price.toLocaleString('vi-VN')}₫</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600">Không có dịch vụ bổ sung</div>
          )}
        </CardBody>
      </Card>

      {/* Diagnosis (read only cho nurse, editable cho doctor) */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 opacity-70">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
            <BeakerIcon className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-800">Chẩn đoán</h4>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4">
            <Textarea
            value={diagnosis} 
            onChange={(e) => setDiagnosis(e.target.value)}
            isReadOnly={isNurse}
            variant={isNurse ? "flat" : "bordered"} 
              minRows={3}
            placeholder="Nhập chẩn đoán bệnh..."
              classNames={{
              input: isNurse ? "bg-gray-100 text-gray-500" : "",
              base: isNurse ? "opacity-60" : ""
              }}
            />
          </CardBody>
        </Card>

      {/* Conclusion (read only cho nurse, editable cho doctor) */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 opacity-70">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Kết luận - Hướng dẫn</h4>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4">
            <Textarea
            value={conclusion} 
            onChange={(e) => setConclusion(e.target.value)}
            isReadOnly={isNurse}
            variant={isNurse ? "flat" : "bordered"} 
              minRows={3}
            placeholder="Nhập kết luận và hướng dẫn điều trị..."
              classNames={{
              input: isNurse ? "bg-gray-100 text-gray-500" : "",
              base: isNurse ? "opacity-60" : ""
              }}
            />
          </CardBody>
        </Card>

      {/* Prescription (read only cho nurse, editable cho doctor) */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 opacity-70">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-gray-800">Đơn thuốc</h4>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="Thuốc" 
              value={prescription.medicine} 
              onChange={(e) => setPrescription({ ...prescription, medicine: e.target.value })}
              isReadOnly={isNurse}
              variant="bordered" 
              placeholder="Thuốc"
              classNames={{
                input: isNurse ? "bg-gray-100 text-gray-500" : "",
                inputWrapper: isNurse ? "bg-gray-100" : ""
              }}
            />
            <Input 
              label="Liều dùng" 
              value={prescription.dosage} 
              onChange={(e) => setPrescription({ ...prescription, dosage: e.target.value })}
              isReadOnly={isNurse}
              variant="bordered" 
              placeholder="Liều dùng"
              classNames={{
                input: isNurse ? "bg-gray-100 text-gray-500" : "",
                inputWrapper: isNurse ? "bg-gray-100" : ""
              }}
            />
            <Input 
              label="Thời gian" 
              value={prescription.duration} 
              onChange={(e) => setPrescription({ ...prescription, duration: e.target.value })}
              isReadOnly={isNurse}
              variant="bordered" 
              placeholder="Thời gian"
              classNames={{
                input: isNurse ? "bg-gray-100 text-gray-500" : "",
                inputWrapper: isNurse ? "bg-gray-100" : ""
              }}
            />
          </div>
          </CardBody>
        </Card>

      {/* Nurse note (editable cho cả doctor và nurse) */}
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-pink-600" />
            <h4 className="font-semibold text-gray-800">Ghi chú điều dưỡng</h4>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4">
            <Textarea
            placeholder="Nhập ghi chú về bệnh nền hoặc dị ứng của bệnh nhân..."
            value={nurseNote}
            onValueChange={setNurseNote}
            minRows={5}
            variant="bordered"
          />

          <div className="flex justify-end mt-4">
            <Button color="success" onPress={onSave} isLoading={saving} startContent={!saving && <CheckCircleIcon className="w-5 h-5" />}>
              {saving ? "Đang lưu..." : isNurse ? "Lưu ghi chú" : "Lưu thay đổi"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

MedicalRecordPage.getLayout = defaultLayout;

export default MedicalRecordPage;

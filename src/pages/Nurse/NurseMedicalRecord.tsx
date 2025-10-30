import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { medicalRecordApi, type MedicalRecord, type MedicalRecordDisplay } from "@/api/medicalRecord";
import { Spinner, Button, Card, CardBody, Textarea, Input, CardHeader, Chip } from "@heroui/react";
import { UserIcon, BeakerIcon, DocumentTextIcon, PencilSquareIcon, HeartIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const NurseMedicalRecord: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [display, setDisplay] = useState<MedicalRecordDisplay | null>(null);
  const [nurseNote, setNurseNote] = useState("");
  const [saving, setSaving] = useState(false);

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
        const res = await medicalRecordApi.getOrCreateByAppointment(appointmentId);
        if (res.success && res.data) {
          setRecord(res.data.record);
          setDisplay(res.data.display);
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
    if (!appointmentId) return;
    setSaving(true);
    try {
      const res = await medicalRecordApi.updateNurseNote(appointmentId, nurseNote);
      if (res.success && res.data) {
        setRecord(res.data);
        toast.success("Đã lưu ghi chú điều dưỡng");
        navigate(-1);
      } else {
        setError(res.message || "Lưu thất bại");
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
      <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-teal-600" />
            <h4 className="font-semibold text-gray-800">Dịch vụ bổ sung</h4>
            <Chip size="sm" variant="flat" color="default" className="ml-2">Chỉ xem</Chip>
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

      {/* Diagnosis (read only) */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <BeakerIcon className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-800">Chẩn đoán</h4>
            <Chip size="sm" variant="flat" color="default" className="ml-2">Chỉ xem</Chip>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <Textarea value={record?.diagnosis || ""} isReadOnly variant="flat" minRows={3} classNames={{ input: "bg-white" }} />
        </CardBody>
      </Card>

      {/* Conclusion (read only) */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Kết luận - Hướng dẫn</h4>
            <Chip size="sm" variant="flat" color="default" className="ml-2">Chỉ xem</Chip>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <Textarea value={record?.conclusion || ""} isReadOnly variant="flat" minRows={3} classNames={{ input: "bg-white" }} />
        </CardBody>
      </Card>

      {/* Prescription (read only) */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-gray-800">Đơn thuốc</h4>
            <Chip size="sm" variant="flat" color="default" className="ml-2">Chỉ xem</Chip>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Thuốc" value={record?.prescription?.medicine || ""} isReadOnly variant="bordered" />
            <Input label="Liều dùng" value={record?.prescription?.dosage || ""} isReadOnly variant="bordered" />
            <Input label="Thời gian" value={record?.prescription?.duration || ""} isReadOnly variant="bordered" />
          </div>
        </CardBody>
      </Card>

      {/* Nurse note (editable) */}
      <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-pink-600" />
            <h4 className="font-semibold text-gray-800">Ghi chú điều dưỡng</h4>
            <Chip size="sm" variant="flat" color="success" className="ml-2">Có thể chỉnh sửa</Chip>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <Textarea
            placeholder="Nhập ghi chú tình trạng, tiền sử..."
            value={nurseNote}
            onValueChange={setNurseNote}
            minRows={5}
            variant="bordered"
          />

          <div className="flex justify-end mt-4">
            <Button color="success" onPress={onSave} isLoading={saving} startContent={!saving && <CheckCircleIcon className="w-5 h-5" />}>
              {saving ? "Đang lưu..." : "Lưu ghi chú"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default NurseMedicalRecord;



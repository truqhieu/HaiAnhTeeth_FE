import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { medicalRecordApi, type MedicalRecord, type MedicalRecordDisplay, type MedicalRecordPermissions } from "@/api/medicalRecord";
import { Spinner, Button, Card, CardBody, Textarea, Input, CardHeader } from "@heroui/react";
import { BeakerIcon, DocumentTextIcon, PencilSquareIcon, HeartIcon, CheckCircleIcon, ChevronDownIcon, XMarkIcon, ArrowLeftIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { appointmentApi } from "@/api/appointment";

const NurseMedicalRecord: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [display, setDisplay] = useState<MedicalRecordDisplay | null>(null);
  const [permissions, setPermissions] = useState<MedicalRecordPermissions | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [conclusion, setConclusion] = useState("");
  // ⭐ Đổi thành array để hỗ trợ nhiều đơn thuốc
  const [prescriptions, setPrescriptions] = useState<Array<{ medicine: string; dosage: string; duration: string }>>([]);
  const [nurseNote, setNurseNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentServices, setCurrentServices] = useState<Array<{ _id: string; serviceName: string; price: number; finalPrice?: number; discountAmount?: number }>>([]);
  const [allServices, setAllServices] = useState<Array<{ _id: string; serviceName: string; price: number; finalPrice?: number; discountAmount?: number }>>([]);
  const [updatingServices, setUpdatingServices] = useState(false);
  const [serviceListLoading, setServiceListLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const canEdit = permissions?.nurse?.canEdit ?? true;
  const lockReason = !canEdit ? permissions?.nurse?.reason || null : null;

  const mapAdditionalServices = (services: any[] | undefined | null) =>
    (services || [])
      .filter((s) => s && s._id)
      .map((s) => ({
        _id: s._id.toString(),
        serviceName: s.serviceName || "",
        price: typeof s.finalPrice === 'number' ? s.finalPrice : (s.price || 0),
        finalPrice: s.finalPrice,
        discountAmount: s.discountAmount,
      }));

  const closeDropdown = () => {
    setIsDropdownOpen(false);
    setDropdownPosition(null);
  };

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

  const getGenderText = (gender?: string | null): string => {
    if (!gender) return '-';
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

  useEffect(() => {
    const load = async () => {
      if (!appointmentId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await medicalRecordApi.getOrCreateByAppointment(appointmentId, 'nurse');
        console.log('🔍 [NurseMedicalRecord] API Response:', res);
        
        if (res.success && res.data) {
          console.log('🔍 [NurseMedicalRecord] Record:', res.data.record);
          console.log('🔍 [NurseMedicalRecord] Display:', res.data.display);
          console.log('🔍 [NurseMedicalRecord] additionalServices from display:', res.data.display?.additionalServices);
          
          setRecord(res.data.record);
          setDisplay(res.data.display);
          setPermissions(res.data.permissions || null);
          setDiagnosis(res.data.record.diagnosis || "");
          setConclusion(res.data.record.conclusion || "");
          // ⭐ Load prescriptions (array mới) hoặc prescription (object cũ - backward compatibility)
          const prescriptionsData = res.data.record.prescriptions || (res.data.record.prescription ? [res.data.record.prescription] : []);
          const loadedPrescriptions = prescriptionsData.map((p: any) => ({
            medicine: p.medicine || "",
            dosage: p.dosage || "",
            duration: p.duration || "",
          }));
          // ⭐ Nếu không có đơn thuốc nào và có thể edit, tự động thêm 1 đơn trống
          if (loadedPrescriptions.length === 0 && (res.data.permissions?.nurse?.canEdit ?? true)) {
            setPrescriptions([{ medicine: "", dosage: "", duration: "" }]);
          } else {
            setPrescriptions(loadedPrescriptions);
          }
          setNurseNote(res.data.record.nurseNote || "");
          const mappedServices = mapAdditionalServices(res.data.display?.additionalServices);
          setCurrentServices(mappedServices);
          setDisplay((prev) => (prev ? { ...prev, additionalServices: mappedServices } : prev));
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

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | FocusEvent) => {
      const target = event.target as Node;
      const isClickInsideButton = dropdownButtonRef.current?.contains(target);
      const isClickInsideDropdownMenu = dropdownMenuRef.current?.contains(target);
      const isClickInsideCard = dropdownRef.current?.contains(target);
      const isClickInsideDropdownArea = isClickInsideButton || isClickInsideDropdownMenu || isClickInsideCard;

      if (!isClickInsideDropdownArea) {
        closeDropdown();
      }
    };

    const updateDropdownPosition = () => {
      if (dropdownButtonRef.current && isDropdownOpen) {
        const rect = dropdownButtonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    updateDropdownPosition();

    const timeoutId = window.setTimeout(() => {
      window.addEventListener("resize", updateDropdownPosition);
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("click", handleClickOutside, true);
      document.addEventListener("scroll", updateDropdownPosition, true);
      document.addEventListener("focusin", handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateDropdownPosition);
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("click", handleClickOutside, true);
      document.removeEventListener("scroll", updateDropdownPosition, true);
      document.removeEventListener("focusin", handleClickOutside, true);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const fetchServices = async () => {
      setServiceListLoading(true);
      try {
        const res = await medicalRecordApi.getActiveServicesForNurse();
        if (res.success && Array.isArray(res.data)) {
          setAllServices(res.data);
        }
      } catch (error) {
        console.error("❌ Error loading services for nurse:", error);
      } finally {
        setServiceListLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleAdditionalServicesUpdate = (recordData: MedicalRecord) => {
    const updatedServices = mapAdditionalServices(recordData.additionalServiceIds as any);
    setCurrentServices(updatedServices);
    setRecord(recordData);
    setDisplay((prev) => (prev ? { ...prev, additionalServices: updatedServices } : prev));
  };

  const handleAddService = async (service: { _id: string; serviceName: string; price: number }) => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      closeDropdown();
      return;
    }

    if (currentServices.some((s) => s._id === service._id)) {
      toast.error("Dịch vụ này đã được thêm");
      closeDropdown();
      return;
    }

    closeDropdown();

    const previousServices = [...currentServices];
    const newServices = [...currentServices, service];
    setCurrentServices(newServices);

    setUpdatingServices(true);
    try {
      const nextIds = newServices.map((s) => s._id);
      const res = await medicalRecordApi.updateAdditionalServicesForNurse(appointmentId, nextIds);
      if (res.success && res.data) {
        handleAdditionalServicesUpdate(res.data);
        toast.success(`Đã thêm dịch vụ: ${service.serviceName}`);
      } else {
        setCurrentServices(previousServices);
        toast.error(res.message || "Không thể cập nhật dịch vụ bổ sung");
      }
    } catch (error: any) {
      setCurrentServices(previousServices);
      toast.error(error.message || "Không thể cập nhật dịch vụ bổ sung");
    } finally {
      setUpdatingServices(false);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      return;
    }

    const serviceToRemove = currentServices.find((s) => s._id === serviceId);
    if (!serviceToRemove) return;

    const previousServices = [...currentServices];
    const newServices = currentServices.filter((s) => s._id !== serviceId);
    setCurrentServices(newServices);

    setUpdatingServices(true);
    try {
      const remainingIds = newServices.map((s) => s._id);
      const res = await medicalRecordApi.updateAdditionalServicesForNurse(appointmentId, remainingIds);
      if (res.success && res.data) {
        handleAdditionalServicesUpdate(res.data);
        toast.success(`Đã xóa dịch vụ: ${serviceToRemove.serviceName}`);
      } else {
        setCurrentServices(previousServices);
        toast.error(res.message || "Không thể cập nhật dịch vụ bổ sung");
      }
    } catch (error: any) {
      setCurrentServices(previousServices);
      toast.error(error.message || "Không thể cập nhật dịch vụ bổ sung");
    } finally {
      setUpdatingServices(false);
    }
  };

  const availableServices = allServices.filter(
    (service) => !currentServices.some((current) => current._id === service._id),
  );

  const onSave = async () => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      return;
    }
    setSaving(true);
    try {
      // Convert prescriptions array to single prescription object (API expects object, not array)
      const prescriptionData = prescriptions.length > 0 ? prescriptions[0] : { medicine: '', dosage: '', duration: '' };
      const res = await medicalRecordApi.updateMedicalRecordForNurse(appointmentId, {
        diagnosis,
        conclusion,
        prescription: prescriptionData,
        nurseNote,
      });
      if (res.success && res.data) {
        setRecord(res.data);
        setDiagnosis(res.data.diagnosis || "");
        setConclusion(res.data.conclusion || "");
        // ⭐ Load prescriptions (array mới) hoặc prescription (object cũ - backward compatibility)
        const updatedPrescriptionsData = res.data.prescriptions || (res.data.prescription ? [res.data.prescription] : []);
        setPrescriptions(updatedPrescriptionsData.map((p: any) => ({
          medicine: p.medicine || "",
          dosage: p.dosage || "",
          duration: p.duration || "",
        })));
        setNurseNote(res.data.nurseNote || "");
        toast.success("Đã lưu hồ sơ khám bệnh");
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

  const handleNoTreatment = async () => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      return;
    }

    setSaving(true);
    try {
      const res = await appointmentApi.markNoTreatmentForNurse(appointmentId);
      if (!res.success) {
        throw new Error(res.message || "Không thể đánh dấu 'Không cần khám'");
      }
      toast.success("Đã đánh dấu ca khám là 'Không cần khám'");
      navigate(-1);
    } catch (error: any) {
      const message = error?.response?.data?.message || error.message || "Không thể xử lý";
      setError(message);
      toast.error(message);
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
      {/* ⭐ Nút Back khi không thể chỉnh sửa (read-only) */}
      {!canEdit && (
        <div className="mb-4">
          <Button
            onClick={() => navigate(-1)}
            color="default"
            variant="flat"
            className="border border-gray-300"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Quay lại
          </Button>
        </div>
      )}
      {!canEdit && lockReason && (
        <Card className="bg-warning-50 border-warning-200">
          <CardBody>
            <p className="text-warning-700 font-medium">{lockReason}</p>
          </CardBody>
        </Card>
      )}

      {/* Patient info */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-3">
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
              <p className="text-gray-900 font-semibold">{getGenderText(display?.gender)}</p>
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

      {/* Additional Services (editable) */}
      <div className="relative" ref={dropdownRef}>
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-teal-600" />
              <h4 className="font-semibold text-gray-800">Dịch vụ bổ sung</h4>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4 space-y-4">
            {currentServices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentServices.map((service) => (
                  <div
                    key={service._id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-teal-200 shadow-sm"
                  >
                    <span className="font-medium text-gray-800">{service.serviceName}</span>
                    {typeof service.price === "number" && service.price > 0 && (
                      <span className="text-xs text-gray-500">
                        {service.price.toLocaleString("vi-VN")}₫
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveService(service._id)}
                      disabled={!canEdit || updatingServices}
                      className={`ml-1 p-1 rounded-full transition-colors ${canEdit && !updatingServices ? "hover:bg-red-100" : "opacity-50 cursor-not-allowed"}`}
                      type="button"
                    >
                      <XMarkIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600">Không có dịch vụ bổ sung</div>
            )}

            <div>
              <button
                ref={dropdownButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canEdit || updatingServices || serviceListLoading) return;
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                disabled={!canEdit || updatingServices || serviceListLoading || availableServices.length === 0}
                className={`flex items-center justify-between w-full px-4 py-2 bg-white border border-teal-300 rounded-lg transition-colors shadow-sm ${canEdit && !updatingServices && !serviceListLoading && availableServices.length > 0 ? "hover:bg-teal-50" : "opacity-60 cursor-not-allowed"}`}
                type="button"
              >
                <span className="text-gray-700">
                  {serviceListLoading ? "Đang tải danh sách dịch vụ..." : "Thêm dịch vụ"}
                </span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {availableServices.length === 0 && !serviceListLoading && (
                <p className="text-xs text-gray-500 mt-2">Không còn dịch vụ nào để thêm.</p>
              )}
            </div>
          </CardBody>
        </Card>

        {canEdit && isDropdownOpen && dropdownPosition && (
          <div
            ref={dropdownMenuRef}
            className="fixed z-50 bg-white border border-teal-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {serviceListLoading ? (
              <div className="px-4 py-2 text-gray-500 text-center">Đang tải dịch vụ...</div>
            ) : availableServices.length > 0 ? (
              <div className="py-2">
                {availableServices.map((service) => (
                  <button
                    key={service._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (updatingServices) return;
                      handleAddService(service);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    className={`w-full px-4 py-2 text-left transition-colors ${updatingServices ? "cursor-not-allowed opacity-60" : "hover:bg-teal-50"}`}
                    type="button"
                    disabled={updatingServices}
                  >
                    <span className="font-medium text-gray-800">{service.serviceName}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2 text-gray-500 text-center">Không còn dịch vụ nào để thêm</div>
            )}
          </div>
        )}
      </div>

      {/* Diagnosis */}
      <Card
        className={`bg-gradient-to-br from-green-50 to-green-100 border-green-200 ${canEdit ? "" : "opacity-70"}`}
        onMouseDown={() => {
          if (isDropdownOpen) {
            closeDropdown();
          }
        }}
      >
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
            isReadOnly={!canEdit}
            variant={canEdit ? "bordered" : "flat"}
            minRows={3} 
            placeholder="Nhập chẩn đoán bệnh..."
            onFocus={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            onMouseDown={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            classNames={{ 
              input: canEdit ? undefined : "bg-gray-100 text-gray-500",
              base: canEdit ? undefined : "opacity-60"
            }} 
          />
        </CardBody>
      </Card>

      {/* Conclusion */}
      <Card
        className={`bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 ${canEdit ? "" : "opacity-70"}`}
        onMouseDown={() => {
          if (isDropdownOpen) {
            closeDropdown();
          }
        }}
      >
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
            isReadOnly={!canEdit}
            variant={canEdit ? "bordered" : "flat"}
            minRows={3} 
            placeholder="Nhập kết luận và hướng dẫn điều trị..."
            onFocus={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            onMouseDown={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            classNames={{ 
              input: canEdit ? undefined : "bg-gray-100 text-gray-500",
              base: canEdit ? undefined : "opacity-60"
            }} 
          />
        </CardBody>
      </Card>

      {/* Prescription */}
      <Card
        className={`bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 ${canEdit ? "" : "opacity-70"}`}
        onMouseDown={() => {
          if (isDropdownOpen) {
            closeDropdown();
          }
        }}
      >
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-gray-800">Đơn thuốc</h4>
            <span className="text-xs text-gray-500 ml-2">(Tùy chọn - có thể bỏ qua nếu không cần)</span>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-4">
          <div className="space-y-4">
            {/* ⭐ Hiển thị danh sách đơn thuốc */}
            {prescriptions.length === 0 && !canEdit ? (
              <div className="text-center text-gray-500 py-4">
                Chưa có đơn thuốc
              </div>
            ) : (
              prescriptions.map((prescription, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                {/* ⭐ 3 trường hiển thị theo hàng ngang */}
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <Input 
                    label="Thuốc" 
                    value={prescription.medicine} 
                    onChange={(e) => {
                      const updated = [...prescriptions];
                      updated[index] = { ...updated[index], medicine: e.target.value };
                      setPrescriptions(updated);
                    }}
                    variant={canEdit ? "bordered" : "flat"} 
                    placeholder="Nhập tên thuốc"
                    isReadOnly={!canEdit}
                    onFocus={() => {
                      if (isDropdownOpen) {
                        closeDropdown();
                      }
                    }}
                    onMouseDown={() => {
                      if (isDropdownOpen) {
                        closeDropdown();
                      }
                    }}
                    classNames={!canEdit ? { inputWrapper: "bg-gray-100 opacity-60", input: "text-gray-500" } : undefined}
                  />
                  
                  <Input 
                    label="Liều dùng" 
                    value={prescription.dosage} 
                    onChange={(e) => {
                      const updated = [...prescriptions];
                      updated[index] = { ...updated[index], dosage: e.target.value };
                      setPrescriptions(updated);
                    }}
                    variant={canEdit ? "bordered" : "flat"} 
                    placeholder="Ví dụ: 2 viên/lần"
                    isReadOnly={!canEdit}
                    onFocus={() => {
                      if (isDropdownOpen) {
                        closeDropdown();
                      }
                    }}
                    onMouseDown={() => {
                      if (isDropdownOpen) {
                        closeDropdown();
                      }
                    }}
                    classNames={!canEdit ? { inputWrapper: "bg-gray-100 opacity-60", input: "text-gray-500" } : undefined}
                  />
                  
                  <Input 
                    label="Thời gian sử dụng" 
                    value={prescription.duration} 
                    onChange={(e) => {
                      const updated = [...prescriptions];
                      updated[index] = { ...updated[index], duration: e.target.value };
                      setPrescriptions(updated);
                    }}
                    variant={canEdit ? "bordered" : "flat"} 
                    placeholder="Ví dụ: 7 ngày"
                    isReadOnly={!canEdit}
                    onFocus={() => {
                      if (isDropdownOpen) {
                        closeDropdown();
                      }
                    }}
                    onMouseDown={() => {
                      if (isDropdownOpen) {
                        closeDropdown();
                      }
                    }}
                    classNames={!canEdit ? { inputWrapper: "bg-gray-100 opacity-60", input: "text-gray-500" } : undefined}
                  />
                </div>
                
                {/* ⭐ Nút xóa đơn thuốc (chỉ hiển thị khi có thể edit và có nhiều hơn 1 đơn) */}
                {canEdit && prescriptions.length > 1 && (
                  <Button
                    isIconOnly
                    color="danger"
                    variant="light"
                    size="sm"
                    onPress={() => {
                      const updated = prescriptions.filter((_, i) => i !== index);
                      setPrescriptions(updated);
                    }}
                    className="mt-6"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </Button>
                )}
              </div>
              ))
            )}
            
            {/* ⭐ Nút thêm đơn thuốc mới - Icon dấu cộng ở góc phải dưới */}
            {canEdit && (
              <div className="flex justify-end pt-2">
                <Button
                  isIconOnly
                  color="primary"
                  variant="solid"
                  size="md"
                  onPress={() => {
                    setPrescriptions([...prescriptions, { medicine: "", dosage: "", duration: "" }]);
                  }}
                >
                  <PlusIcon className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Nurse note */}
      <Card
        className={`bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 ${canEdit ? "" : "opacity-70"}`}
        onMouseDown={() => {
          if (isDropdownOpen) {
            closeDropdown();
          }
        }}
      >
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
            isReadOnly={!canEdit}
            variant={canEdit ? "bordered" : "flat"}
            onFocus={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
            onMouseDown={() => {
              if (isDropdownOpen) {
                closeDropdown();
              }
            }}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button
              color="warning"
              variant="flat"
              onPress={handleNoTreatment}
              isLoading={saving}
              isDisabled={saving || !canEdit}
            >
              Không cần khám
            </Button>
            <Button 
              color="success" 
              onPress={onSave} 
              isLoading={saving} 
              isDisabled={saving || !canEdit}
              startContent={!saving && <CheckCircleIcon className="w-5 h-5" />}
            >
              {saving ? "Đang lưu..." : "Lưu hồ sơ"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default NurseMedicalRecord;



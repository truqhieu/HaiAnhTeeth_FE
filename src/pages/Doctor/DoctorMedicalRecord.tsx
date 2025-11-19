import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { medicalRecordApi, type MedicalRecord, type MedicalRecordDisplay, type MedicalRecordPermissions } from "@/api/medicalRecord";
import { Spinner, Button, Card, CardBody, Textarea, Input, CardHeader, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { UserIcon, BeakerIcon, DocumentTextIcon, PencilSquareIcon, HeartIcon, CheckCircleIcon, XMarkIcon, ChevronDownIcon, PlusIcon, TrashIcon, ArrowLeftIcon, XCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { appointmentApi } from "@/api/appointment";

const DoctorMedicalRecord: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [display, setDisplay] = useState<MedicalRecordDisplay | null>(null);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<MedicalRecordPermissions | null>(null);

  // Form state - doctor có thể chỉnh sửa tất cả trường
  const [diagnosis, setDiagnosis] = useState("");
  const [conclusion, setConclusion] = useState("");
  // ⭐ Đổi thành array để hỗ trợ nhiều đơn thuốc
  const [prescriptions, setPrescriptions] = useState<Array<{ medicine: string; dosage: string; duration: string }>>([]);
  const [nurseNote, setNurseNote] = useState("");

  // Additional Services state
  const [currentServices, setCurrentServices] = useState<Array<{ _id: string; serviceName: string; price: number; finalPrice?: number; discountAmount?: number }>>([]);
  const [allServices, setAllServices] = useState<Array<{ _id: string; serviceName: string; price: number; finalPrice?: number; discountAmount?: number }>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  
  // Modal state cho "Không cần khám"
  const { isOpen: isNoTreatmentModalOpen, onOpen: onNoTreatmentModalOpen, onClose: onNoTreatmentModalClose } = useDisclosure();
  const [noTreatmentReason, setNoTreatmentReason] = useState("");

  const canEdit = permissions?.doctor?.canEdit ?? true;
  const isFinalized = permissions?.recordStatus === "Finalized";
  const lockReason = !canEdit ? permissions?.doctor?.reason || null : null;
  const canApprove = canEdit && !isFinalized;

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

  // Load services và medical record
  useEffect(() => {
    const load = async () => {
      if (!appointmentId) return;
      setLoading(true);
      setError(null);
      try {
        // Load medical record
        const res = await medicalRecordApi.getOrCreateByAppointment(appointmentId, 'doctor');
        console.log('🔍 [MedicalRecord] API Response:', res);
        
        if (res.success && res.data) {
          console.log('🔍 [MedicalRecord] Record:', res.data.record);
          console.log('🔍 [MedicalRecord] Display:', res.data.display);
          console.log('🔍 [MedicalRecord] additionalServices from display:', res.data.display?.additionalServices);
          console.log('🔍 [MedicalRecord] additionalServiceIds from record:', res.data.record?.additionalServiceIds);
          
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
          if (loadedPrescriptions.length === 0 && (res.data.permissions?.doctor?.canEdit ?? true)) {
            setPrescriptions([{ medicine: "", dosage: "", duration: "" }]);
          } else {
            setPrescriptions(loadedPrescriptions);
          }
          setNurseNote(res.data.record.nurseNote || "");
          
          // Set current services from display or record
          const services = res.data.display?.additionalServices || res.data.record?.additionalServiceIds || [];
          console.log('🔍 [MedicalRecord] Parsed services:', services);
          console.log('🔍 [MedicalRecord] Services isArray:', Array.isArray(services));
          console.log('🔍 [MedicalRecord] Services length:', services?.length);
          
          if (Array.isArray(services) && services.length > 0) {
            const mappedServices = services
              .filter((s: any) => s && (s._id || (typeof s === 'object' && s !== null))) // Filter out null/undefined
              .map((s: any) => ({
                _id: s._id || (typeof s === 'string' ? s : s.toString()),
                serviceName: s.serviceName || (typeof s === 'object' ? s.name || '' : ''),
                price: typeof s.finalPrice === 'number' ? s.finalPrice : (s.price || 0),
                finalPrice: s.finalPrice,
                discountAmount: s.discountAmount,
              }));
            console.log('🔍 [MedicalRecord] Mapped services:', mappedServices);
            setCurrentServices(mappedServices);
          } else {
            console.log('🔍 [MedicalRecord] No services found, setting empty array');
            setCurrentServices([]);
          }
        } else {
          setError(res.message || "Không thể tải hồ sơ khám bệnh");
        }

        // Load all available services
        const servicesRes = await medicalRecordApi.getActiveServicesForDoctor();
        if (servicesRes.success && servicesRes.data) {
          setAllServices(servicesRes.data);
        }
      } catch (e: any) {
        setError(e.message || "Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId]);

  // Helper function to close dropdown
  const closeDropdown = () => {
    setIsDropdownOpen(false);
    setDropdownPosition(null);
  };

  // Calculate dropdown position and close when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | FocusEvent) => {
      const target = event.target as Node;
      
      // Kiểm tra xem click có nằm trong các phần tử liên quan đến dropdown không
      const isClickInsideButton = dropdownButtonRef.current?.contains(target);
      const isClickInsideDropdownMenu = dropdownMenuRef.current?.contains(target);
      const isClickInsideCard = dropdownRef.current?.contains(target);
      
      // Nếu click vào bất kỳ đâu ngoài button, menu và card "Dịch vụ bổ sung", đóng dropdown
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
          width: rect.width
        });
      }
    };

    updateDropdownPosition();
    
    // Use a small delay to ensure the dropdown is rendered before adding listeners
    const timeoutId = setTimeout(() => {
      window.addEventListener('resize', updateDropdownPosition);
      document.addEventListener('mousedown', handleClickOutside, true); // Use capture phase
      document.addEventListener('click', handleClickOutside, true); // Also listen to click events
      document.addEventListener('scroll', updateDropdownPosition, true);
      document.addEventListener('focusin', handleClickOutside, true); // Listen to focus events
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDropdownPosition);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('scroll', updateDropdownPosition, true);
      document.removeEventListener('focusin', handleClickOutside, true);
    };
  }, [isDropdownOpen]);

  const handleAddService = async (service: { _id: string; serviceName: string; price: number }) => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      closeDropdown();
      return;
    }
    
    // Check if service already exists
    if (currentServices.some(s => s._id === service._id)) {
      toast.error("Dịch vụ này đã được thêm");
      closeDropdown();
      return;
    }

    // Close dropdown first
    closeDropdown();

    // Lưu lại state cũ để revert nếu có lỗi
    const previousServices = [...currentServices];

    // Add service locally for immediate UI update
    const newServices = [...currentServices, service];
    setCurrentServices(newServices);

    // Update on backend
    try {
      const serviceIds = newServices.map(s => s._id);
      const res = await medicalRecordApi.updateAdditionalServicesForDoctor(appointmentId, serviceIds);
      if (res.success && res.data) {
        // Sử dụng data từ response (đã được populate với additionalServiceIds)
        const record = res.data;
        if (record.additionalServiceIds && Array.isArray(record.additionalServiceIds)) {
          const updatedServices = record.additionalServiceIds
            .filter((s: any) => s && s._id)
            .map((s: any) => ({
              _id: s._id.toString(),
              serviceName: s.serviceName || '',
              price: s.price || 0
            }));
          setCurrentServices(updatedServices);
          
          // Update display từ response
          if (display) {
            setDisplay({
              ...display,
              additionalServices: updatedServices
            });
          }
        } else {
          // Nếu backend trả về empty, giữ lại local state
          setCurrentServices(newServices);
        }
        toast.success(`Đã thêm dịch vụ: ${service.serviceName}`);
      } else {
        // Revert on error
        setCurrentServices(previousServices);
        toast.error(res.message || "Không thể thêm dịch vụ");
      }
    } catch (e: any) {
      // Revert on error
      setCurrentServices(previousServices);
      toast.error(e.message || "Không thể thêm dịch vụ");
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      return;
    }
    
    const serviceToRemove = currentServices.find(s => s._id === serviceId);
    if (!serviceToRemove) return;

    // Lưu lại state cũ để revert nếu có lỗi
    const previousServices = [...currentServices];

    // Remove service locally
    const newServices = currentServices.filter(s => s._id !== serviceId);
    setCurrentServices(newServices);

    // Update on backend
    try {
      const serviceIds = newServices.map(s => s._id);
      const res = await medicalRecordApi.updateAdditionalServicesForDoctor(appointmentId, serviceIds);
      if (res.success && res.data) {
        // Sử dụng data từ response (đã được populate với additionalServiceIds)
        const record = res.data;
        if (record.additionalServiceIds && Array.isArray(record.additionalServiceIds)) {
          const updatedServices = record.additionalServiceIds
            .filter((s: any) => s && s._id)
            .map((s: any) => ({
              _id: s._id.toString(),
              serviceName: s.serviceName || '',
              price: s.price || 0
            }));
          setCurrentServices(updatedServices);
          
          // Update display từ response
          if (display) {
            setDisplay({
              ...display,
              additionalServices: updatedServices
            });
          }
        } else {
          setCurrentServices([]);
        }
        toast.success(`Đã xóa dịch vụ: ${serviceToRemove.serviceName}`);
      } else {
        // Revert on error
        setCurrentServices(previousServices);
        toast.error(res.message || "Không thể xóa dịch vụ");
      }
    } catch (e: any) {
      // Revert on error
      setCurrentServices(previousServices);
      toast.error(e.message || "Không thể xóa dịch vụ");
    }
  };

  const onSave = async (approve: boolean = false) => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      return;
    }
    if (approve && !canApprove) {
      toast.error("Không thể duyệt hồ sơ khi đã được khóa.");
      return;
    }
    setSaving(true);
    try {
      const res = await medicalRecordApi.updateMedicalRecordForDoctor(appointmentId, {
        diagnosis,
        conclusion,
        prescription: prescriptions, // ⭐ Gửi prescriptions array
        nurseNote,
        approve: approve,
      });
      if (res.success && res.data) {
        setRecord(res.data);
        setPermissions((prev) => {
          if (!prev) return prev;
          const nextRecordStatus = res.data.status || prev.recordStatus;
          const appointmentStatus = prev.appointmentStatus;
          const appointmentLocked = appointmentStatus ? ['Completed', 'Finalized'].includes(appointmentStatus) : false;
          const recordFinalized = nextRecordStatus === 'Finalized';
          const doctorCanEdit = !appointmentLocked && !recordFinalized;
          const nurseCanEdit = !appointmentLocked && !recordFinalized;
          return {
            ...prev,
            recordStatus: nextRecordStatus,
            doctor: {
              canEdit: doctorCanEdit,
              reason: doctorCanEdit
                ? null
                : appointmentLocked
                ? 'Ca khám đã hoàn thành, không thể chỉnh sửa hồ sơ.'
                : 'Hồ sơ đã được duyệt.'
            },
            nurse: {
              canEdit: nurseCanEdit,
              reason: nurseCanEdit
                ? null
                : appointmentLocked
                ? 'Ca khám đã hoàn thành, không thể chỉnh sửa hồ sơ.'
                : 'Hồ sơ đã được bác sĩ duyệt, điều dưỡng không thể chỉnh sửa.'
            }
          };
        });
        if (approve) {
          toast.success("Đã lưu và duyệt hồ sơ khám bệnh");
        } else {
          toast.success("Đã lưu hồ sơ khám bệnh");
        }
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

  const onApprove = async () => {
    if (!canApprove) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể duyệt.");
      return;
    }
    await onSave(true);
  };

  // ⭐ Xử lý khi bác sĩ chọn "Không cần khám"
  const handleNoTreatment = async () => {
    if (!appointmentId) return;
    if (!canEdit) {
      toast.error(lockReason || "Hồ sơ đã được khóa, không thể chỉnh sửa.");
      return;
    }
    if (!canApprove) {
      toast.error("Hồ sơ đã được khóa, không thể xử lý.");
      return;
    }

    setSaving(true);
    try {
      // 1. Finalize medical record với conclusion = "Không cần khám" (hoặc lý do bác sĩ nhập)
      const conclusionText = noTreatmentReason.trim() 
        ? `Không cần khám. Lý do: ${noTreatmentReason.trim()}`
        : "Không cần khám";
      
      const res = await medicalRecordApi.updateMedicalRecordForDoctor(appointmentId, {
        diagnosis: "", // Để trống
        conclusion: conclusionText,
        prescription: [], // Để trống
        nurseNote: nurseNote, // Giữ nguyên nurse note nếu có
        approve: true, // Finalize medical record
      });

      if (res.success && res.data) {
        // 2. Update appointment status thành "Completed" (bệnh nhân đã đến nhưng không cần khám)
        try {
          await appointmentApi.updateAppointmentStatus(appointmentId, "Completed");
        } catch (statusError: any) {
          console.warn("⚠️ Không thể cập nhật appointment status:", statusError);
          // Không throw error vì medical record đã được finalize thành công
        }

        setRecord(res.data);
        toast.success("Đã đánh dấu ca khám là 'Không cần khám'");
        onNoTreatmentModalClose();
        setNoTreatmentReason("");
        navigate(-1);
      } else {
        setError(res.message || "Xử lý thất bại");
        toast.error(res.message || "Xử lý thất bại");
      }
    } catch (e: any) {
      setError(e.message || "Xử lý thất bại");
      toast.error(e.message || "Xử lý thất bại");
    } finally {
      setSaving(false);
    }
  };

  // Filter services that are not yet added
  const availableServices = allServices.filter(
    service => !currentServices.some(current => current._id === service._id)
  );

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

      {/* Additional Services (editable cho doctor) */}
      <div className="relative" ref={dropdownRef}>
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardHeader className="pb-0 pt-4 px-6">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-teal-600" />
              <h4 className="font-semibold text-gray-800">Dịch vụ bổ sung</h4>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-4 space-y-4">
            {/* Current services */}
            {currentServices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentServices.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-teal-200 shadow-sm"
                  >
                    <span className="font-medium text-gray-800">{s.serviceName}</span>
                    <span className="text-xs text-gray-500">{(s.finalPrice ?? s.price).toLocaleString('vi-VN')}đ</span>
                    <button
                      onClick={() => handleRemoveService(s._id)}
                      disabled={!canEdit}
                      className={`ml-1 p-1 rounded-full transition-colors ${canEdit ? "hover:bg-red-100" : "opacity-50 cursor-not-allowed"}`}
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

            {/* Dropdown button để thêm dịch vụ - Nằm trong Card */}
            <div>
              <button
                ref={dropdownButtonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canEdit) return;
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                disabled={!canEdit}
                className={`flex items-center justify-between w-full px-4 py-2 bg-white border border-teal-300 rounded-lg transition-colors shadow-sm ${canEdit ? "hover:bg-teal-50" : "opacity-60 cursor-not-allowed"}`}
                type="button"
              >
                <span className="text-gray-700">Thêm dịch vụ</span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Dropdown menu - Hiển thị bên ngoài Card với fixed positioning */}
        {canEdit && isDropdownOpen && dropdownPosition && (
          <div
            ref={dropdownMenuRef}
            className="fixed z-50 bg-white border border-teal-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {availableServices.length > 0 ? (
              <div className="py-2">
                {availableServices.map((service) => (
                  <button
                    key={service._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Khi thêm, sử dụng finalPrice nếu có để hiển thị ngay
                      handleAddService({ ...service, price: typeof service.finalPrice === 'number' ? service.finalPrice : service.price } as any);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-teal-50 transition-colors"
                    type="button"
                  >
                    <span className="font-medium text-gray-800">{service.serviceName}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {(typeof service.finalPrice === 'number' ? service.finalPrice : service.price).toLocaleString('vi-VN')}đ
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2 text-gray-500 text-center">Không còn dịch vụ nào để thêm</div>
            )}
          </div>
        )}
      </div>

      {/* Diagnosis (editable cho doctor) */}
      <Card 
        className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
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
            variant={canEdit ? "bordered" : "flat"} 
            minRows={3} 
            placeholder="Nhập chẩn đoán bệnh..."
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
            classNames={{
              input: canEdit ? undefined : "bg-gray-100 text-gray-500",
              base: canEdit ? undefined : "opacity-60"
            }}
          />
        </CardBody>
      </Card>

      {/* Conclusion (editable cho doctor) */}
      <Card 
        className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
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
            variant={canEdit ? "bordered" : "flat"} 
            minRows={3} 
            placeholder="Nhập kết luận và hướng dẫn điều trị..."
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
            classNames={{
              input: canEdit ? undefined : "bg-gray-100 text-gray-500",
              base: canEdit ? undefined : "opacity-60"
            }}
          />
        </CardBody>
      </Card>

      {/* Prescription (editable cho doctor) */}
      <Card 
        className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
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

      {/* Nurse note (editable cho doctor) */}
      <Card 
        className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200"
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
            variant={canEdit ? "bordered" : "flat"}
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
            classNames={{
              input: canEdit ? undefined : "bg-gray-100 text-gray-500",
              base: canEdit ? undefined : "opacity-60"
            }}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button 
              color="default" 
              variant="flat"
              onPress={() => onSave(false)} 
              isLoading={saving} 
              isDisabled={saving || !canEdit}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
            {/* ⭐ Nút "Không cần khám" - chỉ hiển thị khi có thể approve */}
            {canApprove && (
              <Button 
                color="warning" 
                variant="flat"
                onPress={onNoTreatmentModalOpen} 
                isLoading={saving} 
                isDisabled={saving}
                startContent={!saving && <XCircleIcon className="w-5 h-5" />}
              >
                Không cần khám
              </Button>
            )}
            <Button 
              color="success" 
              onPress={onApprove} 
              isLoading={saving} 
              isDisabled={saving || !canApprove}
              startContent={!saving && <CheckCircleIcon className="w-5 h-5" />}
            >
              {saving ? "Đang xử lý..." : "Duyệt hồ sơ"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ⭐ Modal xác nhận "Không cần khám" */}
      <Modal 
        isOpen={isNoTreatmentModalOpen} 
        onClose={onNoTreatmentModalClose}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="w-6 h-6 text-warning-600" />
                  <span>Xác nhận không cần khám</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <p className="text-gray-700">
                  Bạn có chắc chắn rằng bệnh nhân này không cần khám và có thể về luôn không?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Hành động này sẽ:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside mt-1 space-y-1">
                  <li>Hoàn tất hồ sơ khám bệnh với kết luận "Không cần khám"</li>
                  <li>Cập nhật trạng thái ca khám thành "Đã hoàn thành"</li>
                  <li>Không lưu chẩn đoán và đơn thuốc</li>
                </ul>
                <div className="mt-4">
                  <Textarea
                    label="Lý do (tùy chọn)"
                    placeholder="Nhập lý do tại sao không cần khám..."
                    value={noTreatmentReason}
                    onValueChange={setNoTreatmentReason}
                    minRows={3}
                    variant="bordered"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="default" 
                  variant="light" 
                  onPress={onClose}
                  isDisabled={saving}
                >
                  Hủy
                </Button>
                <Button 
                  color="warning" 
                  onPress={handleNoTreatment}
                  isLoading={saving}
                  startContent={!saving && <XCircleIcon className="w-5 h-5" />}
                >
                  {saving ? "Đang xử lý..." : "Xác nhận không cần khám"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DoctorMedicalRecord;


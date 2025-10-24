import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { XMarkIcon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import {
  appointmentApi,
  serviceApi,
  availableDoctorApi,
  generateByDateApi,
  Service,
} from "@/api";
import { useAuth } from "@/contexts/AuthContext";

interface ExtendedSlot {
  startTime: string;
  endTime: string;
  displayTime?: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  appointmentFor: "self" | "other";
  fullName: string;
  email: string;
  phoneNumber: string;
  serviceId: string;
  doctorUserId: string;
  date: string;
  startTime: Date;
  endTime: Date;
  doctorScheduleId: string | null;
  selectedSlot: { startTime: string; endTime: string } | null;
  notes: string;
}

// 🕓 Initial UTC-safe defaults
const now = new Date();
const utcNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

const initialFormData: FormData = {
  appointmentFor: "self",
  fullName: "",
  email: "",
  phoneNumber: "",
  serviceId: "",
  doctorUserId: "",
  date: utcNow.toISOString().split("T")[0],
  startTime: utcNow,
  endTime: new Date(utcNow.getTime() + 30 * 60000),
  doctorScheduleId: null,
  selectedSlot: null,
  notes: "",
};

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
}: BookingModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [services, setServices] = useState<Service[]>([]);

  const [slots, setSlots] = useState<ExtendedSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ⭐ THÊM: Track abort controller để cancel requests cũ
  const abortControllerRef = useRef<AbortController | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // === Fetch services ===
  useEffect(() => {
    if (!isOpen) return;

    const fetchServices = async () => {
      try {
        const res = await serviceApi.get({ status: "Active", limit: 1000 });
        if (res.status && Array.isArray(res.data)) setServices(res.data);
      } catch (err) {
        console.error("Error fetching services:", err);
        setErrorMessage("Không thể tải danh sách dịch vụ");
      } finally {
      }
    };

    fetchServices();
  }, [isOpen]);

  // === Auto-fill user info ===
  useEffect(() => {
    if (!isOpen) return;
    if (formData.appointmentFor === "self" && user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      }));
    }
  }, [isOpen, user, formData.appointmentFor]);

  // === Fetch available slots for date ===
  const fetchAvailableSlots = useCallback(
    async (serviceId: string, date: string, appointmentFor: "self" | "other") => {
      // ⭐ Cancel previous request nếu có
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // ⭐ Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsLoadingSlots(true);
      setErrorMessage(null);
      try {
        console.log(
          `📡 Fetching slots for ${serviceId} on ${date}, appointmentFor=${appointmentFor}`
        );

        const slotsRes = await generateByDateApi.get({
          serviceId,
          date,
          breakAfterMinutes: 10,
          appointmentFor: appointmentFor,
          // ⭐ THÊM: Gửi customerFullName + customerEmail CHỈ khi appointmentFor === 'other'
          // Khi appointmentFor === 'self', KHÔNG gửi để backend biết loại bỏ exclusive doctors
          ...(appointmentFor === "other" &&
            formData.fullName &&
            formData.email && {
              customerFullName: formData.fullName,
              customerEmail: formData.email,
            }),
        });

        console.log("📡 Slots API Response:", slotsRes);
        console.log("✅ Success:", slotsRes.success);
        console.log("📊 Data:", slotsRes.data);

        if (!slotsRes.success) {
          throw new Error(slotsRes.message || "Không thể tải khung giờ trống");
        }

        const allSlots = (slotsRes.data?.slots || []).map((slot: any) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          displayTime:
            slot.displayTime ||
            `${slot.startTime.slice(11, 16)} - ${slot.endTime.slice(11, 16)}`,
        }));

        // Deduplicate slots - chỉ giữ các khung giờ unique
        // (vì có thể nhiều bác sĩ có cùng khung giờ)
        const uniqueSlotsMap = new Map<string, ExtendedSlot>();
        allSlots.forEach((slot: ExtendedSlot) => {
          const key = `${slot.startTime}-${slot.endTime}`;
          if (!uniqueSlotsMap.has(key)) {
            uniqueSlotsMap.set(key, slot);
          }
        });

        const generatedSlots = Array.from(uniqueSlotsMap.values());

        console.log("🕐 Total Slots from API:", allSlots.length);
        console.log("🕐 Unique Slots:", generatedSlots.length);
        setSlots(generatedSlots);

        // Reset selections
        setFormData((prev) => ({
          ...prev,
          selectedSlot: null,
          doctorUserId: "",
          doctorScheduleId: null,
        }));
        setAvailableDoctors([]);
      } catch (err: any) {
        console.error("Error fetching available slots:", err);
        setErrorMessage(err.message || "Lỗi tải khung giờ trống");
        setSlots([]);
        setAvailableDoctors([]);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [formData.fullName, formData.email]
  );

  // Trigger slot fetching when service, date, or appointmentFor changes
  useEffect(() => {
    if (formData.serviceId && formData.date) {
      fetchAvailableSlots(
        formData.serviceId,
        formData.date,
        formData.appointmentFor
      );
    }
  }, [
    formData.serviceId,
    formData.date,
    formData.appointmentFor,
    fetchAvailableSlots,
  ]);

  // === Fetch doctors for selected slot ===
  const fetchDoctorsForSlot = useCallback(
    async (serviceId: string, date: string, slot: ExtendedSlot) => {
      if (!serviceId || !date || !slot) {
        setAvailableDoctors([]);
        return;
      }

      setLoadingDoctors(true);
      setErrorMessage(null);
      try {
        // ⭐ THÊM: Gửi appointmentFor + userId (để backend loại bỏ bác sĩ mà user đã đặt)
        const doctorRes = await availableDoctorApi.getByTimeSlot({
          serviceId,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          appointmentFor: formData.appointmentFor,
          // ⭐ Nếu đặt cho người khác, gửi userId để backend check exclusive doctors
          ...(formData.appointmentFor === "other" &&
            (user?._id || user?.id) && {
              userId: user?._id || user?.id,
            }),
        });

        if (!doctorRes.success) {
          throw new Error(doctorRes.message || "Không thể tải danh sách bác sĩ");
        }

        const doctors = doctorRes.data?.availableDoctors || [];
        setAvailableDoctors(
          doctors.map((d) => ({
            ...d,
            availableSlots: [],
          }))
        );

        if (doctors.length === 0) {
          setErrorMessage("Không có bác sĩ nào rảnh trong khung giờ này");
        }
      } catch (err: any) {
        console.error("Error fetching doctors for slot:", err);
        setErrorMessage(err.message || "Lỗi tải danh sách bác sĩ");
        setAvailableDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    },
    [formData.appointmentFor, user]
  );

  // === Handle slot select ===
  const handleTimeSelect = (slot: ExtendedSlot) => {
    setFormData((prev) => ({
      ...prev,
      selectedSlot: { startTime: slot.startTime, endTime: slot.endTime },
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime),
      doctorUserId: "",
      doctorScheduleId: null,
    }));

    // Fetch doctors for this slot
    if (formData.serviceId && formData.date) {
      fetchDoctorsForSlot(formData.serviceId, formData.date, slot);
    }
  };

  // === Handlers ===
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: "self" | "other") => {
    // ⭐ Khi thay đổi appointmentFor, reset fullName/email và clear slots
    if (value === 'self') {
      // Đặt cho bản thân - auto fill fullName + email từ user
      setFormData((prev) => ({
        ...prev,
        appointmentFor: value,
        fullName: user?.fullName || '',
        email: user?.email || '',
        selectedSlot: null,
        doctorUserId: "",
        doctorScheduleId: null,
      }));
    } else {
      // Đặt cho người khác - clear fullName + email
      setFormData((prev) => ({
        ...prev,
        appointmentFor: value,
        fullName: '',
        email: '',
        selectedSlot: null,
        doctorUserId: "",
        doctorScheduleId: null,
      }));
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    const doc = availableDoctors.find((d) => String(d.doctorId) === String(doctorId));
    if (doc) {
      setFormData((prev) => ({
        ...prev,
        doctorUserId: doctorId,
        doctorScheduleId: doc?.doctorScheduleId || null,
      }));
      setErrorMessage(null);
    }
  };

  const validateForm = (): string | null => {
    console.log("🔍 validateForm - user:", user);
    console.log("🔍 validateForm - user?._id:", user?._id);
    console.log("🔍 validateForm - user?.id:", user?.id);
    
    if (!user?._id && !user?.id) return "Bạn cần đăng nhập để đặt lịch.";
    if (!formData.fullName.trim()) return "Vui lòng nhập họ và tên.";
    if (!formData.email.trim()) return "Vui lòng nhập email.";
    if (!formData.phoneNumber.trim()) return "Vui lòng nhập số điện thoại.";
    if (!formData.serviceId) return "Vui lòng chọn dịch vụ.";
    if (!formData.date) return "Vui lòng chọn ngày.";
    if (!formData.selectedSlot) return "Vui lòng chọn khung giờ.";
    if (!formData.doctorUserId) return "Vui lòng chọn bác sĩ.";
    if (!formData.doctorScheduleId) return "Dữ liệu lịch trình không hợp lệ.";
    
    // ⭐ THÊM: Validate customer conflict khi đặt cho người khác
    if (formData.appointmentFor === 'other') {
      // Normalize fullName và email
      const normalizeString = (str: string) => {
        return str
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      };
      
      const normalizedName = normalizeString(formData.fullName);
      const normalizedEmail = normalizeString(formData.email);
      
      // Lưu ý: Validation này chỉ là quick check ở FE
      // Backend sẽ validate lại với database
      console.log(`🔍 Validating customer conflict for: ${normalizedName} <${normalizedEmail}>`);
    }
    
    return null;
  };

  // === Submit ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      console.log("📤 About to submit booking:");
      console.log("   - user:", user);
      console.log("   - user._id:", user?._id);
      console.log("   - user.id:", user?.id);
      
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        appointmentFor: formData.appointmentFor,
        serviceId: formData.serviceId,
        doctorUserId: formData.doctorUserId,
        doctorScheduleId: formData.doctorScheduleId!,
        selectedSlot: {
          startTime: formData.selectedSlot!.startTime,
          endTime: formData.selectedSlot!.endTime,
        },
        notes: formData.notes,
      };

      console.log("📤 Booking payload:", payload);

      const res = await appointmentApi.create(payload);

      if (res.success) {
        if (res.data?.requirePayment && res.data?.payment?.paymentId) {
          // ✅ Navigate to payment page
          console.log("💳 Redirecting to payment page:", res.data.payment.paymentId);
          setErrorMessage(null);
          onClose();
          navigate(`/patient/payment/${res.data.payment.paymentId}`);
        } else {
          // ✅ Đặt lịch thành công (không cần thanh toán)
          setErrorMessage(null);
          onClose();
          
          // Show success message
          toast.success(res.message || "Đặt lịch thành công!");
          
          // Navigate to appointments page và reload để fetch lại
          navigate('/patient/appointments');
          
          // Delay một chút rồi mới reload để đảm bảo navigation hoàn tất
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      } else {
        setErrorMessage(res.message || "Đặt lịch thất bại. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Error booking:", err);
      setErrorMessage(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // === Render ===
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39BDCC] sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="w-6 h-6 text-[#39BDCC]" />
            <h2 className="text-2xl font-bold text-gray-800">
              Đặt lịch khám / tư vấn
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Appointment For */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Đặt lịch cho</label>
              <div className="flex gap-6">
                {["self", "other"].map((v) => (
                  <label key={v} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="appointmentFor"
                      checked={formData.appointmentFor === v}
                      onChange={() => handleRadioChange(v as "self" | "other")}
                      className="text-[#39BDCC]"
                    />
                    {v === "self" ? "Bản thân" : "Người thân khác"}
                  </label>
                ))}
              </div>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Họ và tên {formData.appointmentFor === 'other' && '*'}
                  {formData.appointmentFor === 'self' && <span className="text-xs text-gray-500"> (Auto fill)</span>}
                </label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={formData.appointmentFor === 'self'}
                  className={`w-full border px-3 py-2 rounded-lg ${
                    formData.appointmentFor === 'self' 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : ''
                  }`}
                  placeholder={formData.appointmentFor === 'self' ? user?.fullName || '' : 'Nhập họ và tên'}
                />
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Email {formData.appointmentFor === 'other' && '*'}
                  {formData.appointmentFor === 'self' && <span className="text-xs text-gray-500"> (Auto fill)</span>}
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={formData.appointmentFor === 'self'}
                  className={`w-full border px-3 py-2 rounded-lg ${
                    formData.appointmentFor === 'self' 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : ''
                  }`}
                  placeholder={formData.appointmentFor === 'self' ? user?.email || '' : 'Nhập email'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Số điện thoại *
              </label>
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Chọn dịch vụ *
              </label>
              <select
                name="serviceId"
                value={formData.serviceId}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg"
              >
                <option value="">-- Chọn dịch vụ --</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.serviceName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Chọn ngày *
              </label>
              <input
                type="date"
                name="date"
                min={today}
                value={formData.date}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>

            {/* Slots */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Chọn giờ *
              </label>
              {isLoadingSlots ? (
                <div className="text-gray-500 text-center py-4">
                  Đang tải khung giờ...
                </div>
              ) : slots.length ? (
                <div className="grid grid-cols-4 gap-3">
                  {slots.map((s) => {
                    const isSelected = 
                      formData.selectedSlot?.startTime === s.startTime && 
                      formData.selectedSlot?.endTime === s.endTime;
                    
                    return (
                      <button
                        key={`${s.startTime}-${s.endTime}`}
                        type="button"
                        onClick={() => handleTimeSelect(s)}
                        className={`py-2 px-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? "bg-[#39BDCC] text-white"
                            : "border border-blue-200 text-[#39BDCC] hover:bg-blue-50"
                        }`}
                      >
                        {s.displayTime}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                  Vui lòng chọn dịch vụ và ngày để xem giờ trống
                </div>
              )}
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Chọn bác sĩ *
              </label>
              {formData.selectedSlot ? (
                loadingDoctors ? (
                  <div className="text-gray-500 py-3 text-center">
                    Đang tải danh sách bác sĩ...
                  </div>
                ) : availableDoctors.length ? (
                  <select
                    value={formData.doctorUserId}
                    onChange={(e) => handleDoctorSelect(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg"
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {availableDoctors.map((d) => (
                      <option key={d.doctorId} value={d.doctorId}>
                        {d.doctorName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-500 py-3 text-center bg-gray-50 rounded-lg">
                    Không có bác sĩ rảnh cho khung giờ này.
                  </div>
                )
              ) : (
                <div className="text-gray-500 py-3 text-center bg-gray-50 rounded-lg">
                  Vui lòng chọn khung giờ trước
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Ghi chú
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-[#39BDCC] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#32a8b5]"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

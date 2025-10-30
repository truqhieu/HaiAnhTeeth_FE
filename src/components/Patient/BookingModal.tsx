import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { XMarkIcon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

import {
  appointmentApi,
  serviceApi,
  availableDoctorApi,
  getDoctorScheduleRange,
  validateAppointmentTime,
  Service,
} from "@/api";
import { useAuth } from "@/contexts/AuthContext";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  appointmentFor: "self" | "other";
  fullName: string;
  email: string;
  phoneNumber: string;
  date: string;
  serviceId: string;
  doctorUserId: string;
  userStartTimeInput: string;
  startTime: Date;
  endTime: Date;
  doctorScheduleId: string | null;
  notes: string;
}

const now = new Date();
const utcNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

const initialFormData: FormData = {
  appointmentFor: "self",
  fullName: "",
  email: "",
  phoneNumber: "",
  date: utcNow.toISOString().split("T")[0],
  serviceId: "",
  doctorUserId: "",
  userStartTimeInput: "",
  startTime: utcNow,
  endTime: new Date(utcNow.getTime() + 30 * 60000),
  doctorScheduleId: null,
  notes: "",
};

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [services, setServices] = useState<Service[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [doctorScheduleRange, setDoctorScheduleRange] = useState<any>(null);

  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeInputError, setTimeInputError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const selectedService = services.find((s) => s._id === formData.serviceId);
  const serviceDuration = selectedService?.durationMinutes || 30;

  // Function to reset form data completely
  const resetForm = () => {
    setFormData(initialFormData);
    setAvailableDoctors([]);
    setDoctorScheduleRange(null);
    setErrorMessage(null);
    setTimeInputError(null);
    setLoadingDoctors(false);
    setLoadingSchedule(false);
    setSubmitting(false);
  };

  // === Reset form data when modal opens ===
  useEffect(() => {
    if (isOpen) {
      // Reset form data to initial state when modal opens
      resetForm();
    }
  }, [isOpen]);

  // === Fetch services ===
  useEffect(() => {
    if (!isOpen) return;

    const fetchServices = async () => {
      try {
        const res = await serviceApi.get({ status: "Active", limit: 1000 });
        if (res.status && Array.isArray(res.data)) setServices(res.data);
      } catch (err) {
        console.error("Error fetching services:", err);
      }
    };

    fetchServices();
  }, [isOpen]);

  // === Reset form when user changes (logout/login) ===
  useEffect(() => {
    if (isOpen) {
      // Reset form data when user changes
      resetForm();
    }
  }, [user?.id]); // Reset when user ID changes (logout/login)

  // === Reset form when modal closes ===
  useEffect(() => {
    if (!isOpen) {
      // Reset form data when modal closes
      resetForm();
    }
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

  // === Fetch available doctors for selected date + service ===
  useEffect(() => {
    if (!formData.date || !formData.serviceId) {
      setAvailableDoctors([]);
      setDoctorScheduleRange(null); // ⭐ Clear schedule range
      setErrorMessage(null); // ⭐ Clear error message
      return;
    }

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      setErrorMessage(null); // ⭐ Clear error khi fetch doctors mới
      setDoctorScheduleRange(null); // ⭐ Clear schedule range cũ
      setTimeInputError(null); // ⭐ Clear time input error
      
      // ⭐ Clear input fields khi đổi ngày/service
      setFormData((prev) => ({
        ...prev,
        userStartTimeInput: "",
        doctorUserId: "",
      }));
      
      try {
        const doctorRes = await availableDoctorApi.getByDate(
          formData.serviceId,
          formData.date
        );

        if (doctorRes.success) {
          setAvailableDoctors(doctorRes.data?.availableDoctors || []);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [formData.date, formData.serviceId, formData.appointmentFor]);

  // === Fetch doctor schedule when doctor is selected ===
  const handleDoctorSelect = async (doctorId: string) => {
    setFormData((prev) => ({
      ...prev,
      doctorUserId: doctorId,
      userStartTimeInput: "",
      startTime: utcNow,
      endTime: new Date(utcNow.getTime() + serviceDuration * 60000),
    }));

    setLoadingSchedule(true);
    setErrorMessage(null);
    try {
      const scheduleRes = await getDoctorScheduleRange(
        doctorId,
        formData.serviceId,
        formData.date,
        formData.appointmentFor
      );

      if (scheduleRes.success && scheduleRes.data?.scheduleRanges) {
        setDoctorScheduleRange(scheduleRes.data.scheduleRanges);
        // ⭐ Lưu doctorScheduleId từ response
        setFormData((prev) => ({
          ...prev,
          doctorScheduleId: scheduleRes.data.doctorScheduleId || null,
        }));
        
        // ⭐ Hiển thị message nếu không có gaps khả dụng (không đủ thời gian)
        if (scheduleRes.data.message) {
          setErrorMessage(scheduleRes.data.message);
        }
      } else {
        setErrorMessage(scheduleRes.message || "Không thể tải lịch bác sĩ");
        setDoctorScheduleRange(null);
      }
    } catch (err) {
      console.error("Error fetching doctor schedule:", err);
      setErrorMessage("Lỗi tải lịch bác sĩ");
      setDoctorScheduleRange(null);
      } finally {
      setLoadingSchedule(false);
    }
  };

  // === Handle time input blur ===
  const handleTimeInputBlur = async (timeInput: string) => {
    if (!timeInput || !formData.doctorUserId) return;

    const [hours, minutes] = timeInput.split(":");
    if (!hours || !minutes || isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) {
      setTimeInputError("Định dạng thời gian không hợp lệ. Vui lòng nhập HH:mm");
      return;
    }

    // ⭐ Convert giờ VN sang UTC: VN - 7
    // User nhập 08:00 (VN) → lưu 01:00 (UTC)
    const dateObj = new Date(formData.date + 'T00:00:00.000Z');
    const vnHours = parseInt(hours);
    const vnMinutes = parseInt(minutes);
    const utcHours = vnHours - 7; // Convert VN to UTC
    dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
    const startTimeISO = dateObj.toISOString();

    // ⭐ FE validation: không cho đặt thời gian ở quá khứ
    const nowUtc = new Date();
    if (dateObj.getTime() < nowUtc.getTime()) {
      setTimeInputError("Không thể đặt thời gian ở quá khứ");
      return;
    }

    setTimeInputError(null);
    try {
      const validateRes = await validateAppointmentTime(
        formData.doctorUserId,
        formData.serviceId,
        formData.date,
        startTimeISO
      );

      if (!validateRes.success) {
        setTimeInputError(validateRes.message || "Thời gian không hợp lệ");
        return;
      }

      // Parse endTime từ BE (UTC) và tạo Date object
      const endTimeDate = new Date(validateRes.data!.endTime);
      
    setFormData((prev) => ({
      ...prev,
        userStartTimeInput: timeInput,
        startTime: dateObj,
        endTime: endTimeDate,
      }));
    } catch (err: any) {
      console.error("Error validating time:", err);
      setTimeInputError(err.message || "Lỗi validate thời gian");
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
    if (value === "self") {
      setFormData((prev) => ({
        ...prev,
        appointmentFor: value,
        fullName: user?.fullName || "",
        email: user?.email || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        appointmentFor: value,
        fullName: "",
        email: "",
      }));
    }
  };

  const validateForm = (): string | null => {
    if (!user?._id && !user?.id) return "Bạn cần đăng nhập để đặt lịch.";
    if (!formData.fullName.trim()) return "Vui lòng nhập họ và tên.";
    if (!formData.email.trim()) return "Vui lòng nhập email.";
    if (!formData.phoneNumber.trim()) return "Vui lòng nhập số điện thoại.";
    if (!formData.serviceId) return "Vui lòng chọn dịch vụ.";
    if (!formData.date) return "Vui lòng chọn ngày.";
    if (!formData.doctorUserId) return "Vui lòng chọn bác sĩ.";
    if (!formData.userStartTimeInput) return "Vui lòng nhập thời gian bắt đầu.";

    return null;
  };

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
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        appointmentFor: formData.appointmentFor,
        serviceId: formData.serviceId,
        doctorUserId: formData.doctorUserId,
        doctorScheduleId: formData.doctorScheduleId || "",
        selectedSlot: {
          startTime: formData.startTime.toISOString(),
          endTime: formData.endTime.toISOString(),
        },
        notes: formData.notes,
      };

      const res = await appointmentApi.create(payload);

      if (res.success) {
        // Reset form after successful booking
        resetForm();
        
        if (res.data?.requirePayment && res.data?.payment?.paymentId) {
          setErrorMessage(null);
          onClose();
          navigate(`/patient/payment/${res.data.payment.paymentId}`);
        } else {
          setErrorMessage(null);
          onClose();
          toast.success(res.message || "Đặt lịch thành công!");
          navigate("/patient/appointments");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
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
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
            onClick={onClose}
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Appointment For */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Đặt lịch cho
              </label>
              <div className="flex gap-6">
                {["self", "other"].map((v) => (
                  <label key={v} className="flex items-center gap-2">
                    <input
                      checked={formData.appointmentFor === v}
                      className="text-[#39BDCC]"
                      name="appointmentFor"
                      type="radio"
                      onChange={() => handleRadioChange(v as "self" | "other")}
                    />
                    {v === "self" ? "Bản thân" : "Người thân khác"}
                  </label>
                ))}
              </div>
              
              {/* Hiển thị thông tin người được đặt lịch */}
              {formData.appointmentFor === "self" ? (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Bản thân:</strong> {user?.fullName} ({user?.email})
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Người thân:</strong> {formData.fullName} ({formData.email})
                  </p>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Họ và tên
                </label>
                <input
                  className={`w-full border px-3 py-2 rounded-lg ${
                    formData.appointmentFor === "self" 
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
                      : "bg-white text-gray-900"
                  }`}
                  disabled={formData.appointmentFor === "self"}
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Email
                </label>
                <input
                  className={`w-full border px-3 py-2 rounded-lg ${
                    formData.appointmentFor === "self" 
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
                      : "bg-white text-gray-900"
                  }`}
                  disabled={formData.appointmentFor === "self"}
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Số điện thoại *
              </label>
              <input
                className="w-full border px-3 py-2 rounded-lg"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Chọn ngày *
              </label>
              <input
                className="w-full border px-3 py-2 rounded-lg"
                min={today}
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Chọn dịch vụ *
              </label>
              <select
                className="w-full border px-3 py-2 rounded-lg"
                name="serviceId"
                value={formData.serviceId}
                onChange={handleInputChange}
              >
                <option value="">-- Chọn dịch vụ --</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.serviceName} ({s.durationMinutes} phút)
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Chọn bác sĩ *
              </label>
              {loadingDoctors ? (
                  <div className="text-gray-500 py-3 text-center">
                    Đang tải danh sách bác sĩ...
                  </div>
                ) : availableDoctors.length ? (
                  <select
                    className="w-full border px-3 py-2 rounded-lg"
                    value={formData.doctorUserId}
                    onChange={(e) => handleDoctorSelect(e.target.value)}
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
                  {formData.serviceId && formData.date
                    ? "Không có bác sĩ khả dụng"
                    : "Vui lòng chọn ngày và dịch vụ"}
                </div>
              )}
            </div>

            {/* Time Input - shows only if doctor is selected */}
            {formData.doctorUserId && (
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Thời gian bắt đầu khám *
                </label>
                {loadingSchedule ? (
                  <div className="text-gray-500 py-3 text-center">
                    Đang tải lịch bác sĩ...
                  </div>
                ) : doctorScheduleRange && Array.isArray(doctorScheduleRange) ? (
                  <div className="space-y-3">
                    {/* Hiển thị các khoảng thời gian khả dụng chi tiết */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-2">
                        Khoảng thời gian khả dụng:
                      </p>
                      <div className="space-y-2">
                        {doctorScheduleRange.map((range: any, index: number) => (
                          <div key={index}>
                            <p className="text-sm font-semibold text-[#39BDCC] mb-1">
                              {range.shiftDisplay}:
                            </p>
                            <p className="text-sm text-gray-700 ml-2">
                              {range.displayRange === 'Đã hết chỗ' ? (
                                <span className="text-red-600 font-medium">Đã hết chỗ</span>
                              ) : (
                                range.displayRange.split(', ').map((gap: string, gapIdx: number) => (
                                  <span key={gapIdx}>
                                    {gapIdx > 0 && <span className="mx-2">|</span>}
                                    <span className="text-[#39BDCC] font-medium">{gap}</span>
                                  </span>
                                ))
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Input thời gian và hiển thị kết quả nằm ngang */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Nhập giờ bắt đầu
                          </label>
                          <input
                            type="text"
                            placeholder="vd: 09:30"
                            className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent ${
                              timeInputError 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'focus:ring-[#39BDCC] focus:border-transparent'
                            }`}
                            value={formData.userStartTimeInput}
                            onChange={(e) => {
                              const timeInput = e.target.value;
                              setTimeInputError(null);
                              
                              // ⭐ Tính endTime real-time khi đang nhập
                              const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                              if (timeRegex.test(timeInput)) {
                                const [hours, minutes] = timeInput.split(":");
                                const vnHours = parseInt(hours);
                                const vnMinutes = parseInt(minutes);
                                const utcHours = vnHours - 7;
                                
                                const dateObj = new Date(formData.date + 'T00:00:00.000Z');
                                dateObj.setUTCHours(utcHours, vnMinutes, 0, 0);
                                
                                const endTimeDate = new Date(dateObj.getTime() + serviceDuration * 60000);
                                
                                setFormData((prev) => ({
                                  ...prev,
                                  userStartTimeInput: timeInput,
                                  startTime: dateObj,
                                  endTime: endTimeDate,
                                }));
                              } else {
                                // Nếu chưa đúng format, chỉ update input
                                setFormData((prev) => ({
                                  ...prev,
                                  userStartTimeInput: timeInput,
                                }));
                              }
                            }}
                            onBlur={() =>
                              handleTimeInputBlur(formData.userStartTimeInput)
                            }
                          />
                          {timeInputError && (
                            <p className="mt-1 text-xs text-red-600 font-medium">
                              {timeInputError}
                            </p>
                          )}
                        </div>

                        {formData.userStartTimeInput && !timeInputError && /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(formData.userStartTimeInput) && (
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Thời gian kết thúc dự kiến
                            </label>
                            <div className="border px-3 py-2 rounded-lg bg-blue-50 border-blue-200">
                              <span className="font-semibold text-[#39BDCC]">
                                {String((formData.endTime.getUTCHours() + 7) % 24).padStart(2, '0')}:{String(formData.endTime.getUTCMinutes()).padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
              ) : (
                <div className="text-gray-500 py-3 text-center bg-gray-50 rounded-lg">
                    Vui lòng chọn bác sĩ để xem lịch khả dụng
                </div>
              )}
            </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm mb-1 font-medium text-gray-700">
                Ghi chú
              </label>
              <textarea
                className="w-full border px-3 py-2 rounded-lg"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                type="button"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                className="px-6 py-2 bg-[#39BDCC] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#32a8b5]"
                disabled={submitting}
                type="submit"
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

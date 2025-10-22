import React, { useState, useEffect, useCallback } from "react";
import { XMarkIcon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import {
  appointmentApi,
  serviceApi,
  availableDoctorApi,
  AvailableDoctor,
  Service,
} from "@/api";
import { useAuth } from "@/contexts/AuthContext";

// 🕐 Helper: convert local → UTC ISO string
const toUTCISOString = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();

interface ExtendedSlot {
  startTime: string;
  endTime: string;
  displayTime?: string;
}

type ExtendedAvailableDoctor = Omit<AvailableDoctor, "doctorScheduleId"> & {
  doctorScheduleId?: string | null;
  availableSlots?: ExtendedSlot[];
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (paymentId: string) => void;
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
  onBookingSuccess,
}) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [availableDoctors, setAvailableDoctors] = useState<ExtendedAvailableDoctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<ExtendedAvailableDoctor[]>([]);
  const [slots, setSlots] = useState<ExtendedSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // === Fetch services ===
  useEffect(() => {
    if (!isOpen) return;

    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const res = await serviceApi.get({ status: "Active", limit: 1000 });
        if (res.status && Array.isArray(res.data)) setServices(res.data);
      } catch (err) {
        console.error("Error fetching services:", err);
      } finally {
        setLoadingServices(false);
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

  // === Fetch available doctors for selected date/time ===
  const fetchAvailableDoctors = useCallback(
    async (serviceId: string, date: string) => {
      if (!serviceId || !date) {
        setAvailableDoctors([]);
        setSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      setLoadingDoctors(true);
      setAvailableDoctors([]);
      setSlots([]);
      setFilteredDoctors([]);
      setFormData((prev) => ({
        ...prev,
        selectedSlot: null,
        doctorUserId: "",
        doctorScheduleId: null,
      }));

      try {
        const base =
          import.meta.env.VITE_API1_URL ||
          "https://haianhteethbe-production.up.railway.app";

        // Lấy giờ 08:00–08:30 mặc định để gọi time-slot API
        const selectedDate = new Date(date);
        const startTimeLocal = new Date(selectedDate);
        startTimeLocal.setHours(8, 0, 0, 0);
        const endTimeLocal = new Date(selectedDate);
        endTimeLocal.setHours(8, 30, 0, 0);

        const startTime = toUTCISOString(startTimeLocal);
        const endTime = toUTCISOString(endTimeLocal);

        const res = await availableDoctorApi.getByTimeSlot({
          serviceId,
          date,
          startTime,
          endTime,
        });

        if (!res.success) throw new Error(res.message || "Không lấy được dữ liệu");

        const doctors = res.data?.availableDoctors || [];

        const normalized = doctors.map((d) => ({
          ...d,
          availableSlots: [],
        }));

        setAvailableDoctors(normalized);

        // Cập nhật slots nếu backend trả kèm
        const newSlots: ExtendedSlot[] = res.data?.requestedTime
          ? [
              {
                startTime: res.data.requestedTime.startTime,
                endTime: res.data.requestedTime.endTime,
                displayTime: res.data.requestedTime.displayTime,
              },
            ]
          : [];

        setSlots(newSlots);
      } catch (err) {
        console.error("Error fetching available doctors:", err);
      } finally {
        setIsLoadingSlots(false);
        setLoadingDoctors(false);
      }
    },
    []
  );

  useEffect(() => {
    if (formData.serviceId && formData.date) {
      fetchAvailableDoctors(formData.serviceId, formData.date);
    }
  }, [formData.serviceId, formData.date, fetchAvailableDoctors]);

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
    setFilteredDoctors(availableDoctors);
  };

  // === Handlers ===
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: "self" | "other") => {
    setFormData((prev) => ({ ...prev, appointmentFor: value }));
  };

  const handleDoctorSelect = (doctorId: string) => {
    const doc = filteredDoctors.find((d) => String(d.doctorId) === String(doctorId));
    setFormData((prev) => ({
      ...prev,
      doctorUserId: doctorId,
      doctorScheduleId: doc?.doctorScheduleId || null,
    }));
  };

  const validateForm = (): string | null => {
    if (!user?._id) return "Bạn cần đăng nhập để đặt lịch.";
    if (!formData.fullName.trim()) return "Vui lòng nhập họ và tên.";
    if (!formData.email.trim()) return "Vui lòng nhập email.";
    if (!formData.phoneNumber.trim()) return "Vui lòng nhập số điện thoại.";
    if (!formData.serviceId) return "Vui lòng chọn dịch vụ.";
    if (!formData.date) return "Vui lòng chọn ngày.";
    if (!formData.selectedSlot) return "Vui lòng chọn khung giờ.";
    if (!formData.doctorUserId) return "Vui lòng chọn bác sĩ.";
    if (!formData.doctorScheduleId) return "Dữ liệu lịch trình không hợp lệ.";
    return null;
  };

  // === Submit ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) return alert(error);

    setSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        appointmentFor: formData.appointmentFor,
        serviceId: formData.serviceId,
        doctorUserId: formData.doctorUserId,
        doctorScheduleId: formData.doctorScheduleId!,
        selectedSlot: {
          startTime: toUTCISOString(new Date(formData.selectedSlot!.startTime)),
          endTime: toUTCISOString(new Date(formData.selectedSlot!.endTime)),
        },
        notes: formData.notes,
      };

      const res = await appointmentApi.create(payload);

      if (res.success) {
        if (res.data?.requirePayment && res.data?.payment?.paymentId) {
          onBookingSuccess(res.data.payment.paymentId);
        } else {
          alert(res.message || "Đặt lịch thành công!");
          onClose();
        }
      } else {
        alert(res.message || "Đặt lịch thất bại. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Error booking:", err);
      alert(err.message || "Đã có lỗi xảy ra.");
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
                  Họ và tên *
                </label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Email *
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-lg"
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
                  {slots.map((s) => (
                    <button
                      key={`${s.startTime}-${s.endTime}`}
                      type="button"
                      onClick={() => handleTimeSelect(s)}
                      className={`py-2 px-2 rounded-lg text-sm ${
                        formData.selectedSlot?.startTime === s.startTime
                          ? "bg-[#39BDCC] text-white"
                          : "border border-blue-200 text-[#39BDCC]"
                      }`}
                    >
                      {s.displayTime || `${s.startTime.slice(11, 16)} - ${s.endTime.slice(11, 16)}`}
                    </button>
                  ))}
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
              {loadingDoctors ? (
                <div className="text-gray-500 py-3 text-center">
                  Đang tải danh sách bác sĩ...
                </div>
              ) : filteredDoctors.length ? (
                <select
                  value={formData.doctorUserId}
                  onChange={(e) => handleDoctorSelect(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg"
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {filteredDoctors.map((d) => (
                    <option key={d.doctorId} value={d.doctorId}>
                      {d.doctorName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-gray-500 py-3 text-center bg-gray-50 rounded-lg">
                  Không có bác sĩ rảnh.
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
              <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg">
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-[#39BDCC] text-white rounded-lg"
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

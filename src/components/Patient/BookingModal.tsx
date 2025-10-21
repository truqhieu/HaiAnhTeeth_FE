import React, { useState } from 'react';
import { XMarkIcon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import PaymentModal from "./PaymentModal";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  category: 'individual' | 'company';
  fullName: string;
  email: string;
  phone: string;
  serviceType: string;
  doctorName: string;
  date: string;
  time: string;
}

const consultants = [
  { key: 'bs-nguyen-van-a', label: 'BS. Nguyễn Văn A' },
  { key: 'bs-nguyen-thi-b', label: 'BS. Nguyễn Thị B' },
  { key: 'bs-tran-van-c', label: 'BS. Trần Văn C' },
];

const timeSlots = [
  '09:00 - 09:30',
  '10:00 - 10:30',
  '11:00 - 11:30',
  '14:00 - 14:30',
  '15:00 - 15:30',
];

const initialFormData: FormData = {
  category: 'individual',
  fullName: '',
  email: '',
  phone: '',
  serviceType: '',
  doctorName: '',
  date: '',
  time: '',
};

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: 'individual' | 'company') => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.serviceType === "consultation") {
      // 🔹 Nếu chọn tư vấn online => mở PaymentModal
      setIsPaymentOpen(true);
    } else {
      // 🔹 Nếu chọn dịch vụ khác => xác nhận đặt lịch bình thường
      alert("Đặt lịch khám thành công!");
      setFormData(initialFormData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* --- Booking Modal --- */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Nền tối */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Nội dung Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#39BDCC]">
            <div className="flex items-center space-x-3">
              <CalendarDaysIcon className="w-6 h-6 text-[#39BDCC]" />
              <h2 className="text-2xl font-bold text-gray-800">Đặt lịch khám / tư vấn</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Đặt lịch cho */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Đặt lịch cho
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value="individual"
                      checked={formData.category === 'individual'}
                      onChange={() => handleRadioChange('individual')}
                      className="w-4 h-4 text-[#39BDCC]"
                    />
                    <span className="ml-2 text-gray-700">Bản thân</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value="company"
                      checked={formData.category === 'company'}
                      onChange={() => handleRadioChange('company')}
                      className="w-4 h-4 text-[#39BDCC]"
                    />
                    <span className="ml-2 text-gray-700">Người thân khác</span>
                  </label>
                </div>
              </div>

              {/* Họ tên - Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Nhập họ và tên"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39BDCC]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Nhập email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39BDCC]"
                  />
                </div>
              </div>

              {/* Điện thoại */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39BDCC]"
                />
              </div>

              {/* Dịch vụ + Bác sĩ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn dịch vụ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39BDCC]"
                  >
                    <option value="">Chọn dịch vụ</option>
                    <option value="general">Khám tổng quát</option>
                    <option value="specialized">Khám chuyên khoa</option>
                    <option value="consultation">Tư vấn online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn bác sĩ
                  </label>
                  <select
                    name="doctorName"
                    value={formData.doctorName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39BDCC]"
                  >
                    <option value="">Chọn bác sĩ</option>
                    {consultants.map((doc) => (
                      <option key={doc.key} value={doc.key}>
                        {doc.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ngày */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn ngày <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  min={today}
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39BDCC]"
                />
              </div>

              {/* Giờ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Chọn giờ
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleTimeSelect(slot)}
                      className={`py-2 rounded-lg text-sm transition ${
                        formData.time === slot
                          ? 'bg-[#39BDCC] text-white'
                          : 'bg-blue-50 text-[#39BDCC] hover:bg-blue-100'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#39BDCC] text-white rounded-lg font-semibold hover:bg-[#2ca6b5] transition"
                >
                  Xác nhận đặt lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* --- Payment Modal (hiển thị khi chọn tư vấn online) --- */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setFormData(initialFormData);
          onClose();
        }}
      />
    </>
  );
};

export default BookingModal;

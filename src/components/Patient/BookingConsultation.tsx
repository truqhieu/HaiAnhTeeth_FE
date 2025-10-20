// Giả sử file này ở: @/components/BookingConsultation.tsx

import React, { useState } from 'react';
import { XMarkIcon, CalendarDaysIcon } from "@heroicons/react/24/solid";

interface FormData {
  category: 'individual' | 'company';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceType: string;
  doctorName: string;
  date: string;
  time: string;
}

// THAY ĐỔI 1: Thêm 'onBookingSuccess' vào interface
interface BookingConsultationProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: () => void; // <-- PROP MỚI
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

// Dữ liệu ban đầu cho state
const initialFormData = {
  category: 'individual' as 'individual' | 'company',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  serviceType: '',
  doctorName: '',
  date: '',
  time: '',
};

const BookingConsultation: React.FC<BookingConsultationProps> = ({ 
  isOpen, 
  onClose, 
  onBookingSuccess // <-- THAY ĐỔI 2: Nhận prop mới
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRadioChange = (value: 'individual' | 'company') => {
    setFormData(prev => ({
      ...prev,
      category: value,
    }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({
      ...prev,
      time: time,
    }));
  };

  // THAY ĐỔI 3: Cập nhật handleSubmit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    
    // Không alert, không gọi onClose
    // alert('Đặt lịch tư vấn thành công!'); 
    
    setFormData(initialFormData); // Reset form
    
    onBookingSuccess(); // <-- Gọi hàm thành công để mở modal thanh toán
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        aria-label="Close modal"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClose();
          }
        }}
      />

      {/* Modal Content (Giữ nguyên) */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39BDCC]">
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="w-6 h-6 text-[#39BDCC]" />
            <h2 className="text-2xl font-bold text-gray-800">Đặt lịch tư vấn online</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Giữ nguyên) */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
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
                    className="w-4 h-4 text-blue-500"
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
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Người thân khác</span>
                </label>
              </div>
            </div>

            {/* Name and Email Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Nhập họ và tên"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39BDCC]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Nhập địa chỉ email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39BDCC]"
                />
              </div>
            </div>

            {/* Phone Section */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39BDCC]"
              />
            </div>

            {/* Service and Doctor Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn dịch vụ tư vấn <span className="text-red-500">*</span>
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39BDCC]"
                >
                  <option value="">Chọn dịch vụ</option>
                  <option value="general">Tư vấn tổng quát</option>
                  <option value="specialized">Tư vấn chuyên khoa</option>
                  <option value="emergency">Tư vấn khẩn cấp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn bác sĩ <span className="text-red-500">*</span>
                </label>
                <select
                  name="doctorName"
                  value={formData.doctorName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39BDCC]"
                >
                  <option value="">Chọn bác sĩ</option>
                  {consultants.map(doc => (
                    <option key={doc.key} value={doc.key}>
                      {doc.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn ngày tư vấn <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                min={today}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39BDCC]"
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Chọn giờ tư vấn <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-3">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleTimeSelect(slot)}
                    className={`py-2 rounded-lg font-medium text-sm transition ${
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

            {/* Submit Button */}
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
                Xác nhận và thanh toán
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingConsultation;
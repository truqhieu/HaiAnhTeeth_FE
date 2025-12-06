import React, { useEffect, useState } from "react";
import { Button, Select, SelectItem } from "@heroui/react";

import { appointmentApi } from "@/api";

interface Props {
  appointmentId: string;
  currentStartTime: string;
  currentEndTime: string;
  serviceName: string;
  currentDoctorName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ChangeDoctorModal: React.FC<Props> = ({
  appointmentId,
  currentStartTime,
  currentEndTime,
  serviceName,
  currentDoctorName,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Array<{
    _id: string;
    fullName: string;
    email: string;
    workingHours: any;
  }>>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const showToast = (type: "success" | "error", message: string, cb?: () => void) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
      if (cb) cb();
    }, 2200);
  };

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        
        // Sử dụng API mới để lấy danh sách bác sĩ khả dụng
        const res = await appointmentApi.getAvailableDoctors(
          appointmentId,
          currentStartTime,
          currentEndTime
        );
        
        if (res.success && res.data) {
          console.log("Available doctors:", res.data.availableDoctors);
          setDoctors(res.data.availableDoctors || []);
        } else {
          setDoctors([]);
        }
      } catch (err) {
        console.error("Error loading available doctors:", err);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    loadDoctors();
  }, [appointmentId, currentStartTime, currentEndTime]);

  const handleSubmit = async () => {
    if (!selectedDoctorId) return;
    try {
      setSubmitting(true);
      await appointmentApi.requestChangeDoctor(appointmentId, {
        newDoctorUserId: selectedDoctorId,
        reason: reason 
      });
      showToast("success", "Đã gửi yêu cầu đổi bác sĩ. Đang chờ staff duyệt.", () => {
        onSuccess();
        onClose();
      });
    } catch (err: any) {
      // Hiển thị lỗi cụ thể từ API
      const errorMessage =
        err?.response?.data?.message || "Có lỗi xảy ra khi đổi bác sĩ";
      showToast("error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <>
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Đổi bác sĩ</h3>

        <div className="space-y-4">
          {/* Thông tin lịch hẹn hiện tại */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Thông tin lịch hẹn hiện tại</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Dịch vụ:</span> {serviceName}</div>
              <div><span className="font-medium">Ngày:</span> {formatDate(currentStartTime)}</div>
              <div><span className="font-medium">Giờ:</span> {formatTime(currentStartTime)} - {formatTime(currentEndTime)}</div>
              <div><span className="font-medium">Bác sĩ hiện tại:</span> {currentDoctorName}</div>
            </div>
          </div>

          {/* Chọn bác sĩ mới */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Chọn bác sĩ mới</h4>
            {loading ? (
              <div className="text-center py-4">
                <div className="text-sm text-gray-600">Đang tải danh sách bác sĩ...</div>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-sm text-red-600 font-medium mb-2">
                  Không có bác sĩ nào khả dụng trong thời gian này
                </div>
                <div className="text-xs text-gray-500">
                  Vui lòng đổi lịch hẹn để có thêm lựa chọn bác sĩ
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Select
                  placeholder="Chọn bác sĩ mới"
                  selectedKeys={selectedDoctorId ? [selectedDoctorId] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    console.log("Selected doctor key:", selectedKey);
                    setSelectedDoctorId(selectedKey || "");
                  }}
                >
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor._id} textValue={doctor.fullName}>
                      <span className="font-medium">{doctor.fullName}</span>
                    </SelectItem>
                  ))}
                </Select>
                <div className="text-xs text-gray-500">
                  Tìm thấy {doctors.length} bác sĩ khả dụng
                </div>
              </div>
            )}
          </div>

          {/* Lý do yêu cầu */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Lý do yêu cầu (tùy chọn)</h4>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do yêu cầu đổi bác sĩ..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button
            disabled={submitting}
            variant="light"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            color="primary"
            isDisabled={!selectedDoctorId || doctors.length === 0}
            isLoading={submitting}
            onClick={handleSubmit}
          >
            Gửi yêu cầu đổi bác sĩ
          </Button>
        </div>
      </div>
    </div>

    {/* Toast */}
    {toast && (
      <div
        className={`fixed top-5 right-5 z-[10000] px-4 py-3 rounded-lg shadow-lg text-sm transition-opacity duration-300 ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}
        role="status"
      >
        {toast.message}
      </div>
    )}
    </>
  );
};

export default ChangeDoctorModal;
import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  Button,
  Select,
  SelectItem,
  Textarea,
  Spinner,
} from "@heroui/react";
import toast from "react-hot-toast";
import { appointmentApi } from "@/api";

interface Doctor {
  _id: string;
  fullName: string;
}

interface ReassignDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  appointmentId: string;
  currentDoctorName: string;
  startTime: string;
  endTime: string;
}

const ReassignDoctorModal: React.FC<ReassignDoctorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  appointmentId,
  currentDoctorName,
  startTime,
  endTime,
}) => {
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Fetch available doctors when modal opens
  useEffect(() => {
    if (isOpen && appointmentId && startTime && endTime) {
      fetchAvailableDoctors();
    }
  }, [isOpen, appointmentId, startTime, endTime]);

  const fetchAvailableDoctors = async () => {
    try {
      setIsLoadingDoctors(true);
      const response = await appointmentApi.getAvailableDoctors(
        appointmentId,
        startTime,
        endTime
      );

      if (response.success && response.data) {
        setAvailableDoctors(response.data.availableDoctors || []);
      } else {
        toast.error("Không thể tải danh sách bác sĩ khả dụng");
        setAvailableDoctors([]);
      }
    } catch (error: any) {
      console.error("Error fetching available doctors:", error);
      toast.error(error.message || "Lỗi khi tải danh sách bác sĩ");
      setAvailableDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    // ⭐ Nếu không có bác sĩ khả dụng, hủy lịch hẹn
    if (availableDoctors.length === 0) {
      if (!reason.trim()) {
        toast.error("Vui lòng nhập lý do hủy lịch!");
        return;
      }

      try {
        setIsSubmitting(true);

        const response = await appointmentApi.reviewAppointment(
          appointmentId,
          "cancel",
          reason.trim()
        );

        if (response.success) {
          toast.success("Đã hủy lịch hẹn thành công!");
          
          // Reset form
          handleClose();
          
          // Trigger refresh
          if (onSuccess) {
            onSuccess();
          }
        } else {
          toast.error(response.message || "Không thể hủy lịch hẹn");
        }
      } catch (error: any) {
        console.error("Error cancelling appointment:", error);
        toast.error(error.message || "Có lỗi xảy ra khi hủy lịch hẹn");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ⭐ Logic gán bác sĩ mới (khi có bác sĩ khả dụng)
    // Validation
    if (!selectedDoctorId) {
      toast.error("Vui lòng chọn bác sĩ mới!");
      return;
    }

    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do gán lại bác sĩ!");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await appointmentApi.reassignDoctor(
        appointmentId,
        selectedDoctorId
      );

      if (response.success) {
        const selectedDoctor = availableDoctors.find(d => d._id === selectedDoctorId);
        
        toast.success(
          `Đã gán bác sĩ mới: ${selectedDoctor?.fullName || "Bác sĩ"} thành công!`
        );

        // Reset form
        handleClose();
        
        // Trigger refresh
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(response.message || "Không thể gán bác sĩ");
      }
    } catch (error: any) {
      console.error("Error reassigning doctor:", error);
      toast.error(error.message || "Có lỗi xảy ra khi gán bác sĩ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Chỉ ẩn validation errors, KHÔNG clear form data
    setShowValidation(false);
    onClose();
  };

  if (!isOpen) return null;

  const isDoctorInvalid = showValidation && !selectedDoctorId;
  const isReasonInvalid = showValidation && !reason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Gán Bác Sĩ Mới</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Current Doctor Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Bác sĩ hiện tại:</span> {currentDoctorName}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Thời gian: {new Date(startTime).toLocaleString("vi-VN")} -{" "}
              {new Date(endTime).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Select New Doctor - Chỉ hiển thị khi có bác sĩ khả dụng */}
          {availableDoctors.length > 0 && (
            <div>
              <Select
                label="Chọn bác sĩ mới *"
                placeholder="Chọn bác sĩ khả dụng"
                selectedKeys={selectedDoctorId ? new Set([selectedDoctorId]) : new Set([])}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  setSelectedDoctorId(selected ? String(selected) : "");
                }}
                isRequired
                isInvalid={isDoctorInvalid}
                errorMessage={isDoctorInvalid ? "Vui lòng chọn bác sĩ" : ""}
                isDisabled={isLoadingDoctors || isSubmitting}
                variant="bordered"
                size="lg"
                classNames={{
                  trigger: "border-2",
                }}
              >
                {isLoadingDoctors ? (
                  <SelectItem key="loading" isDisabled>
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      <span>Đang tải...</span>
                    </div>
                  </SelectItem>
                ) : (
                  availableDoctors.map((doctor) => (
                    <SelectItem key={doctor._id}>
                      {doctor.fullName}
                    </SelectItem>
                  ))
                )}
              </Select>
            </div>
          )}

          {/* Reason - Label thay đổi dựa trên có bác sĩ hay không */}
          <div>
            <Textarea
              label={availableDoctors.length === 0 ? "Lý do hủy lịch *" : "Lý do gán lại bác sĩ *"}
              placeholder={
                availableDoctors.length === 0 
                  ? "Nhập lý do hủy lịch (vd: Không có bác sĩ khả dụng trong khung giờ này...)"
                  : "Nhập lý do (vd: Bác sĩ cũ xin nghỉ phép...)"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              isRequired
              isInvalid={isReasonInvalid}
              errorMessage={isReasonInvalid ? "Vui lòng nhập lý do" : ""}
              variant="bordered"
              minRows={3}
              maxRows={6}
              isDisabled={isSubmitting}
            />
          </div>

          {/* Warning */}
          {availableDoctors.length === 0 && !isLoadingDoctors && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Không có bác sĩ nào khả dụng trong khung giờ này. Vui lòng hủy lịch hẹn và yêu cầu bệnh nhân dặt lịch hẹn mới.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button
            color="default"
            variant="flat"
            onPress={handleClose}
            isDisabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            color={availableDoctors.length === 0 ? "danger" : "primary"}
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={isLoadingDoctors}
          >
            {isSubmitting 
              ? "Đang xử lý..." 
              : availableDoctors.length === 0 
                ? "Xác nhận hủy lịch" 
                : "Xác nhận"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReassignDoctorModal;


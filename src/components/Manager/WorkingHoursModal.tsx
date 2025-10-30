import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button } from "@heroui/react";
import toast from "react-hot-toast";

interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workingHours: any) => void;
  initialWorkingHours?: {
    morningStart: string;
    morningEnd: string;
    afternoonStart: string;
    afternoonEnd: string;
  };
}

const WorkingHoursModal: React.FC<WorkingHoursModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialWorkingHours,
}) => {
  const [formData, setFormData] = useState({
    morningStart: "08:00",
    morningEnd: "12:00",
    afternoonStart: "14:00",
    afternoonEnd: "18:00",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial working hours when modal opens
  useEffect(() => {
    if (isOpen && initialWorkingHours) {
      setFormData(initialWorkingHours);
    }
  }, [isOpen, initialWorkingHours]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

      if (
        !timeRegex.test(formData.morningStart) ||
        !timeRegex.test(formData.morningEnd) ||
        !timeRegex.test(formData.afternoonStart) ||
        !timeRegex.test(formData.afternoonEnd)
      ) {
        toast.error("Thời gian phải có định dạng HH:MM (24h)");
        return;
      }

      // Validate time logic
      const morningStartTime = new Date(
        `2000-01-01T${formData.morningStart}:00`,
      );
      const morningEndTime = new Date(`2000-01-01T${formData.morningEnd}:00`);
      const afternoonStartTime = new Date(
        `2000-01-01T${formData.afternoonStart}:00`,
      );
      const afternoonEndTime = new Date(
        `2000-01-01T${formData.afternoonEnd}:00`,
      );

      if (morningStartTime >= morningEndTime) {
        toast.error(
          "Thời gian bắt đầu ca sáng phải nhỏ hơn thời gian kết thúc ca sáng",
        );
        return;
      }

      if (afternoonStartTime >= afternoonEndTime) {
        toast.error(
          "Thời gian bắt đầu ca chiều phải nhỏ hơn thời gian kết thúc ca chiều",
        );
        return;
      }

      onSubmit(formData);
    } catch (error: any) {
      console.error("Error submitting working hours:", error);
      toast.error("Lỗi khi cập nhật giờ làm việc");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Cập nhật giờ làm việc
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Morning Shift */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="morning-shift"
            >
              Ca sáng
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Bắt đầu"
                  type="time"
                  value={formData.morningStart}
                  onChange={(e) =>
                    handleInputChange("morningStart", e.target.value)
                  }
                  placeholder="08:00"
                />
              </div>
              <div>
                <Input
                  label="Kết thúc"
                  type="time"
                  value={formData.morningEnd}
                  onChange={(e) =>
                    handleInputChange("morningEnd", e.target.value)
                  }
                  placeholder="12:00"
                />
              </div>
            </div>
          </div>

          {/* Afternoon Shift */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="afternoon-shift"
            >
              Ca chiều
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Bắt đầu"
                  type="time"
                  value={formData.afternoonStart}
                  onChange={(e) =>
                    handleInputChange("afternoonStart", e.target.value)
                  }
                  placeholder="14:00"
                />
              </div>
              <div>
                <Input
                  label="Kết thúc"
                  type="time"
                  value={formData.afternoonEnd}
                  onChange={(e) =>
                    handleInputChange("afternoonEnd", e.target.value)
                  }
                  placeholder="18:00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            disabled={isSubmitting}
            variant="bordered"
            onPress={onClose}
          >
            Hủy
          </Button>
          <Button
            color="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkingHoursModal;
import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Select, SelectItem, Textarea } from "@heroui/react";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

interface Room {
  id: number;
  roomNumber: string;
  roomName: string;
  floor: number;
  status: "available" | "occupied" | "maintenance";
  assignedDoctor: Doctor | null;
  capacity: number;
  equipment: string[];
}

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onSuccess?: () => void;
  doctors: Doctor[];
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  onSuccess,
  doctors,
}) => {
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomName: "",
    floor: "",
    assignedDoctorId: "",
    capacity: "",
    equipment: "",
    status: "available",
  });

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { key: "available", label: "Sẵn sàng" },
    { key: "occupied", label: "Đang sử dụng" },
    { key: "maintenance", label: "Bảo trì" },
  ];

  const floorOptions = [
    { key: "1", label: "Tầng 1" },
    { key: "2", label: "Tầng 2" },
    { key: "3", label: "Tầng 3" },
    { key: "4", label: "Tầng 4" },
    { key: "5", label: "Tầng 5" },
  ];

  // Load room data when modal opens
  useEffect(() => {
    if (isOpen && room) {
      setFormData({
        roomNumber: room.roomNumber,
        roomName: room.roomName,
        floor: room.floor.toString(),
        assignedDoctorId: room.assignedDoctor
          ? room.assignedDoctor.id.toString()
          : "",
        capacity: room.capacity.toString(),
        equipment: room.equipment.join(", "),
        status: room.status,
      });
      setShowValidation(false);
    }
  }, [isOpen, room]);

  // Validation states
  const isRoomNumberInvalid = showValidation && !formData.roomNumber.trim();
  const isRoomNameInvalid = showValidation && !formData.roomName.trim();
  const isFloorInvalid = showValidation && !formData.floor;
  const isCapacityInvalid =
    showValidation &&
    (!formData.capacity ||
      isNaN(Number(formData.capacity)) ||
      Number(formData.capacity) <= 0);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowValidation(true);

    // Check validation
    const hasErrors =
      !formData.roomNumber.trim() ||
      !formData.roomName.trim() ||
      !formData.floor ||
      !formData.capacity ||
      isNaN(Number(formData.capacity)) ||
      Number(formData.capacity) <= 0;

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API call
      const equipmentList = formData.equipment
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");

      const updateData = {
        id: room?.id,
        roomNumber: formData.roomNumber.trim(),
        roomName: formData.roomName.trim(),
        floor: Number(formData.floor),
        assignedDoctorId: formData.assignedDoctorId
          ? Number(formData.assignedDoctorId)
          : null,
        capacity: Number(formData.capacity),
        equipment: equipmentList,
        status: formData.status,
      };

      // TODO: Gửi request lên backend để cập nhật room
      // const response = await fetch(`/api/rooms/${room?.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updateData),
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Không thể cập nhật phòng');
      // }

      // Giả lập API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Updating room:", updateData);

      // Close modal and notify success
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating room:", error);
      alert("Có lỗi xảy ra khi cập nhật phòng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      roomNumber: "",
      roomName: "",
      floor: "",
      assignedDoctorId: "",
      capacity: "",
      equipment: "",
      status: "available",
    });
    setShowValidation(false);
    onClose();
  };

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        aria-label="Close modal"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClose();
          }
        }}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39BDCC]">
          <div className="flex items-center space-x-3">
            <img
              alt="Logo"
              className="h-8 w-auto object-contain"
              src="/Screenshot_2025-09-19_141436-removebg-preview.png"
            />
            <div>
              <h2 className="text-2xl font-bold">Chỉnh sửa phòng</h2>
              <p className="text-sm text-gray-600">
                {room.roomNumber} - {room.roomName}
              </p>
            </div>
          </div>
          <Button
            isIconOnly
            className="text-gray-500 hover:text-gray-700"
            variant="light"
            onPress={handleClose}
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6">
          <Form autoComplete="off" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                fullWidth
                autoComplete="off"
                errorMessage={
                  isRoomNumberInvalid ? "Vui lòng nhập số phòng" : ""
                }
                isInvalid={isRoomNumberInvalid}
                label="Số phòng *"
                placeholder="Ví dụ: 101, 102, 201..."
                type="text"
                value={formData.roomNumber}
                onValueChange={(value) => handleInputChange("roomNumber", value)}
                variant="bordered"
              />

              <Input
                fullWidth
                autoComplete="off"
                errorMessage={isRoomNameInvalid ? "Vui lòng nhập tên phòng" : ""}
                isInvalid={isRoomNameInvalid}
                label="Tên phòng *"
                placeholder="Ví dụ: Phòng khám tổng quát 1"
                type="text"
                value={formData.roomName}
                onValueChange={(value) => handleInputChange("roomName", value)}
                variant="bordered"
              />

              <Select
                fullWidth
                errorMessage={isFloorInvalid ? "Vui lòng chọn tầng" : ""}
                isInvalid={isFloorInvalid}
                label="Tầng *"
                placeholder="Chọn tầng"
                selectedKeys={formData.floor ? [formData.floor] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("floor", selectedKey);
                }}
                variant="bordered"
              >
                {floorOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

              <Input
                fullWidth
                autoComplete="off"
                errorMessage={
                  isCapacityInvalid
                    ? "Vui lòng nhập sức chứa hợp lệ (lớn hơn 0)"
                    : ""
                }
                isInvalid={isCapacityInvalid}
                label="Sức chứa *"
                placeholder="Số người"
                type="number"
                value={formData.capacity}
                onValueChange={(value) => handleInputChange("capacity", value)}
                variant="bordered"
                endContent={<span className="text-gray-500 text-sm">người</span>}
              />

              <Select
                fullWidth
                label="Phân công bác sĩ"
                placeholder="Chọn bác sĩ (tùy chọn)"
                selectedKeys={
                  formData.assignedDoctorId ? [formData.assignedDoctorId] : []
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("assignedDoctorId", selectedKey);
                }}
                variant="bordered"
              >
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id.toString()} textValue={doctor.name}>
                    <div>
                      <div className="font-medium">{doctor.name}</div>
                      <div className="text-xs text-gray-500">
                        {doctor.specialty}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              <Select
                fullWidth
                label="Trạng thái"
                placeholder="Chọn trạng thái"
                selectedKeys={formData.status ? [formData.status] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("status", selectedKey);
                }}
                variant="bordered"
              >
                {statusOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

              <div className="md:col-span-2">
                <Textarea
                  fullWidth
                  autoComplete="off"
                  label="Thiết bị"
                  placeholder="Nhập danh sách thiết bị, cách nhau bởi dấu phẩy. Ví dụ: Ghế nha khoa, Máy X-quang, Đèn chiếu"
                  value={formData.equipment}
                  onValueChange={(value) => handleInputChange("equipment", value)}
                  variant="bordered"
                  minRows={3}
                  description="Các thiết bị cách nhau bởi dấu phẩy"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="bordered"
                onPress={handleClose}
                isDisabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                className="bg-[#39BDCC] text-white hover:bg-[#2ca6b5]"
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
                type="submit"
                variant="solid"
              >
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật phòng"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditRoomModal;


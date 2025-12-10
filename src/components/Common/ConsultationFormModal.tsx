import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from "@heroui/react";
import toast from "react-hot-toast";
import { consultationInfoApi } from "@/api";

interface ConsultationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultationFormModal: React.FC<ConsultationFormModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setPhone("");
      setEmail("");
      setShowValidation(false);
    }
  }, [isOpen]);

  const isNameInvalid = showValidation && !name.trim();
  const isPhoneInvalid =
    showValidation && (!/^[0-9]{10,11}$/.test(phone) || !phone.startsWith("0"));
  const isEmailInvalid =
    showValidation &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async () => {
    setShowValidation(true);
    if (isNameInvalid || isPhoneInvalid || isEmailInvalid) return;

    try {
      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const normalizeText = (text: string): string => {
        return text.trim().replace(/\s+/g, ' ');
      };

      setSubmitting(true);
      const res = await consultationInfoApi.create({
        name: normalizeText(name),
        phone: phone.trim(),
        email: email.trim(),
      });
      if ((res as any).success) {
        toast.success(res.message || "Gửi thông tin tư vấn thành công");
        onClose();
      } else {
        toast.error(res.message || "Không thể gửi thông tin tư vấn");
      }
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi gửi thông tin tư vấn");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="text-xl font-bold">Để lại thông tin tư vấn</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label={<>Họ và tên <span className="text-red-500">*</span></>}
                  placeholder="Nhập họ và tên"
                  value={name}
                  onValueChange={setName}
                  isInvalid={isNameInvalid}
                  errorMessage={isNameInvalid ? "Vui lòng nhập họ và tên" : ""}
                  variant="bordered"
                />
                <Input
                  label={<>Số điện thoại <span className="text-red-500">*</span></>}
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onValueChange={(v) => setPhone(v.replace(/[^0-9]/g, ""))}
                  isInvalid={isPhoneInvalid}
                  errorMessage={isPhoneInvalid ? "SĐT phải bắt đầu bằng 0 và có 10-11 số" : ""}
                  variant="bordered"
                  maxLength={11}
                />
                <Input
                  label={<>Email <span className="text-red-500">*</span></>}
                  placeholder="Nhập email"
                  value={email}
                  onValueChange={setEmail}
                  isInvalid={isEmailInvalid}
                  errorMessage={isEmailInvalid ? "Email không hợp lệ" : ""}
                  variant="bordered"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>Hủy</Button>
              <Button className="bg-[#39BDCC] text-white" onPress={handleSubmit} isLoading={submitting}>
                Gửi thông tin
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ConsultationFormModal;



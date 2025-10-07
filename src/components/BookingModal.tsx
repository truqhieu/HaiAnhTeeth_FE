import React from "react";
import { XMarkIcon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form, Textarea } from "@heroui/react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = { name, email, message };

    // TODO: Gửi data lên server
    // eslint-disable-next-line no-console
    console.log("Đặt lịch khám:", data);

    // Reset form
    setName("");
    setEmail("");
    setMessage("");

    onClose();
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
          if (e.key === "Enter" || e.key === " ") {
            onClose();
          }
        }}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39BDCC]">
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="w-6 h-6 text-[#39BDCC]" />
            <h2 className="text-2xl font-bold">Đặt lịch khám</h2>
          </div>
          <Button
            isIconOnly
            className="text-gray-500 hover:text-gray-700"
            variant="light"
            onPress={onClose}
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6">
          <Form className="space-y-4" onSubmit={onSubmit}>
            <Input
              fullWidth
              isRequired
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={name}
              onValueChange={setName}
            />

            <Input
              fullWidth
              isRequired
              label="Email"
              placeholder="nguyenvana@example.com"
              type="email"
              value={email}
              onValueChange={setEmail}
            />

            <Textarea
              fullWidth
              label="Nội dung"
              placeholder="Triệu chứng hoặc yêu cầu của bạn..."
              rows={4}
              value={message}
              onValueChange={setMessage}
            />

            <Button
              className="w-full flex items-center justify-center text-white bg-[#39BDCC] hover:bg-[#2ca6b5]"
              type="submit"
              variant="solid"
            >
              Xác nhận đặt lịch
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

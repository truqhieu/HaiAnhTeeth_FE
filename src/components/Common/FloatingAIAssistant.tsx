import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";

// Beautiful AI Chatbot Icon - Robot với gradient đẹp
const AIChatbotIcon: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 64,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
        <stop offset="100%" stopColor="#6366F1" stopOpacity="1" />
      </linearGradient>
    </defs>
    
    {/* Robot Head - hình chữ nhật bo tròn như TV */}
    <rect
      x="16"
      y="20"
      width="32"
      height="28"
      rx="6"
      ry="6"
      fill="url(#robotGradient)"
      stroke="#4F46E5"
      strokeWidth="2"
    />

    {/* Antenna trên đầu */}
    <line x1="32" y1="20" x2="32" y2="12" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="32" cy="10" r="2.5" fill="#6366F1" />

    {/* Eyes - mắt xanh cyan */}
    <ellipse cx="24" cy="32" rx="4" ry="3.5" fill="#39BDCC" />
    <circle cx="24" cy="32" r="2" fill="white" />
    <ellipse cx="40" cy="32" rx="4" ry="3.5" fill="#39BDCC" />
    <circle cx="40" cy="32" r="2" fill="white" />

    {/* Mouth - speaker với dots */}
    <rect x="24" y="42" width="16" height="4" rx="2" fill="#39BDCC" />
    <circle cx="26.5" cy="44" r="1" fill="white" />
    <circle cx="32" cy="44" r="1" fill="white" />
    <circle cx="37.5" cy="44" r="1" fill="white" />
  </svg>
);

const FloatingAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleTryNow = () => {
    setIsOpen(false);
    navigate("/patient/ai-booking");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-6 right-6 z-50 w-20 h-20 flex items-center justify-center group"
        aria-label="AI Booking Assistant"
      >
        {/* Viền tròn với pulse animation - tạo cảm giác năng động */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 opacity-20 animate-ping"></span>
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-600/30 animate-pulse"></span>
        
        {/* Viền tròn cố định - giúp dễ nhận diện */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/80 to-indigo-600/80 border-2 border-purple-400/50 shadow-lg"></span>
        
        {/* Icon với floating animation */}
        <div className="relative ai-float-animation">
          <AIChatbotIcon 
            size={64} 
            className="drop-shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ai-glow-effect" 
          />
        </div>
      </button>

      {/* Introduction Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={handleCloseModal}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-white",
          header: "border-b border-gray-200",
          body: "py-6",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <AIChatbotIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Đặt Lịch Thông Minh</h2>
                    <p className="text-sm text-gray-500 font-normal mt-1">
                      Đặt lịch khám chỉ bằng một câu nói
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-6">
                  {/* Giới thiệu chức năng */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      🚀 Chức năng mới từ AI
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Bạn có thể đặt lịch khám chỉ bằng cách mô tả yêu cầu của mình bằng tiếng Việt tự nhiên. 
                      AI sẽ tự động hiểu và tạo lịch hẹn cho bạn một cách nhanh chóng và chính xác.
                    </p>
                  </div>

                  {/* Bỏ ví dụ sử dụng theo yêu cầu */}

                  {/* Lợi ích */}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-3">
                      ✨ Tại sao nên dùng?
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-3">
                        <span className="text-purple-500 mt-1">✓</span>
                        <span className="text-gray-700">Nhanh chóng - Chỉ cần một câu nói</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-500 mt-1">✓</span>
                        <span className="text-gray-700">Tiện lợi - Không cần điền form phức tạp</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-500 mt-1">✓</span>
                        <span className="text-gray-700">Thông minh - AI tự động hiểu yêu cầu của bạn</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-purple-500 mt-1">✓</span>
                        <span className="text-gray-700">Chính xác - Tự động tìm slot phù hợp</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-between border-t border-gray-200 pt-4">
                <Button variant="light" onPress={onClose}>
                  Để sau
                </Button>
                <Button
                  color="primary"
                  onPress={handleTryNow}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold"
                >
                  Thử ngay
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default FloatingAIAssistant;


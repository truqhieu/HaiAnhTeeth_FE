import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentApi } from "@/api/appointment";
import { Button, Card, CardBody, CardHeader, Textarea, Spinner } from "@heroui/react";
import toast from "react-hot-toast";

const AIBooking: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "bot" | "user"; text: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  // 🆕 Lưu conversation history để gửi cho OpenAI API
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [conversationContext, setConversationContext] = useState<any>(null);
  // ⭐ NEW: Reservation countdown
  const [reservationExpiresAt, setReservationExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  // ⭐ NEW: Track if this is a new conversation
  const [isNewConversation, setIsNewConversation] = useState<boolean>(true);

  useEffect(() => {
    setMessages([
      {
        role: "bot",
        text:
          "Xin chào 👋 Mình là trợ lý AI đặt lịch. Bạn chỉ cần mô tả nhu cầu của mình, mình sẽ giúp bạn đặt lịch khám một cách nhanh chóng và tiện lợi!\n\nVui lòng cung cấp ngày, giờ mong muốn, tên dịch vụ, tên bác sĩ để mình hỗ trợ bạn đặt lịch một cách tốt nhất nhé.",
      },
    ]);
    // Set isNewConversation to true when component mounts
    setIsNewConversation(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Vui lòng nhập yêu cầu đặt lịch");
      return;
    }
    try {
      setSubmitting(true);
      const userMessage = prompt.trim();
      
      // hiển thị tin nhắn người dùng
      setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
      setPrompt(""); // Clear input

      // 🆕 Gửi API với conversation history và isNewConversation flag
      const res = await appointmentApi.aiCreate(userMessage, "self", conversationHistory, conversationContext, isNewConversation);
      
      // 🆕 Handle new Function Calling response format
      // Cả success và needsMoreInfo đều có followUpQuestion (response từ AI)
      const botResponse = (res.data as any)?.followUpQuestion || res.message || "Xin lỗi, mình gặp lỗi khi xử lý yêu cầu của bạn.";
      
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: botResponse,
        },
      ]);
      
      // ⭐ CỰC KỲ QUAN TRỌNG: Update conversation history từ backend response
      // Backend có thể trả về conversationHistory trong res.data.conversationHistory hoặc res.data.parsedData.conversationHistory
      const newHistory = (res.data as any)?.conversationHistory || (res.data as any)?.parsedData?.conversationHistory;
      if (newHistory && Array.isArray(newHistory) && newHistory.length > 0) {
        // Backend đã trả về conversation history → dùng conversation history từ backend
        // eslint-disable-next-line no-console
        console.log('📝 [AI Booking FE] Updating conversation history from backend:', newHistory.length, 'messages');
        setConversationHistory(newHistory);
      } else {
        // ⭐ FALLBACK: Nếu backend không trả về conversation history, tự động append user message và bot response vào conversation history hiện tại
        // eslint-disable-next-line no-console
        console.log('⚠️ [AI Booking FE] Backend did not return conversation history, appending manually');
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: userMessage },
          { role: "assistant", content: botResponse }
        ]);
      }
      
      // ⭐ Reset isNewConversation after first message
      if (isNewConversation) {
        setIsNewConversation(false);
      }
      
      const bookingContext = (res.data as any)?.parsedData?.bookingContext;
      if (bookingContext) {
        setConversationContext(bookingContext);
      }
      
      // ⭐ NEW: Update reservation expiry time
      const expiresAt = (res.data as any)?.reservationExpiresAt;
      if (expiresAt) {
        setReservationExpiresAt(expiresAt);
      } else {
        setReservationExpiresAt(null);
      }
      
      // ⭐ NEW: Check for payment requirement at TOP LEVEL (not inside appointment)
      // Backend returns: { requirePayment: true, payment: { paymentId, QRurl, ... }, appointment: {...} }
      const requiresPayment = (res.data as any)?.requirePayment || false;
      const paymentInfo = (res.data as any)?.payment || null;
      
      // Nếu appointment được tạo thành công VÀ cần thanh toán
      if (res.success && (res.data as any)?.appointment && requiresPayment && paymentInfo) {
        // ⭐ Payment required - navigate to payment page
        const paymentId = paymentInfo.paymentId || paymentInfo._id;
        
        if (paymentId) {
          toast.success("Đặt lịch thành công! Đang chuyển đến trang thanh toán...");
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              text: "Mình đã tạo lịch tư vấn của bạn và chuyển đến trang thanh toán ngay bây giờ nhé!",
            },
          ]);
          setConversationContext(null);
          // ⭐ Delay navigation to allow message to be displayed
          setTimeout(() => {
            navigate(`/patient/payment/${paymentId}`);
          }, 5); // 5 seconds delay for better UX
          return;
        }
      }
      
      // Nếu appointment được tạo thành công NHƯNG KHÔNG cần thanh toán
      if (res.success && (res.data as any)?.appointment && !requiresPayment) {
        // Appointment created successfully without payment!
        toast.success("Đặt lịch thành công!");
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Mình đã tạo lịch khám thành công! Bạn có thể xem trong mục 'Lịch khám của tôi'.",
          },
        ]);
        setConversationContext(null);
        // ⭐ Delay navigation to allow message to be displayed
        setTimeout(() => {
          navigate("/patient/appointments");
        }, 5000); // 5 seconds delay for better UX
        return;
      }
      
      // ⭐ QUAN TRỌNG: Nếu success = true nhưng không có appointment (informational query, off-topic response)
      // Đây không phải là lỗi, chỉ cần tiếp tục conversation
      if (res.success && !(res.data as any)?.appointment) {
        // Informational query hoặc off-topic response - không phải lỗi
        return; // Continue conversation
      }
      
      // Continue conversation if needsMoreInfo
      if ((res.data as any)?.needsMoreInfo) {
        return; // Wait for user response
      }

      // ⭐ FIX: If success = false but we have a valid bot response (error message from AI)
      // Display it in chat and DON'T navigate or throw error
      if (!res.success && botResponse) {
        // Error message already displayed in chat (line 53-59)
        return; // Don't navigate, let user continue conversation
      }

      // ⭐ Only throw error if no valid response at all
      if (!res.success && !botResponse) {
        throw new Error(res.message || "Không thể tạo lịch tự động");
      }
    } catch (e: any) {
      console.error("❌ [AI Booking] Error details:", {
        message: e.message,
        stack: e.stack,
        error: e,
      });
      
      // Show detailed error message
      const errorMsg = e.message || "Không thể đặt lịch tự động";
      toast.error(errorMsg);
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `❌ Xin lỗi, mình gặp lỗi: ${errorMsg}. Bạn vui lòng thử lại hoặc liên hệ hỗ trợ nhé!`,
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  }, [prompt, navigate, conversationHistory, conversationContext]);

  // ⭐ NEW: Countdown timer effect
  useEffect(() => {
    if (!reservationExpiresAt) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(reservationExpiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        setReservationExpiresAt(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [reservationExpiresAt]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Nhấn Enter (không có Shift) để gửi
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Ngăn xuống dòng
      handleSubmit();
    }
  }, [handleSubmit]);

  // ⭐ NEW: Handle new conversation button
  const handleNewConversation = useCallback(() => {
    setIsNewConversation(true);
    setConversationHistory([]);
    setConversationContext(null);
    setReservationExpiresAt(null);
    setMessages([
      {
        role: "bot",
        text:
          "Xin chào 👋 Mình là trợ lý AI đặt lịch. Bạn chỉ cần mô tả nhu cầu của mình, mình sẽ giúp bạn đặt lịch khám một cách nhanh chóng và tiện lợi!\n\nVui lòng cung cấp ngày, giờ mong muốn, tên dịch vụ, tên bác sĩ để mình hỗ trợ bạn đặt lịch một cách tốt nhất nhé.",
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-white shadow-lg border border-gray-200 h-[70vh] flex flex-col">
          <CardHeader className="pb-0 pt-6 px-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Trợ lý AI – Đặt lịch</h1>
            <Button 
              size="sm" 
              color="default" 
              variant="flat"
              onPress={handleNewConversation}
              className="text-sm"
            >
              🔄 Cuộc hội thoại mới
            </Button>
          </CardHeader>
          <CardBody className="px-6 pb-0 flex-1 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  } px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </CardBody>
          {/* ⭐ NEW: Reservation countdown display */}
          {countdown > 0 && (
            <div className="px-6 py-2 bg-yellow-50 border-t border-yellow-200">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-yellow-800">⏱️ Đã giữ chỗ cho bạn:</span>
                <span className="font-bold text-yellow-900">{countdown}s</span>
                <span className="text-yellow-700">còn lại</span>
              </div>
            </div>
          )}
          <div className="px-6 pb-6 pt-3 border-t border-gray-200">
            <div className="flex items-end gap-3">
              <Textarea
                placeholder="Nhập yêu cầu của bạn... (Enter để gửi, Shift+Enter để xuống dòng)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                minRows={1}
                maxRows={5}
                variant="bordered"
              />
              <Button color="primary" onPress={handleSubmit} isDisabled={submitting || !prompt.trim()}>
                {submitting ? <Spinner size="sm" color="white" /> : "Gửi"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIBooking;



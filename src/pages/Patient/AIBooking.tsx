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

  useEffect(() => {
    setMessages([
      {
        role: "bot",
        text:
          "Xin chào 👋 Mình là trợ lý AI đặt lịch. Bạn chỉ cần mô tả nhu cầu của mình, mình sẽ giúp bạn đặt lịch khám một cách nhanh chóng và tiện lợi!",
      },
    ]);
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

      // 🆕 Gửi API với conversation history
      const res = await appointmentApi.aiCreate(userMessage, "self", conversationHistory);
      
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
      
      // Update conversation history từ backend response (AI đã tự manage history)
      const newHistory = (res.data as any)?.parsedData?.conversationHistory;
      if (newHistory && Array.isArray(newHistory)) {
        setConversationHistory(newHistory);
      }
      
      // Nếu appointment được tạo thành công, có thể navigate hoặc hiển thị thông báo
      if (res.success && (res.data as any)?.appointment) {
        // Appointment created successfully!
        return;
      }
      
      // Continue conversation if needsMoreInfo
      if ((res.data as any)?.needsMoreInfo) {
        return; // Wait for user response
      }

      // Handle other errors
      if (!res.success || !res.data) {
        throw new Error(res.message || "Không thể tạo lịch tự động");
      }

      // Success - appointment created
      toast.success("Đặt lịch thành công!");

      const appointment: any = res.data.appointment;
      // Thử lấy paymentId từ nhiều cấu trúc khác nhau để an toàn
      const paymentObj = appointment?.paymentId || appointment?.payment || null;
      const paymentId: string | null = (paymentObj && (paymentObj._id || paymentObj.paymentId)) ? (paymentObj._id || paymentObj.paymentId) : (typeof paymentObj === 'string' ? paymentObj : null);
      const paymentStatus: string | null = paymentObj?.status || null;

      if (paymentId && (!paymentStatus || paymentStatus === "Pending")) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Mình đã tạo lịch tư vấn của bạn và chuyển đến trang thanh toán ngay bây giờ nhé!",
          },
        ]);
        navigate(`/patient/payment/${paymentId}`);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Mình đã tạo lịch khám thành công! Bạn có thể xem trong mục 'Lịch khám của tôi'.",
        },
      ]);
      navigate("/patient/appointments");
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
  }, [prompt, navigate, conversationHistory]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Nhấn Enter (không có Shift) để gửi
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Ngăn xuống dòng
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-white shadow-lg border border-gray-200 h-[70vh] flex flex-col">
          <CardHeader className="pb-0 pt-6 px-6">
            <h1 className="text-2xl font-bold text-gray-900">Trợ lý AI – Đặt lịch</h1>
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



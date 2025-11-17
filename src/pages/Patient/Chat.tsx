import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Input,
  Button,
  Card,
  CardBody,
  Avatar,
  Spinner,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import {
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { chatApi, appointmentApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";

// Interface cho tin nhắn từ backend
interface Message {
  _id: string;
  senderId: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  receiverId: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  content: string;
  createdAt: string;
  read?: boolean;
}

// Interface cho medical record
interface MedicalRecord {
  _id: string;
  patient: {
    fullName: string;
    email: string;
    phone?: string;
    age?: number;
    address?: string;
  };
  doctor: {
    fullName: string;
    email: string;
    specialization?: string;
  };
  medicalInfo: {
    diagnosis: string;
    conclusion: string;
    nurseNote: string;
  };
  prescription: Array<{
    medicineName: string;
    dosage: string;
    duration: string;
  }>;
  additionalServices?: Array<{
    _id: string;
    serviceName?: string;
    price?: number;
  }>;
  followUp: {
    date: string | null;
  };
  createdAt: string;
}

// Interface cho thông tin bác sĩ
interface DoctorInfo {
  _id: string;
  fullName: string;
  email: string;
  specialization?: string;
  avatar?: string;
}

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Lấy params từ URL
  const doctorIdFromUrl = searchParams.get("doctorId");
  const appointmentIdFromUrl = searchParams.get("appointmentId");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<any>(null);

  // Setup Socket.IO connection
  useEffect(() => {
    if (!user?._id) return;

    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:9999';
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 [Socket] Connected:', socket.id);
      socket.emit('join-user-room', user._id);
      console.log('📱 [Socket] Joined room for user:', user._id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 [Socket] Disconnected');
    });

    // Listen for new messages
    socket.on('new-message', (data: any) => {
      console.log('📨 [Socket] New message received:', data);
      
      const incomingMessage = data.message as any;
      const msgAppointmentId = typeof incomingMessage.appointmentId === 'object' 
        ? incomingMessage.appointmentId._id 
        : incomingMessage.appointmentId;
      
      // Update messages if it's for current appointment
      if (appointmentIdFromUrl && msgAppointmentId === appointmentIdFromUrl) {
        setMessages(prev => [...prev, incomingMessage]);
        toast.success(`Tin nhắn mới từ ${data.senderName}`, {
          icon: '💬',
          duration: 3000,
        });
      }
    });

    socket.on('connect_error', (error: any) => {
      console.error('❌ [Socket] Connection error:', error);
    });

    return () => {
      console.log('🔌 [Socket] Cleaning up...');
      socket.disconnect();
    };
  }, [user?._id, appointmentIdFromUrl]);

  useEffect(() => {
    if (!doctorIdFromUrl || !appointmentIdFromUrl) {
      toast.error("Vui lòng chọn ca khám để chat");
      navigate("/patient/appointments");
      return;
    }
    
    if (appointmentIdFromUrl) {
      fetchConversationData();
    }
  }, [doctorIdFromUrl, appointmentIdFromUrl]);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversationData = async () => {
    try {
      setLoading(true);
      
      console.log("🔍 [Chat] Fetching conversation data...");
      console.log("📋 [Chat] Params:", { doctorIdFromUrl, appointmentIdFromUrl });
      
      // 1. Lấy thông tin appointment
      const aptResponse = await appointmentApi.getMyAppointments({ 
        includePendingPayment: false 
      });
      
      if (aptResponse.success && aptResponse.data) {
        const appointment = aptResponse.data.find(
          (apt: any) => apt._id === appointmentIdFromUrl
        );
        
        if (!appointment) {
          toast.error("Không tìm thấy ca khám");
          navigate("/patient/appointments");
          return;
        }
        
        // Kiểm tra status
        if (!["Completed", "Finalized"].includes(appointment.status)) {
          toast.error("Chỉ có thể chat với ca khám đã hoàn thành");
          navigate("/patient/appointments");
          return;
        }
        
        setAppointmentInfo(appointment);
        
        // Lấy thông tin doctor
        const doctor = appointment.replacedDoctorUserId || appointment.doctorUserId;
        
        if (doctor) {
          setDoctorInfo({
            _id: doctor._id,
            fullName: doctor.fullName,
            email: doctor.email,
            specialization: doctor.specialization,
            avatar: doctor.avatar
          });
        }
      }
      
      // 2. Lấy tin nhắn và medical record từ API
      try {
        const msgResponse = await chatApi.getMessages(appointmentIdFromUrl!);
        
        console.log("📨 [Chat] Full response:", msgResponse);
        console.log("📨 [Chat] Response type:", typeof msgResponse);
        console.log("📨 [Chat] Response keys:", Object.keys(msgResponse));
        
        if (msgResponse.success) {
          // Check if data exists
          console.log("📋 [Chat] msgResponse.data:", msgResponse.data);
          console.log("📋 [Chat] data type:", typeof msgResponse.data);
          console.log("📋 [Chat] data keys:", msgResponse.data ? Object.keys(msgResponse.data) : 'null');
          
          const responseData = msgResponse.data;
          
          if (responseData) {
            // Lấy messages - try multiple paths
            const messagesData = responseData.messages || responseData.data?.messages || responseData;
            console.log("✅ [Chat] Messages data:", messagesData);
            console.log("✅ [Chat] Messages length:", Array.isArray(messagesData) ? messagesData.length : 'not array');
            setMessages(Array.isArray(messagesData) ? messagesData : []);
            
            // Lấy medical record - try multiple paths
            const medicalRecordData = responseData.medicalRecord || responseData.data?.medicalRecord;
            console.log("🏥 [Chat] Medical record check:", {
              hasMedicalRecord: !!medicalRecordData,
              medicalRecordKeys: medicalRecordData ? Object.keys(medicalRecordData) : 'none',
              fullData: medicalRecordData
            });
            
            if (medicalRecordData) {
              console.log("✅ [Chat] Setting medical record!");
              setMedicalRecord(medicalRecordData);
            } else {
              console.log("⚠️ [Chat] No medical record found");
              setMedicalRecord(null);
            }
          }
        }
      } catch (msgError: any) {
        console.log("ℹ️ [Chat] No messages yet:", msgError.message);
        setMessages([]);
      }
      
    } catch (error: any) {
      console.error("❌ Error fetching conversation:", error);
      toast.error("Không thể tải cuộc trò chuyện");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !doctorIdFromUrl || !appointmentIdFromUrl) return;
    
    try {
      setSendingMessage(true);
      
      const response = await chatApi.sendMessage({
        receiverId: doctorIdFromUrl,
        appointmentId: appointmentIdFromUrl,
        content: newMessage.trim()
      });
      
      if (response.success && response.data) {
        setMessages([...messages, response.data]);
        setNewMessage("");
        toast.success("Đã gửi tin nhắn");
      } else {
        toast.error(response.message || "Không thể gửi tin nhắn");
      }
      
    } catch (error: any) {
      console.error("❌ [Chat] Error sending message:", error);
      toast.error(error.message || "Không thể gửi tin nhắn");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (isYesterday) {
      return `Hôm qua ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!doctorInfo) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Card className="shadow-sm max-w-md">
          <CardBody className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              Không tìm thấy thông tin bác sĩ
            </p>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onPress={() => navigate("/patient/appointments")}
            >
              Quay lại danh sách ca khám
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate("/patient/appointments")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-[#39BDCC]" />
          <h1 className="text-3xl font-bold text-gray-800">Chat với bác sĩ</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Medical Record Panel - Left side */}
          {medicalRecord && (
            <Card className="shadow-lg border-0 lg:col-span-1 overflow-hidden h-[calc(100vh-200px)]">
              <CardBody className="p-0 flex flex-col h-full">
                <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white px-4 py-3 shadow-md min-h-[72px] flex items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <ClipboardDocumentListIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-lg">Hồ sơ khám bệnh</h3>
                  </div>
                </div>

                <div className="p-4 overflow-y-auto flex-1 bg-gradient-to-b from-gray-50 to-white">
                  <Accordion 
                    defaultExpandedKeys={["1", "2", "3"]}
                    selectionMode="multiple"
                    variant="splitted"
                    className="px-0"
                  >
                    {/* Thông tin cơ bản */}
                    <AccordionItem
                      key="1"
                      title={
                        <span className="font-semibold text-gray-800">
                          Thông tin bệnh nhân
                        </span>
                      }
                    >
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Họ tên:</span>
                          <p className="text-gray-900">{medicalRecord.patient.fullName}</p>
                        </div>
                        {medicalRecord.patient.age && (
                          <div>
                            <span className="font-medium text-gray-600">Tuổi:</span>
                            <p className="text-gray-900">{medicalRecord.patient.age}</p>
                          </div>
                        )}
                        {medicalRecord.patient.phone && (
                          <div>
                            <span className="font-medium text-gray-600">SĐT:</span>
                            <p className="text-gray-900">{medicalRecord.patient.phone}</p>
                          </div>
                        )}
                      </div>
                    </AccordionItem>

                    {/* Thông tin y tế */}
                    <AccordionItem
                      key="2"
                      title={
                        <span className="font-semibold text-gray-800">
                          Thông tin khám bệnh
                        </span>
                      }
                    >
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Chẩn đoán:</span>
                          <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                            {medicalRecord.medicalInfo.diagnosis}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Kết luận:</span>
                          <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                            {medicalRecord.medicalInfo.conclusion}
                          </p>
                        </div>
                      </div>
                    </AccordionItem>

                    {/* Đơn thuốc */}
                    <AccordionItem
                      key="3"
                      title={
                        <span className="font-semibold text-gray-800">
                          Đơn thuốc {medicalRecord.prescription && medicalRecord.prescription.length > 0 && `(${medicalRecord.prescription.length})`}
                        </span>
                      }
                    >
                      <div className="space-y-4 text-sm">
                        {medicalRecord.prescription && medicalRecord.prescription.length > 0 ? (
                          medicalRecord.prescription.map((prescription, index) => (
                            <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                              <div className="mb-2">
                                <span className="font-medium text-gray-600">Thuốc:</span>
                                <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                                  {prescription.medicineName || 'Chưa có'}
                                </p>
                              </div>
                              <div className="mb-2">
                                <span className="font-medium text-gray-600">Liều lượng:</span>
                                <p className="text-gray-900 mt-1">
                                  {prescription.dosage || 'Chưa có'}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Thời gian:</span>
                                <p className="text-gray-900 mt-1">
                                  {prescription.duration || 'Chưa có'}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-600">Chưa có đơn thuốc</div>
                        )}
                      </div>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Chat Container */}
          <Card className={`shadow-lg border-0 overflow-hidden h-[calc(100vh-200px)] ${medicalRecord ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <CardBody className="p-0 flex flex-col h-full">
              {/* Doctor Info Header */}
              <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white px-4 py-3 shadow-md min-h-[72px]">
                <div className="flex items-center gap-3 h-full">
                  <Avatar
                    name={doctorInfo.fullName}
                    src={doctorInfo.avatar}
                    className="ring-2 ring-white/50 shadow-lg"
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg truncate">BS. {doctorInfo.fullName}</p>
                    {doctorInfo.specialization && (
                      <p className="text-sm text-blue-50 flex items-center gap-1 truncate">
                        <span className="w-1.5 h-1.5 bg-blue-200 rounded-full flex-shrink-0"></span>
                        {doctorInfo.specialization}
                      </p>
                    )}
                  </div>
                  {appointmentInfo && (
                    <div className="text-xs text-blue-100">
                      <p>Ca khám: {new Date(appointmentInfo.timeslotId?.startTime).toLocaleDateString("vi-VN")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white"
              >
                {messages.length === 0 ? (
                  <div className="text-center mt-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <ChatBubbleLeftRightIcon className="w-10 h-10 text-[#39BDCC]" />
                    </div>
                    <p className="text-gray-600 font-medium">Chưa có tin nhắn nào</p>
                    <p className="text-sm text-gray-400 mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isCurrentUser = message.senderId._id === user?._id;
                      return (
                        <div
                          key={message._id || index}
                          className={`mb-4 flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] ${
                              isCurrentUser ? "order-2" : "order-1"
                            } animate-fade-in`}
                          >
                            {!isCurrentUser && (
                              <p className="text-xs text-gray-500 mb-1 px-1">
                                BS. {message.senderId.fullName}
                              </p>
                            )}
                            <div
                              className={`rounded-2xl p-3.5 shadow-sm transition-all duration-200 hover:shadow-md ${
                                isCurrentUser
                                  ? "bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white"
                                  : "bg-white text-gray-800 border border-gray-100"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                            <p
                              className={`text-xs text-gray-400 mt-1.5 px-1 ${
                                isCurrentUser ? "text-right" : "text-left"
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-100 shadow-lg">
                <div className="flex gap-3">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={sendingMessage}
                    classNames={{
                      input: "text-sm",
                      inputWrapper: "border-gray-200 hover:border-[#39BDCC] transition-colors shadow-sm"
                    }}
                  />
                  <Button
                    className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white shadow-md hover:shadow-lg transition-all duration-200"
                    isIconOnly
                    onClick={handleSendMessage}
                    isLoading={sendingMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;

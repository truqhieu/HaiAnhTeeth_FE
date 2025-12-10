import { useState, useEffect, useRef } from "react";
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
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { chatApi, type DoctorConversation } from "@/api/chat";
import { doctorApi, type AppointmentDetail } from "@/api/doctor";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";

// Patient interface for doctor's chat
interface PatientChat {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  lastAppointmentDate?: string;
  unreadCount: number;
  appointmentId: string;
}

// Message interface matching BE response
interface ChatMessage {
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
  appointmentId: {
    _id: string;
    appointmentDate: string;
    status: string;
  };
  content: string;
  status: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// Medical Record interface
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

const DoctorChat = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientChat[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [appointmentInfo, setAppointmentInfo] = useState<any>(null);
  const [showAppointmentInfo, setShowAppointmentInfo] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Setup Socket.IO connection
  useEffect(() => {
    if (!user?._id) return;

    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://haianhteethbe-production.up.railway.app';
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
      
      const incomingMessage = data.message as ChatMessage;
      const incomingAppointmentId = typeof incomingMessage.appointmentId === 'object'
        ? incomingMessage.appointmentId._id
        : incomingMessage.appointmentId;
      
      // Update messages if it's for current selected patient
      if (selectedPatient && incomingAppointmentId === selectedPatient.appointmentId) {
        setMessages(prev => [...prev, incomingMessage]);
        toast.success(`Tin nhắn mới từ ${data.senderName}`, {
          icon: '💬',
          duration: 3000,
        });
      }
      
      // Update unread count
      setPatients(prev => prev.map(p => 
        p.appointmentId === incomingAppointmentId
          ? { ...p, unreadCount: p.unreadCount + 1 }
          : p
      ));
    });

    socket.on('connect_error', (error: any) => {
      console.error('❌ [Socket] Connection error:', error);
    });

    return () => {
      console.log('🔌 [Socket] Cleaning up...');
      socket.disconnect();
    };
  }, [user?._id, selectedPatient?.appointmentId]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      setShowAppointmentInfo(true); // Reset về mở khi chọn patient mới
      fetchMessages(selectedPatient.appointmentId);
    }
  }, [selectedPatient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const scrollChatToCenter = () => {
    setTimeout(() => {
      chatContainerRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "center"
      });
    }, 100);
  };

  // Fetch conversations from API
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getConversations();
      
      if (response.success && response.data) {
        const conversations = response.data as unknown as DoctorConversation[];
        
        // Deduplicate patients - group by patientId, lấy appointment mới nhất
        const patientMap = new Map<string, PatientChat>();
        
        conversations.forEach((conv) => {
          const patientId = conv.patient._id;
          const existingPatient = patientMap.get(patientId);
          
          // Nếu chưa có hoặc appointment mới hơn, cập nhật
          if (!existingPatient || new Date(conv.appointmentDate) > new Date(existingPatient.lastAppointmentDate || '')) {
            patientMap.set(patientId, {
              _id: conv.patient._id,
              fullName: conv.patient.fullName,
              email: conv.patient.email,
              lastAppointmentDate: conv.appointmentDate,
              unreadCount: conv.unreadCount || 0,
              appointmentId: conv.appointmentId,
            });
          }
        });
        
        const patientsData = Array.from(patientMap.values());
        setPatients(patientsData);
      } else {
        toast.error("Không thể tải danh sách bệnh nhân");
      }
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast.error(error?.message || "Không thể tải danh sách bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages and medical record from API
  const fetchMessages = async (appointmentId: string) => {
    try {
      const response = await chatApi.getMessages(appointmentId);
      
      console.log("📨 [DoctorChat] Full response:", response);
      console.log("📨 [DoctorChat] Response keys:", Object.keys(response));
      
      if (response.success) {
        const responseData = response.data;
        console.log("📋 [DoctorChat] responseData:", responseData);
        console.log("📋 [DoctorChat] responseData keys:", responseData ? Object.keys(responseData) : 'null');
        
        if (responseData) {
          // Lấy messages
          const messagesData = responseData.messages || responseData.data?.messages || responseData;
          console.log("✅ [DoctorChat] Messages length:", Array.isArray(messagesData) ? messagesData.length : 'not array');
          setMessages(Array.isArray(messagesData) ? messagesData as ChatMessage[] : []);
          
          // Lấy medical record
          const medicalRecordData = responseData.medicalRecord || responseData.data?.medicalRecord;
          console.log("🏥 [DoctorChat] Medical record check:", {
            hasMedicalRecord: !!medicalRecordData,
            medicalRecordKeys: medicalRecordData ? Object.keys(medicalRecordData) : 'none'
          });
          
          if (medicalRecordData) {
            console.log("✅ [DoctorChat] Setting medical record!");
            setMedicalRecord(medicalRecordData);
          } else {
            console.log("⚠️ [DoctorChat] No medical record");
            setMedicalRecord(null);
          }

          // Lấy appointment info từ response
          const appointmentData = responseData.appointment || responseData.data?.appointment;
          
          // Fetch thêm thông tin chi tiết appointment nếu cần
          if (appointmentId) {
            try {
              const appointmentDetailRes = await doctorApi.getAppointmentDetail(appointmentId);
              if (appointmentDetailRes.success && appointmentDetailRes.data) {
                setAppointmentInfo(appointmentDetailRes.data);
              } else if (appointmentData) {
                // Fallback về data từ chat API nếu không lấy được detail
                setAppointmentInfo(appointmentData);
              } else {
                setAppointmentInfo(null);
              }
            } catch (err) {
              console.warn("Could not fetch appointment detail, using basic info:", err);
              if (appointmentData) {
                setAppointmentInfo(appointmentData);
              } else {
                setAppointmentInfo(null);
              }
            }
          } else if (appointmentData) {
            setAppointmentInfo(appointmentData);
          } else {
            setAppointmentInfo(null);
          }
          
          // Update unread count
          setPatients(prev => prev.map(p => 
            p.appointmentId === appointmentId ? { ...p, unreadCount: 0 } : p
          ));
        }
      } else {
        toast.error("Không thể tải tin nhắn");
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error(error?.message || "Không thể tải tin nhắn");
    }
  };

  // Send message via API
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient) return;

    try {
      setSendingMessage(true);

      // Chat: chỉ trim đầu/cuối để giữ nguyên formatting (line breaks, multiple spaces)
      // Không normalize như các form khác vì chat cần preserve user formatting
      const response = await chatApi.sendMessage({
        receiverId: selectedPatient._id,
        appointmentId: selectedPatient.appointmentId,
        content: newMessage.trim(),
      });

      if (response.success && response.data) {
        // Transform Message to ChatMessage format
        const chatMessage: ChatMessage = {
          ...response.data,
          appointmentId: typeof response.data.appointmentId === 'string' 
            ? { _id: response.data.appointmentId, appointmentDate: '', status: '' }
            : response.data.appointmentId as ChatMessage['appointmentId']
        };
        setMessages([...messages, chatMessage]);
        setNewMessage("");
        scrollToBottom();
      } else {
        toast.error(response.message || "Không thể gửi tin nhắn");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error?.message || "Không thể gửi tin nhắn");
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
    const d = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = d.toDateString() === today.toDateString();
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) {
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (isYesterday) {
      return `Hôm qua ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Filter patients based on search query
  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      patient.fullName.toLowerCase().includes(query) ||
      patient.email.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-[#39BDCC]" />
          <h1 className="text-3xl font-bold text-gray-800">
            Chat với bệnh nhân
          </h1>
        </div>

        {patients.length === 0 ? (
          <Card className="shadow-sm">
            <CardBody className="text-center py-12">
              <UserCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">
                Chưa có bệnh nhân nào
              </p>
              <p className="text-gray-500 text-sm">
                Danh sách bệnh nhân đã khám sẽ hiển thị ở đây.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-200px)]">
            {/* Danh sách bệnh nhân - Left side */}
            <Card className="shadow-lg border-0 lg:col-span-3 overflow-hidden">
              <CardBody className="p-0">
                <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white px-4 py-4 shadow-md">
                  <div className="flex items-center gap-3 h-10">
                    <UserCircleIcon className="w-6 h-6" />
                    <h3 className="font-semibold text-lg">
                      Bệnh nhân
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        {patients.length}
                      </span>
                    </h3>
                  </div>
                </div>
                
                {/* Search box */}
                <div className="p-3 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                  <Input
                    placeholder="Tìm bệnh nhân..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
                    size="sm"
                    classNames={{
                      input: "text-sm",
                      inputWrapper: "bg-white"
                    }}
                  />
                </div>

                <div className="overflow-y-auto h-full">
                  {filteredPatients.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Không tìm thấy bệnh nhân</p>
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                    <div
                      key={patient._id}
                      className={`p-4 cursor-pointer transition-all duration-200 relative ${
                        selectedPatient?._id === patient._id
                          ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-l-[#39BDCC] shadow-sm"
                          : "hover:bg-gray-50 hover:shadow-sm border-b border-gray-100"
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar
                            name={patient.fullName}
                            src={patient.avatar}
                            className="flex-shrink-0 ring-2 ring-white shadow-md"
                            size="md"
                          />
                          {patient.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full border-2 border-white flex items-center justify-center font-bold">
                              {patient.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate transition-colors ${
                            selectedPatient?._id === patient._id 
                              ? "text-[#39BDCC]" 
                              : "text-gray-800"
                          }`}>
                            {patient.fullName}
                          </p>
                          {patient.lastAppointmentDate && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Khám lần cuối:{" "}
                              {new Date(
                                patient.lastAppointmentDate
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )))}
                </div>
              </CardBody>
            </Card>

            {/* Chat & Medical Record - Right side */}
            {selectedPatient ? (
              <>
                {/* Khung chat */}
                <Card ref={chatContainerRef} className={`shadow-lg border-0 overflow-hidden ${medicalRecord ? 'lg:col-span-6' : 'lg:col-span-9'}`}>
                  <CardBody className="p-0 flex flex-col h-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white px-4 py-3 shadow-md min-h-[72px]">
                      <div className="flex items-center gap-3 h-full">
                        <Avatar
                          name={selectedPatient.fullName}
                          src={selectedPatient.avatar}
                          className="ring-2 ring-white/50 shadow-lg"
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg truncate">{selectedPatient.fullName}</p>
                          <p className="text-sm text-blue-50 flex items-center gap-1 truncate">
                            <span className="w-1.5 h-1.5 bg-blue-200 rounded-full flex-shrink-0"></span>
                            {selectedPatient.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
                      {/* Appointment Info Card */}
                      {appointmentInfo && (
                        <Card className="mb-4 border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-sm">
                          <CardBody className="p-0">
                            <div 
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100/50 transition-colors"
                              onClick={() => setShowAppointmentInfo(!showAppointmentInfo)}
                            >
                              <div className="flex items-center gap-2">
                                <ClipboardDocumentListIcon className="w-5 h-5 text-[#39BDCC]" />
                                <h3 className="font-semibold text-gray-800">Thông tin ca khám</h3>
                              </div>
                              <button
                                className="p-1 hover:bg-blue-200/50 rounded-full transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAppointmentInfo(!showAppointmentInfo);
                                }}
                              >
                                {showAppointmentInfo ? (
                                  <ChevronUpIcon className="w-5 h-5 text-[#39BDCC]" />
                                ) : (
                                  <ChevronDownIcon className="w-5 h-5 text-[#39BDCC]" />
                                )}
                              </button>
                            </div>
                            {showAppointmentInfo && (
                              <div className="px-4 pb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  {appointmentInfo.serviceName && (
                                    <div className="flex items-start gap-2">
                                      <SparklesIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-900">{appointmentInfo.serviceName}</span>
                                    </div>
                                  )}
                                  {(appointmentInfo.timeslotId?.startTime || appointmentInfo.appointmentDate) && (
                                    <div className="flex items-start gap-2">
                                      <CalendarIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-900">
                                        {new Date(appointmentInfo.timeslotId?.startTime || appointmentInfo.appointmentDate).toLocaleDateString("vi-VN", {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  {((appointmentInfo.timeslotId?.startTime && appointmentInfo.timeslotId?.endTime) || 
                                    (appointmentInfo.startTime && appointmentInfo.endTime)) && (
                                    <div className="flex items-start gap-2">
                                      <ClockIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-900">
                                        {new Date(appointmentInfo.timeslotId?.startTime || appointmentInfo.startTime).toLocaleTimeString("vi-VN", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}{" "}
                                        -{" "}
                                        {new Date(appointmentInfo.timeslotId?.endTime || appointmentInfo.endTime).toLocaleTimeString("vi-VN", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  )}
                                  {appointmentInfo.mode && (
                                    <div className="flex items-start gap-2">
                                      {appointmentInfo.mode === "Online" ? (
                                        <VideoCameraIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                      ) : (
                                        <BuildingOfficeIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                      )}
                                      <span className="text-gray-900">
                                        {appointmentInfo.mode === "Online" ? "Trực tuyến" : "Tại phòng khám"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      )}

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
                                      {message.senderId.fullName}
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
                                  <div className={`flex items-center gap-2 mt-1.5 px-1 ${
                                    isCurrentUser ? "justify-end" : "justify-start"
                                  }`}>
                                    <p className="text-xs text-gray-400">
                                      {formatTime(message.createdAt)}
                                    </p>
                                    {!message.read && !isCurrentUser && (
                                      <span className="inline-flex items-center gap-1 text-red-500 text-xs font-semibold">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                        Mới
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
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

                {/* Medical Record Panel - Right side */}
                {medicalRecord && (
                  <Card className="shadow-lg border-0 lg:col-span-3 overflow-hidden h-full">
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
                          {/* Thông tin bệnh nhân */}
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
              </>
            ) : (
              <Card className="shadow-lg border-0 lg:col-span-9 overflow-hidden">
                <CardBody className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-white">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <ChatBubbleLeftRightIcon className="w-12 h-12 text-[#39BDCC]" />
                    </div>
                    <p className="text-gray-600 font-medium text-lg mb-2">
                      Chọn một bệnh nhân để bắt đầu chat
                    </p>
                    <p className="text-gray-400 text-sm">
                      Danh sách bệnh nhân hiển thị bên trái
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorChat;

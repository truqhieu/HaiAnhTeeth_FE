import { useState, useEffect, useRef } from "react";
import {
  Input,
  Button,
  Card,
  CardBody,
  Avatar,
  Spinner,
} from "@heroui/react";
import {
  PaperAirplaneIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { type Message } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

// Patient interface for doctor's chat
interface Patient {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  lastAppointmentDate?: string;
  unreadCount?: number;
}

// Mock data - Danh sách bệnh nhân đã khám
const mockPatients: Patient[] = [
  {
    _id: "patient1",
    fullName: "Nguyễn Thị Lan",
    email: "nguyenlan@example.com",
    lastAppointmentDate: "2024-01-15",
    unreadCount: 2,
  },
  {
    _id: "patient2",
    fullName: "Trần Văn Hùng",
    email: "tranvanhung@example.com",
    lastAppointmentDate: "2024-01-10",
    unreadCount: 1,
  },
];

const mockMessagesData: Record<string, Message[]> = {
  patient1: [
    {
      _id: "m1",
      conversationId: "c1",
      senderId: "patient1",
      senderName: "Nguyễn Thị Lan",
      senderRole: "patient",
      content: "Chào bác sĩ, em muốn hỏi về kết quả khám răng lần trước ạ",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: true,
    },
    {
      _id: "m2",
      conversationId: "c1",
      senderId: "doctor1",
      senderName: "Bác sĩ",
      senderRole: "doctor",
      content: "Chào em, kết quả khám của em khá tốt. Răng của em đã ổn định sau khi trám.",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      isRead: true,
    },
    {
      _id: "m3",
      conversationId: "c1",
      senderId: "patient1",
      senderName: "Nguyễn Thị Lan",
      senderRole: "patient",
      content: "Dạ em cảm ơn bác sĩ. Em có cần tái khám không ạ?",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false,
    },
    {
      _id: "m4",
      conversationId: "c1",
      senderId: "patient1",
      senderName: "Nguyễn Thị Lan",
      senderRole: "patient",
      content: "Và em nên chú ý những gì trong thời gian này ạ?",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      isRead: false,
    },
  ],
  patient2: [
    {
      _id: "m5",
      conversationId: "c2",
      senderId: "patient2",
      senderName: "Trần Văn Hùng",
      senderRole: "patient",
      content: "Bác sĩ ơi, sau khi nhổ răng khôn, em bị sưng má có sao không ạ?",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      isRead: false,
    },
  ],
  
};

const DoctorChat = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchMessages(selectedPatient._id);
      scrollChatToCenter();
    }
  }, [selectedPatient]);

  const scrollChatToCenter = () => {
    setTimeout(() => {
      chatContainerRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "center"
      });
    }, 100);
  };

  // Mock function - lấy danh sách bệnh nhân đã khám
  const fetchPatients = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPatients(mockPatients);
    } catch (error: any) {
      console.error("Error fetching patients:", error);
      toast.error("Không thể tải danh sách bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  // Mock function - lấy tin nhắn với bệnh nhân
  const fetchMessages = async (patientId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setMessages(mockMessagesData[patientId] || []);
      
      // Đánh dấu đã đọc khi mở chat
      setPatients(prev => prev.map(p => 
        p._id === patientId ? { ...p, unreadCount: 0 } : p
      ));
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error("Không thể tải tin nhắn");
    }
  };

  // Mock function - gửi tin nhắn
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient) return;

    try {
      setSendingMessage(true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const newMsg: Message = {
        _id: `m${Date.now()}`,
        conversationId: `c${selectedPatient._id}`,
        senderId: user?._id || "doctor1",
        senderName: user?.fullName || "Bác sĩ",
        senderRole: "doctor",
        content: newMessage.trim(),
        timestamp: new Date(),
        isRead: false,
      };

      setMessages([...messages, newMsg]);
      setNewMessage("");
      toast.success("Đã gửi tin nhắn");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Không thể gửi tin nhắn");
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

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
            {/* Danh sách bệnh nhân */}
            <Card className="shadow-lg border-0 lg:col-span-1 overflow-hidden">
              <CardBody className="p-0">
                <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white px-4 py-4 shadow-md">
                  <div className="flex items-center gap-3 h-10">
                    <UserCircleIcon className="w-6 h-6" />
                    <h3 className="font-semibold text-lg">
                      Danh sách bệnh nhân 
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
                          {patient.unreadCount && patient.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
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

            {/* Khung chat */}
            <Card ref={chatContainerRef} className="shadow-lg border-0 lg:col-span-2 overflow-hidden">
              {selectedPatient ? (
                <CardBody className="p-0 flex flex-col h-full">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white px-4 py-3 flex items-center gap-3 shadow-md">
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

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
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
                          const isDoctor = message.senderRole === "doctor";
                          return (
                            <div
                              key={message._id || index}
                              className={`mb-4 flex ${
                                isDoctor ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[70%] ${
                                  isDoctor ? "order-2" : "order-1"
                                } animate-fade-in`}
                              >
                                <div
                                  className={`rounded-2xl p-3.5 shadow-sm transition-all duration-200 hover:shadow-md ${
                                    isDoctor
                                      ? "bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white"
                                      : "bg-white text-gray-800 border border-gray-100"
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {message.content}
                                  </p>
                                </div>
                                <div className={`flex items-center gap-2 mt-1.5 px-1 ${
                                  isDoctor ? "justify-end" : "justify-start"
                                }`}>
                                  <p className="text-xs text-gray-400">
                                    {formatTime(message.timestamp)}
                                  </p>
                                  {!message.isRead && !isDoctor && (
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
                        color="primary"
                        className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] shadow-md hover:shadow-lg transition-all duration-200"
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
              ) : (
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
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorChat;


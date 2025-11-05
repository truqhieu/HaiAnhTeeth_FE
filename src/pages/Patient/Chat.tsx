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
import { type Doctor, type Message } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

// Mock data - sẽ thay thế bằng API call sau
const mockDoctors: Doctor[] = [
  {
    _id: "1",
    fullName: "Nguyễn Văn An",
    email: "nguyenvanan@example.com",
    specialty: "Chuyên khoa Răng Hàm Mặt",
  },
  {
    _id: "2",
    fullName: "Trần Thị Bình",
    email: "tranthibinh@example.com",
    specialty: "Chuyên khoa Nha Chu",
  },
  {
    _id: "3",
    fullName: "Lê Hoàng Minh",
    email: "lehoangminh@example.com",
    specialty: "Chuyên khoa Implant",
  },
];

const mockMessagesData: Record<string, Message[]> = {
  "1": [
    {
      _id: "m1",
      conversationId: "c1",
      senderId: "patient1",
      senderName: "Bệnh nhân",
      senderRole: "patient",
      content: "Chào bác sĩ, em muốn hỏi về kết quả khám răng lần trước ạ",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: true,
    },
    {
      _id: "m2",
      conversationId: "c1",
      senderId: "1",
      senderName: "BS. Nguyễn Văn An",
      senderRole: "doctor",
      content: "Chào em, kết quả khám của em khá tốt. Răng của em đã ổn định sau khi trám.",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      isRead: true,
    },
    {
      _id: "m3",
      conversationId: "c1",
      senderId: "patient1",
      senderName: "Bệnh nhân",
      senderRole: "patient",
      content: "Dạ em cảm ơn bác sĩ. Em có cần tái khám không ạ?",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isRead: true,
    },
  ],
  "2": [
    {
      _id: "m4",
      conversationId: "c2",
      senderId: "2",
      senderName: "BS. Trần Thị Bình",
      senderRole: "doctor",
      content: "Chào em, bác sĩ đã xem kết quả của em rồi nhé.",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
    },
  ],
  "3": [],
};

const Chat = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchMessages(selectedDoctor._id);
      scrollChatToCenter();
    }
  }, [selectedDoctor]);

  const scrollChatToCenter = () => {
    setTimeout(() => {
      chatContainerRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "center"
      });
    }, 100);
  };

  // Mock function - sẽ thay thế bằng API call sau
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setDoctors(mockDoctors);
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
      toast.error("Không thể tải danh sách bác sĩ");
    } finally {
      setLoading(false);
    }
  };

  // Mock function - sẽ thay thế bằng API call sau
  const fetchMessages = async (doctorId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setMessages(mockMessagesData[doctorId] || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error("Không thể tải tin nhắn");
    }
  };

  // Mock function - sẽ thay thế bằng API call sau
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDoctor) return;

    try {
      setSendingMessage(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newMsg: Message = {
        _id: `m${Date.now()}`,
        conversationId: `c${selectedDoctor._id}`,
        senderId: user?._id || "patient1",
        senderName: user?.fullName || "Bệnh nhân",
        senderRole: "patient",
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

  // Filter doctors based on search query
  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      doctor.fullName.toLowerCase().includes(query) ||
      doctor.email.toLowerCase().includes(query) ||
      (doctor.specialty && doctor.specialty.toLowerCase().includes(query))
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
          <h1 className="text-3xl font-bold text-gray-800">Chat với bác sĩ</h1>
        </div>

        {doctors.length === 0 ? (
          <Card className="shadow-sm">
            <CardBody className="text-center py-12">
              <UserCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">
                Chưa có bác sĩ khả dụng để chat
              </p>
              <p className="text-gray-500 text-sm">
                Bạn chỉ có thể chat với các bác sĩ đã từng khám cho bạn trong các ca
                khám đã hoàn thành.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
            {/* Danh sách bác sĩ */}
            <Card className="shadow-lg border-0 lg:col-span-1 overflow-hidden">
              <CardBody className="p-0">
                <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white px-4 py-4 shadow-md">
                  <div className="flex items-center gap-3 h-10">
                    <UserCircleIcon className="w-6 h-6" />
                    <h3 className="font-semibold text-lg">Danh sách bác sĩ</h3>
                  </div>
                </div>
                
                {/* Search box */}
                <div className="p-3 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                  <Input
                    placeholder="Tìm bác sĩ..."
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
                  {filteredDoctors.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Không tìm thấy bác sĩ</p>
                    </div>
                  ) : (
                    filteredDoctors.map((doctor) => (
                    <div
                      key={doctor._id}
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        selectedDoctor?._id === doctor._id
                          ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-l-[#39BDCC] shadow-sm"
                          : "hover:bg-gray-50 hover:shadow-sm border-b border-gray-100"
                      }`}
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={doctor.fullName}
                          src={doctor.avatar}
                          className="flex-shrink-0 ring-2 ring-white shadow-md"
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate transition-colors ${
                            selectedDoctor?._id === doctor._id 
                              ? "text-[#39BDCC]" 
                              : "text-gray-800"
                          }`}>
                            BS. {doctor.fullName}
                          </p>
                          {doctor.specialty && (
                            <p className="text-sm text-gray-500 truncate mt-0.5">
                              {doctor.specialty}
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
              {selectedDoctor ? (
                <CardBody className="p-0 flex flex-col h-full">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white px-4 py-3 flex items-center gap-3 shadow-md">
                    <Avatar
                      name={selectedDoctor.fullName}
                      src={selectedDoctor.avatar}
                      className="ring-2 ring-white/50 shadow-lg"
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg truncate">BS. {selectedDoctor.fullName}</p>
                      {selectedDoctor.specialty && (
                        <p className="text-sm text-blue-50 flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 bg-blue-200 rounded-full flex-shrink-0"></span>
                          {selectedDoctor.specialty}
                        </p>
                      )}
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
                          const isCurrentUser = message.senderId === user?._id;
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
                                  {formatTime(message.timestamp)}
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
                      Chọn một bác sĩ để bắt đầu chat
                    </p>
                    <p className="text-gray-400 text-sm">
                      Danh sách bác sĩ hiển thị bên trái
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

export default Chat;


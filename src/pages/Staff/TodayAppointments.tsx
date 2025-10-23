import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
} from "@heroui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { appointmentApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

interface Appointment {
  id: string;
  status: string;
  patientName: string;
  doctorName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
}

const TodayAppointments = () => {
  const { isAuthenticated, user } = useAuth(); // ⭐ Lấy user để debug
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ⭐⭐⭐ DEBUG USER ROLE ⭐⭐⭐
  useEffect(() => {
    console.log("=== CURRENT USER INFO ===");
    console.log("User:", user);
    console.log("User role:", user?.role);
    console.log("User email:", user?.email);
    console.log("========================");
  }, [user]);

  const refetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appointmentApi.getAllAppointments();
      
      console.log('=== FRONTEND RECEIVED ===');
      console.log('Total appointments:', res.data?.length);
      
      if (res.success && res.data) {
        const today = new Date().toISOString().split("T")[0];

        // ⭐ MAP TRƯỚC, FILTER SAU - để giữ populated data
        const allMapped = res.data.map((apt: any) => {
          let patientName = 'N/A';
          
          if (apt.customerId && typeof apt.customerId === 'object' && apt.customerId.fullName) {
            patientName = apt.customerId.fullName;
          } else if (apt.patientUserId && typeof apt.patientUserId === 'object' && apt.patientUserId.fullName) {
            patientName = apt.patientUserId.fullName;
          }

          return {
            id: apt._id,
            status: apt.status,
            patientName: patientName,
            doctorName: apt.doctorUserId?.fullName || 'N/A',
            serviceName: apt.serviceId?.serviceName || 'N/A',
            startTime: apt.timeslotId?.startTime || '',
            endTime: apt.timeslotId?.endTime || '',
          };
        });

        // Filter appointments hôm nay
        const todayAppointments = allMapped.filter((apt) => {
          return apt.startTime && apt.startTime.startsWith(today);
        });

        console.log('Today appointments:', todayAppointments.length);
        
        setAppointments(todayAppointments);
      } else {
        setError(res.message || "Lỗi lấy danh sách ca khám");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Lỗi khi tải ca khám");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refetchAppointments();
    }
  }, [isAuthenticated]);

  const handleReview = async (appointmentId: string, action: 'approve' | 'cancel') => {
    try {
      setProcessingId(appointmentId);
      
      // ⭐ LOG USER INFO TRƯỚC KHI GỌI API
      console.log("=== BEFORE REVIEW API CALL ===");
      console.log("Current user:", user);
      console.log("Current user role:", user?.role);
      console.log("Appointment ID:", appointmentId);
      console.log("Action:", action);
      
      let cancelReason: string | undefined;
      if (action === 'cancel') {
        const reason = prompt("Vui lòng nhập lý do hủy:");
        if (!reason || reason.trim() === '') {
          setProcessingId(null);
          return;
        }
        cancelReason = reason.trim();
      }
      
      console.log("=== CALLING REVIEW API ===");
      console.log("appointmentId:", appointmentId);
      console.log("action:", action);
      console.log("cancelReason:", cancelReason);
      
      const res = await appointmentApi.reviewAppointment(appointmentId, action, cancelReason);
      
      console.log("Review response:", res);
      
      if (res.success) {
        alert(action === 'approve' 
          ? "✅ Đã duyệt ca khám thành công!" 
          : "✅ Đã hủy ca khám thành công!"
        );
        await refetchAppointments();
      } else {
        alert(`❌ ${res.message || "Thao tác thất bại"}`);
      }
    } catch (error: any) {
      console.error("=== REVIEW API ERROR ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      
      // Hiển thị lỗi chi tiết hơn
      if (error.message.includes("403") || error.message.toLowerCase().includes("quyền")) {
        alert(`❌ Bạn không có quyền thực hiện thao tác này!\n\nRole hiện tại: ${user?.role || 'Không xác định'}\n\nVui lòng liên hệ quản trị viên.`);
      } else {
        alert(`❌ ${error.message || "Thao tác thất bại, vui lòng thử lại."}`);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "Pending": return "Chờ duyệt";
      case "Approved": return "Đã xác nhận";
      case "CheckedIn": return "Đã nhận";
      case "Completed": return "Đã hoàn thành";
      case "Cancelled": return "Đã hủy";
      case "PendingPayment": return "Chờ thanh toán";
      default: return status;
    }
  };

  const getStatusClassName = (status: string): string => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Pending":
      case "PendingPayment": return "bg-yellow-100 text-yellow-800";
      case "Completed": return "bg-blue-100 text-blue-800";
      case "CheckedIn": return "bg-indigo-100 text-indigo-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = [
    { key: "time", label: "Giờ bắt đầu" },
    { key: "endTime", label: "Giờ kết thúc" },
    { key: "patient", label: "Bệnh nhân" },
    { key: "doctor", label: "Bác sĩ" },
    { key: "service", label: "Dịch vụ" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hành động" },
  ];

  if (!isAuthenticated) {
    return <p>Vui lòng đăng nhập để xem ca khám</p>;
  }

  if (loading) {
    return <Spinner label="Đang tải ca khám..." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Các ca khám hôm nay</h2>
        {/* ⭐ HIỂN THỊ ROLE HIỆN TẠI ĐỂ DEBUG */}
        {user && (
          <div className="text-sm text-gray-600">
            Role: <span className="font-semibold">{user.role}</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <Table aria-label="Bảng các ca khám hôm nay">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={appointments}
          emptyContent={"Không có ca khám nào hôm nay."}
        >
          {(appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>{formatTime(appointment.startTime)}</TableCell>
              <TableCell>{formatTime(appointment.endTime)}</TableCell>
              <TableCell>{appointment.patientName}</TableCell>
              <TableCell>{appointment.doctorName}</TableCell>
              <TableCell>{appointment.serviceName}</TableCell>
              <TableCell>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusClassName(appointment.status)
                  }`}
                >
                  {getStatusText(appointment.status)}
                </span>
              </TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button 
                      size="sm" 
                      variant="light" 
                      isIconOnly
                      isDisabled={processingId === appointment.id}
                    >
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Hành động">
                    {appointment.status === 'Pending' ? (
                      <>
                        <DropdownItem 
                          key="approve"
                          onPress={() => handleReview(appointment.id, 'approve')}
                        >
                          Duyệt
                        </DropdownItem>
                        <DropdownItem 
                          key="cancel"
                          onPress={() => handleReview(appointment.id, 'cancel')} 
                          className="text-danger" 
                          color="danger"
                        >
                          Hủy
                        </DropdownItem>
                      </>
                    ) : (
                      <DropdownItem 
                        key="no-action"
                        isDisabled
                      >
                        Không có hành động
                      </DropdownItem>
                    )}
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TodayAppointments;
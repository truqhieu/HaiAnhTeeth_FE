import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Spinner,
} from "@heroui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { appointmentApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

interface Appointment {
  id: string;
  status: string;
  type: string;
  mode: string;
  patientName: string;
  doctorName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  notes?: string;
  paymentStatus?: string;
  appointmentFor: string;
  customerName?: string;
}

const Appointments = () => {
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Fetch user appointments
  const refetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 [refetchAppointments] Fetching appointments...');
      
      const res = await appointmentApi.getMyAppointments();
      console.log('📡 Appointments API Response:', res);
      console.log('📡 Response type:', typeof res);
      console.log('📡 Response keys:', res ? Object.keys(res) : 'null');
      
      if (!res) {
        console.error('❌ Response is null or undefined');
        setError("Không nhận được dữ liệu từ server");
        setAppointments([]);
        return;
      }
      
      if (res.success === false) {
        console.error('❌ API returned success=false:', res.message);
        setError(res.message || "Lỗi lấy danh sách ca khám");
        setAppointments([]);
        return;
      }
      
      if (!res.data) {
        console.error('❌ Response has no data field');
        setError("Dữ liệu không hợp lệ");
        setAppointments([]);
        return;
      }

      if (!Array.isArray(res.data)) {
        console.error('❌ res.data is not an array:', res.data);
        setError("Dữ liệu không hợp lệ (không phải mảng)");
        setAppointments([]);
        return;
      }
      
      console.log('✅ Response success, data is array');
      console.log('📊 Response data count:', res.data.length);
      
      if (res.data.length === 0) {
        console.log('ℹ️ No appointments found');
        setAppointments([]);
        return;
      }
      
      // Map backend response to frontend interface
      const mappedAppointments: Appointment[] = res.data.map((apt: any, index: number) => {
        console.log(`🔄 Mapping appointment ${index}:`, {
          backend_id: apt._id,
          backend_status: apt.status,
          backend_startTime: apt.timeslotId?.startTime,
          backend_doctorName: apt.doctorUserId?.fullName,
          backend_serviceName: apt.serviceId?.serviceName
        });

        return {
          id: apt._id,
          status: apt.status,
          type: apt.type,
          mode: apt.mode,
          patientName: apt.patientUserId?.fullName || '',
          doctorName: apt.doctorUserId?.fullName || '',
          serviceName: apt.serviceId?.serviceName || '',
          startTime: apt.timeslotId?.startTime || '',
          endTime: apt.timeslotId?.endTime || '',
          notes: apt.notes || '',
          paymentStatus: apt.paymentId?.status || '',
          appointmentFor: apt.appointmentFor || 'self',
          customerName: apt.customerId?.fullName || '',
        };
      });
      
      console.log('✅ Mapped Appointments:', mappedAppointments);
      console.log('✅ Total appointments mapped:', mappedAppointments.length);
      setAppointments(mappedAppointments);
      setError(null);
      
    } catch (err: any) {
      console.error("❌ Error fetching appointments:", err);
      console.error("❌ Error message:", err.message);
      console.error("❌ Error stack:", err.stack);
      setError(err.message || "Lỗi khi tải ca khám");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔍 [useEffect] isAuthenticated changed:', isAuthenticated);
    if (!isAuthenticated) {
      console.log('⚠️ Not authenticated, skipping fetch');
      setAppointments([]);
      return;
    }
    
    console.log('✅ Authenticated, fetching appointments');
    refetchAppointments();
  }, [isAuthenticated]);

  const getStatusText = (status: string): string => {
    switch (status) {
      case "Pending":
        return "Chờ duyệt";
      case "Approved":
        return "Đã xác nhận";
      case "CheckedIn":
        return "Đã nhận";
      case "Completed":
        return "Đã hoàn thành";
      case "Cancelled":
        return "Đã hủy";
      case "PendingPayment":
        return "Chờ thanh toán";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentAppointments = appointments.filter((apt) => {
    // Kiểm tra xem startTime có hợp lệ không
    if (!apt.startTime) {
      console.warn('⚠️ Appointment không có startTime:', apt);
      // Nếu không có startTime thì KHÔNG hiển thị
      return false;
    }
    
    try {
      const aptDate = new Date(apt.startTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Đặt về đầu ngày hôm nay
      
      console.log(`🔍 Filter check for apt ${apt.id.substring(0, 8)}...:`);
      console.log(`   - startTime: ${apt.startTime}`);
      console.log(`   - aptDate: ${aptDate.toISOString()}`);
      console.log(`   - today: ${today.toISOString()}`);
      console.log(`   - aptDate >= today: ${aptDate >= today}`);
      console.log(`   - activeTab: ${activeTab}`);
      
      // Nếu startTime invalid, không hiển thị
      if (isNaN(aptDate.getTime())) {
        console.warn('⚠️ StartTime invalid:', apt.startTime);
        return false;
      }
      
      // Hiển thị dựa vào tab
      if (activeTab === "upcoming") {
        // Tab "Sắp tới": hiển thị appointments trong tương lai (từ hôm nay trở đi)
        const result = aptDate >= today;
        console.log(`   - Result for 'upcoming': ${result}`);
        return result;
      } else if (activeTab === "completed") {
        // Tab "Đã khám": hiển thị appointments trong quá khứ (trước hôm nay)
        const result = aptDate < today;
        console.log(`   - Result for 'completed': ${result}`);
        return result;
      }
      
      // Mặc định hiển thị tab "upcoming"
      return activeTab === "upcoming";
      
    } catch (err) {
      console.error('❌ Lỗi filter appointments:', err, apt);
      return false; // Nếu lỗi thì không hiển thị
    }
  });

  console.log('📊 Final filtered appointments for tab "' + activeTab + '":', currentAppointments.length, 'out of', appointments.length);
  if (currentAppointments.length > 0) {
    console.log('✅ Showing appointments:', currentAppointments.map(a => a.id.substring(0, 8)));
  }

  const columns = [
    { key: "date", label: "Ngày, tháng, năm" },
    { key: "time", label: "Giờ bắt đầu" },
    { key: "endTime", label: "Giờ kết thúc" },
    { key: "doctor", label: "Bác sĩ" },
    { key: "service", label: "Dịch vụ" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hoạt động" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Vui lòng đăng nhập để xem ca khám</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Spinner label="Đang tải ca khám..." color="primary" />
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Ca khám của tôi</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "upcoming"
                  ? "text-[#39BDCC] border-b-2 border-[#39BDCC]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => {
                setActiveTab("upcoming");
              }}
            >
              Sắp tới
            </button>
            <button
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "completed"
                  ? "text-[#39BDCC] border-b-2 border-[#39BDCC]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => {
                setActiveTab("completed");
              }}
            >
              Đã khám
            </button>
          </div>

          {/* Table */}
          <Table className="w-full">
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={currentAppointments}
              emptyContent="Không có ca khám"
            >
              {(appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{formatDate(appointment.startTime)}</TableCell>
                  <TableCell>{formatTime(appointment.startTime)}</TableCell>
                  <TableCell>{formatTime(appointment.endTime)}</TableCell>
                  <TableCell>{appointment.doctorName}</TableCell>
                  <TableCell>{appointment.serviceName}</TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        appointment.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : appointment.status === "PendingPayment"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getStatusText(appointment.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                        </button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Action menu">
                        <DropdownItem key="view">Xem chi tiết</DropdownItem>
                        {appointment.status === "Pending" || appointment.status === "PendingPayment" ? (
                          <>
                            <DropdownItem key="edit">
                              Thay đổi lịch
                            </DropdownItem>
                            <DropdownItem key="request">
                              Yêu cầu thay đổi
                            </DropdownItem>
                          </>
                        ) : null}
                        {appointment.status === "Completed" ? (
                          <DropdownItem key="history">Xem hóa đơn</DropdownItem>
                        ) : null}
                        {appointment.status === "Cancelled" ? (
                          <DropdownItem key="cancel">Xác nhận</DropdownItem>
                        ) : null}
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Results info */}
          {currentAppointments.length > 0 && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Hiển thị 1 đến {currentAppointments.length} trong{" "}
                {currentAppointments.length} kết quả
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;

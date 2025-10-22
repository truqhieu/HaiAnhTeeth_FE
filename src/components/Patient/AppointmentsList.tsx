import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Button, Spinner, Badge } from "@heroui/react";
import { CalendarIcon, ClockIcon, UserIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { appointmentApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

interface Appointment {
  _id: string;
  status: string;
  type: string;
  mode: string;
  patientUserId?: { fullName: string };
  doctorUserId?: { fullName: string };
  serviceId?: { serviceName: string };
  timeslotId?: { startTime: string; endTime: string };
  customerId?: { fullName: string };
  appointmentFor: string;
  notes?: string;
}

export const AppointmentsList = () => {
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        
        // Lấy danh sách ca khám đã hoàn tất đặt lịch
        // Bao gồm:
        //   - Đặt lịch khám (Examination) không cần thanh toán → Status = Pending ngay
        //   - Tư vấn online (Consultation) đã thanh toán xong → Status chuyển từ PendingPayment sang Pending
        // Không bao gồm:
        //   - Các ca tư vấn đang chờ thanh toán (PendingPayment)
        const res = await appointmentApi.getMyAppointments();
        
        if (res.success && Array.isArray(res.data)) {
          setAppointments(res.data);
          setError(null);
        } else {
          setError("Không thể tải danh sách ca khám");
        }
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải ca khám");
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [isAuthenticated]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
      case "PendingPayment":
        return "warning";
      case "Approved":
      case "CheckedIn":
        return "success";
      case "Completed":
        return "secondary";
      case "Cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      "PendingPayment": "Chờ thanh toán",
      "Pending": "Chờ duyệt",
      "Approved": "Đã xác nhận",
      "CheckedIn": "Đã nhận",
      "Completed": "Đã hoàn thành",
      "Cancelled": "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("vi-VN");
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner label="Đang tải ca khám..." color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <XCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <Button
          color="danger"
          variant="flat"
          size="sm"
          className="mt-4"
          onPress={() => window.location.reload()}
        >
          Tải lại
        </Button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <CalendarIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Chưa có ca khám</h3>
        <p className="text-gray-600">Bạn chưa đặt lịch khám nào. Hãy đặt lịch để bắt đầu!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Ca khám của tôi</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {appointments.map((appointment) => (
          <Card key={appointment._id} className="border-l-4 border-l-[#39BDCC]">
            <CardHeader className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  {appointment.serviceId?.serviceName || "Dịch vụ"}
                </h3>
                <p className="text-sm text-gray-600">
                  {appointment.type === "Consultation" ? "Tư vấn" : "Khám"}
                </p>
              </div>
              <Badge
                color={getStatusColor(appointment.status)}
                variant="flat"
                className="font-semibold"
              >
                {getStatusText(appointment.status)}
              </Badge>
            </CardHeader>

            <CardBody className="space-y-3">
              {/* Doctor */}
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Bác sĩ</p>
                  <p className="font-medium text-gray-800">
                    {appointment.doctorUserId?.fullName || "N/A"}
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Thời gian</p>
                  <p className="font-medium text-gray-800">
                    {appointment.timeslotId?.startTime &&
                      formatDateTime(appointment.timeslotId.startTime)}
                  </p>
                </div>
              </div>

              {/* Mode */}
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Hình thức</p>
                  <p className="font-medium text-gray-800">
                    {appointment.mode === "Online" ? "Trực tuyến" : "Tại phòng khám"}
                  </p>
                </div>
              </div>

              {/* Appointment For */}
              {appointment.appointmentFor === "other" && appointment.customerId && (
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Đặt cho</p>
                    <p className="font-medium text-gray-800">
                      {appointment.customerId.fullName}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {appointment.notes && (
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-xs text-gray-500 font-semibold mb-1">Ghi chú</p>
                  <p className="text-sm text-gray-700">{appointment.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {appointment.status === "PendingPayment" && (
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="flex-1"
                  >
                    Thanh toán
                  </Button>
                )}
                {(appointment.status === "Pending" ||
                  appointment.status === "Approved") && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AppointmentsList;

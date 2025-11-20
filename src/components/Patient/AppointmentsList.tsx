import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Badge,
} from "@heroui/react";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

import { appointmentApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/Common";

interface Appointment {
  _id: string;
  status: string;
  type: string;
  mode: string;
  patientUserId?: { fullName: string };
  doctorUserId?: { fullName: string };
  serviceId?: {
    serviceName: string;
    price?: number;
    category?: string;
  };
  timeslotId?: { startTime: string; endTime: string };
  customerId?: { fullName: string };
  appointmentFor: string;
  notes?: string;
  paymentId?: {
    status: string;
    amount: number;
    method: string;
  };
}

export const AppointmentsList = () => {
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{startDate: string | null, endDate: string | null}>({
    startDate: null,
    endDate: null
  });

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
        // console.error("Error fetching appointments:", err);
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
      PendingPayment: "Chờ thanh toán",
      Pending: "Chờ duyệt",
      Approved: "Đã xác nhận",
      CheckedIn: "Đã nhận",
      Completed: "Đã hoàn thành",
      Cancelled: "Đã hủy",
    };

    return statusMap[status] || status;
  };

  const formatPaymentInfo = (
    appointment: Appointment,
  ): { text: string; color: string } => {
    // ⭐ Nếu là Examination (khám) hoặc FollowUp (tái khám) - Thanh toán tại phòng khám
    if (appointment.type === "Examination" || appointment.type === "FollowUp") {
      return {
        text: "Thanh toán tại phòng khám",
        color: "text-gray-500",
      };
    }

    // Nếu là Consultation (tư vấn) - cần thanh toán
    if (appointment.type === "Consultation") {
      // Nếu có paymentId và đã thanh toán
      if (
        appointment.paymentId &&
        appointment.paymentId.status === "Completed"
      ) {
        return {
          text: `${appointment.paymentId.amount.toLocaleString("vi-VN")} VNĐ`,
          color: "text-green-600 font-semibold",
        };
      }
      // Nếu có paymentId nhưng chưa thanh toán
      if (appointment.paymentId && appointment.paymentId.status === "Pending") {
        return {
          text: `Chưa thanh toán (${appointment.paymentId.amount.toLocaleString("vi-VN")} VNĐ)`,
          color: "text-orange-600 font-semibold",
        };
      }

      // Nếu không có paymentId (trường hợp cũ hoặc lỗi)
      return {
        text: "Chưa thanh toán",
        color: "text-red-600 font-semibold",
      };
    }

    // Mặc định
    return {
      text: "N/A",
      color: "text-gray-400",
    };
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      // Format: DD/MM/YYYY HH:mm (UTC time)
      const day = String(date.getUTCDate()).padStart(2, "0");
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const year = date.getUTCFullYear();
      const hours = String(date.getUTCHours()).padStart(2, "0");
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner color="primary" label="Đang tải ca khám..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <XCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <Button
          className="mt-4"
          color="danger"
          size="sm"
          variant="flat"
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
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Chưa có ca khám
        </h3>
        <p className="text-gray-600">
          Bạn chưa đặt lịch khám nào. Hãy đặt lịch để bắt đầu!
        </p>
      </div>
    );
  }

  // Filter appointments by date range
  const filteredAppointments = appointments.filter((appointment) => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return true;
    }

    if (!appointment.timeslotId?.startTime) {
      return false;
    }

    const appointmentDate = new Date(appointment.timeslotId.startTime);
    const appointmentDateStr = appointmentDate.toISOString().split('T')[0];

    if (dateRange.startDate && appointmentDateStr < dateRange.startDate) {
      return false;
    }
    if (dateRange.endDate && appointmentDateStr > dateRange.endDate) {
      return false;
    }

    return true;
  });

  if (filteredAppointments.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Ca khám của tôi</h2>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateChange={(startDate, endDate) => setDateRange({startDate, endDate})}
                placeholder="Chọn khoảng thời gian để lọc ca khám"
              />
            </div>
            <button
              onClick={() => setDateRange({startDate: null, endDate: null})}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <CalendarIcon className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Không tìm thấy ca khám
          </h3>
          <p className="text-gray-600">
            Không có ca khám nào trong khoảng thời gian đã chọn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Ca khám của tôi</h2>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={(startDate, endDate) => setDateRange({startDate, endDate})}
              placeholder="Chọn khoảng thời gian để lọc ca khám"
            />
          </div>
          <button
            onClick={() => setDateRange({startDate: null, endDate: null})}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAppointments.map((appointment) => (
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
                className="font-semibold"
                color={getStatusColor(appointment.status)}
                variant="flat"
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
                    appointment.timeslotId?.endTime ? (
                      <>
                        {formatDateTime(appointment.timeslotId.startTime)}
                        {" - "}
                        {(() => {
                          const endDate = new Date(
                            appointment.timeslotId.endTime,
                          );
                          const hours = String(endDate.getUTCHours()).padStart(
                            2,
                            "0",
                          );
                          const minutes = String(
                            endDate.getUTCMinutes(),
                          ).padStart(2, "0");

                          return `${hours}:${minutes}`;
                        })()}
                      </>
                    ) : (
                      formatDateTime(appointment.timeslotId?.startTime || "")
                    )}
                  </p>
                </div>
              </div>

              {/* Mode */}
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Hình thức</p>
                  <p className="font-medium text-gray-800">
                    {appointment.mode === "Online"
                      ? "Trực tuyến"
                      : "Tại phòng khám"}
                  </p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Thanh toán</p>
                  <p
                    className={`font-medium ${formatPaymentInfo(appointment).color}`}
                  >
                    {formatPaymentInfo(appointment).text}
                  </p>
                </div>
              </div>

              {/* Appointment For */}
              {appointment.appointmentFor === "other" &&
                appointment.customerId && (
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
                  <p className="text-xs text-gray-500 font-semibold mb-1">
                    Ghi chú
                  </p>
                  <p className="text-sm text-gray-700">{appointment.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {appointment.status === "PendingPayment" && (
                  <Button
                    className="flex-1"
                    color="primary"
                    size="sm"
                    variant="flat"
                  >
                    Thanh toán
                  </Button>
                )}
                {(appointment.status === "Pending" ||
                  appointment.status === "Approved") && (
                  <Button
                    className="flex-1"
                    color="danger"
                    size="sm"
                    variant="flat"
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

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

const PendingAppointments = () => {
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appointmentApi.getPendingAppointments();

      console.log("Raw API response from getPendingAppointments:", res);
      if (res.success) {
        const mappedAppointments: Appointment[] = res.data.map((apt: any) => ({
          id: apt._id,
          status: apt.status,
          patientName:
            apt.customerId?.fullName || apt.patientUserId?.fullName || "N/A",
          doctorName: apt.doctorUserId?.fullName || "N/A",
          serviceName: apt.serviceId?.serviceName || "N/A",
          startTime: apt.timeslotId?.startTime || "",
          endTime: apt.timeslotId?.endTime || "",
        }));

        setAppointments(mappedAppointments);
      } else {
        setError(res.message || "Lỗi lấy danh sách ca khám chờ duyệt");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải ca khám chờ duyệt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refetchAppointments();
    }
  }, [isAuthenticated]);

  const handleReview = async (
    appointmentId: string,
    action: "approve" | "cancel",
  ) => {
    try {
      let cancelReason;

      if (action === "cancel") {
        cancelReason = prompt("Vui lòng nhập lý do hủy:");
        if (!cancelReason) return; // User cancelled the prompt
      }
      await appointmentApi.reviewAppointment(
        appointmentId,
        action,
        cancelReason,
      );
      refetchAppointments();
    } catch (error) {
      console.error("Failed to review appointment", error);
      alert("Thao tác thất bại, vui lòng thử lại.");
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
  };

  const columns = [
    { key: "date", label: "Ngày" },
    { key: "time", label: "Giờ bắt đầu" },
    { key: "patient", label: "Bệnh nhân" },
    { key: "doctor", label: "Bác sĩ" },
    { key: "service", label: "Dịch vụ" },
    { key: "actions", label: "Hành động" },
  ];

  if (!isAuthenticated) {
    return <p>Vui lòng đăng nhập để xem ca khám</p>;
  }

  if (loading) {
    return <Spinner label="Đang tải ca khám..." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Yêu cầu đặt lịch chờ xác nhận
      </h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      <Table aria-label="Bảng các yêu cầu đặt lịch chờ xác nhận">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={"Không có yêu cầu nào."} items={appointments}>
          {(appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>{formatDate(appointment.startTime)}</TableCell>
              <TableCell>{formatTime(appointment.startTime)}</TableCell>
              <TableCell>{appointment.patientName}</TableCell>
              <TableCell>{appointment.doctorName}</TableCell>
              <TableCell>{appointment.serviceName}</TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Hành động">
                    <DropdownItem
                      key="approve"
                      onPress={() => handleReview(appointment.id, "approve")}
                    >
                      Duyệt
                    </DropdownItem>
                    <DropdownItem
                      key="cancel"
                      className="text-danger"
                      color="danger"
                      onPress={() => handleReview(appointment.id, "cancel")}
                    >
                      Hủy
                    </DropdownItem>
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

export default PendingAppointments;

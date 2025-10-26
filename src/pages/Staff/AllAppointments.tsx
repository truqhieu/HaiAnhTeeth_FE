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
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Chip,
  Tabs,
  Tab,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
} from "@heroui/react";
import { 
  MagnifyingGlassIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { appointmentApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
// ===== Interface định nghĩa =====
interface Appointment {
  id: string;
  status: string;
  patientName: string;
  doctorName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  checkInTime: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// ===== Component chính =====
const AllAppointments = () => {
  const { isAuthenticated, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Cancel Modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Danh sách unique doctors và dates
  const [doctors, setDoctors] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);

  // ===== Hàm lấy tất cả ca khám =====
  const refetchAllAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const res: ApiResponse<any[]> = await appointmentApi.getAllAppointments();

      if (res.success && res.data) {
        const allMapped: Appointment[] = res.data.map((apt) => {
          let patientName = "N/A";

          if (apt.customerId && typeof apt.customerId === "object" && apt.customerId.fullName) {
            patientName = apt.customerId.fullName;
          } else if (apt.patientUserId && typeof apt.patientUserId === "object" && apt.patientUserId.fullName) {
            patientName = apt.patientUserId.fullName;
          }

          return {
            id: apt._id,
            status: apt.status,
            patientName: patientName,
            doctorName: apt.doctorUserId?.fullName || "N/A",
            serviceName: apt.serviceId?.serviceName || "N/A",
            startTime: apt.timeslotId?.startTime || "",
            endTime: apt.timeslotId?.endTime || "",
            checkInTime: apt.checkInTime || "",
            createdAt: apt.createdAt || "",
          };
        });

        setAppointments(allMapped);
        setFilteredAppointments(allMapped);

        const uniqueDoctors = [...new Set(allMapped.map(apt => apt.doctorName))].filter(d => d !== "N/A");
        const uniqueDates = [...new Set(allMapped.map(apt => formatDate(apt.startTime)))].filter(d => d !== "");
        
        setDoctors(uniqueDoctors);
        setDates(uniqueDates);
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
      refetchAllAppointments();
    }
  }, [isAuthenticated]);

  // ===== Filter appointments =====
  useEffect(() => {
    let filtered = [...appointments];

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter(apt => apt.status === activeTab);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(apt => 
        apt.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
        apt.serviceName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by doctor
    if (selectedDoctor !== "all") {
      filtered = filtered.filter(apt => apt.doctorName === selectedDoctor);
    }

    // Filter by date
    if (selectedDate !== "all") {
      filtered = filtered.filter(apt => formatDate(apt.startTime) === selectedDate);
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [searchText, selectedDoctor, selectedDate, activeTab, appointments]);

  // ===== Open Cancel Modal =====
  const openCancelModal = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setCancelReason("");
    setIsCancelModalOpen(true);
  };

  // ===== Close Cancel Modal =====
  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setSelectedAppointmentId(null);
    setCancelReason("");
  };

  // ===== Confirm Cancel =====
  const handleConfirmCancel = async () => {
    if (!selectedAppointmentId) return;
    
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy!");
      return;
    }

    try {
      setProcessingId(selectedAppointmentId);

      const res: ApiResponse<null> = await appointmentApi.reviewAppointment(
        selectedAppointmentId,
        "cancel",
        cancelReason.trim()
      );

      if (res.success) {
        toast.success("Đã hủy ca khám thành công!");
        closeCancelModal();
        await refetchAllAppointments();
      } else {
        toast.error(res.message || "Thao tác thất bại");
      }
    } catch (error: any) {
      console.error("=== REVIEW API ERROR ===", error);
      toast.error(error.message || "Thao tác thất bại, vui lòng thử lại.");
    } finally {
      setProcessingId(null);
    }
  };

  // ===== Duyệt ca khám =====
  const handleApprove = async (appointmentId: string) => {
    try {
      setProcessingId(appointmentId);

      const res: ApiResponse<null> = await appointmentApi.reviewAppointment(
        appointmentId,
        "approve"
      );

      if (res.success) {
        toast.success("Đã duyệt ca khám thành công!");
        await refetchAllAppointments();
      } else {
        toast.error(res.message || "Thao tác thất bại");
      }
    } catch (error: any) {
      console.error("=== REVIEW API ERROR ===", error);
      toast.error(error.message || "Thao tác thất bại, vui lòng thử lại.");
    } finally {
      setProcessingId(null);
    }
  };

  // ===== Cập nhật trạng thái ca khám =====
  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: "CheckedIn" | "Completed" | "Cancelled"
  ) => {
    try {
      setProcessingId(appointmentId);

      const res = await appointmentApi.updateAppointmentStatus(
        appointmentId,
        newStatus
      );

      if (res.success) {
        const statusMessages = {
          CheckedIn: "Đã check-in bệnh nhân thành công!",
          Completed: "Đã hoàn thành ca khám!",
          Cancelled: "Đã hủy ca khám thành công!",
        };
        toast.success(statusMessages[newStatus]);
        await refetchAllAppointments();
      } else {
        toast.error(res.message || "Thao tác thất bại");
      }
    } catch (error: any) {
      console.error("=== UPDATE STATUS ERROR ===", error);
      toast.error(error.message || "Thao tác thất bại, vui lòng thử lại.");
    } finally {
      setProcessingId(null);
    }
  };

  // ===== Helper functions =====
  const getStatusText = (status: string): string => {
    switch (status) {
      case "Pending":
        return "Chờ duyệt";
      case "Approved":
        return "Đã xác nhận";
      case "CheckedIn":
        return "Đã check-in";
      case "Completed":
        return "Đã hoàn thành";
      case "Cancelled":
        return "Đã hủy";
      case "NoShow":
        return "Không đến";
      case "PendingPayment":
        return "Chờ thanh toán";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "primary" | "danger" | "default" => {
    switch (status) {
      case "Approved":
        return "success";
      case "Pending":
      case "PendingPayment":
        return "warning";
      case "Completed":
        return "primary";
      case "CheckedIn":
        return "primary";
      case "Cancelled":
      case "NoShow":
        return "danger";
      default:
        return "default";
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

  const formatDateTime = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats calculation
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === "Pending").length,
    approved: appointments.filter(a => a.status === "Approved").length,
    checkedIn: appointments.filter(a => a.status === "CheckedIn").length,
    completed: appointments.filter(a => a.status === "Completed").length,
    cancelled: appointments.filter(a => a.status === "Cancelled").length,
  };

  const columns = [
    { key: "date", label: "Ngày khám" },
    { key: "time", label: "Giờ khám" },
    { key: "patient", label: "Bệnh nhân" },
    { key: "doctor", label: "Bác sĩ" },
    { key: "service", label: "Dịch vụ" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hành động" },
  ];

  // ===== Pagination logic =====
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  // ===== Render UI =====
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardBody className="text-center p-8">
            <ExclamationCircleIcon className="w-16 h-16 mx-auto mb-4 text-warning-500" />
            <p className="text-lg font-semibold">Vui lòng đăng nhập để xem ca khám</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" label="Đang tải ca khám..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-[1600px] mx-auto">
      {/* Cancel Appointment Modal */}
      <Modal 
        isOpen={isCancelModalOpen} 
        onClose={closeCancelModal}
        size="2xl"
        classNames={{
          base: "rounded-2xl",
          header: "border-b border-gray-200",
          footer: "border-t border-gray-200",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-full p-2">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Xác nhận hủy ca khám</h3>
                <p className="text-sm text-gray-500 font-normal mt-1">
                  Vui lòng nhập lý do hủy ca khám
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <Textarea
              label="Lý do hủy"
              placeholder="Vui lòng nhập lý do hủy ca khám (bắt buộc)..."
              value={cancelReason}
              onValueChange={setCancelReason}
              minRows={4}
              maxRows={8}
              size="lg"
              variant="bordered"
              isRequired
              description="Lý do sẽ được gửi đến bệnh nhân"
              classNames={{
                input: "text-base",
                label: "text-base font-semibold",
              }}
            />
            
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <ExclamationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Lưu ý:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Hành động này không thể hoàn tác</li>
                    <li>Bệnh nhân sẽ nhận được thông báo về việc hủy</li>
                    <li>Lý do hủy sẽ được lưu vào hệ thống</li>
                  </ul>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="gap-3">
            <Button
              color="default"
              variant="flat"
              onPress={closeCancelModal}
              size="lg"
              className="font-semibold"
              isDisabled={processingId === selectedAppointmentId}
            >
              Đóng
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmCancel}
              size="lg"
              className="font-semibold"
              isDisabled={!cancelReason.trim() || processingId === selectedAppointmentId}
              isLoading={processingId === selectedAppointmentId}
            >
              {processingId === selectedAppointmentId ? "Đang hủy..." : "Xác nhận hủy"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý ca khám</h1>
          <p className="text-gray-600 mt-1">Theo dõi và quản lý tất cả các ca khám</p>
        </div>
        {user && (
          <Chip color="primary" variant="flat" size="lg">
            {user.role}
          </Chip>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-danger-50 border-danger-200">
          <CardBody className="flex flex-row items-center gap-3">
            <XCircleIcon className="w-6 h-6 text-danger-600 flex-shrink-0" />
            <p className="text-danger-700">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
            <p className="text-sm text-blue-600 mt-1">Tổng số</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-sm text-yellow-600 mt-1">Chờ duyệt</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
            <p className="text-sm text-green-600 mt-1">Đã xác nhận</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-indigo-700">{stats.checkedIn}</p>
            <p className="text-sm text-indigo-600 mt-1">Đã check-in</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-purple-700">{stats.completed}</p>
            <p className="text-sm text-purple-600 mt-1">Hoàn thành</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
            <p className="text-sm text-red-600 mt-1">Đã hủy</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Tìm kiếm bệnh nhân, dịch vụ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
              isClearable
              onClear={() => setSearchText("")}
              size="lg"
              variant="bordered"
            />

            <Select
              label="Bác sĩ"
              placeholder="Chọn bác sĩ"
              selectedKeys={selectedDoctor !== "all" ? new Set([selectedDoctor]) : new Set([])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setSelectedDoctor(selected ? String(selected) : "all");
              }}
              size="lg"
              variant="bordered"
              startContent={<UserGroupIcon className="w-5 h-5 text-gray-400" />}
            >
              {[{ key: "all", label: "Tất cả bác sĩ" }, ...doctors.map(d => ({ key: d, label: d }))].map((item) => (
                <SelectItem key={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Ngày khám"
              placeholder="Chọn ngày"
              selectedKeys={selectedDate !== "all" ? new Set([selectedDate]) : new Set([])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setSelectedDate(selected ? String(selected) : "all");
              }}
              size="lg"
              variant="bordered"
              startContent={<CalendarIcon className="w-5 h-5 text-gray-400" />}
            >
              {[{ key: "all", label: "Tất cả ngày" }, ...dates.map(d => ({ key: d, label: d }))].map((item) => (
                <SelectItem key={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Tabs for Status Filter */}
      <Card>
        <CardBody className="overflow-x-auto">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
            size="lg"
            color="primary"
            variant="underlined"
          >
            <Tab key="all" title={`Tất cả (${stats.total})`} />
            <Tab key="Pending" title={`Chờ duyệt (${stats.pending})`} />
            <Tab key="Approved" title={`Đã xác nhận (${stats.approved})`} />
            <Tab key="CheckedIn" title={`Đã check-in (${stats.checkedIn})`} />
            <Tab key="Completed" title={`Hoàn thành (${stats.completed})`} />
            <Tab key="Cancelled" title={`Đã hủy (${stats.cancelled})`} />
          </Tabs>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          <Table 
            aria-label="Bảng quản lý ca khám"
            removeWrapper
            classNames={{
              th: "bg-gray-100 text-gray-700 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody
              items={currentAppointments}
              emptyContent={
                <div className="text-center py-12">
                  <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">Không có ca khám nào</p>
                </div>
              }
            >
              {(appointment: Appointment) => (
                <TableRow key={appointment.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{formatDate(appointment.startTime)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">{appointment.patientName}</p>
                      <p className="text-xs text-gray-500">Đặt lúc: {formatDateTime(appointment.createdAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip variant="flat" color="default">
                      {appointment.doctorName}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-700">{appointment.serviceName}</p>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(appointment.status)}
                      variant="flat"
                      size="lg"
                      startContent={
                        appointment.status === "Completed" ? <CheckCircleIcon className="w-4 h-4" /> :
                        appointment.status === "Cancelled" ? <XCircleIcon className="w-4 h-4" /> : null
                      }
                    >
                      {getStatusText(appointment.status)}
                    </Chip>
                    {appointment.checkInTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        Check-in: {formatDateTime(appointment.checkInTime)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {appointment.status === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            onPress={() => handleApprove(appointment.id)}
                            isDisabled={processingId === appointment.id}
                            isLoading={processingId === appointment.id}
                          >
                            Xác nhận
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => openCancelModal(appointment.id)}
                            isDisabled={processingId === appointment.id}
                          >
                            Hủy
                          </Button>
                        </>
                      )}
                      {appointment.status === "Approved" && (
                        <>
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onPress={() => handleUpdateStatus(appointment.id, "CheckedIn")}
                            isDisabled={processingId === appointment.id}
                            isLoading={processingId === appointment.id}
                          >
                            Check-in
                          </Button>
                          <Button
                            size="sm"
                            color="warning"
                            variant="flat"
                            onPress={() => handleUpdateStatus(appointment.id, "Cancelled")}
                            isDisabled={processingId === appointment.id}
                            isLoading={processingId === appointment.id}
                          >
                            No Show
                          </Button>
                        </>
                      )}
                      {!["Pending", "Approved"].includes(appointment.status) && (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            color="primary"
            size="lg"
            classNames={{
              wrapper: "gap-2",
              item: "w-10 h-10 text-base",
              cursor: "bg-primary text-white font-semibold",
            }}
          />
        </div>
      )}

      {/* Result Count */}
      <div className="text-center text-sm text-gray-600">
        Hiển thị <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)}</span> trong tổng số <span className="font-semibold">{filteredAppointments.length}</span> ca khám
      </div>
    </div>
  );
};

export default AllAppointments;
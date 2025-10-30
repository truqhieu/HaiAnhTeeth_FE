import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Button,
  Chip,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Pagination,
} from "@heroui/react";
import { 
  EyeIcon, 
  UserIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { nurseApi, type NurseAppointment, appointmentApi } from "@/api";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/Common";
import AppointmentDetailModalNurse from "./AppointmentDetailModalNurse";
import PatientDetailModalNurse from "./PatientDetailModalNurse";

const NurseSchedule = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<NurseAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<NurseAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{startDate: string | null, endDate: string | null}>({
    startDate: null,
    endDate: null
  });
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  // Theo dõi ca đang trong quá trình khám (UI-only toggle)
  const [inProgressIds, setInProgressIds] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null); // <-- Dùng state này
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Danh sách dates và doctors
  const [dates, setDates] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<string[]>([]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await nurseApi.getAppointmentsSchedule();
      
      if (res.success && res.data) {
        setAppointments(res.data);
        setFilteredAppointments(res.data);
        
        // Extract unique dates và doctors
        const uniqueDates = [...new Set(res.data.map(apt => formatDate(apt.appointmentDate)))].filter(d => d !== "N/A");
        const uniqueDoctors = [...new Set(res.data.map(apt => apt.doctorName))].filter(d => d !== "N/A");
        setDates(uniqueDates);
        setDoctors(uniqueDoctors);
      } else {
        setError(res.message || "Lỗi lấy danh sách lịch khám");
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err.message || "Lỗi khi tải lịch khám");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
    }
  }, [isAuthenticated]);

  // Filter appointments
  useEffect(() => {
    let filtered = [...appointments];

    // Sửa logic tab:
    // - Lịch sắp tới: hiển thị các ca có trạng thái CheckedIn hoặc InProgress
    // - Lịch sử khám: chỉ hiển thị các ca Completed
    if (activeTab === "upcoming") {
      filtered = filtered.filter(apt => apt.status === "CheckedIn" || apt.status === "InProgress");
    } else if (activeTab === "history") {
      filtered = filtered.filter(apt => apt.status === "Completed");
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(apt => 
        apt.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
        apt.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        const startDate = new Date(dateRange.startDate!);
        const endDate = new Date(dateRange.endDate!);
        
        // Set time to start of day for comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        return aptDate >= startDate && aptDate <= endDate;
      });
    } else if (dateRange.startDate) {
      // Only start date selected
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        const startDate = new Date(dateRange.startDate!);
        startDate.setHours(0, 0, 0, 0);
        return aptDate >= startDate;
      });
    } else if (dateRange.endDate) {
      // Only end date selected
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        const endDate = new Date(dateRange.endDate!);
        endDate.setHours(23, 59, 59, 999);
        return aptDate <= endDate;
      });
    }

    // Filter by mode
    if (selectedMode !== "all") {
      filtered = filtered.filter(apt => apt.mode === selectedMode);
    }

    // Filter by doctor
    if (selectedDoctor !== "all") {
      filtered = filtered.filter(apt => apt.doctorName === selectedDoctor);
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [searchText, dateRange, selectedMode, selectedDoctor, activeTab, appointments]);

  const handleViewAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsAppointmentModalOpen(true);
  };

  // ⭐ SỬA: Hàm này giờ nhận patientId
  const handleViewPatient = (patientId: string | null) => {
    if (patientId && patientId !== "N/A" && patientId !== "Trống") {
      setSelectedPatientId(patientId);
      setIsPatientModalOpen(true);
    } else {
      console.error("Invalid or missing patientId:", patientId);
      setError("Không tìm thấy thông tin bệnh nhân cho ca khám này.");
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "primary" | "danger" | "default" => {
    switch (status) {
      case "Approved":
        return "success";
      case "CheckedIn":
        return "primary";
      case "InProgress":
        return "warning";
      case "Completed":
        return "primary";
      case "Finalized":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Approved":
        return "Đã xác nhận";
      case "CheckedIn":
        return "Đã nhận";
      case "InProgress":
        return "Đang khám";
      case "Completed":
        return "Hoàn thành";
      case "Finalized":
        return "Đã kết thúc";
      default:
        return status;
    }
  };

  const getModeText = (mode: string) => {
    switch (mode) {
      case "Online":
        return "Trực tuyến";
      case "Offline":
        return "Tại phòng khám";
      default:
        return mode;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString: string): string => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Stats calculation
  const stats = {
    total: appointments.length,
    // Sắp tới = số ca đang CheckedIn hoặc InProgress
    upcoming: appointments.filter(a => a.status === "CheckedIn" || a.status === "InProgress").length,
    today: appointments.filter(a => formatDate(a.appointmentDate) === formatDate(new Date().toISOString())).length,
    online: appointments.filter(a => a.mode === "Online").length,
    offline: appointments.filter(a => a.mode === "Offline").length,
    completed: appointments.filter(a => a.status === "Completed").length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  const columns = [
    { key: "date", label: "Ngày" },
    { key: "time", label: "Giờ" },
    { key: "doctor", label: "Bác sĩ" },
    { key: "patient", label: "Bệnh nhân" },
    { key: "service", label: "Dịch vụ" },
    { key: "mode", label: "Hình thức" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hành động" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardBody className="text-center p-8">
            <ClockIcon className="w-16 h-16 mx-auto mb-4 text-warning-500" />
            <p className="text-lg font-semibold">Vui lòng đăng nhập để xem lịch khám</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" label="Đang tải lịch khám..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch khám của phòng khám</h1>
          <p className="text-gray-600 mt-1">Theo dõi tất cả ca khám của các bác sĩ</p>
        </div>
        <Chip color="secondary" variant="flat" size="lg" startContent={<HeartIcon className="w-5 h-5" />}>
          Điều dưỡng
        </Chip>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-danger-50 border-danger-200">
          <CardBody className="flex flex-row items-center gap-3">
            <span className="text-danger-600 text-lg">⚠️</span>
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
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-green-700">{stats.upcoming}</p>
            <p className="text-sm text-green-600 mt-1">Sắp tới</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-orange-700">{stats.today}</p>
            <p className="text-sm text-orange-600 mt-1">Hôm nay</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-purple-700">{stats.online}</p>
            <p className="text-sm text-purple-600 mt-1">Trực tuyến</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-indigo-700">{stats.offline}</p>
            <p className="text-sm text-indigo-600 mt-1">Trực tiếp</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-teal-700">{stats.completed}</p>
            <p className="text-sm text-teal-600 mt-1">Hoàn thành</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Tìm kiếm bệnh nhân, bác sĩ, dịch vụ..."
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
              startContent={<UserIcon className="w-5 h-5 text-gray-400" />}
            >
              {[{ key: "all", label: "Tất cả bác sĩ" }, ...doctors.map(d => ({ key: d, label: d }))].map((item) => (
                <SelectItem key={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>

            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={(startDate, endDate) => setDateRange({ startDate, endDate })}
              placeholder="Chọn khoảng thời gian"
              className="w-full"
            />

            <Select
              label="Hình thức"
              placeholder="Chọn hình thức"
              selectedKeys={selectedMode !== "all" ? new Set([selectedMode]) : new Set([])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setSelectedMode(selected ? String(selected) : "all");
              }}
              size="lg"
              variant="bordered"
              startContent={<VideoCameraIcon className="w-5 h-5 text-gray-400" />}
            >
              <SelectItem key="all">Tất cả hình thức</SelectItem>
              <SelectItem key="Online" startContent={<VideoCameraIcon className="w-4 h-4" />}>
                Trực tuyến
              </SelectItem>
              <SelectItem key="Offline" startContent={<BuildingOfficeIcon className="w-4 h-4" />}>
                Tại phòng khám
              </SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Tabs - Upcoming vs History */}
      <Card>
        <CardBody className="overflow-x-auto">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key))}
            size="lg"
            color="secondary"
            variant="underlined"
          >
            <Tab 
              key="upcoming" 
              title={
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>Lịch sắp tới ({stats.upcoming})</span>
                </div>
              } 
            />
            <Tab 
              key="history" 
              title={
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  <span>Lịch sử khám ({stats.completed})</span>
                </div>
              } 
            />
          </Tabs>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardBody className="p-0">
          <Table 
            aria-label="Bảng lịch khám của điều dưỡng"
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
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">Không có lịch khám nào</p>
                </div>
              }
            >
              {(appointment) => (
                <TableRow key={appointment.appointmentId} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-7">
                        {formatDateTime(appointment.appointmentDate)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <span>{appointment.startTime} - {appointment.endTime}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip variant="flat" color="primary" size="sm">
                      {appointment.doctorName}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-gray-900">{appointment.patientName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-700">{appointment.serviceName}</p>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="lg" 
                      variant="flat"
                      color={appointment.mode === "Online" ? "secondary" : "default"}
                      startContent={
                        appointment.mode === "Online" ? 
                          <VideoCameraIcon className="w-4 h-4" /> : 
                          <BuildingOfficeIcon className="w-4 h-4" />
                      }
                    >
                      {getModeText(appointment.mode)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="lg"
                      color={getStatusColor(appointment.status)}
                      variant="flat"
                    >
                      {getStatusText(appointment.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                  <div className="flex gap-2 flex-wrap items-center">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<EyeIcon className="w-4 h-4" />}
                      onPress={() => handleViewAppointment(appointment.appointmentId)}
                    >
                      Chi tiết
                    </Button>

                    <Button
                      size="sm"
                      variant="flat"
                      color="secondary"
                      startContent={<UserIcon className="w-4 h-4" />}
                      onPress={() => handleViewPatient(appointment.patientId)}
                    >
                      Bệnh nhân
                    </Button>

                    {/* Nút đánh dấu đang trong ca khám (chỉ cho CheckedIn) */}
                    {/* Nút cập nhật trạng thái cho cả Offline và Consultation (Online) */}
                    {appointment.status === "CheckedIn" && !inProgressIds.has(appointment.appointmentId) && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="warning"
                        onPress={async () => {
                          try {
                            await appointmentApi.updateAppointmentStatus(appointment.appointmentId, "InProgress");
                            setInProgressIds(prev => new Set(prev).add(appointment.appointmentId));
                            // Cập nhật status hiển thị ngay
                            appointment.status = "InProgress" as any;
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                      >
                        Đang trong ca khám
                      </Button>
                    )}

                    {/* Hiển thị Hồ sơ bệnh án cho ca Offline khi đang khám (InProgress), đã bấm bắt đầu, hoặc đã Completed */}
                    {appointment.mode === "Offline" && (
                      appointment.status === "InProgress" ||
                      appointment.status === "Completed" ||
                      inProgressIds.has(appointment.appointmentId)
                    ) && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="success"
                        startContent={<ClipboardDocumentListIcon className="w-4 h-4" />}
                        onPress={() => navigate(`/nurse/medical-record/${appointment.appointmentId}`)}
                        isDisabled={!appointment.patientId || appointment.patientId === "N/A" || appointment.patientId === "Trống"}
                      >
                        Hồ sơ bệnh án
                      </Button>
                    )}

                    {/* Nút Hoàn thành cho ca InProgress */}
                    {appointment.status === "InProgress" && (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={async () => {
                          try {
                            const res = await appointmentApi.updateAppointmentStatus(appointment.appointmentId, "Completed");
                            if (res.success) {
                              toast.success("Đã hoàn thành ca khám");
                              fetchAppointments();
                            } else {
                              toast.error(res.message || "Không thể cập nhật trạng thái");
                            }
                          } catch (e: any) {
                            toast.error(e.message || "Không thể cập nhật trạng thái");
                          }
                        }}
                      >
                        Hoàn thành
                      </Button>
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
            color="secondary"
            size="lg"
            classNames={{
              wrapper: "gap-2",
              item: "w-10 h-10 text-base",
              cursor: "bg-secondary text-white font-semibold",
            }}
          />
        </div>
      )}

      {/* Result Count */}
      <div className="text-center text-sm text-gray-600">
        Hiển thị <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)}</span> trong tổng số <span className="font-semibold">{filteredAppointments.length}</span> ca khám
      </div>

     
      <AppointmentDetailModalNurse
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        appointmentId={selectedAppointmentId}
      />
      
      {/* ⭐ SỬA: Truyền prop patientId cho modal */}
      <PatientDetailModalNurse
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patientId={selectedPatientId}
      />
    </div>
  );
};

export default NurseSchedule;


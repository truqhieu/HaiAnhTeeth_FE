import { useState, useEffect, useMemo, useCallback } from "react";
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
  // Removed filteredAppointments state - now using useMemo
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Separate initial load from subsequent loads
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null); // Track which appointment is being updated
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState(""); // Debounced search text
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{startDate: string | null, endDate: string | null}>({
    startDate: null,
    endDate: null
  });
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  // Theo dõi ca đang trong quá trình khám (UI-only toggle)
  
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

  // Fetch tất cả bác sĩ
  const fetchAllDoctors = async () => {
    try {
      const res = await nurseApi.getAllDoctors();
      if (res.success && res.data) {
        // Lấy danh sách tên bác sĩ
        const doctorNames = res.data.map(doctor => doctor.fullName);
        setDoctors(doctorNames);
      }
    } catch (err: any) {
      console.error("Error fetching all doctors:", err);
      // Fallback: lấy từ appointments nếu API lỗi
    }
  };

  const fetchAppointments = useCallback(async (startDate?: string | null, endDate?: string | null, silent: boolean = false) => {
    try {
      // Chỉ set loading khi là lần fetch đầu tiên (không phải silent)
      if (!silent) {
        setLoading(prev => {
          // Nếu đang initial loading, giữ nguyên, nếu không thì set true
          if (!prev) return true;
          return prev;
        });
      }
      setError(null);
      const res = await nurseApi.getAppointmentsSchedule(startDate, endDate);
      
      if (res.success && res.data) {
        setAppointments(res.data);
        
        // Extract unique dates từ appointments (sử dụng formatDate inline để tránh dependency)
        const uniqueDates = [...new Set(res.data.map(apt => {
          if (!apt.appointmentDate || apt.appointmentDate === "N/A") return "N/A";
          return new Date(apt.appointmentDate).toLocaleDateString("vi-VN");
        }))].filter(d => d !== "N/A");
        setDates(uniqueDates);
      } else {
        setError(res.message || "Lỗi lấy danh sách lịch khám");
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err.message || "Lỗi khi tải lịch khám");
    } finally {
      if (!silent) {
        setInitialLoading(false);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllDoctors(); // Lấy tất cả bác sĩ trước
      fetchAppointments(); // Fetch mặc định (2 tuần)
    }
  }, [isAuthenticated, fetchAppointments]);

  // Debounce search text để tránh filter quá nhiều lần
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchText]);

  // Refetch appointments khi dateRange thay đổi
  useEffect(() => {
    if (!isAuthenticated) return;
    
    if (dateRange.startDate && dateRange.endDate) {
      // Chỉ fetch khi cả startDate và endDate đều có giá trị
      fetchAppointments(dateRange.startDate, dateRange.endDate);
    } else if (!dateRange.startDate && !dateRange.endDate) {
      // Khi clear date range, fetch lại mặc định (2 tuần)
      fetchAppointments();
    }
  }, [dateRange.startDate, dateRange.endDate, isAuthenticated, fetchAppointments]);

  // Sử dụng useMemo để tính toán filtered appointments - tránh re-render không cần thiết
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Sửa logic tab:
    // - Lịch sắp tới: hiển thị các ca có trạng thái CheckedIn hoặc InProgress
    // - Lịch sử khám: hiển thị các ca Completed, Expired, No-Show
    if (activeTab === "upcoming") {
      filtered = filtered.filter(apt => apt.status === "CheckedIn" || apt.status === "InProgress");
    } else if (activeTab === "history") {
      filtered = filtered.filter(apt => apt.status === "Completed" || apt.status === "Expired" || apt.status === "No-Show");
    }

    // Filter by search text (sử dụng debounced search text)
    if (debouncedSearchText) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.patientName.toLowerCase().includes(searchLower) ||
        apt.serviceName.toLowerCase().includes(searchLower) ||
        apt.doctorName.toLowerCase().includes(searchLower)
      );
    }

    // Filter by mode
    if (selectedMode !== "all") {
      filtered = filtered.filter(apt => apt.mode === selectedMode);
    }

    // Filter by doctor
    if (selectedDoctor !== "all") {
      filtered = filtered.filter(apt => apt.doctorName === selectedDoctor);
    }

    // Sort by appointmentDate ascending (ngày cũ nhất lên đầu, ngày mới nhất xuống dưới) sau đó sort by startTime ascending
    filtered.sort((a, b) => {
      // So sánh theo appointmentDate trước (ngày cũ nhất lên đầu)
      const dateA = a.appointmentDate || '';
      const dateB = b.appointmentDate || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB); // Ascending: ngày cũ nhất lên đầu
      }
      
      // Nếu cùng ngày, sort theo startTime (giờ sớm nhất lên đầu trong cùng ngày)
      const timeA = a.startTime || '';
      const timeB = b.startTime || '';
      return timeA.localeCompare(timeB); // Ascending: giờ sớm nhất lên đầu
    });

    return filtered;
  }, [appointments, activeTab, debouncedSearchText, selectedMode, selectedDoctor]);

  // Reset page khi filtered appointments thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, selectedMode, selectedDoctor, activeTab]);

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
      case "Expired":
        return "danger";
      case "No-Show":
        return "danger";
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
      case "Expired":
        return "Đã hết hạn";
      case "No-Show":
        return "Không đến";
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

  // Removed duplicate stats calculation - now using useMemo below

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

  // Stats calculation - sử dụng useMemo để tránh tính toán lại
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return {
      total: appointments.length,
      upcoming: appointments.filter(a => a.status === "CheckedIn" || a.status === "InProgress").length,
      today: appointments.filter(a => {
        if (!a.appointmentDate) return false;
        const aptDate = new Date(a.appointmentDate).toISOString().split('T')[0];
        return aptDate === today;
      }).length,
      online: appointments.filter(a => a.mode === "Online").length,
      offline: appointments.filter(a => a.mode === "Offline").length,
      completed: appointments.filter(a => a.status === "Completed").length,
    };
  }, [appointments]);

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
              items={initialLoading ? [] : currentAppointments}
              isLoading={initialLoading}
              loadingContent={
                <div className="text-center py-12">
                  <Spinner size="lg" label="Đang tải lịch khám..." />
                </div>
              }
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
                    {appointment.status === "CheckedIn" && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="warning"
                        isLoading={updatingStatusId === appointment.appointmentId}
                        isDisabled={updatingStatusId === appointment.appointmentId}
                        onPress={async () => {
                          try {
                            setUpdatingStatusId(appointment.appointmentId);
                            // Optimistic update: update UI immediately
                            const updatedAppointments = appointments.map(apt => 
                              apt.appointmentId === appointment.appointmentId 
                                ? { ...apt, status: "InProgress" as const }
                                : apt
                            );
                            setAppointments(updatedAppointments);
                            
                            const res = await appointmentApi.updateAppointmentStatus(appointment.appointmentId, "InProgress");
                            if (res.success) {
                              toast.success("Đã cập nhật trạng thái: Đang trong ca khám");
                              // Silent refetch to sync with backend without showing loading
                              fetchAppointments(
                                dateRange.startDate || undefined,
                                dateRange.endDate || undefined,
                                true // silent = true để không hiển thị loading
                              );
                            } else {
                              // Revert on error
                              setAppointments(appointments);
                              toast.error(res.message || "Cập nhật trạng thái thất bại");
                            }
                          } catch (e: any) {
                            // Revert on error
                            setAppointments(appointments);
                            console.error("Error updating status:", e);
                            toast.error(e.message || "Cập nhật trạng thái thất bại");
                          } finally {
                            setUpdatingStatusId(null);
                          }
                        }}
                      >
                        Đang trong ca khám
                      </Button>
                    )}

                    {/* Hiển thị Hồ sơ bệnh án cho ca Offline khi đang khám (InProgress), đã bấm bắt đầu, hoặc đã Completed */}
                    {appointment.mode === "Offline" && (
                      appointment.status === "InProgress" ||
                      appointment.status === "Completed"
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

                    {/* Nút Hoàn thành cho ca InProgress - chỉ hiển thị khi doctor đã duyệt hồ sơ (status = "Finalized") */}
                    {appointment.status === "InProgress" && appointment.doctorApproved && (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        isLoading={updatingStatusId === appointment.appointmentId}
                        isDisabled={updatingStatusId === appointment.appointmentId}
                        onPress={async () => {
                          setUpdatingStatusId(appointment.appointmentId);
                          // Optimistic update: update UI immediately
                          const previousAppointments = [...appointments];
                          const updatedAppointments = appointments.map(apt => 
                            apt.appointmentId === appointment.appointmentId 
                              ? { ...apt, status: "Completed" as const }
                              : apt
                          );
                          setAppointments(updatedAppointments);
                          
                          try {
                            const res = await appointmentApi.updateAppointmentStatus(appointment.appointmentId, "Completed");
                            if (res.success) {
                              toast.success("Đã hoàn thành ca khám");
                              // Silent refetch to sync with backend without showing loading
                              fetchAppointments(
                                dateRange.startDate || undefined,
                                dateRange.endDate || undefined,
                                true // silent = true để không hiển thị loading
                              );
                            } else {
                              // Revert on error
                              setAppointments(previousAppointments);
                              toast.error(res.message || "Không thể cập nhật trạng thái");
                            }
                          } catch (e: any) {
                            // Revert on error
                            setAppointments(previousAppointments);
                            toast.error(e.message || "Không thể cập nhật trạng thái");
                          } finally {
                            setUpdatingStatusId(null);
                          }
                        }}
                      >
                        Hoàn thành
                      </Button>
                    )}
                    {/* Hiển thị thông báo nếu chưa được bác sĩ duyệt */}
                    {appointment.status === "InProgress" && !appointment.doctorApproved && (
                      <span className="text-xs text-gray-500 italic">Chờ bác sĩ duyệt hồ sơ</span>
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


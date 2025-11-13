
import { useState, useEffect, useMemo, useCallback } from "react";
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
  CheckCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { doctorApi, type DoctorAppointment } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/Common";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppointmentDetailModal from "./AppointmentDetailModal";
import PatientDetailModal from "./PatientDetailModal";

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Separate initial load from subsequent loads
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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Danh sách dates
  const [dates, setDates] = useState<string[]>([]);

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
      const res = await doctorApi.getAppointmentsSchedule(startDate, endDate);
      
      if (res.success && res.data) {
        setAppointments(res.data);
        
        // Extract unique dates (sử dụng formatDate inline để tránh dependency)
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
      fetchAppointments(); // Fetch mặc định (2 tuần)
    }
  }, [isAuthenticated, fetchAppointments]);

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

  // ⭐ Helper: Lấy ngày hôm nay theo timezone Việt Nam (UTC+7) dưới dạng YYYY-MM-DD
  const getTodayInVietnam = (): string => {
    const now = new Date();
    // Lấy ngày hôm nay theo timezone Việt Nam
    const vietnamDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); // Format: YYYY-MM-DD
    return vietnamDateStr;
  };

  // ⭐ Helper: Kiểm tra xem appointment có phải là của ngày hôm nay không (theo timezone Việt Nam)
  const isTodayAppointment = (appointmentDate: string): boolean => {
    if (!appointmentDate) return false;
    
    const aptDate = new Date(appointmentDate);
    if (isNaN(aptDate.getTime())) return false;
    
    // Lấy ngày của appointment theo timezone Việt Nam
    const aptDateStr = aptDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); // Format: YYYY-MM-DD
    
    const today = getTodayInVietnam();
    
    // So sánh chuỗi ngày (YYYY-MM-DD)
    return aptDateStr === today;
  };

  // Sử dụng useMemo để tính toán filtered appointments - tránh re-render không cần thiết
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Tab logic:
    // - Các ca khám hôm nay: hiển thị các ca có trạng thái CheckedIn hoặc InProgress VÀ là của ngày hôm nay
    // - History: hiển thị Completed, Expired, No-Show
    if (activeTab === "upcoming") {
      filtered = filtered.filter(apt => {
        // Chỉ hiển thị các ca có trạng thái CheckedIn hoặc InProgress VÀ là của ngày hôm nay
        const isToday = isTodayAppointment(apt.appointmentDate);
        const isValidStatus = apt.status === "CheckedIn" || apt.status === "InProgress";
        return isValidStatus && isToday;
      });
    } else if (activeTab === "history") {
      filtered = filtered.filter(apt => apt.status === "Completed" || apt.status === "Expired" || apt.status === "No-Show");
    }

    // Filter by search text (sử dụng debounced search text)
    if (debouncedSearchText) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(apt => {
        // Tìm theo tên bệnh nhân, dịch vụ
        const matchesBasic = 
          apt.patientName.toLowerCase().includes(searchLower) ||
          apt.serviceName.toLowerCase().includes(searchLower);
        
        // Tìm theo trạng thái (text search)
        const statusText = getStatusText(apt.status).toLowerCase();
        const matchesStatus = statusText.includes(searchLower);
        
        // Tìm theo các từ khóa đặc biệt - nếu search chứa keyword thì chỉ match với status tương ứng
        if (searchLower.includes('đang trong ca khám') || searchLower.includes('inprogress')) {
          // Khi search "đang trong ca khám", chỉ hiển thị InProgress, không hiển thị CheckedIn
          return apt.status === 'InProgress';
        }
        if (searchLower.includes('đã có mặt') || searchLower.includes('đã nhận') || searchLower.includes('check-in')) {
          // Khi search "đã có mặt", chỉ hiển thị CheckedIn
          return apt.status === 'CheckedIn';
        }
        
        // Nếu không có keyword đặc biệt, tìm theo basic search hoặc status text
        return matchesBasic || matchesStatus;
      });
    }

    // Filter by mode
    if (selectedMode !== "all") {
      filtered = filtered.filter(apt => apt.mode === selectedMode);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
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
  }, [appointments, activeTab, debouncedSearchText, selectedMode, selectedStatus]);

  // Reset page khi filtered appointments thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, selectedMode, selectedStatus, activeTab]);

  const handleViewAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsAppointmentModalOpen(true);
  };

  const handleViewPatient = (appointmentId: string) => {
    setSelectedPatientId(appointmentId);
    setIsPatientModalOpen(true);
  };

  const getStatusColor = (status: string): "success" | "warning" | "primary" | "danger" | "default" => {
    switch (status) {
      case "Approved":
        return "success";
      case "CheckedIn":
        return "primary";
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
        return "Đã có mặt";
      case "InProgress":
        return "Đang trong ca khám";
      case "Completed":
        return "Hoàn thành";
      case "Finalized":
        return "Đã kết thúc";
      case "Cancelled":
        return "Ca khám đã hủy";
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
  // Memoize format functions để tránh tạo lại mỗi lần render
  const formatDate = useCallback((dateString: string): string => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  }, []);

  const formatDateTime = useCallback((dateString: string): string => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Stats calculation - sử dụng useMemo để tránh tính toán lại
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const now = new Date();
    return {
      total: appointments.length,
      // ⭐ Đếm số ca khám hôm nay (CheckedIn hoặc InProgress và là của ngày hôm nay)
      upcoming: appointments.filter(a => {
        const isToday = isTodayAppointment(a.appointmentDate);
        const isValidStatus = a.status === "CheckedIn" || a.status === "InProgress";
        return isValidStatus && isToday;
      }).length,
      today: appointments.filter(a => {
        if (!a.appointmentDate) return false;
        const aptDate = new Date(a.appointmentDate).toISOString().split('T')[0];
        return aptDate === today;
      }).length,
      online: appointments.filter(a => a.mode === "Online").length,
      offline: appointments.filter(a => a.mode === "Offline").length,
      completed: appointments.filter(a => a.status === "Completed" || a.status === "Finalized").length,
    };
  }, [appointments]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  const columns = [
    { key: "date", label: "Ngày" },
    { key: "time", label: "Giờ" },
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

  // Không hiển thị full-page loading nữa, chỉ hiển thị skeleton hoặc để table hiển thị với loading state
  
  const handleViewMedicalRecord = async (appointmentId: string) => {
    toast.success("Đang chuyển đến hồ sơ khám bệnh...");
    navigate(`/doctor/medical-record/${appointmentId}`);
  };
  return (
    <div className="space-y-6 p-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch khám của tôi</h1>
          <p className="text-gray-600 mt-1">Quản lý và theo dõi lịch khám bệnh</p>
        </div>
        <Chip color="primary" variant="flat" size="lg" startContent={<CheckCircleIcon className="w-5 h-5" />}>
          Bác sĩ
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
              placeholder="Tìm kiếm bệnh nhân, dịch vụ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
              isClearable
              onClear={() => setSearchText("")}
              size="lg"
              variant="bordered"
            />

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

            <Select
              label="Trạng thái"
              placeholder="Chọn trạng thái"
              selectedKeys={selectedStatus !== "all" ? new Set([selectedStatus]) : new Set([])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setSelectedStatus(selected ? String(selected) : "all");
              }}
              size="lg"
              variant="bordered"
              startContent={<DocumentTextIcon className="w-5 h-5 text-gray-400" />}
            >
              <SelectItem key="all">Tất cả trạng thái</SelectItem>
              <SelectItem key="CheckedIn">Đã có mặt</SelectItem>
              <SelectItem key="InProgress">Đang trong ca khám</SelectItem>
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
            color="primary"
            variant="underlined"
          >
            <Tab 
              key="upcoming" 
              title={
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  <span>Các ca khám hôm nay ({stats.upcoming})</span>
                </div>
              } 
            />
            <Tab 
              key="history" 
              title={
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  <span>Lịch sử khám ({appointments.length - stats.upcoming})</span>
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
            aria-label="Bảng lịch khám của bác sĩ"
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
                    <div className="flex flex-col gap-2">
                      <Chip
                        size="lg"
                        color={getStatusColor(appointment.status)}
                        variant="flat"
                      >
                        {getStatusText(appointment.status)}
                      </Chip>
                      {/* Indicator cho medical record status */}
                      {appointment.status === "InProgress" || appointment.status === "Completed" ? (
                        appointment.medicalRecordStatus === "Finalized" ? (
                          <Chip
                            size="sm"
                            color="success"
                            variant="flat"
                            className="text-xs"
                          >
                            ✓ Đã duyệt hồ sơ
                          </Chip>
                        ) : appointment.medicalRecordStatus === "Draft" ? (
                          <Chip
                            size="sm"
                            color="warning"
                            variant="flat"
                            className="text-xs"
                          >
                            ⚠ Chưa duyệt hồ sơ
                          </Chip>
                        ) : (
                          <Chip
                            size="sm"
                            color="default"
                            variant="flat"
                            className="text-xs"
                          >
                            📝 Chưa có hồ sơ
                          </Chip>
                        )
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="primary"
                        onPress={() => handleViewAppointment(appointment.appointmentId)}
                        title="Xem chi tiết ca khám"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="secondary"
                        onPress={() => handleViewPatient(appointment.appointmentId)}
                        title="Xem chi tiết bệnh nhân"
                      >
                        <UserIcon className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="relative">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="success"
                        onPress={() => handleViewMedicalRecord(appointment.appointmentId)}
                        title="Xem hồ sơ khám bệnh"
                      >
                        <DocumentTextIcon className="w-5 h-5" />
                      </Button>
                      {/* Badge indicator trên button */}
                      {(appointment.status === "InProgress" || appointment.status === "Completed") && (
                        appointment.medicalRecordStatus === "Finalized" ? (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        ) : appointment.medicalRecordStatus === "Draft" ? (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></span>
                        ) : null
                      )}
                    </div>
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

      {/* Modals */}
      <AppointmentDetailModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        appointmentId={selectedAppointmentId}
      />
      
      <PatientDetailModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        appointmentId={selectedPatientId}
      />
    </div>
  );
};

export default DoctorSchedule;


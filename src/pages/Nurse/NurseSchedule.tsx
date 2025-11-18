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
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  PlayIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { nurseApi, type NurseAppointment, appointmentApi, leaveRequestApi } from "@/api";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/Common";
import AppointmentDetailModalNurse from "./AppointmentDetailModalNurse";
import PatientDetailModalNurse from "./PatientDetailModalNurse";

const NurseSchedule = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
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
  
  // ⭐ Approved leaves để check bác sĩ có On Leave không
  const [approvedLeaves, setApprovedLeaves] = useState<Array<{
    userId: string;
    startDate: string;
    endDate: string;
  }>>([]);

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

  // ⭐ Hàm lấy approved leaves
  const fetchApprovedLeaves = async () => {
    try {
      const res = await leaveRequestApi.getAllLeaveRequests({
        status: "Approved",
        limit: 1000,
      });
      
      if (!res || !res.success || !res.data) {
        console.warn('⚠️ [fetchApprovedLeaves] Invalid response:', res);
        setApprovedLeaves([]);
        return;
      }

      const leavesArray = Array.isArray(res.data) ? res.data : [];
      
      if (leavesArray.length > 0) {
        const leaves = leavesArray.map((leave: any) => {
          let userId = "";
          if (leave.userId) {
            if (typeof leave.userId === 'object' && leave.userId._id) {
              userId = leave.userId._id.toString();
            } else if (typeof leave.userId === 'string') {
              userId = leave.userId;
            } else {
              userId = String(leave.userId);
            }
          }
          
          return {
            userId: userId,
            startDate: leave.startDate,
            endDate: leave.endDate,
          };
        });
        
        console.log('✅ [fetchApprovedLeaves] Loaded', leaves.length, 'approved leaves');
        setApprovedLeaves(leaves);
      } else {
        console.log('⚠️ [fetchApprovedLeaves] No approved leaves found');
        setApprovedLeaves([]);
      }
    } catch (err: any) {
      console.error("❌ Error fetching approved leaves:", err);
      setApprovedLeaves([]);
    }
  };

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

  // ⭐ Helper: Kiểm tra xem appointment có phải là sắp tới (từ ngày mai trở đi) không
  const isFutureAppointment = (appointmentDate: string): boolean => {
    if (!appointmentDate) return false;
    
    const aptDate = new Date(appointmentDate);
    if (isNaN(aptDate.getTime())) return false;
    
    // Lấy ngày của appointment theo timezone Việt Nam
    const aptDateStr = aptDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); // Format: YYYY-MM-DD
    
    const today = getTodayInVietnam();
    const todayDate = new Date(today);
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
    
    // So sánh: appointment date >= tomorrow
    return aptDateStr >= tomorrowStr;
  };

  // ⭐ Helper: Check doctor có leave trong thời gian appointment không
  const isDoctorOnLeave = (appointment: NurseAppointment): boolean => {
    // ⭐ Cách 1: Check doctorStatus từ backend (nhanh và chính xác nhất)
    if (appointment.doctorStatus === 'On Leave') {
      return true;
    }
    
    // ⭐ Cách 2: Fallback - check approved leaves (nếu doctorStatus chưa được set)
    if (!appointment.doctorUserId || !appointment.appointmentDate || approvedLeaves.length === 0) {
      return false;
    }

    const appointmentDate = new Date(appointment.appointmentDate);
    appointmentDate.setHours(0, 0, 0, 0);

    return approvedLeaves.some((leave) => {
      if (leave.userId !== appointment.doctorUserId) return false;
      
      const leaveStart = new Date(leave.startDate);
      leaveStart.setHours(0, 0, 0, 0);
      const leaveEnd = new Date(leave.endDate);
      leaveEnd.setHours(23, 59, 59, 999);
      
      return appointmentDate >= leaveStart && appointmentDate <= leaveEnd;
    });
  };

  const fetchAppointments = useCallback(async (startDate?: string | null, endDate?: string | null, silent: boolean = false) => {
    try {
      // Chỉ set loading khi là lần fetch đầu tiên (không phải silent)
      if (!silent) {
        setLoading(true);
        // ⭐ FIX: Reset initialLoading khi bắt đầu fetch mới (khi refresh)
        setInitialLoading(true);
      }
      setError(null);
      
      const res = await nurseApi.getAppointmentsSchedule(startDate, endDate);
      
      // ⭐ FIX: Kiểm tra response đầy đủ để tránh crash
      if (res && res.success && res.data) {
        // ⭐ Đảm bảo data là array
        const appointmentsData = Array.isArray(res.data) ? res.data : [];
        setAppointments(appointmentsData);
        
        // Extract unique dates từ appointments (sử dụng formatDate inline để tránh dependency)
        const uniqueDates = [...new Set(appointmentsData.map(apt => {
          if (!apt.appointmentDate || apt.appointmentDate === "Chưa có") return "Chưa có";
          try {
            return new Date(apt.appointmentDate).toLocaleDateString("vi-VN");
          } catch (e) {
            console.warn("Invalid date format:", apt.appointmentDate);
            return "Chưa có";
          }
        }))].filter(d => d !== "Chưa có");
        setDates(uniqueDates);
      } else {
        setError(res?.message || "Lỗi lấy danh sách lịch khám");
        setAppointments([]); // ⭐ Đảm bảo appointments luôn là array
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err.message || "Lỗi khi tải lịch khám");
      setAppointments([]); // ⭐ Đảm bảo appointments luôn là array khi có lỗi
    } finally {
      if (!silent) {
        setInitialLoading(false);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // ⭐ FIX: Chỉ fetch khi đã xác nhận authentication status (không còn loading)
    if (!authLoading && isAuthenticated) {
      fetchAllDoctors(); // Lấy tất cả bác sĩ trước
      fetchApprovedLeaves(); // ⭐ Lấy approved leaves
      fetchAppointments(); // Fetch mặc định (2 tuần)
    }
  }, [isAuthenticated, authLoading]); // ⭐ FIX: Thêm authLoading vào dependency

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
  }, [dateRange.startDate, dateRange.endDate, isAuthenticated]); 

  // Sử dụng useMemo để tính toán filtered appointments - tránh re-render không cần thiết
  const filteredAppointments = useMemo(() => {
    // ⭐ FIX: Đảm bảo appointments luôn là array
    if (!Array.isArray(appointments)) {
      return [];
    }
    let filtered = [...appointments];

    // Sửa logic tab:
    // - Các ca khám hôm nay: hiển thị các ca có trạng thái Approved, CheckedIn hoặc InProgress VÀ là của ngày hôm nay
    // - Các ca khám sắp tới: hiển thị các ca có trạng thái Approved, CheckedIn hoặc InProgress VÀ là từ ngày mai trở đi
    // - Lịch sử khám: hiển thị các ca Completed, Expired, No-Show
    if (activeTab === "upcoming") {
      filtered = filtered.filter(apt => {
        // Chỉ hiển thị các ca có trạng thái Approved, CheckedIn hoặc InProgress VÀ là của ngày hôm nay
        const isToday = isTodayAppointment(apt.appointmentDate);
        const isValidStatus = apt.status === "Approved" || apt.status === "CheckedIn" || apt.status === "InProgress";
        return isValidStatus && isToday;
      });
    } else if (activeTab === "future") {
      filtered = filtered.filter(apt => {
        // Chỉ hiển thị các ca có trạng thái Approved, CheckedIn hoặc InProgress VÀ là từ ngày mai trở đi
        const isFuture = isFutureAppointment(apt.appointmentDate);
        const isValidStatus = apt.status === "Approved" || apt.status === "CheckedIn" || apt.status === "InProgress";
        return isValidStatus && isFuture;
      });
    } else if (activeTab === "history") {
      filtered = filtered.filter(apt => apt.status === "Completed" || apt.status === "Expired" || apt.status === "No-Show");
    }

    // Filter by search text (sử dụng debounced search text)
    if (debouncedSearchText) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(apt => {
        // Tìm theo tên bệnh nhân, bác sĩ, dịch vụ
        const matchesBasic = 
          apt.patientName.toLowerCase().includes(searchLower) ||
          apt.serviceName.toLowerCase().includes(searchLower) ||
          apt.doctorName.toLowerCase().includes(searchLower);
        
        // Tìm theo trạng thái (text search)
        const statusText = getStatusText(apt.status).toLowerCase();
        const matchesStatus = statusText.includes(searchLower);

        // Tìm theo ngày/giờ hiển thị tiếng Việt
        const appointmentDateVi = apt.appointmentDate
          ? new Date(apt.appointmentDate).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).toLowerCase()
          : "";
        const startTimeVi = apt.startTime
          ? new Date(apt.startTime).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).toLowerCase()
          : "";
        const matchesDate = appointmentDateVi.includes(searchLower) || startTimeVi.includes(searchLower);
        
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
        return matchesBasic || matchesStatus || matchesDate;
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

    // Sort by appointmentDate descending (ngày mới nhất lên đầu) sau đó sort by startTime descending
    filtered.sort((a, b) => {
      // So sánh theo appointmentDate trước (ngày mới nhất lên đầu)
      const dateA = a.appointmentDate || '';
      const dateB = b.appointmentDate || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA); // Descending: ngày mới nhất lên đầu
      }
      
      // Nếu cùng ngày, sort theo startTime (giờ muộn nhất lên đầu trong cùng ngày)
      const timeA = a.startTime || '';
      const timeB = b.startTime || '';
      return timeB.localeCompare(timeA); // Descending: giờ muộn nhất lên đầu
    });

    return filtered;
  }, [appointments, activeTab, debouncedSearchText, selectedMode, selectedDoctor, selectedStatus, isTodayAppointment, isFutureAppointment]);

  // Reset page khi filtered appointments thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText, selectedMode, selectedDoctor, selectedStatus, activeTab]);

  const handleViewAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsAppointmentModalOpen(true);
  };

  // ⭐ SỬA: Hàm này giờ nhận patientId
  const handleViewPatient = (patientId: string | null) => {
    if (patientId && patientId !== "Chưa có" && patientId !== "Trống") {
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

  const formatDate = (dateString: string): string => {
    if (!dateString || dateString === "Chưa có") return "Chưa có";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString: string): string => {
    if (!dateString || dateString === "Chưa có") return "Chưa có";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  // Removed duplicate stats calculation - now using useMemo below

  // Pagination
  // ⭐ FIX: Đảm bảo filteredAppointments luôn là array
  const safeFilteredAppointments = Array.isArray(filteredAppointments) ? filteredAppointments : [];
  const totalPages = Math.ceil(safeFilteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = safeFilteredAppointments.slice(startIndex, endIndex);

  // ⭐ FIX: Stats calculation - phải đặt TRƯỚC các early returns để tuân thủ Rules of Hooks
  const stats = useMemo(() => {
    // ⭐ FIX: Đảm bảo appointments luôn là array
    const safeAppointments = Array.isArray(appointments) ? appointments : [];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const historyStatuses = ["Completed", "Expired", "No-Show"];
    return {
      total: safeAppointments.length,
      // ⭐ Đếm số ca khám hôm nay (Approved, CheckedIn hoặc InProgress và là của ngày hôm nay)
      upcoming: safeAppointments.filter(a => {
        const isToday = isTodayAppointment(a.appointmentDate);
        const isValidStatus = a.status === "Approved" || a.status === "CheckedIn" || a.status === "InProgress";
        return isValidStatus && isToday;
      }).length,
      // ⭐ Đếm số ca khám sắp tới (Approved, CheckedIn hoặc InProgress và là từ ngày mai trở đi)
      future: safeAppointments.filter(a => {
        const isFuture = isFutureAppointment(a.appointmentDate);
        const isValidStatus = a.status === "Approved" || a.status === "CheckedIn" || a.status === "InProgress";
        return isValidStatus && isFuture;
      }).length,
      history: safeAppointments.filter(a => historyStatuses.includes(a.status)).length,
      today: safeAppointments.filter(a => {
        if (!a.appointmentDate) return false;
        try {
          const aptDate = new Date(a.appointmentDate).toISOString().split('T')[0];
          return aptDate === today;
        } catch (e) {
          return false;
        }
      }).length,
      online: safeAppointments.filter(a => a.mode === "Online").length,
      offline: safeAppointments.filter(a => a.mode === "Offline").length,
      completed: safeAppointments.filter(a => a.status === "Completed").length,
    };
  }, [appointments, isTodayAppointment, isFutureAppointment]);

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

  // ⭐ FIX: Hiển thị loading khi đang check authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardBody className="text-center p-8">
            <Spinner size="lg" label="Đang tải..." />
          </CardBody>
        </Card>
      </div>
    );
  }

  // ⭐ FIX: Kiểm tra authentication sau khi đã load xong
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

  return (
    <div className="space-y-6 p-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch khám của phòng khám</h1>
          <p className="text-gray-600 mt-1">Theo dõi tất cả ca khám của các bác sĩ</p>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              startContent={<ClipboardDocumentListIcon className="w-5 h-5 text-gray-400" />}
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
            color="secondary"
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
              key="future" 
              title={
                <div className="flex items-center gap-2">
                  <ArrowRightIcon className="w-5 h-5" />
                  <span>Các ca khám sắp tới ({stats.future})</span>
                </div>
              } 
            />
            <Tab 
              key="history" 
              title={
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  <span>Lịch sử khám ({stats.history})</span>
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
                    {(() => {
                      const isOnLeave = isDoctorOnLeave(appointment);
                      return isOnLeave ? (
                        <Chip variant="flat" color="danger" size="sm">
                          Vắng mặt
                        </Chip>
                      ) : (
                        <Chip variant="flat" color="primary" size="sm">
                          {appointment.doctorName}
                        </Chip>
                      );
                    })()}
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
                      onPress={() => handleViewPatient(appointment.patientId)}
                      title="Xem chi tiết bệnh nhân"
                    >
                      <UserIcon className="w-5 h-5" />
                    </Button>

                    {/* Nút đánh dấu đang trong ca khám (chỉ cho CheckedIn và bác sĩ không vắng mặt) */}
                    {/* Nút cập nhật trạng thái cho cả Offline và Consultation (Online) */}
                    {appointment.status === "CheckedIn" && !isDoctorOnLeave(appointment) && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="warning"
                        isLoading={updatingStatusId === appointment.appointmentId}
                        isDisabled={updatingStatusId === appointment.appointmentId}
                        title="Bắt đầu ca khám"
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
                        <PlayIcon className="w-5 h-5" />
                      </Button>
                    )}

                    {/* Hiển thị Hồ sơ bệnh án cho ca Offline khi đang khám (InProgress), đã bấm bắt đầu, hoặc đã Completed */}
                    {appointment.mode === "Offline" && (
                      appointment.status === "InProgress" ||
                      appointment.status === "Completed"
                    ) && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="success"
                        onPress={() => navigate(`/nurse/medical-record/${appointment.appointmentId}`)}
                        isDisabled={!appointment.patientId || appointment.patientId === "Chưa có" || appointment.patientId === "Trống"}
                        title="Xem hồ sơ bệnh án"
                      >
                        <ClipboardDocumentListIcon className="w-5 h-5" />
                      </Button>
                    )}

                    {/* Nút Hoàn thành cho ca InProgress - chỉ hiển thị khi doctor đã duyệt hồ sơ (status = "Finalized") */}
                    {appointment.status === "InProgress" && appointment.doctorApproved && (
                      <Button
                        isIconOnly
                        size="sm"
                        color="primary"
                        variant="flat"
                        isLoading={updatingStatusId === appointment.appointmentId}
                        isDisabled={updatingStatusId === appointment.appointmentId}
                        title="Hoàn thành ca khám"
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
                        <CheckCircleIcon className="w-5 h-5" />
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
        Hiển thị <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, safeFilteredAppointments.length)}</span> trong tổng số <span className="font-semibold">{safeFilteredAppointments.length}</span> ca khám
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


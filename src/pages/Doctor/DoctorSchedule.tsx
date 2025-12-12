
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Tooltip,
} from "@heroui/react";
import { 
  EyeIcon, 
  UserIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { doctorApi, type DoctorAppointment } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/Common";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import AppointmentDetailModal from "./AppointmentDetailModal";
import PatientDetailModal from "./PatientDetailModal";

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  // ⭐ State riêng để lưu tất cả appointments cho việc tính stats (không bị ảnh hưởng bởi tab/date filter)
  const [allAppointmentsForStats, setAllAppointmentsForStats] = useState<DoctorAppointment[]>([]);
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
  
  // ⭐ Track previous location để detect khi quay lại từ trang edit
  const prevLocationRef = useRef<string>(location.pathname);
  // ⭐ Track previous values để tránh gọi API không cần thiết
  const prevTabRef = useRef<string>(activeTab);
  const prevDateRangeRef = useRef<{startDate: string | null, endDate: string | null}>(dateRange);
  // ⭐ Ref để lưu dateRange mới nhất cho location change effect
  const dateRangeRef = useRef<{startDate: string | null, endDate: string | null}>(dateRange);
  // ⭐ Flag để đánh dấu đã fetch allAppointmentsForStats chưa
  const hasFetchedStatsRef = useRef<boolean>(false);

  const fetchAppointments = useCallback(async (startDate?: string | null, endDate?: string | null, silent: boolean = false, updateStats: boolean = false) => {
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
        
        // ⭐ Nếu updateStats = true, cập nhật allAppointmentsForStats để tính stats
        if (updateStats) {
          setAllAppointmentsForStats(res.data);
        }
        
        // Extract unique dates (sử dụng formatDate inline để tránh dependency)
        const uniqueDates = [...new Set(res.data.map(apt => {
          if (!apt.appointmentDate || apt.appointmentDate === "Chưa có") return "Chưa có";
          try {
            return new Date(apt.appointmentDate).toLocaleDateString("vi-VN");
          } catch (e) {
            return "Chưa có";
          }
        }))].filter(d => d !== "Chưa có");
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

  // ⭐ Fetch tất cả appointments để tính stats (chỉ fetch một lần khi mount)
  useEffect(() => {
    if (isAuthenticated && !hasFetchedStatsRef.current) {
      // ⭐ Fetch tất cả appointments (không filter date) để tính stats cho tất cả tabs
      // updateStats = true để cập nhật allAppointmentsForStats, silent = true để không hiển thị loading
      fetchAppointments(null, null, true, true);
      hasFetchedStatsRef.current = true;
      
      // ⭐ Sau đó fetch appointments cho tab mặc định (upcoming) để hiển thị trong table
      const today = getTodayInVietnam();
      fetchAppointments(today, today, false, false);
    }
    // ⭐ Loại bỏ fetchAppointments và getTodayInVietnam khỏi dependencies để tránh re-run không cần thiết
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ⭐ Helper: Lấy ngày hôm nay theo timezone Việt Nam (memoize để tránh tạo lại function)
  const getTodayInVietnam = useCallback((): string => {
    const now = new Date();
    // Lấy ngày hôm nay theo timezone Việt Nam
    const vietnamDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); // Format: YYYY-MM-DD
    return vietnamDateStr;
  }, []);

  // ⭐ Tối ưu: Gộp 2 useEffect thành 1 và chỉ fetch khi các giá trị thực sự thay đổi
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // ⭐ Chỉ fetch khi các giá trị thực sự thay đổi
    const currentTab = activeTab;
    const currentStartDate = dateRange.startDate;
    const currentEndDate = dateRange.endDate;
    const prevTab = prevTabRef.current;
    const prevDateRange = prevDateRangeRef.current;
    
    // Kiểm tra xem có thay đổi thực sự không
    const tabChanged = prevTab !== currentTab;
    const dateRangeChanged = prevDateRange.startDate !== currentStartDate || prevDateRange.endDate !== currentEndDate;
    
    if (!tabChanged && !dateRangeChanged) {
      return; // Không có thay đổi, không cần fetch
    }
    
    // Cập nhật refs
    prevTabRef.current = currentTab;
    prevDateRangeRef.current = { startDate: currentStartDate, endDate: currentEndDate };
    dateRangeRef.current = { startDate: currentStartDate, endDate: currentEndDate };
    
    if (currentTab === "history") {
      // Khi chọn tab "history", fetch tất cả lịch sử (không giới hạn date range)
      // Truyền null để BE lấy tất cả appointments không filter theo date
      // updateStats = false để không ghi đè allAppointmentsForStats
      fetchAppointments(null, null, false, false);
    } else if (currentTab === "future") {
      // Khi chọn tab "future", fetch từ ngày mai đến chủ nhật tuần sau
      const today = getTodayInVietnam();
      const todayDate = new Date(today);
      
      // Ngày mai
      const tomorrowDate = new Date(todayDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
      
      // Chủ nhật tuần sau
      const currentDayOfWeek = todayDate.getDay();
      const daysUntilThisSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
      const thisSunday = new Date(todayDate);
      thisSunday.setDate(thisSunday.getDate() + daysUntilThisSunday);
      const nextSunday = new Date(thisSunday);
      nextSunday.setDate(nextSunday.getDate() + 7);
      const nextSundayStr = nextSunday.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
      
      // updateStats = false để không ghi đè allAppointmentsForStats
      fetchAppointments(tomorrowStr, nextSundayStr, false, false);
    } else if (currentTab === "upcoming") {
      // ⭐ FIX: Tab "Các ca khám hôm nay": Fetch appointments của ngày hôm nay
      const today = getTodayInVietnam();
      // updateStats = false để không ghi đè allAppointmentsForStats
      fetchAppointments(today, today, false, false);
    } else if (currentStartDate && currentEndDate) {
      // Chỉ fetch khi cả startDate và endDate đều có giá trị
      // updateStats = false để không ghi đè allAppointmentsForStats
      fetchAppointments(currentStartDate, currentEndDate, false, false);
    } else if (!currentStartDate && !currentEndDate) {
      // Khi clear date range, fetch lại mặc định (2 tuần)
      // updateStats = false để không ghi đè allAppointmentsForStats
      fetchAppointments(undefined, undefined, false, false);
    }
    // ⭐ Loại bỏ fetchAppointments và getTodayInVietnam khỏi dependencies để tránh re-run không cần thiết
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateRange.startDate, dateRange.endDate, isAuthenticated]);

  // ⭐ Cập nhật dateRangeRef khi dateRange thay đổi
  useEffect(() => {
    dateRangeRef.current = dateRange;
  }, [dateRange]);

  // ⭐ Refetch appointments khi quay lại từ trang edit medical record
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const currentPath = location.pathname;
    const prevPath = prevLocationRef.current;
    
    // Nếu quay lại từ trang edit medical record (/doctor/medical-record/:id) về schedule
    if (prevPath.startsWith('/doctor/medical-record/') && currentPath === '/doctor/schedule') {
      // Refetch appointments để cập nhật medicalRecordStatus (silent để không hiển thị loading)
      // Sử dụng ref để lấy giá trị mới nhất
      const currentDateRange = dateRangeRef.current;
      fetchAppointments(currentDateRange.startDate || undefined, currentDateRange.endDate || undefined, true, false);
      // ⭐ Cũng refetch allAppointmentsForStats để cập nhật stats
      fetchAppointments(null, null, true, true);
      hasFetchedStatsRef.current = true; // Đánh dấu đã fetch stats
    }
    
    // Update previous location
    prevLocationRef.current = currentPath;
    // ⭐ Loại bỏ fetchAppointments khỏi dependencies để tránh re-run không cần thiết
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isAuthenticated]);

  // ⭐ Helper: Kiểm tra xem appointment có phải là của ngày hôm nay không (theo timezone Việt Nam)
  // Memoize để tránh tạo lại function mỗi lần render
  const isTodayAppointment = useCallback((appointmentDate: string): boolean => {
    if (!appointmentDate) return false;
    
    const aptDate = new Date(appointmentDate);
    if (isNaN(aptDate.getTime())) return false;
    
    // Lấy ngày của appointment theo timezone Việt Nam
    const aptDateStr = aptDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); // Format: YYYY-MM-DD
    
    const today = getTodayInVietnam();
    
    // So sánh chuỗi ngày (YYYY-MM-DD)
    return aptDateStr === today;
  }, [getTodayInVietnam]);

  // ⭐ Helper: Kiểm tra xem appointment có phải là sắp tới (từ ngày mai đến chủ nhật tuần sau) không
  // Memoize để tránh tạo lại function mỗi lần render
  const isFutureAppointment = useCallback((appointmentDate: string): boolean => {
    if (!appointmentDate) return false;
    
    const aptDate = new Date(appointmentDate);
    if (isNaN(aptDate.getTime())) return false;
    
    // Lấy ngày của appointment theo timezone Việt Nam
    const aptDateStr = aptDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); // Format: YYYY-MM-DD
    
    const today = getTodayInVietnam();
    const todayDate = new Date(today);
    
    // Ngày mai
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
    
    // Chủ nhật tuần sau (chủ nhật của tuần tiếp theo)
    // Tính toán: tìm chủ nhật của tuần hiện tại, sau đó cộng thêm 7 ngày để được chủ nhật tuần sau
    const currentDayOfWeek = todayDate.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    const daysUntilThisSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek; // Số ngày đến chủ nhật tuần này
    const thisSunday = new Date(todayDate);
    thisSunday.setDate(thisSunday.getDate() + daysUntilThisSunday);
    
    // Chủ nhật tuần sau = chủ nhật tuần này + 7 ngày
    const nextSunday = new Date(thisSunday);
    nextSunday.setDate(nextSunday.getDate() + 7);
    const nextSundayStr = nextSunday.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
    
    // So sánh: appointment date >= tomorrow && appointment date <= chủ nhật tuần sau
    return aptDateStr >= tomorrowStr && aptDateStr <= nextSundayStr;
  }, [getTodayInVietnam]);

  // Sử dụng useMemo để tính toán filtered appointments - tránh re-render không cần thiết
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Tab logic:
    // - Các ca khám hôm nay: hiển thị các ca có trạng thái Approved, CheckedIn, InProgress VÀ là của ngày hôm nay
    //   + Với ca khám Online: cũng hiển thị No-Show
    // - Các ca khám sắp tới: hiển thị các ca có trạng thái Approved, CheckedIn, InProgress VÀ là từ ngày mai trở đi
    //   + Với ca khám Online: cũng hiển thị No-Show
    // - History: hiển thị Completed, Expired, No-Show (cho cả Online và Offline)
    if (activeTab === "upcoming") {
      filtered = filtered.filter(apt => {
        const isToday = isTodayAppointment(apt.appointmentDate);
        // Với ca khám Online: hiển thị Approved, CheckedIn, InProgress, No-Show
        // Với ca khám Offline: chỉ hiển thị Approved, CheckedIn, InProgress
        const isValidStatus = apt.mode === "Online"
          ? (apt.status === "Approved" || apt.status === "CheckedIn" || apt.status === "InProgress" || apt.status === "No-Show")
          : (apt.status === "Approved" || apt.status === "CheckedIn" || apt.status === "InProgress");
        return isValidStatus && isToday;
      });
    } else if (activeTab === "future") {
      filtered = filtered.filter(apt => {
        const isFuture = isFutureAppointment(apt.appointmentDate);
        // Với ca khám Online: hiển thị Approved, CheckedIn, InProgress, No-Show
        // Với ca khám Offline: chỉ hiển thị Approved, CheckedIn, InProgress
        const isValidStatus = apt.mode === "Online"
          ? (apt.status === "Approved" || apt.status === "CheckedIn" || apt.status === "InProgress" || apt.status === "No-Show")
          : (apt.status === "Approved" || apt.status === "CheckedIn" || apt.status === "InProgress");
        return isValidStatus && isFuture;
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
          (apt.serviceName.toLowerCase().includes(searchLower) ||
          (apt.additionalServiceNames && apt.additionalServiceNames.some(s => s.toLowerCase().includes(searchLower))));
        
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

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    // ⭐ Sort logic: Ưu tiên updatedAt (mới nhất lên đầu), sau đó createdAt, sau đó startTime
    // Đặc biệt cho tab "today": ca khám được update sớm nhất (checkin, status change) sẽ lên đầu
    filtered.sort((a, b) => {
      // ⭐ Ưu tiên 1: updatedAt (mới nhất lên đầu) - chỉ áp dụng cho tab "today"
      if (activeTab === "upcoming") {
        const updatedAtA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const updatedAtB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (updatedAtA !== updatedAtB) {
          return updatedAtB - updatedAtA; // Descending: mới nhất lên đầu
        }
        
        // ⭐ Ưu tiên 2: createdAt (mới nhất lên đầu) nếu updatedAt giống nhau
        const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (createdAtA !== createdAtB) {
          return createdAtB - createdAtA; // Descending: mới nhất lên đầu
        }
      }
      
      // ⭐ Ưu tiên 3: appointmentDate (ngày mới nhất lên đầu)
      const dateA = a.appointmentDate || '';
      const dateB = b.appointmentDate || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA); // Descending: ngày mới nhất lên đầu
      }
      
      // ⭐ Ưu tiên 4: startTime (giờ muộn nhất lên đầu trong cùng ngày)
      const timeA = a.startTime || '';
      const timeB = b.startTime || '';
      return timeB.localeCompare(timeA); // Descending: giờ muộn nhất lên đầu
    });

    return filtered;
  }, [appointments, activeTab, debouncedSearchText, selectedMode, selectedStatus, isTodayAppointment, isFutureAppointment]);

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
    if (!dateString || dateString === "Chưa có" || dateString === "Chưa có thông tin") return "Chưa có thông tin";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  }, []);

  const formatDateTime = useCallback((dateString: string): string => {
    if (!dateString || dateString === "Chưa có" || dateString === "Chưa có thông tin") return "Chưa có thông tin";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  }, []);

  // Stats calculation - sử dụng useMemo để tránh tính toán lại
  // ⭐ Sử dụng allAppointmentsForStats thay vì appointments để stats luôn chính xác
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const historyStatuses = ["Completed", "Expired", "No-Show"];
    return {
      total: allAppointmentsForStats.length,
      // ⭐ Đếm số ca khám hôm nay
      // - Online: Approved, CheckedIn, InProgress, No-Show
      // - Offline: Approved, CheckedIn, InProgress
      upcoming: allAppointmentsForStats.filter(a => {
        const isToday = isTodayAppointment(a.appointmentDate);
        const isValidStatus = a.mode === "Online"
          ? (a.status === "Approved" || a.status === "CheckedIn" || a.status === "InProgress" || a.status === "No-Show")
          : (a.status === "Approved" || a.status === "CheckedIn" || a.status === "InProgress");
        return isValidStatus && isToday;
      }).length,
      // ⭐ Đếm số ca khám sắp tới
      // - Online: Approved, CheckedIn, InProgress, No-Show
      // - Offline: Approved, CheckedIn, InProgress
      future: allAppointmentsForStats.filter(a => {
        const isFuture = isFutureAppointment(a.appointmentDate);
        const isValidStatus = a.mode === "Online"
          ? (a.status === "Approved" || a.status === "CheckedIn" || a.status === "InProgress" || a.status === "No-Show")
          : (a.status === "Approved" || a.status === "CheckedIn" || a.status === "InProgress");
        return isValidStatus && isFuture;
      }).length,
      history: allAppointmentsForStats.filter(a => historyStatuses.includes(a.status)).length,
      today: allAppointmentsForStats.filter(a => {
        if (!a.appointmentDate) return false;
        const aptDate = new Date(a.appointmentDate).toISOString().split('T')[0];
        return aptDate === today;
      }).length,
      online: allAppointmentsForStats.filter(a => a.mode === "Online").length,
      offline: allAppointmentsForStats.filter(a => a.mode === "Offline").length,
      completed: allAppointmentsForStats.filter(a => a.status === "Completed" || a.status === "Finalized").length,
    };
  }, [allAppointmentsForStats, isTodayAppointment, isFutureAppointment]);

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
  
  // ⭐ Handler: Đánh dấu bệnh nhân vắng mặt (No-Show)
  const handleMarkNoShow = async (appointmentId: string) => {
    try {
      toast.loading('Đang cập nhật...', { id: 'no-show' });
      
      // Gọi API updateAppointmentStatus với status 'No-Show'
      const { appointmentApi } = await import('@/api');
      const res = await appointmentApi.updateAppointmentStatus(appointmentId, 'No-Show');
      
      if (res.success) {
        toast.success('Đã đánh dấu bệnh nhân vắng mặt', { id: 'no-show' });
        // Refresh appointments - fetch lại với date range hiện tại
        const currentDateRange = dateRangeRef.current;
        await fetchAppointments(currentDateRange.startDate || undefined, currentDateRange.endDate || undefined, false, false);
        // Cũng refresh stats
        await fetchAppointments(null, null, true, true);
      } else {
        toast.error(res.message || 'Không thể cập nhật trạng thái', { id: 'no-show' });
      }
    } catch (error: any) {
      console.error('Error marking no-show:', error);
      toast.error(error.message || 'Lỗi khi đánh dấu vắng mặt', { id: 'no-show' });
    }
  };

  // ⭐ Handler: Xác nhận lại ca khám đã vắng mặt (No-Show → Approved)
  const handleApproveNoShow = async (appointmentId: string) => {
    try {
      toast.loading('Đang xác nhận...', { id: 'approve-noshow' });
      
      // Gọi API updateAppointmentStatus với status 'Approved'
      const { appointmentApi } = await import('@/api');
      const res = await appointmentApi.updateAppointmentStatus(appointmentId, 'Approved');
      
      if (res.success) {
        toast.success('Đã xác nhận ca khám', { id: 'approve-noshow' });
        // Refresh appointments - fetch lại với date range hiện tại
        const currentDateRange = dateRangeRef.current;
        await fetchAppointments(currentDateRange.startDate || undefined, currentDateRange.endDate || undefined, false, false);
        // Cũng refresh stats
        await fetchAppointments(null, null, true, true);
      } else {
        toast.error(res.message || 'Không thể cập nhật trạng thái', { id: 'approve-noshow' });
      }
    } catch (error: any) {
      console.error('Error approving no-show:', error);
      toast.error(error.message || 'Lỗi khi xác nhận ca khám', { id: 'approve-noshow' });
    }
  };

  // ⭐ Handler: Hoàn thành ca khám trực tuyến (không cần hồ sơ khám bệnh)
  const handleCompleteOnlineAppointment = async (appointmentId: string) => {
    try {
      toast.loading('Đang hoàn thành ca khám...', { id: 'complete-online' });
      
      // Gọi API updateAppointmentStatus với status 'Completed'
      const { appointmentApi } = await import('@/api');
      const res = await appointmentApi.updateAppointmentStatus(appointmentId, 'Completed');
      
      if (res.success) {
        toast.success('Đã hoàn thành ca khám', { id: 'complete-online' });
        // Refresh appointments
        const currentDateRange = dateRangeRef.current;
        await fetchAppointments(currentDateRange.startDate || undefined, currentDateRange.endDate || undefined, false, false);
        await fetchAppointments(null, null, true, true);
      } else {
        toast.error(res.message || 'Không thể cập nhật trạng thái', { id: 'complete-online' });
      }
    } catch (error: any) {
      console.error('Error completing online appointment:', error);
      toast.error(error.message || 'Lỗi khi hoàn thành ca khám', { id: 'complete-online' });
    }
  };

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
      {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
      </div> */}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
            label="Tìm kiếm"
            labelPlacement="inside"
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
            label="Khoảng thời gian"
            labelPlacement="inside"
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
                    {/* ⭐ Hiển thị tất cả services nếu có additionalServiceNames (follow-up với nhiều services) */}
                    <div className="flex flex-col gap-1">
                      {/* ⭐ Hiển thị tất cả services nếu có additionalServiceNames (follow-up với nhiều services) */}
                      {appointment.type === "FollowUp" && appointment.additionalServiceNames && appointment.additionalServiceNames.length > 0 ? (
                        appointment.additionalServiceNames.map((serviceName, idx) => (
                          <p key={idx} className="text-sm text-gray-700">{serviceName}</p>
                        ))
                      ) : (
                        <p className="text-sm text-gray-700">{appointment.serviceName}</p>
                      )}
                      {/* ⭐ Hiển thị badge "Tái khám" nếu là follow-up */}
                      {appointment.type === "FollowUp" && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 w-fit">
                          Tái khám
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
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
                      {/* ⭐ Hiển thị link Google Meet cho ca khám online */}
                      {appointment.mode === "Online" && appointment.linkMeetUrl && (
                        <a
                          href={appointment.linkMeetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1"
                          title="Click để tham gia Google Meet"
                        >
                          <VideoCameraIcon className="w-3 h-3" />
                          <span>Link Meet</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
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
                      {/* Indicator cho medical record status - chỉ hiển thị cho ca khám Offline */}
                      {appointment.noTreatment ? (
                        <Chip
                          size="sm"
                          color="default"
                          variant="flat"
                          className="text-xs"
                        >
                          Không cần khám
                        </Chip>
                      ) : (
                        // Chỉ hiển thị medical record status cho ca khám Offline
                        appointment.mode === "Offline" && (appointment.status === "InProgress" || appointment.status === "Completed") && (
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
                        )
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    {/* ⭐ Logic riêng cho ca khám Online */}
                    {appointment.mode === "Online" ? (
                      <>
                        {/* Nút xem chi tiết luôn hiển thị */}
                        <Tooltip content="Xem chi tiết">
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
                        </Tooltip>
                        
                        {/* Nút xem bệnh nhân luôn hiển thị */}
                        <Tooltip content="Xem bệnh nhân">
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
                        </Tooltip>

                        {/* Nút Vắng mặt - chỉ hiển thị khi Approved hoặc CheckedIn */}
                        {(appointment.status === "Approved" || appointment.status === "CheckedIn") && (
                          <Tooltip content="Vắng mặt">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              color="warning"
                              onPress={() => handleMarkNoShow(appointment.appointmentId)}
                              title="Đánh dấu vắng mặt"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </Button>
                          </Tooltip>
                        )}

                        {/* Nút Hoàn thành - chỉ hiển thị khi Approved hoặc CheckedIn */}
                        {(appointment.status === "Approved" || appointment.status === "CheckedIn") && (
                          <Tooltip content="Hoàn thành">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              color="success"
                              onPress={() => handleCompleteOnlineAppointment(appointment.appointmentId)}
                              title="Hoàn thành ca khám"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </Button>
                          </Tooltip>
                        )}

                        {/* Nút Xác nhận - chỉ hiển thị khi No-Show */}
                        {appointment.status === "No-Show" && (
                          <Tooltip content="Xác nhận">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              color="success"
                              onPress={() => handleApproveNoShow(appointment.appointmentId)}
                              title="Xác nhận ca khám"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </Button>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      /* ⭐ Logic cho ca khám Offline (giữ nguyên) */
                      <>
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
                        {/* Ẩn nút hồ sơ khi status là Approved hoặc CheckedIn; chỉ hiển thị khi InProgress hoặc Completed */}
                        {appointment.status !== "Approved" && 
                         appointment.status !== "CheckedIn" && 
                         (appointment.status === "InProgress" || appointment.status === "Completed") &&
                         !appointment.noTreatment && (
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
                          </div>
                        )}
                      </>
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


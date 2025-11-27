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
  const [tabCounts, setTabCounts] = useState({
    today: 0,
    future: 0,
    history: 0,
  });
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

  const refreshTabCounts = useCallback(async () => {
    try {
      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
      const todayDate = new Date(todayStr);

      const tomorrowDate = new Date(todayDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

      const currentDayOfWeek = todayDate.getDay();
      const daysUntilThisSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
      const thisSunday = new Date(todayDate);
      thisSunday.setDate(thisSunday.getDate() + daysUntilThisSunday);
      const nextSunday = new Date(thisSunday);
      nextSunday.setDate(nextSunday.getDate() + 7);
      const nextSundayStr = nextSunday.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

      const [todayRes, futureRes, historyRes] = await Promise.all([
        nurseApi.getAppointmentsSchedule(todayStr, todayStr),
        nurseApi.getAppointmentsSchedule(tomorrowStr, nextSundayStr),
        nurseApi.getAppointmentsSchedule(null, null),
      ]);

      const getAppointmentsFromResponse = (res: any) => {
        if (res && res.success && Array.isArray(res.data)) {
          return res.data as NurseAppointment[];
        }
        return [] as NurseAppointment[];
      };

      const activeStatuses = new Set(["Approved", "CheckedIn", "InProgress"]);
      const historyStatuses = new Set(["Completed", "Expired", "No-Show"]);

      const todayAppointments = getAppointmentsFromResponse(todayRes);
      const futureAppointments = getAppointmentsFromResponse(futureRes);
      const historyAppointments = getAppointmentsFromResponse(historyRes);

      setTabCounts({
        today: todayAppointments.filter((apt) => activeStatuses.has(apt.status)).length,
        future: futureAppointments.filter((apt) => activeStatuses.has(apt.status)).length,
        history: historyAppointments.filter((apt) => historyStatuses.has(apt.status)).length,
      });
    } catch (error) {
      console.error("Error refreshing tab counts:", error);
      setTabCounts({
        today: 0,
        future: 0,
        history: 0,
      });
    }
  }, []);

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
        refreshTabCounts();
        
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
        refreshTabCounts();
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err.message || "Lỗi khi tải lịch khám");
      setAppointments([]); // ⭐ Đảm bảo appointments luôn là array khi có lỗi
      refreshTabCounts();
    } finally {
      if (!silent) {
        setInitialLoading(false);
        setLoading(false);
      }
    }
  }, [refreshTabCounts]);

  useEffect(() => {
    // ⭐ FIX: Chỉ fetch khi đã xác nhận authentication status (không còn loading)
    if (!authLoading && isAuthenticated) {
      fetchAllDoctors(); // Lấy tất cả bác sĩ trước
      fetchApprovedLeaves(); // ⭐ Lấy approved leaves
      fetchAppointments(); // Fetch mặc định (2 tuần)
      refreshTabCounts();
    }
    // ⭐ Loại bỏ các function khỏi dependencies để tránh re-run không cần thiết
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, refreshTabCounts]);

  // Debounce search text để tránh filter quá nhiều lần
  useEffect(() => {
    // Nếu searchText rỗng, clear ngay lập tức
    if (!searchText || !searchText.trim()) {
      setDebouncedSearchText("");
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchText]);

  // ⭐ FIX: Fetch appointments khi switch tab hoặc dateRange thay đổi
  useEffect(() => {
    if (!isAuthenticated) return;

    // Nếu người dùng đang chọn khoảng thời gian, ưu tiên sử dụng filters này
    if (dateRange.startDate && dateRange.endDate) {
      fetchAppointments(dateRange.startDate, dateRange.endDate);
      return;
    }

    // Không có date range tùy chỉnh -> sử dụng các tab mặc định
    if (activeTab === "upcoming") {
      const today = getTodayInVietnam();
      fetchAppointments(today, today);
    } else if (activeTab === "future") {
      const today = getTodayInVietnam();
      const todayDate = new Date(today);
      const tomorrowDate = new Date(todayDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

      const currentDayOfWeek = todayDate.getDay();
      const daysUntilThisSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
      const thisSunday = new Date(todayDate);
      thisSunday.setDate(thisSunday.getDate() + daysUntilThisSunday);
      const nextSunday = new Date(thisSunday);
      nextSunday.setDate(nextSunday.getDate() + 7);
      const nextSundayStr = nextSunday.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

      fetchAppointments(tomorrowStr, nextSundayStr);
    } else if (activeTab === "history") {
      fetchAppointments(null, null);
    } else {
      fetchAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateRange.startDate, dateRange.endDate, isAuthenticated]);

  // Helper function để normalize text (loại bỏ dấu tiếng Việt)
  const normalizeText = useCallback((text: string): string => {
    if (!text || typeof text !== 'string') return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }, []);

  const getStatusText = useCallback((status: string) => {
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
  }, []);

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
    if (debouncedSearchText && debouncedSearchText.trim()) {
      const searchLower = debouncedSearchText.toLowerCase().trim();
      const searchNormalized = normalizeText(searchLower);
      
      filtered = filtered.filter(apt => {
        try {
          // Tìm theo tên bệnh nhân
          let matchesPatient = false;
          if (apt.patientName && typeof apt.patientName === 'string') {
            const patientNameLower = apt.patientName.toLowerCase();
            const patientNameNormalized = normalizeText(apt.patientName);
            matchesPatient = patientNameLower.includes(searchLower) || patientNameNormalized.includes(searchNormalized);
          }
          
          // Tìm theo tên dịch vụ
          let matchesService = false;
          if (apt.serviceName && typeof apt.serviceName === 'string') {
            const serviceNameLower = apt.serviceName.toLowerCase();
            const serviceNameNormalized = normalizeText(apt.serviceName);
            matchesService = serviceNameLower.includes(searchLower) || serviceNameNormalized.includes(searchNormalized);
          }
          
          // Tìm theo dịch vụ bổ sung
          let matchesAdditionalService = false;
          if (apt.additionalServiceNames && Array.isArray(apt.additionalServiceNames)) {
            matchesAdditionalService = apt.additionalServiceNames.some(s => {
              if (!s || typeof s !== 'string') return false;
              const serviceLower = s.toLowerCase();
              const serviceNormalized = normalizeText(s);
              return serviceLower.includes(searchLower) || serviceNormalized.includes(searchNormalized);
            });
          }
          
          // Tìm theo tên bác sĩ
          let matchesDoctor = false;
          if (apt.doctorName && typeof apt.doctorName === 'string') {
            const doctorNameLower = apt.doctorName.toLowerCase();
            const doctorNameNormalized = normalizeText(apt.doctorName);
            matchesDoctor = doctorNameLower.includes(searchLower) || doctorNameNormalized.includes(searchNormalized);
          }
          
          const matchesBasic = matchesPatient || matchesService || matchesAdditionalService || matchesDoctor;
          
          // Tìm theo trạng thái (text search)
          const statusText = getStatusText(apt.status).toLowerCase();
          const matchesStatus = statusText.includes(searchLower);

          // Tìm theo ngày hiển thị tiếng Việt
          let appointmentDateVi = "";
          if (apt.appointmentDate) {
            try {
              const date = new Date(apt.appointmentDate);
              if (!isNaN(date.getTime())) {
                appointmentDateVi = date.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).toLowerCase();
              }
            } catch (e) { /* Ignore date parsing errors */ }
          }
          
          // Tìm theo giờ (startTime và endTime có thể là "HH:mm" hoặc ISO string)
          const startTimeStr = apt.startTime ? apt.startTime.toLowerCase() : "";
          const endTimeStr = apt.endTime ? apt.endTime.toLowerCase() : "";
          
          // Tìm trong cả format hiển thị (nếu có formatDate được dùng)
          let startTimeVi = "";
          if (apt.startTime) {
            try {
              const time = new Date(apt.startTime);
              if (!isNaN(time.getTime())) {
                startTimeVi = time.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).toLowerCase();
              } else {
                startTimeVi = apt.startTime.toLowerCase(); // Fallback to raw string if not a valid date
              }
            } catch (e) {
              startTimeVi = apt.startTime.toLowerCase(); // Fallback to raw string if parsing fails
            }
          }
          
          const matchesDate = appointmentDateVi.includes(searchLower) || 
                            startTimeStr.includes(searchLower) || 
                            endTimeStr.includes(searchLower) ||
                            startTimeVi.includes(searchLower);
          
          // Tìm theo các từ khóa đặc biệt - nếu search chứa keyword thì chỉ match với status tương ứng
          if (searchLower.includes('đang trong ca khám') || searchLower.includes('inprogress')) {
            return apt.status === 'InProgress';
          }
          if (searchLower.includes('đã có mặt') || searchLower.includes('đã nhận') || searchLower.includes('check-in')) {
            return apt.status === 'CheckedIn';
          }
          
          return matchesBasic || matchesStatus || matchesDate;
        } catch (error) {
          console.error("Error filtering appointment:", error, apt);
          return false;
        }
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
  }, [appointments, activeTab, debouncedSearchText, selectedMode, selectedDoctor, selectedStatus, isTodayAppointment, isFutureAppointment, getStatusText, normalizeText]);

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

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
            label="Tìm kiếm"
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
              label="Khoảng thời gian"
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={(startDate, endDate) => setDateRange({ startDate, endDate })}
              placeholder="Chọn khoảng thời gian"
              className="w-full text-gray-500"
            />

            <Select
              label="Hình thức"
              labelPlacement="inside"
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
                  <span>Các ca khám hôm nay ({tabCounts.today})</span>
                </div>
              } 
            />
            <Tab 
              key="future" 
              title={
                <div className="flex items-center gap-2">
                  <ArrowRightIcon className="w-5 h-5" />
                  <span>Các ca khám sắp tới ({tabCounts.future})</span>
                </div>
              } 
            />
            <Tab 
              key="history" 
              title={
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  <span>Lịch sử khám ({tabCounts.history})</span>
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


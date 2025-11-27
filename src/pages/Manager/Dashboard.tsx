import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  LabelList,
} from "recharts";
import {
  CalendarIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import toast from "react-hot-toast";
import { managerApi } from "../../api/manager";
import { Tabs, Tab } from "@heroui/react";
import viLocale from "@/utils/viLocale";

// Register Vietnamese locale
registerLocale("vi", viLocale as any);
setDefaultLocale("vi");

interface DashboardData {
  filterRange: {
    startDate: string;
    endDate: string;
  };
  appointments: {
    total: number;
    examination: number;
    consultation: number;
  };
  revenue: {
    Examination: number;
    Consultation: number;
    total: number;
  };
  patients: {
    total: number;
    newPatients: number;
  };
}

interface ServiceRevenueData {
  filterRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalServices: number;
    totalOriginalRevenue: number;
    totalPaidRevenue: number;
    totalRevenue: number;
    totalCount: number;
  };
  services: Array<{
    serviceId: string;
    serviceName: string;
    category: string;
    originalPrice: number;
    paidPrice: number;
    count: number;
    totalOriginalRevenue: number;
    totalPaidRevenue: number;
    totalRevenue: number;
  }>;
}

const Dashboard = () => {
  // Selected month for specific month revenue (default: current month)
  const getDefaultMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<{ year: number; quarter: number }>({
    year: new Date().getFullYear(),
    quarter: Math.floor(new Date().getMonth() / 3) + 1,
  });
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<{
    year: number;
    revenue: number[];
  } | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [yearlyData, setYearlyData] = useState<DashboardData | null>(null);
  const [quarterlyData, setQuarterlyData] = useState<DashboardData | null>(null);
  const [serviceRevenueData, setServiceRevenueData] = useState<ServiceRevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);
  const [isLoadingYearly, setIsLoadingYearly] = useState(false);
  const [isLoadingQuarterly, setIsLoadingQuarterly] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Get start and end date of selected month
  const getMonthDateRange = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    return { start, end };
  };

  // Get start and end date of selected year
  const getYearDateRange = (year: number) => {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { start, end };
  };

  // Get start and end date of selected quarter
  const getQuarterDateRange = (year: number, quarter: number) => {
    const startMonth = (quarter - 1) * 3;
    const endMonth = startMonth + 2;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);
    return { start, end };
  };

  // Fetch dashboard data for specific month
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const { start, end } = getMonthDateRange(selectedMonth);
      
      const response = await managerApi.getDashboardStats(
        start.toISOString(),
        end.toISOString()
      );

      // Backend returns: { success: true, message: 'Doanh thu', result: {...} }
      // But ApiResponse wraps it in data, so check both
      const dashboardResult = (response as any).result || response.data?.result || response.data;
      
      if (response.success && dashboardResult) {
        setDashboardData(dashboardResult);
      } else {
        toast.error(response.message || "Không thể tải dữ liệu thống kê");
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error(error?.message || "Lỗi khi tải dữ liệu thống kê");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch monthly revenue comparison
  const fetchMonthlyRevenue = async () => {
    try {
      setIsLoadingMonthly(true);
      const now = new Date();
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const response = await managerApi.getMonthlyRevenue(
        startOfYear.toISOString(),
        endOfYear.toISOString()
      );

      // Backend returns: { success: true, message: '...', result: {...} }
      // But ApiResponse wraps it in data, so check both
      const monthlyResult = (response as any).result || response.data?.result || response.data;
      
      if (response.success && monthlyResult) {
        setMonthlyRevenueData(monthlyResult);
      } else {
        toast.error(response.message || "Không thể tải dữ liệu doanh thu theo tháng");
      }
    } catch (error: any) {
      console.error("Error fetching monthly revenue:", error);
      toast.error(error?.message || "Lỗi khi tải dữ liệu doanh thu theo tháng");
    } finally {
      setIsLoadingMonthly(false);
    }
  };

  // Fetch yearly statistics
  const fetchYearlyData = async () => {
    try {
      setIsLoadingYearly(true);
      const { start, end } = getYearDateRange(selectedYear);
      
      const response = await managerApi.getDashboardStats(
        start.toISOString(),
        end.toISOString()
      );

      const yearlyResult = (response as any).result || response.data?.result || response.data;
      
      if (response.success && yearlyResult) {
        setYearlyData(yearlyResult);
      } else {
        toast.error(response.message || "Không thể tải dữ liệu thống kê năm");
      }
    } catch (error: any) {
      console.error("Error fetching yearly data:", error);
      toast.error(error?.message || "Lỗi khi tải dữ liệu thống kê năm");
    } finally {
      setIsLoadingYearly(false);
    }
  };

  // Fetch quarterly statistics
  const fetchQuarterlyData = async () => {
    try {
      setIsLoadingQuarterly(true);
      const { start, end } = getQuarterDateRange(selectedQuarter.year, selectedQuarter.quarter);
      
      const response = await managerApi.getDashboardStats(
        start.toISOString(),
        end.toISOString()
      );

      const quarterlyResult = (response as any).result || response.data?.result || response.data;
      
      if (response.success && quarterlyResult) {
        setQuarterlyData(quarterlyResult);
      } else {
        toast.error(response.message || "Không thể tải dữ liệu thống kê quý");
      }
    } catch (error: any) {
      console.error("Error fetching quarterly data:", error);
      toast.error(error?.message || "Lỗi khi tải dữ liệu thống kê quý");
    } finally {
      setIsLoadingQuarterly(false);
    }
  };

  // Fetch service revenue report
  const fetchServiceRevenue = async (startDate?: string, endDate?: string) => {
    try {
      setIsLoadingServices(true);
      
      const response = await managerApi.getServiceRevenueReport(
        startDate,
        endDate
      );

      const serviceResult = (response as any).result || response.data?.result || response.data;
      
      if (response.success && serviceResult) {
        setServiceRevenueData(serviceResult);
      } else {
        toast.error(response.message || "Không thể tải dữ liệu phân tích dịch vụ");
      }
    } catch (error: any) {
      console.error("Error fetching service revenue:", error);
      toast.error(error?.message || "Lỗi khi tải dữ liệu phân tích dịch vụ");
    } finally {
      setIsLoadingServices(false);
    }
  };

  // Fetch data on mount and when selected month changes
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Fetch monthly revenue on mount
  useEffect(() => {
    fetchMonthlyRevenue();
  }, []);

  // Fetch yearly data when year changes
  useEffect(() => {
    fetchYearlyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // Fetch quarterly data when quarter changes
  useEffect(() => {
    fetchQuarterlyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuarter]);

  // Fetch service revenue on mount (default to current month)
  useEffect(() => {
    const { start, end } = getMonthDateRange(selectedMonth);
    fetchServiceRevenue(start.toISOString(), end.toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format currency without symbol (for labels and Y-axis)
  const formatCurrencyNoSymbol = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };


  // Format month name
  const getMonthName = (monthIndex: number) => {
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];
    return months[monthIndex];
  };

  // Prepare monthly comparison data for chart
  const monthlyChartData = monthlyRevenueData?.revenue.map((revenue, index) => ({
    month: getMonthName(index),
    doanhThu: revenue,
  })) || [];

  // Export service revenue report to PDF using backend endpoint
  const handleExportPDF = async () => {
    if (!dashboardData) {
      toast.error("Không có dữ liệu để xuất PDF");
      return;
    }

    try {
      const { start, end } = getMonthDateRange(selectedMonth);
      
      // Show loading toast
      const loadingToast = toast.loading("Đang tạo PDF...");
      
      // Call backend PDF endpoint
      const blob = await managerApi.exportServiceRevenuePDF(
        start.toISOString(),
        end.toISOString()
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Generate filename with date range
      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];
      link.download = `bao-cao-doanh-thu-dich-vu-${startDateStr}-${endDateStr}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success("Xuất PDF thành công!");
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast.error("Lỗi khi xuất PDF: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              Thống kê phòng khám
            </h1>
            <p className="text-sm text-gray-600">
              Theo dõi hiệu suất và phân tích dữ liệu phòng khám
            </p>
          </div>
          {dashboardData && (
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>Xuất PDF báo cáo dịch vụ</span>
            </button>
          )}
        </div>
      </div>

      {/* Revenue sections in tabs - tab headers fill width */}
      <Tabs
        aria-label="Phân hệ thống kê"
        color="default"
        variant="underlined"
        className="mb-6"
        classNames={{
          tabList: "w-full grid grid-cols-5 gap-0",
          tab: "w-full",
          tabContent: "w-full text-center font-semibold group-data-[selected=true]:text-gray-900 text-xs md:text-sm",
          cursor: "w-full bg-gray-900",
        }}
      >
        <Tab key="specific" title="Doanh thu tháng cụ thể">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Doanh thu tháng cụ thể
            </h2>
            <p className="text-sm text-gray-600">
              Xem chi tiết doanh thu và thống kê của một tháng
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
            <DatePicker
              selected={selectedMonth}
              onChange={(date) => setSelectedMonth(date || new Date())}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              locale="vi"
              className="w-32 text-sm focus:outline-none bg-transparent"
              placeholderText="Chọn tháng"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39BDCC]"></div>
          </div>
        )}

        {/* Summary Cards */}
        {!isLoading && dashboardData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Total Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Tổng ca khám
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {(dashboardData.appointments?.total || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 font-medium">
                      Trong khoảng thời gian đã chọn
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Examination Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Ca khám bệnh
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {(dashboardData.appointments?.examination || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 font-medium">
                      {(dashboardData.appointments?.total || 0) > 0
                        ? `${(((dashboardData.appointments?.examination || 0) / (dashboardData.appointments?.total || 1)) * 100).toFixed(1)}% tổng số`
                        : "Không có dữ liệu"}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Consultation Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Ca tư vấn
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {(dashboardData.appointments?.consultation || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 font-medium">
                      {(dashboardData.appointments?.total || 0) > 0
                        ? `${(((dashboardData.appointments?.consultation || 0) / (dashboardData.appointments?.total || 1)) * 100).toFixed(1)}% tổng số`
                        : "Không có dữ liệu"}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-[#39BDCC] to-[#2da5b3] rounded-xl shadow-sm p-6 text-white">
              <p className="text-sm font-medium mb-1 opacity-90">
                Tổng doanh thu
              </p>
              <p className="text-3xl font-bold mb-2">
                {formatCurrency(dashboardData.revenue?.total || 0)}
              </p>
              <p className="text-xs opacity-75">
                Trong khoảng thời gian đã chọn
              </p>
            </div>

            {/* Examination Revenue */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm font-medium text-gray-600 mb-1">
                Doanh thu khám bệnh
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(dashboardData.revenue?.Examination || 0)}
              </p>
              <p className="text-xs text-gray-500">
                {(dashboardData.revenue?.total || 0) > 0
                  ? `${(((dashboardData.revenue?.Examination || 0) / (dashboardData.revenue?.total || 1)) * 100).toFixed(1)}% tổng doanh thu`
                  : "Không có dữ liệu"}
              </p>
            </div>

            {/* Consultation Revenue */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm font-medium text-gray-600 mb-1">
                Doanh thu tư vấn
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(dashboardData.revenue?.Consultation || 0)}
              </p>
              <p className="text-xs text-gray-500">
                {(dashboardData.revenue?.total || 0) > 0
                  ? `${(((dashboardData.revenue?.Consultation || 0) / (dashboardData.revenue?.total || 1)) * 100).toFixed(1)}% tổng doanh thu`
                  : "Không có dữ liệu"}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointment Status Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Thống kê hình thức khám
                </h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {(dashboardData.appointments?.total || 0).toLocaleString()}
                  </p>
                  <span className="text-sm text-gray-600">tổng ca khám</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    {
                      name: "Khám bệnh",
                      value: dashboardData.appointments?.examination || 0,
                      color: "#39BDCC",
                    },
                    {
                      name: "Tư vấn",
                      value: dashboardData.appointments?.consultation || 0,
                      color: "#8B5CF6",
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    allowDecimals={false}
                    tickFormatter={(value) => {
                      return Math.round(value).toString();
                    }}
                  />

                  <Bar
                    dataKey="value"
                    fill="#39BDCC"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  >
                    {[
                      {
                        name: "Khám bệnh",
                        value: dashboardData.appointments?.examination || 0,
                        color: "#39BDCC",
                      },
                      {
                        name: "Tư vấn",
                        value: dashboardData.appointments?.consultation || 0,
                        color: "#8B5CF6",
                      },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Distribution Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Phân bổ doanh thu theo dịch vụ
                </h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData.revenue?.total || 0)}
                  </p>
                  <span className="text-sm text-gray-600">tổng doanh thu</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Khám bệnh",
                          value: dashboardData.revenue?.Examination || 0,
                          color: "#39BDCC",
                        },
                        {
                          name: "Tư vấn",
                          value: dashboardData.revenue?.Consultation || 0,
                          color: "#8B5CF6",
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        {
                          name: "Khám bệnh",
                          value: dashboardData.revenue?.Examination || 0,
                          color: "#39BDCC",
                        },
                        {
                          name: "Tư vấn",
                          value: dashboardData.revenue?.Consultation || 0,
                          color: "#8B5CF6",
                        },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry: any) => (
                        <span className="text-sm text-gray-700">
                          {value} ({formatCurrency(entry.payload.value)})
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            </div>
          </>
        )}
        </div>
        </Tab>
        <Tab key="compare" title="So sánh doanh thu giữa các tháng">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            So sánh doanh thu giữa các tháng
          </h2>
          <p className="text-sm text-gray-600">
            Biểu đồ so sánh doanh thu 12 tháng trong năm {monthlyRevenueData?.year || new Date().getFullYear()}
          </p>
        </div>

        {/* Loading State */}
        {isLoadingMonthly && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39BDCC]"></div>
          </div>
        )}

        {/* Monthly Comparison Chart - Line Chart (Similar to gold price chart) */}
        {!isLoadingMonthly && monthlyRevenueData && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyChartData} margin={{ top: 50, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#374151", fontSize: 12 }}
                axisLine={{ stroke: "#D1D5DB" }}
                tickLine={{ stroke: "#D1D5DB" }}
              />
              <YAxis
                tick={{ fill: "#374151", fontSize: 12 }}
                axisLine={{ stroke: "#D1D5DB" }}
                tickLine={{ stroke: "#D1D5DB" }}
                tickCount={8}
                tickFormatter={(value) => {
                  return formatCurrencyNoSymbol(value);
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="doanhThu"
                stroke="#39BDCC"
                strokeWidth={2.5}
                dot={{ fill: "#39BDCC", r: 4 }}
                activeDot={{ r: 6 }}
                name="Doanh thu"
              >
                <LabelList
                  dataKey="doanhThu"
                  position="top"
                  formatter={(value: any) => formatCurrencyNoSymbol(Number(value) || 0)}
                  style={{ fill: "#374151", fontSize: 11, fontWeight: 500 }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        )}
        </div>
        </Tab>

        <Tab key="yearly" title="Thống kê năm">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Thống kê theo năm
                </h2>
                <p className="text-sm text-gray-600">
                  Xem tổng quan thống kê và doanh thu của một năm
                </p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-32 text-sm focus:outline-none bg-transparent border-none"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingYearly && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39BDCC]"></div>
              </div>
            )}

            {!isLoadingYearly && yearlyData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">Tổng ca khám</p>
                        <p className="text-3xl font-bold text-gray-900 mb-2">
                          {(yearlyData.appointments?.total || 0).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Khám bệnh: {(yearlyData.appointments?.examination || 0).toLocaleString()}</span>
                          <span>•</span>
                          <span>Tư vấn: {(yearlyData.appointments?.consultation || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#39BDCC] to-[#2da5b3] rounded-xl shadow-sm p-6 text-white">
                    <p className="text-sm font-medium mb-1 opacity-90">Tổng doanh thu</p>
                    <p className="text-3xl font-bold mb-2">
                      {formatCurrency(yearlyData.revenue?.total || 0)}
                    </p>
                    <p className="text-xs opacity-75">Năm {selectedYear}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bổ doanh thu</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Khám bệnh", value: yearlyData.revenue?.Examination || 0, color: "#39BDCC" },
                            { name: "Tư vấn", value: yearlyData.revenue?.Consultation || 0, color: "#8B5CF6" },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[
                            { name: "Khám bệnh", value: yearlyData.revenue?.Examination || 0, color: "#39BDCC" },
                            { name: "Tư vấn", value: yearlyData.revenue?.Consultation || 0, color: "#8B5CF6" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình thức khám</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          { name: "Khám bệnh", value: yearlyData.appointments?.examination || 0 },
                          { name: "Tư vấn", value: yearlyData.appointments?.consultation || 0 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} allowDecimals={false} />
                        <Bar dataKey="value" fill="#39BDCC" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        </Tab>

        <Tab key="quarterly" title="Thống kê quý">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Thống kê theo quý
                </h2>
                <p className="text-sm text-gray-600">
                  Xem tổng quan thống kê và doanh thu của một quý
                </p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedQuarter.year}
                  onChange={(e) => setSelectedQuarter({ ...selectedQuarter, year: Number(e.target.value) })}
                  className="w-24 text-sm focus:outline-none bg-transparent border-none"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedQuarter.quarter}
                  onChange={(e) => setSelectedQuarter({ ...selectedQuarter, quarter: Number(e.target.value) })}
                  className="w-20 text-sm focus:outline-none bg-transparent border-none"
                >
                  <option value={1}>Quý 1</option>
                  <option value={2}>Quý 2</option>
                  <option value={3}>Quý 3</option>
                  <option value={4}>Quý 4</option>
                </select>
              </div>
            </div>

            {isLoadingQuarterly && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39BDCC]"></div>
              </div>
            )}

            {!isLoadingQuarterly && quarterlyData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">Tổng ca khám</p>
                        <p className="text-3xl font-bold text-gray-900 mb-2">
                          {(quarterlyData.appointments?.total || 0).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Khám bệnh: {(quarterlyData.appointments?.examination || 0).toLocaleString()}</span>
                          <span>•</span>
                          <span>Tư vấn: {(quarterlyData.appointments?.consultation || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#39BDCC] to-[#2da5b3] rounded-xl shadow-sm p-6 text-white">
                    <p className="text-sm font-medium mb-1 opacity-90">Tổng doanh thu</p>
                    <p className="text-3xl font-bold mb-2">
                      {formatCurrency(quarterlyData.revenue?.total || 0)}
                    </p>
                    <p className="text-xs opacity-75">Quý {selectedQuarter.quarter} - {selectedQuarter.year}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bổ doanh thu</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Khám bệnh", value: quarterlyData.revenue?.Examination || 0, color: "#39BDCC" },
                            { name: "Tư vấn", value: quarterlyData.revenue?.Consultation || 0, color: "#8B5CF6" },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[
                            { name: "Khám bệnh", value: quarterlyData.revenue?.Examination || 0, color: "#39BDCC" },
                            { name: "Tư vấn", value: quarterlyData.revenue?.Consultation || 0, color: "#8B5CF6" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình thức khám</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          { name: "Khám bệnh", value: quarterlyData.appointments?.examination || 0 },
                          { name: "Tư vấn", value: quarterlyData.appointments?.consultation || 0 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} allowDecimals={false} />
                        <Bar dataKey="value" fill="#39BDCC" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        </Tab>

        <Tab key="services" title="Phân tích dịch vụ">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Phân tích dịch vụ
                </h2>
                <p className="text-sm text-gray-600">
                  Xem dịch vụ được sử dụng nhiều nhất và có doanh thu cao nhất
                </p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                <DatePicker
                  selected={selectedMonth}
                  onChange={(date) => {
                    if (date) {
                      setSelectedMonth(date);
                      const { start, end } = getMonthDateRange(date);
                      fetchServiceRevenue(start.toISOString(), end.toISOString());
                    }
                  }}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  locale="vi"
                  className="w-32 text-sm focus:outline-none bg-transparent"
                  placeholderText="Chọn tháng"
                />
              </div>
            </div>

            {isLoadingServices && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39BDCC]"></div>
              </div>
            )}

            {!isLoadingServices && serviceRevenueData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-[#39BDCC] to-[#2da5b3] rounded-xl shadow-sm p-6 text-white">
                    <p className="text-sm font-medium mb-1 opacity-90">Tổng doanh thu</p>
                    <p className="text-3xl font-bold mb-2">
                      {formatCurrency(serviceRevenueData.summary?.totalPaidRevenue || 0)}
                    </p>
                    <p className="text-xs opacity-75">
                      {serviceRevenueData.summary?.totalServices || 0} dịch vụ
                    </p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <p className="text-sm font-medium text-gray-600 mb-1">Tổng số lượt sử dụng</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">
                      {(serviceRevenueData.summary?.totalCount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Tất cả dịch vụ</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <p className="text-sm font-medium text-gray-600 mb-1">Số dịch vụ</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">
                      {serviceRevenueData.summary?.totalServices || 0}
                    </p>
                    <p className="text-xs text-gray-500">Đã sử dụng</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Most Used Services */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <ChartBarIcon className="w-5 h-5 text-[#39BDCC]" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dịch vụ được sử dụng nhiều nhất
                      </h3>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {[...(serviceRevenueData.services || [])]
                        .sort((a, b) => (b.count || 0) - (a.count || 0))
                        .slice(0, 10)
                        .map((service, index) => (
                          <div
                            key={service.serviceId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-[#39BDCC] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{service.serviceName}</p>
                                <p className="text-xs text-gray-500">{service.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{service.count || 0} lượt</p>
                              <p className="text-xs text-gray-500">{formatCurrency(service.totalPaidRevenue || 0)}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Highest Revenue Services */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <CurrencyDollarIcon className="w-5 h-5 text-[#39BDCC]" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dịch vụ có doanh thu cao nhất
                      </h3>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {[...(serviceRevenueData.services || [])]
                        .sort((a, b) => (b.totalPaidRevenue || 0) - (a.totalPaidRevenue || 0))
                        .slice(0, 10)
                        .map((service, index) => (
                          <div
                            key={service.serviceId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-[#39BDCC] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{service.serviceName}</p>
                                <p className="text-xs text-gray-500">{service.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(service.totalPaidRevenue || 0)}
                              </p>
                              <p className="text-xs text-gray-500">{service.count || 0} lượt sử dụng</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Dashboard;

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
  AreaChart,
  Area,
  ComposedChart,
  LineChart,
  Line,
  LabelList,
} from "recharts";
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import { managerApi } from "../../api/manager";
import { Tabs, Tab } from "@heroui/react";

// Custom Vietnamese locale
// - Months: T1, T2, T3... (Tháng 1, Tháng 2, Tháng 3...)
// - Weekdays: CN, T2, T3... (Chủ nhật, Thứ 2, Thứ 3...) - keep normal
const viLocaleCustom = {
  ...vi,
  localize: {
    ...vi.localize,
    // Keep weekdays normal: CN, T2, T3...
    day: (n: number) => {
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return days[n];
    },
    // Custom months: T1, T2, T3...
    month: (n: number) => {
      const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
      return months[n];
    },
  },
  // Override months array for month picker
  months: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
  monthsShort: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
  // Keep weekdays normal
  weekdays: ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
  weekdaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  weekdaysMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  options: {
    ...vi.options,
    weekStartsOn: 1, // Monday
  },
};

// Register Vietnamese locale
registerLocale("vi", viLocaleCustom as any);
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

const Dashboard = () => {
  // Selected month for specific month revenue (default: current month)
  const getDefaultMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth());
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<{
    year: number;
    revenue: number[];
  } | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);

  // Get start and end date of selected month
  const getMonthDateRange = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
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

      // Handle different response structures
      const dashboardResult = response.data?.result || response.result || response.data;
      
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

      const monthlyResult = response.data?.result || response.result || response.data;
      
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

  // Fetch data on mount and when selected month changes
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Fetch monthly revenue on mount
  useEffect(() => {
    fetchMonthlyRevenue();
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

  // Format currency for chart labels (shorter format)
  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M VND`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K VND`;
    }
    return `${amount.toLocaleString('vi-VN')} VND`;
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
        </div>
      </div>

      {/* Revenue sections in tabs - tab headers fill width, each 1/2 */}
      <Tabs
        aria-label="Phân hệ doanh thu"
        color="default"
        variant="underlined"
        className="mb-6"
        classNames={{
          tabList: "w-full grid grid-cols-2 gap-0",
          tab: "w-full",
          tabContent: "w-full text-center font-semibold group-data-[selected=true]:text-gray-900",
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
                  Thống kê trạng thái ca khám
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
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
                  formatter={(value: number) => formatCurrencyNoSymbol(value)}
                  style={{ fill: "#374151", fontSize: 11, fontWeight: 500 }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        )}
        </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Dashboard;

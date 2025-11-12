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
} from "recharts";
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { managerApi } from "../../api/manager";

interface DashboardData {
  filterRange: {
    startDate: string;
    endDate: string;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    other: number;
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
  // Set default date range to last 7 days
  const getDefaultEndDate = () => new Date();
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  };

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await managerApi.getDashboardStats(
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (response.success && response.result) {
        setDashboardData(response.result);
      } else {
        toast.error("Không thể tải dữ liệu thống kê");
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error(error?.message || "Lỗi khi tải dữ liệu thống kê");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when date range changes
  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const handleExport = () => {
    // TODO: Implement export functionality khi có API
    toast.success("Đang xuất dữ liệu...", {
      icon: "📊",
      duration: 2000,
    });
    console.log("Exporting data from", startDate, "to", endDate);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                Dashboard phòng khám
            </h1>
            <p className="text-sm text-gray-600">
              Theo dõi hiệu suất và phân tích dữ liệu phòng khám
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Date Range Picker */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date || new Date())}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="w-28 text-sm focus:outline-none"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Từ ngày"
                />
                <span className="text-gray-400 text-sm">đến</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date || new Date())}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="w-28 text-sm focus:outline-none"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Đến ngày"
                />
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#39BDCC] text-white rounded-lg hover:bg-[#2da5b3] transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span>Xuất Báo Cáo</span>
            </button>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Tổng ca khám
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.appointments.total.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Successful Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Ca khám hoàn thành
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {dashboardData.appointments.completed.toLocaleString()}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 font-medium">
                      {dashboardData.appointments.total > 0
                        ? `${((dashboardData.appointments.completed / dashboardData.appointments.total) * 100).toFixed(1)}% tổng số`
                        : "Không có dữ liệu"}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Cancelled Appointments */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Ca khám bị hủy
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {dashboardData.appointments.cancelled.toLocaleString()}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 font-medium">
                      {dashboardData.appointments.total > 0
                        ? `${((dashboardData.appointments.cancelled / dashboardData.appointments.total) * 100).toFixed(1)}% tổng số`
                        : "Không có dữ liệu"}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* New Patients */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Bệnh nhân mới
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {dashboardData.patients.newPatients.toLocaleString()}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 font-medium">
                      Tổng: {dashboardData.patients.total.toLocaleString()} bệnh nhân
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserPlusIcon className="w-6 h-6 text-purple-600" />
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
                {formatCurrency(dashboardData.revenue.total)}
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
                {formatCurrency(dashboardData.revenue.Examination)}
              </p>
              <p className="text-xs text-gray-500">
                {dashboardData.revenue.total > 0
                  ? `${((dashboardData.revenue.Examination / dashboardData.revenue.total) * 100).toFixed(1)}% tổng doanh thu`
                  : "Không có dữ liệu"}
              </p>
            </div>

            {/* Consultation Revenue */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm font-medium text-gray-600 mb-1">
                Doanh thu tư vấn
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(dashboardData.revenue.Consultation)}
              </p>
              <p className="text-xs text-gray-500">
                {dashboardData.revenue.total > 0
                  ? `${((dashboardData.revenue.Consultation / dashboardData.revenue.total) * 100).toFixed(1)}% tổng doanh thu`
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
                    {dashboardData.appointments.total.toLocaleString()}
                  </p>
                  <span className="text-sm text-gray-600">tổng ca khám</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    {
                      name: "Hoàn thành",
                      value: dashboardData.appointments.completed,
                      color: "#10B981",
                    },
                    {
                      name: "Bị hủy",
                      value: dashboardData.appointments.cancelled,
                      color: "#EF4444",
                    },
                    {
                      name: "Khác",
                      value: dashboardData.appointments.other,
                      color: "#6B7280",
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
                        name: "Hoàn thành",
                        value: dashboardData.appointments.completed,
                        color: "#10B981",
                      },
                      {
                        name: "Bị hủy",
                        value: dashboardData.appointments.cancelled,
                        color: "#EF4444",
                      },
                      {
                        name: "Khác",
                        value: dashboardData.appointments.other,
                        color: "#6B7280",
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
                    {formatCurrency(dashboardData.revenue.total)}
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
                          value: dashboardData.revenue.Examination,
                          color: "#39BDCC",
                        },
                        {
                          name: "Tư vấn",
                          value: dashboardData.revenue.Consultation,
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
                          value: dashboardData.revenue.Examination,
                          color: "#39BDCC",
                        },
                        {
                          name: "Tư vấn",
                          value: dashboardData.revenue.Consultation,
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
  );
};

export default Dashboard;

import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";

// Mock data - sẽ thay bằng API call sau
const summaryData = {
  totalAppointments: 1250,
  successfulAppointments: 1100,
  cancelledAppointments: 150,
  newPatients: 150,
};

const monthlyAppointmentsData = [
  { name: "Tuần 1", appointments: 10 },
  { name: "Tuần 2", appointments: 20 },
  { name: "Tuần 3", appointments: 30 },
  { name: "Tuần 4", appointments: 40 },
];

const cancellationReasonsData = [
  { name: "No show", value: 20, color: "#60A5FA" },
  { name: "Reschedule", value: 15, color: "#34D399" },
  { name: "Cancelled", value: 10, color: "#1E40AF" },
];

const revenueData = [
  { day: "Ngày 1", revenue: 0 },
  { day: "Ngày 5", revenue: 15 },
  { day: "Ngày 10", revenue: 25 },
  { day: "Ngày 15", revenue: 35 },
  { day: "Ngày 20", revenue: 48 },
  { day: "Ngày 25", revenue: 58 },
  { day: "Ngày 30", revenue: 68 },
];

const appointmentTrendsData = [
  { name: "Tuần 1", appointments: 10 },
  { name: "Tuần 2", appointments: 20 },
  { name: "Tuần 3", appointments: 30 },
  { name: "Tuần 4", appointments: 40 },
];

const Dashboard = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const handleExport = () => {
    // TODO: Implement export functionality khi có API
    toast.success("Đang xuất dữ liệu...", {
      icon: "📊",
      duration: 2000,
    });
    console.log("Exporting data from", startDate, "to", endDate);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                Dashboard phòng khám
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Appointments */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Tổng ca khám
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {summaryData.totalAppointments.toLocaleString()}
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
                Ca khám thành công
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {summaryData.successfulAppointments.toLocaleString()}
              </p>
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-xs text-green-600 font-medium">
                  +12% so với tháng trước
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
                {summaryData.cancelledAppointments.toLocaleString()}
              </p>
              <div className="flex items-center">
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-600 mr-1" />
                <span className="text-xs text-red-600 font-medium">
                  +2.1% so với tháng trước
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
                {summaryData.newPatients.toLocaleString()}
              </p>
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="w-4 h-4 text-purple-600 mr-1" />
                <span className="text-xs text-purple-600 font-medium">
                  +8% so với tháng trước
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserPlusIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Appointments Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Lịch khám theo tuần
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {summaryData.totalAppointments.toLocaleString()}
              </p>
              <span className="text-sm text-gray-600">ca khám trong tháng</span>
            </div>
            <div className="flex items-center mt-2">
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                +5.2% so với tháng trước
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyAppointmentsData}>
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
                dataKey="appointments"
                fill="#39BDCC"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cancellation Reasons Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Trạng thái lịch khám
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {summaryData.cancelledAppointments}
              </p>
              <span className="text-sm text-gray-600">ca khám bị hủy</span>
            </div>
            <div className="flex items-center mt-2">
              <ArrowTrendingUpIcon className="w-4 h-4 text-yellow-600 mr-1" />
              <span className="text-sm text-yellow-600 font-medium">
                +2.1% so với tháng trước
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={cancellationReasonsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {cancellationReasonsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-gray-700">
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xu hướng doanh thu
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-sm text-gray-600">
                30 ngày gần nhất
              </p>
            </div>
            <div className="flex items-center mt-2">
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                +1.5% so với kỳ trước
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
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
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#39BDCC"
                strokeWidth={3}
                dot={{ fill: "#39BDCC", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment Trends Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xu hướng đặt lịch theo tuần
            </h3>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">5,000</p>
              <span className="text-sm text-gray-600">ca khám trong 12 tháng</span>
            </div>
            <div className="flex items-center mt-2">
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                +10% so với năm trước
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={appointmentTrendsData}>
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
                dataKey="appointments"
                fill="#8B5CF6"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Pagination,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

interface Appointment {
  id: number;
  date: string;
  time: string;
  endTime: string;
  doctor: string;
  service: string;
  status: "upcoming" | "completed" | "cancelled";
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<
    "upcoming" | "completed" | "cancelled"
  >("upcoming");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data
  const appointments: Appointment[] = [
    {
      id: 1,
      date: "02/10/2025",
      time: "08:37",
      endTime: "03:54",
      doctor: "Hải Anh",
      service: "Tư vấn khám",
      status: "upcoming",
    },
    {
      id: 2,
      date: "10/10/2025",
      time: "06:22",
      endTime: "22:15",
      doctor: "Ngọc Mai",
      service: "Khám tổng",
      status: "completed",
    },
    {
      id: 3,
      date: "07/10/2025",
      time: "06:15",
      endTime: "07:04",
      doctor: "Lê Dũng",
      service: "Nhổ răng",
      status: "cancelled",
    },
  ];

  const filteredAppointments = appointments.filter(
    (apt) => apt.status === activeTab,
  );

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  const getStatusColor = (
    status: string,
  ): "success" | "warning" | "primary" => {
    switch (status) {
      case "upcoming":
        return "success";
      case "completed":
        return "warning";
      case "cancelled":
        return "primary";
      default:
        return "primary";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "Sắp tới";
      case "completed":
        return "Đã khám";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const columns = [
    { key: "date", label: "Ngày, tháng, năm" },
    { key: "time", label: "Giờ bắt đầu" },
    { key: "endTime", label: "Giờ kết thúc" },
    { key: "doctor", label: "Bác sĩ" },
    { key: "service", label: "Dịch vụ" },
    { key: "status", label: "Trạng thái" },
    { key: "confirm", label: "Xác nhận" },
    { key: "actions", label: "Hoạt động" },
  ];

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Lịch các ca khám
        </h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "upcoming"
                  ? "text-[#39BDCC] border-b-2 border-[#39BDCC]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => {
                setActiveTab("upcoming");
                setCurrentPage(1);
              }}
            >
              Sắp tới
            </button>
            <button
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "completed"
                  ? "text-[#39BDCC] border-b-2 border-[#39BDCC]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => {
                setActiveTab("completed");
                setCurrentPage(1);
              }}
            >
              Đã khám
            </button>
            <button
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "cancelled"
                  ? "text-[#39BDCC] border-b-2 border-[#39BDCC]"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => {
                setActiveTab("cancelled");
                setCurrentPage(1);
              }}
            >
              Đã hủy
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <Table
            aria-label="Appointments table"
            bottomContent={
              totalPages > 1 ? (
                <div className="flex w-full justify-center py-4">
                  <Pagination
                    showControls
                    color="primary"
                    page={currentPage}
                    total={totalPages}
                    onChange={setCurrentPage}
                  />
                </div>
              ) : null
            }
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  className="bg-gray-50 text-gray-700 font-semibold"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={
                <div className="text-center py-8 text-gray-500">
                  Không có ca khám nào
                </div>
              }
            >
              {currentAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    {appointment.date}
                  </TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>{appointment.endTime}</TableCell>
                  <TableCell>{appointment.doctor}</TableCell>
                  <TableCell>{appointment.service}</TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(appointment.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(appointment.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {appointment.status === "upcoming" && (
                      <Button
                        className="bg-[#39BDCC] text-white"
                        size="sm"
                        variant="solid"
                      >
                        Xem chi tiết
                      </Button>
                    )}
                    {appointment.status === "completed" && (
                      <Button
                        className="bg-[#FF9800] text-white"
                        size="sm"
                        variant="solid"
                      >
                        Hóy lịch
                      </Button>
                    )}
                    {appointment.status === "cancelled" && (
                      <Button
                        className="bg-[#2196F3] text-white"
                        size="sm"
                        variant="solid"
                      >
                        Xác nhận
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                        </button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Action menu">
                        <DropdownItem key="view">Xem chi tiết</DropdownItem>
                        {appointment.status === "upcoming" ? (
                          <>
                            <DropdownItem key="edit">
                              Thay đổi lịch
                            </DropdownItem>
                            <DropdownItem key="request">
                              Yêu cầu thay đổi
                            </DropdownItem>
                          </>
                        ) : null}
                        {appointment.status === "completed" ? (
                          <DropdownItem key="history">Hỏy lịch</DropdownItem>
                        ) : null}
                        {appointment.status === "cancelled" ? (
                          <DropdownItem key="cancel">Xác nhận</DropdownItem>
                        ) : null}
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Results info */}
          {filteredAppointments.length > 0 && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Show 1 to {Math.min(itemsPerPage, filteredAppointments.length)}{" "}
                of {filteredAppointments.length} results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

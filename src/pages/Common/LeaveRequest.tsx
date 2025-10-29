import type { LeaveRequest } from "@/api/leaveRequest";

import { useState, useEffect } from "react";
import {
  Input,
  Textarea,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  PaperAirplaneIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { leaveRequestApi } from "@/api/leaveRequest";

const LeaveRequestPage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      const response = await leaveRequestApi.getAllLeaveRequests({
        limit: 100,
      });

      if (response.success && response.data) {
        setLeaveRequests(response.data.data || []);
      }
    } catch {
      toast.error("Không thể tải danh sách đơn xin nghỉ");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu");

      return;
    }

    if (!endDate) {
      toast.error("Vui lòng chọn ngày kết thúc");

      return;
    }

    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do nghỉ");

      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start < now) {
      toast.error("Ngày bắt đầu phải từ hôm nay trở đi");

      return;
    }

    if (end <= start) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");

      return;
    }

    try {
      setSubmitting(true);

      const response = await leaveRequestApi.createLeaveRequest({
        startDate,
        endDate,
        reason: reason.trim(),
      });

      if (response.success || (response.data as any)?.status) {
        toast.success("Gửi đơn xin nghỉ thành công!");
        setStartDate("");
        setEndDate("");
        setReason("");
        // Refresh danh sách
        fetchLeaveRequests();
      } else {
        toast.error(response.message || "Không thể gửi đơn xin nghỉ");
      }
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi khi gửi đơn xin nghỉ");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string): "warning" | "success" | "danger" => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Approved":
        return "success";
      case "Rejected":
        return "danger";
      default:
        return "warning";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "Pending":
        return "Đang chờ duyệt";
      case "Approved":
        return "Đã được duyệt";
      case "Rejected":
        return "Đã bị từ chối";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <ClockIcon className="w-4 h-4" />;
      case "Approved":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "Rejected":
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ExclamationCircleIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1; // +1 để bao gồm cả ngày bắt đầu
  };

  const columns = [
    { key: "dates", label: "Thời gian nghỉ" },
    { key: "reason", label: "Lý do" },
    { key: "status", label: "Trạng thái" },
    { key: "approver", label: "Người duyệt" },
  ];

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Đơn xin nghỉ phép</h1>
        <p className="text-gray-600 mt-2">
          Gửi và theo dõi đơn xin nghỉ phép của bạn
        </p>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Gửi đơn xin nghỉ phép mới
          </h2>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="startDate"
              >
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <Input
                fullWidth
                classNames={{
                  input: "text-base",
                  inputWrapper:
                    "border-2 hover:border-blue-500 transition-colors h-12",
                }}
                id="startDate"
                min={today}
                size="lg"
                type="date"
                value={startDate}
                variant="bordered"
                onValueChange={setStartDate}
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="endDate"
              >
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <Input
                fullWidth
                classNames={{
                  input: "text-base",
                  inputWrapper:
                    "border-2 hover:border-blue-500 transition-colors h-12",
                }}
                id="endDate"
                min={startDate || today}
                size="lg"
                type="date"
                value={endDate}
                variant="bordered"
                onValueChange={setEndDate}
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
              <p className="text-sm text-blue-800 font-medium">
                <CalendarIcon className="w-4 h-4 inline mr-2" />
                Tổng số ngày nghỉ: {calculateDays(startDate, endDate)} ngày
              </p>
            </div>
          )}

          <div>
            <label
              className="block text-sm font-semibold text-gray-700 mb-2"
              htmlFor="reason"
            >
              Lý do nghỉ <span className="text-red-500">*</span>
            </label>
            <Textarea
              fullWidth
              classNames={{
                input: "text-base",
                inputWrapper:
                  "border-2 hover:border-blue-500 transition-colors",
              }}
              id="reason"
              minRows={4}
              placeholder="Mô tả lý do xin nghỉ phép của bạn..."
              value={reason}
              variant="bordered"
              onValueChange={setReason}
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <ExclamationCircleIcon className="w-3 h-3" />
              Lý do rõ ràng sẽ giúp quản lý xem xét nhanh hơn
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-8"
              isDisabled={submitting}
              isLoading={submitting}
              size="lg"
              startContent={
                !submitting && <PaperAirplaneIcon className="w-5 h-5" />
              }
              type="submit"
            >
              {submitting ? "Đang gửi..." : "Gửi đơn xin nghỉ"}
            </Button>
          </div>
        </form>
      </div>

      {/* Leave Requests History */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">
            Lịch sử đơn xin nghỉ
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Theo dõi trạng thái các đơn xin nghỉ của bạn
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Spinner color="primary" size="lg" />
            <p className="text-gray-500 mt-4">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <Table
            aria-label="Leave requests history table"
            classNames={{
              wrapper: "shadow-none rounded-none",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  className="bg-gray-50 text-gray-700 font-semibold text-sm uppercase tracking-wider"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent={
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <CalendarIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">
                    Chưa có đơn xin nghỉ nào
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Đơn xin nghỉ của bạn sẽ xuất hiện ở đây
                  </p>
                </div>
              }
              items={leaveRequests}
            >
              {(request) => (
                <TableRow
                  key={request._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell>
                    <div className="py-1">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <CalendarIcon className="w-4 h-4 text-blue-500" />
                        <span>
                          {formatDate(request.startDate)} -{" "}
                          {formatDate(request.endDate)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {calculateDays(request.startDate, request.endDate)} ngày
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-800 max-w-md">
                      {request.reason}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Chip
                      className="font-medium"
                      color={getStatusColor(request.status)}
                      size="sm"
                      startContent={getStatusIcon(request.status)}
                      variant="flat"
                    >
                      {getStatusText(request.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {request.approvedByManager ? (
                      <p className="text-sm text-gray-700">
                        {request.approvedByManager.fullName}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Chưa xử lý</p>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default LeaveRequestPage;


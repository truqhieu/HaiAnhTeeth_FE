import type { LeaveRequest } from "@/api/leaveRequest";

import { useState, useEffect } from "react";
import {
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
  Card,
  CardBody,
} from "@heroui/react";
import toast from "react-hot-toast";

import { leaveRequestApi } from "@/api/leaveRequest";
import VietnameseDateInput from "@/components/Common/VietnameseDateInput";

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
  
      // 🔍 DEBUG
      console.log('📦 LeaveRequest Response:', response);
      console.log('✅ response.success:', response.success);
      console.log('✅ response.status:', (response as any).status);
      console.log('📊 response.data:', response.data);
  
      // ✅ Check cả success và status
      if ((response.success || (response as any).status) && response.data) {
        // Backend trả về: { status: true, total, totalPages, data: [...] }
        // Hoặc wrapper: { success: true, data: { status: true, total, totalPages, data: [...] } }
        const responseData = response.data.data ? response.data : (response as any);
        const requestsData = responseData.data || [];
        
        console.log('✅ Setting leave requests:', requestsData);
        setLeaveRequests(requestsData);
      } else {
        console.log('❌ No data in response');
      }
    } catch (error) {
      console.error('❌ Error fetching leave requests:', error);
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

    if (end < start) {
      toast.error("Ngày kết thúc không thể trước ngày bắt đầu");
      return;
    }

    try {
      setSubmitting(true);

      // ✅ Backend expects "YYYY-MM-DD" format, not ISO strings
      // The DateHelper.parseVNDateOnlyStart/End functions expect plain date strings
      const response = await leaveRequestApi.createLeaveRequest({
        startDate: startDate, // Already in YYYY-MM-DD format
        endDate: endDate,     // Already in YYYY-MM-DD format
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


const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  
  // Use Vietnam timezone explicitly to ensure consistent display
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

// Normalize date to YYYY-MM-DD format using Vietnam timezone
// This ensures we compare dates correctly regardless of how they're stored (UTC vs local)
// Ignores time component and extracts only the date part
const normalizeDate = (dateString?: string | null): string | null => {
  if (!dateString) return null;
  try {
    // Create Date object from the string (handles ISO strings, UTC, etc.)
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      console.error("Invalid date string:", dateString);
      return null;
    }
    
    // Use Intl.DateTimeFormat to get date components in Vietnam timezone
    // This properly handles UTC dates and converts them to Vietnam timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    
    // Format to get YYYY-MM-DD directly
    const formatted = formatter.format(date);
    
    // Validate the format (should be YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
      return formatted;
    }
    
    // Fallback: manually extract parts if formatting fails
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === "year")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const day = parts.find(p => p.type === "day")?.value;
    
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
    
    console.error("Failed to normalize date:", dateString);
    return null;
  } catch (error) {
    console.error("Error normalizing date:", dateString, error);
    return null;
  }
};

// Format date range - shows single date if start and end are the same day
const formatDateRange = (startDate?: string, endDate?: string): string => {
  if (!startDate || !endDate) return "N/A";
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // ⭐ Backend stores dates as UTC dates representing calendar days:
    // - startDate: YYYY-MM-DD 00:00:00.000Z (e.g., 2025-12-07T00:00:00.000Z)
    // - endDate: YYYY-MM-DD 23:59:59.999Z (e.g., 2025-12-11T23:59:59.999Z)
    // Extract the date part (YYYY-MM-DD) directly from UTC to get the intended calendar day
    const startUTCStr = start.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
    const endUTCStr = end.toISOString().split('T')[0];     // YYYY-MM-DD in UTC
    
    // Check if same calendar day
    const isSameDay = startUTCStr === endUTCStr;
    
    // Format dates for display: extract date part from UTC and format as DD/MM/YYYY
    const formatDateFromUTC = (dateStr: string): string => {
      // dateStr is in format YYYY-MM-DD from UTC
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };
    
    // If both dates represent the same calendar day, show only one date
    if (isSameDay) {
      return formatDateFromUTC(startUTCStr);
    }
    
    // Otherwise show the range using UTC date parts (not converted to VN timezone)
    return `${formatDateFromUTC(startUTCStr)} → ${formatDateFromUTC(endUTCStr)}`;
  } catch (error) {
    console.error("Error formatting date range:", error);
    // Fallback: try to format using the original formatDate function
    return `${formatDate(startDate)} → ${formatDate(endDate)}`;
  }
};

  // Bỏ tính và hiển thị tổng số ngày nghỉ theo yêu cầu

  const columns = [
    { key: "dates", label: "Thời gian nghỉ" },
    { key: "reason", label: "Lý do" },
    { key: "status", label: "Trạng thái" },
    { key: "approver", label: "Người duyệt" },
  ];

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Đơn xin nghỉ phép</h1>
        <p className="text-gray-600 mt-2">
          Gửi và theo dõi đơn xin nghỉ phép của bạn
        </p>
      </div>

      {/* Form Section */}
      <Card className="shadow-lg mb-6 border-0">
        <CardBody className="p-6 md:p-8">
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              Gửi đơn xin nghỉ phép mới
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VietnameseDateInput
                className="w-full"
                inputWrapperClassName="border-2 border-gray-300 hover:border-blue-400 data-[focus=true]:border-blue-500 h-12 transition-colors"
                label={
                  <>
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </>
                }
                value={startDate}
                onChange={setStartDate}
                minDate={new Date(today)}
                labelOutside
              />

              <VietnameseDateInput
                className="w-full"
                inputWrapperClassName="border-2 border-gray-300 hover:border-blue-400 data-[focus=true]:border-blue-500 h-12 transition-colors"
                label={
                  <>
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </>
                }
                value={endDate}
                onChange={setEndDate}
                minDate={startDate ? new Date(startDate) : new Date(today)}
                labelOutside
              />
            </div>

            {/* Bỏ hiển thị tổng số ngày nghỉ */}

            <div>
              <label
                className="block text-sm font-bold text-gray-700 mb-3"
                htmlFor="reason"
              >
                Lý do nghỉ <span className="text-red-500">*</span>
              </label>
              <Textarea
                fullWidth
                classNames={{
                  input: "text-base",
                  inputWrapper:
                    "border-2 border-gray-300 hover:border-blue-400 data-[focus=true]:border-blue-500 transition-colors",
                }}
                id="reason"
                minRows={4}
                placeholder="Mô tả lý do xin nghỉ phép của bạn... Ví dụ: Nghỉ ốm, việc gia đình, du lịch, v.v."
                value={reason}
                variant="bordered"
                onValueChange={setReason}
              />
              <p className="text-xs text-gray-700 mt-2.5 bg-amber-50 p-2 rounded border-l-2 border-amber-400">
                Lý do rõ ràng và chi tiết sẽ giúp quản lý xem xét đơn nhanh hơn
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-bold px-8 shadow-md hover:shadow-lg transition-all"
                isDisabled={submitting}
                isLoading={submitting}
                size="lg"
                type="submit"
              >
                {submitting ? "Đang gửi..." : "Gửi đơn xin nghỉ"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Leave Requests History */}
      <Card className="shadow-lg border-0">
        <CardBody className="p-0">
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-blue-50">
            <h2 className="text-xl font-bold text-gray-800">
              Lịch sử đơn xin nghỉ
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi trạng thái các đơn xin nghỉ của bạn
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <Spinner color="primary" size="lg" />
              <p className="text-gray-500 mt-4 font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <Table
              aria-label="Leave requests history table"
              classNames={{
                wrapper: "shadow-none rounded-none",
                th: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-bold text-xs uppercase tracking-wider",
                td: "py-4",
              }}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn key={column.key}>
                    {column.label}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
              emptyContent={
                <div className="text-center py-16">
                  <p className="text-gray-500 text-lg font-semibold">
                    Chưa có đơn xin nghỉ nào
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Đơn xin nghỉ của bạn sẽ xuất hiện ở đây sau khi gửi
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
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatDateRange(request.startDate, request.endDate)}
                        </span>
                        {/* Bỏ chip hiển thị số ngày */}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 max-w-md leading-relaxed">
                        {request.reason}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Chip
                        className="font-semibold"
                        color={getStatusColor(request.status)}
                        size="md"
                        variant="flat"
                      >
                        {getStatusText(request.status)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {request.approvedByManager ? (
                        <p className="text-sm font-medium text-gray-700">
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
        </CardBody>
      </Card>
    </div>
  );
};

export default LeaveRequestPage;

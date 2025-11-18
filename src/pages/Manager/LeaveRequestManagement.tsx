import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
} from "@heroui/react";
  import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { leaveRequestApi } from "@/api/leaveRequest";
import type { LeaveRequest } from "@/api/leaveRequest";

const LeaveRequestManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"Approved" | "Rejected" | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, [statusFilter, currentPage]);

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchLeaveRequests();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await leaveRequestApi.getAllLeaveRequests(params);

      // ✅ Check cả success và status
      if ((response.success || (response as any).status) && response.data) {
        // Backend trả về: { status: true, total, totalPages, data: [...] }
        // Hoặc wrapper: { success: true, data: { status: true, total, totalPages, data: [...] } }
        const responseData = response.data.data ? response.data : (response as any);
        const requestsData = responseData.data || [];

        // Sort by createdAt descending (mới nhất lên đầu)
        const sortedRequests = [...requestsData].sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA; // Descending: mới nhất lên đầu
        });
        let finalRequests = sortedRequests;

        const isVietnameseDateSearch = (term: string) =>
          /\d{1,2}\/\d{1,2}(\/\d{2,4})?/.test(term.trim());
        const isDateSearch = Boolean(searchTerm.trim()) && isVietnameseDateSearch(searchTerm);

        if (isDateSearch) {
          const searchLower = searchTerm.trim().toLowerCase();
          finalRequests = sortedRequests.filter((request: LeaveRequest) => {
            const startDateVi = request.startDate
              ? new Date(request.startDate).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).toLowerCase()
              : "";
            const endDateVi = request.endDate
              ? new Date(request.endDate).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).toLowerCase()
              : "";
            const createdAtVi = request.createdAt
              ? new Date(request.createdAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).toLowerCase()
              : "";
            return (
              startDateVi.includes(searchLower) ||
              endDateVi.includes(searchLower) ||
              createdAtVi.includes(searchLower)
            );
          });
        }

        setLeaveRequests(finalRequests);
        if (isDateSearch) {
          setTotal(finalRequests.length || 0);
          setTotalPages(Math.max(1, Math.ceil((finalRequests.length || 1) / itemsPerPage)));
        } else {
          setTotal(responseData.total || finalRequests.length || 0);
          setTotalPages(
            responseData.totalPages ||
              Math.max(1, Math.ceil((finalRequests.length || 1) / itemsPerPage))
          );
        }
      } else {
        toast.error("Không thể tải danh sách đơn xin nghỉ");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Error fetching leave requests:", error);
      toast.error("Đã xảy ra lỗi khi tải danh sách đơn xin nghỉ");
    } finally {
      setLoading(false);
    }
  };


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAction = (
    request: LeaveRequest,
    action: "Approved" | "Rejected",
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setIsConfirmModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setIsProcessing(true);

      const response = await leaveRequestApi.handleLeaveRequest(
        selectedRequest._id,
        actionType,
      );

      if (response.status || response.success) {
        toast.success(
          response.message ||
            `Đã ${actionType === "Approved" ? "duyệt" : "từ chối"} đơn xin nghỉ`,
        );
        setIsConfirmModalOpen(false);
        setSelectedRequest(null);
        setActionType(null);
        fetchLeaveRequests();
      } else {
        toast.error(response.message || "Không thể xử lý đơn xin nghỉ");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi xử lý đơn xin nghỉ");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (
    status: string
  ): "warning" | "success" | "danger" => {
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
        return "Đang chờ";
      case "Approved":
        return "Đã duyệt";
      case "Rejected":
        return "Đã từ chối";
      default:
        return status;
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

  // Bỏ hiển thị tổng số ngày theo yêu cầu

  const columns = [
    { key: "stt", label: "STT" },
    { key: "employee", label: "Nhân viên" },
    { key: "dates", label: "Thời gian nghỉ" },
    { key: "reason", label: "Lý do" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hành động" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Quản lý đơn xin nghỉ phép
        </h1>
        <p className="text-gray-600 mt-2">
          Xem và duyệt các đơn xin nghỉ của nhân viên
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Input
            className="w-full"
            placeholder="Tìm kiếm theo lý do..."
            startContent={
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            }
            value={searchTerm}
            variant="bordered"
            onValueChange={setSearchTerm}
          />
        </div>

        {/* Status Filter */}
        <Select
          className="w-48"
          placeholder="Trạng thái"
          selectedKeys={[statusFilter]}
          variant="bordered"
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;

            setStatusFilter(selected);
          }}
        >
          <SelectItem key="all">Tất cả trạng thái</SelectItem>
          <SelectItem key="Pending">Đang chờ</SelectItem>
          <SelectItem key="Approved">Đã duyệt</SelectItem>
          <SelectItem key="Rejected">Đã từ chối</SelectItem>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table
            aria-label="Bảng quản lý đơn xin nghỉ"
            classNames={{
              wrapper: "shadow-none",
            }}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.key}
                  className="bg-white text-gray-700 font-semibold text-sm uppercase tracking-wider"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              emptyContent="Không có đơn xin nghỉ nào"
              items={leaveRequests}
            >
              {(request) => (
                <TableRow key={request._id}>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {(currentPage - 1) * itemsPerPage +
                        leaveRequests.indexOf(request) +
                        1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.userId?.fullName || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.userId?.role || "N/A"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="py-1">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <CalendarIcon className="w-4 h-4 text-blue-500" />
                        <span>
                          {formatDate(request.startDate)} -{" "}
                          {formatDate(request.endDate)}
                        </span>
                      </div>
                      {/* Bỏ tổng số ngày nghỉ */}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-800 max-w-xs line-clamp-2">
                      {request.reason}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(request.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(request.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {request.status === "Pending" ? (
                      <div className="flex items-center gap-3">
                        <Tooltip content="Duyệt đơn">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="min-w-8 h-8 text-green-600 hover:bg-green-50"
                            onPress={() => handleAction(request, "Approved")}
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Từ chối đơn">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="min-w-8 h-8 text-red-600 hover:bg-red-50"
                            onPress={() => handleAction(request, "Rejected")}
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </Button>
                        </Tooltip>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <ClockIcon className="w-5 h-5" />
                        <span>Đã xử lý</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Confirm Modal */}
      <Modal
        isDismissable={!isProcessing}
        isOpen={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {actionType === "Approved" ? "Duyệt đơn xin nghỉ" : "Từ chối đơn xin nghỉ"}
          </ModalHeader>
          <ModalBody>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Nhân viên</p>
                      <p className="font-medium text-gray-900">
                        {selectedRequest.userId?.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Vai trò</p>
                      <p className="font-medium text-gray-900">
                        {selectedRequest.userId?.role}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Thời gian nghỉ</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(selectedRequest.startDate)} -{" "}
                        {formatDate(selectedRequest.endDate)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Lý do</p>
                      <p className="font-medium text-gray-900">
                        {selectedRequest.reason}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700">
                  {actionType === "Approved"
                    ? "Bạn có chắc chắn muốn duyệt đơn xin nghỉ này?"
                    : "Bạn có chắc chắn muốn từ chối đơn xin nghỉ này?"}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => {
                setIsConfirmModalOpen(false);
                setSelectedRequest(null);
                setActionType(null);
              }}
            >
              Hủy
            </Button>
            <Button
              className={
                actionType === "Approved"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }
              isLoading={isProcessing}
              onPress={confirmAction}
            >
              {actionType === "Approved" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-4 sm:mb-0">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
            {Math.min(currentPage * itemsPerPage, total)} trong tổng số {total}{" "}
            đơn xin nghỉ
          </div>
          <div className="flex gap-2">
            {/* Previous button */}
            <Button
              isDisabled={currentPage === 1}
              size="sm"
              variant="bordered"
              onPress={() => handlePageChange(currentPage - 1)}
            >
              ←
            </Button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                className="min-w-8"
                color={currentPage === page ? "primary" : "default"}
                size="sm"
                variant={currentPage === page ? "solid" : "bordered"}
                onPress={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}

            {/* Next button */}
            <Button
              isDisabled={currentPage === totalPages}
              size="sm"
              variant="bordered"
              onPress={() => handlePageChange(currentPage + 1)}
            >
              →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestManagement;


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
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { leaveRequestApi } from "@/api/leaveRequest";
import type { LeaveRequest } from "@/api/leaveRequest";

const LeaveRequestManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
  }, [statusFilter]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: 1,
        limit: 100,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await leaveRequestApi.getAllLeaveRequests(params);

      if (response.success && response.data) {
        setLeaveRequests(response.data.data || []);
      } else {
        toast.error("Không thể tải danh sách đơn xin nghỉ");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi tải danh sách đơn xin nghỉ");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLeaveRequests();
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
    status: string,
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

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1;
  };

  const columns = [
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
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
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
            <SelectItem key="all">Tất cả</SelectItem>
            <SelectItem key="Pending">Đang chờ</SelectItem>
            <SelectItem key="Approved">Đã duyệt</SelectItem>
            <SelectItem key="Rejected">Đã từ chối</SelectItem>
          </Select>
        </div>

        <Button
          className="bg-blue-600 text-white hover:bg-blue-700"
          startContent={<MagnifyingGlassIcon className="w-5 h-5" />}
          onPress={handleSearch}
        >
          Tìm kiếm
        </Button>
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
                  className="bg-gray-50 text-gray-700 font-semibold text-sm uppercase tracking-wider"
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
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.userId?.fullName || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.userId?.role || "N/A"}
                        </p>
                      </div>
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
                      <p className="text-sm text-gray-500 mt-1">
                        {calculateDays(request.startDate, request.endDate)} ngày
                      </p>
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
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          className="bg-green-50 text-green-600 hover:bg-green-100"
                          size="sm"
                          variant="flat"
                          onPress={() => handleAction(request, "Approved")}
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </Button>
                        <Button
                          isIconOnly
                          className="bg-red-50 text-red-600 hover:bg-red-100"
                          size="sm"
                          variant="flat"
                          onPress={() => handleAction(request, "Rejected")}
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <ClockIcon className="w-4 h-4" />
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
                        {formatDate(selectedRequest.endDate)} (
                        {calculateDays(
                          selectedRequest.startDate,
                          selectedRequest.endDate,
                        )}{" "}
                        ngày)
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
    </div>
  );
};

export default LeaveRequestManagement;


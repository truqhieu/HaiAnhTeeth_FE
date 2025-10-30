import type { Complaint } from "@/api/complaint";

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
  Textarea,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { complaintApi } from "@/api/complaint";

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [actionType, setActionType] = useState<"Approved" | "Rejected" | null>(
    null,
  );

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, currentPage]);

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchComplaints();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchComplaints = async () => {
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

      const response = await complaintApi.getAllComplaints(params);

      // ✅ Check cả success và status
      if ((response.success || (response as any).status) && response.data) {
        // Backend trả về: { status: true, total, totalPages, data: [...] }
        // Hoặc wrapper: { success: true, data: { status: true, total, totalPages, data: [...] } }
        const responseData = response.data.data ? response.data : (response as any);
        const complaintsData = responseData.data || [];
        
        setComplaints(complaintsData);
        setTotal(responseData.total || 0);
        setTotalPages(responseData.totalPages || 1);
      } else {
        toast.error("Không thể tải danh sách khiếu nại");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Error fetching complaints:", error);
      toast.error("Đã xảy ra lỗi khi tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (currentPage === 1) {
      fetchComplaints();
    } else {
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetail = async (complaint: Complaint) => {
    try {
      const response = await complaintApi.viewDetailComplaint(complaint._id);

      // 🔍 DEBUG
      console.log("📦 View Detail Response:", response);
      console.log("✅ response.success:", response.success);
      console.log("📊 response.data:", response.data);

      if (response.success && response.data) {
        // Backend có thể trả về data trực tiếp hoặc nested
        const complaintDetail = response.data.data || response.data;

        console.log("✅ Setting complaint detail:", complaintDetail);
        setSelectedComplaint(complaintDetail);
        setIsViewModalOpen(true);
        setResponseText("");
        setActionType(null);
      } else {
        console.log("❌ No data in response");
        toast.error("Không thể tải chi tiết khiếu nại");
      }
    } catch (error: any) {
      console.error("❌ Exception:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi khi tải chi tiết khiếu nại",
      );
    }
  };

  const handleProcessComplaint = async () => {
    if (!selectedComplaint || !actionType) return;

    if (!responseText.trim()) {
      toast.error("Vui lòng nhập phản hồi");

      return;
    }

    try {
      setIsProcessing(true);

      const response = await complaintApi.handleComplaint(
        selectedComplaint._id,
        {
          status: actionType,
          responseText: responseText.trim(),
        },
      );

      // 🔍 DEBUG
      console.log("📦 Handle Complaint Response:", response);
      console.log("✅ response.success:", response.success);
      console.log("📊 response.data:", response.data);
      console.log("📝 response.message:", response.message);

      if (response.success) {
        toast.success(
          response.message ||
            response.data?.message ||
            `Đã ${actionType === "Approved" ? "duyệt" : "từ chối"} khiếu nại`,
        );
        setIsViewModalOpen(false);
        setSelectedComplaint(null);
        setResponseText("");
        setActionType(null);
        fetchComplaints();
      } else {
        // Hiển thị message từ backend
        const errorMessage =
          response.message || response.data?.message || "Không thể xử lý khiếu nại";

        console.log("❌ Error message:", errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("❌ Exception:", error);

      // Lấy message từ backend nếu có
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Đã xảy ra lỗi khi xử lý khiếu nại";

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = [
    { key: "title", label: "Tiêu đề" },
    { key: "patient", label: "Bệnh nhân" },
    { key: "createdAt", label: "Ngày gửi" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hành động" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý khiếu nại</h1>
        <p className="text-gray-600 mt-2">
          Xem và xử lý các khiếu nại từ bệnh nhân
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Input
              className="w-full"
              placeholder="Tìm kiếm theo tiêu đề, mô tả..."
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
            aria-label="Bảng quản lý khiếu nại"
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
            <TableBody emptyContent="Không có khiếu nại nào" items={complaints}>
              {(complaint) => (
                <TableRow key={complaint._id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 truncate">
                        {complaint.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {complaint.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {complaint.patientUserId?.fullName || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {complaint.patientUserId?.phone || "N/A"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatDate(complaint.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(complaint.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(complaint.status)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                        size="sm"
                        variant="flat"
                        onPress={() => handleViewDetail(complaint)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* View Detail Modal */}
      <Modal
        isDismissable={!isProcessing}
        isOpen={isViewModalOpen}
        size="3xl"
        onOpenChange={setIsViewModalOpen}
      >
        <ModalContent>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Chi tiết khiếu nại</h3>
          </ModalHeader>
          <ModalBody className="px-6 py-4">
            {selectedComplaint && (
              <div className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Bệnh nhân
                    </p>
                    <p className="text-base text-gray-900">
                      {selectedComplaint.patientUserId?.fullName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Số điện thoại
                    </p>
                    <p className="text-base text-gray-900">
                      {selectedComplaint.patientUserId?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Ngày gửi
                    </p>
                    <p className="text-base text-gray-900">
                      {formatDate(selectedComplaint.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Trạng thái
                    </p>
                    <Chip
                      color={getStatusColor(selectedComplaint.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(selectedComplaint.status)}
                    </Chip>
                  </div>
                </div>

                {/* Tiêu đề và mô tả */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Tiêu đề
                  </p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedComplaint.title}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Nội dung khiếu nại
                  </p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Lịch sử phản hồi */}
                {selectedComplaint.managerResponses &&
                  selectedComplaint.managerResponses.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Lịch sử phản hồi
                      </p>
                      <div className="space-y-3">
                        {selectedComplaint.managerResponses.map(
                          (response, index) => (
                            <div
                              key={index}
                              className="bg-blue-50 p-3 rounded-lg"
                            >
                              <p className="text-sm text-gray-600 mb-1">
                                {formatDate(response.respondedAt)}
                              </p>
                              <p className="text-base text-gray-900">
                                {response.responseText}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Form xử lý (chỉ hiện nếu status là Pending) */}
                {selectedComplaint.status === "Pending" && (
                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Xử lý khiếu nại <span className="text-red-500">*</span>
                    </p>

                    <div className="mb-4">
                      <Textarea
                        fullWidth
                        classNames={{
                          base: "w-full",
                          inputWrapper: "w-full",
                        }}
                        description={
                          <span className="text-xs text-gray-500">
                            Chỉ được nhập chữ, số và các ký tự: . , ! ? ; : {`' "`} ( ) _ -
                          </span>
                        }
                        label="Phản hồi"
                        minRows={4}
                        placeholder="Nhập phản hồi của bạn (tối thiểu 5 ký tự)..."
                        value={responseText}
                        variant="bordered"
                        onValueChange={setResponseText}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-green-600 text-white"
                        startContent={<CheckCircleIcon className="w-5 h-5" />}
                        onPress={() => setActionType("Approved")}
                      >
                        Duyệt khiếu nại
                      </Button>
                      <Button
                        className="flex-1 bg-red-600 text-white"
                        startContent={<XCircleIcon className="w-5 h-5" />}
                        onPress={() => setActionType("Rejected")}
                      >
                        Từ chối khiếu nại
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end gap-3 w-full">
              {selectedComplaint?.status === "Pending" && actionType && (
                <Button
                  className="bg-blue-600 text-white"
                  isDisabled={isProcessing || !responseText.trim()}
                  isLoading={isProcessing}
                  onPress={handleProcessComplaint}
                >
                  Xác nhận {actionType === "Approved" ? "duyệt" : "từ chối"}
                </Button>
              )}
              <Button
                className="bg-gray-200 text-gray-700"
                isDisabled={isProcessing}
                onPress={() => {
                  setIsViewModalOpen(false);
                  setSelectedComplaint(null);
                  setResponseText("");
                  setActionType(null);
                }}
              >
                Đóng
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-4 sm:mb-0">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{" "}
            {Math.min(currentPage * itemsPerPage, total)} trong tổng số {total}{" "}
            khiếu nại
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

export default ComplaintManagement;

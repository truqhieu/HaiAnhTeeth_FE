import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Pagination,
} from "@heroui/react";

import { patientRequestApi, PatientRequest } from "../../api/patientRequest";
import { formatDate, formatTime } from "../../utils/dateUtils";

const PatientRequests: React.FC = () => {
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PatientRequest | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const {
    isOpen: isRejectOpen,
    onOpen: onRejectOpen,
    onClose: onRejectClose,
  } = useDisclosure();

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (typeFilter !== "all") {
        params.requestType = typeFilter;
      }

      const response = await patientRequestApi.getAllRequests(params);

      if (response.success) {
        setRequests(response.data.requests);
        setTotalPages(response.data.pagination.totalPages);
        setTotalItems(response.data.pagination.totalItems);
      }
    } catch (error) {
      console.error("Error loading requests:", error);
      setError("Không thể tải danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentPage, statusFilter, typeFilter]);

  const handleApprove = async (requestId: string) => {
    // ⭐ Tránh double click
    if (processingRequestId === requestId) {
      return;
    }

    try {
      setProcessingRequestId(requestId);
      
      const response = await patientRequestApi.approveRequest(requestId);

      if (response.success) {
        // Hiển thị modal thông báo thành công
        setShowSuccessModal(true);
        setSuccessMessage("Duyệt yêu cầu thành công!");
        loadRequests();
        onDetailClose();
      } else {
        setShowErrorModal(true);
        setErrorMessage("Có lỗi xảy ra khi duyệt yêu cầu");
      }
    } catch (error: any) {
      console.error("Error approving request:", error);
      
      // ⭐ Kiểm tra nếu yêu cầu đã được xử lý rồi thì coi như thành công
      const errorMessage = error?.message || "";
      if (
        errorMessage.includes("đã được xử lý") ||
        errorMessage.includes("already been processed") ||
        errorMessage.includes("đã được duyệt") ||
        errorMessage.includes("already approved")
      ) {
        // Yêu cầu đã được xử lý rồi - coi như thành công
        setShowSuccessModal(true);
        setSuccessMessage("Yêu cầu đã được duyệt trước đó!");
        loadRequests(); // Refresh để cập nhật UI
        onDetailClose();
      } else {
        setShowErrorModal(true);
        setErrorMessage(errorMessage || "Có lỗi xảy ra khi duyệt yêu cầu");
      }
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      setShowErrorModal(true);
      setErrorMessage("Vui lòng nhập lý do từ chối");
      return;
    }

    // ⭐ Tránh double click
    if (processingRequestId === selectedRequest._id) {
      return;
    }

    try {
      setProcessingRequestId(selectedRequest._id);
      
      const response = await patientRequestApi.rejectRequest(
        selectedRequest._id,
        rejectReason,
      );

      if (response.success) {
        setShowSuccessModal(true);
        setSuccessMessage("Từ chối yêu cầu thành công!");
        loadRequests();
        onRejectClose();
        setRejectReason("");
        setSelectedRequest(null);
      } else {
        setShowErrorModal(true);
        setErrorMessage("Có lỗi xảy ra khi từ chối yêu cầu");
      }
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      
      // ⭐ Kiểm tra nếu yêu cầu đã được xử lý rồi thì coi như thành công
      const errorMessage = error?.message || "";
      if (
        errorMessage.includes("đã được xử lý") ||
        errorMessage.includes("already been processed") ||
        errorMessage.includes("đã được từ chối") ||
        errorMessage.includes("already rejected")
      ) {
        // Yêu cầu đã được xử lý rồi - coi như thành công
        setShowSuccessModal(true);
        setSuccessMessage("Yêu cầu đã được xử lý trước đó!");
        loadRequests(); // Refresh để cập nhật UI
        onRejectClose();
        setRejectReason("");
        setSelectedRequest(null);
      } else {
        setShowErrorModal(true);
        setErrorMessage(errorMessage || "Có lỗi xảy ra khi từ chối yêu cầu");
      }
    } finally {
      setProcessingRequestId(null);
    }
  };

  const openDetailModal = (request: PatientRequest) => {
    setSelectedRequest(request);
    onDetailOpen();
  };

  const openRejectModal = (request: PatientRequest) => {
    setSelectedRequest(request);
    onRejectOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Approved":
        return "success";
      case "Rejected":
        return "danger";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "Reschedule":
        return "Đổi lịch hẹn";
      case "ChangeDoctor":
        return "Đổi bác sĩ";
      default:
        return type;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Lỗi tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button color="primary" onClick={loadRequests}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Xử lý yêu cầu của bệnh nhân</h1>
        <p className="text-gray-600">
          Quản lý và xử lý các yêu cầu đổi lịch hẹn, đổi bác sĩ
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Trạng thái
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="Chọn trạng thái"
              >
                <SelectItem key="all" value="all">
                  Tất cả
                </SelectItem>
                <SelectItem key="Pending" value="Pending">
                  Chờ xử lý
                </SelectItem>
                <SelectItem key="Approved" value="Approved">
                  Đã duyệt
                </SelectItem>
                <SelectItem key="Rejected" value="Rejected">
                  Đã từ chối
                </SelectItem>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Loại yêu cầu
              </label>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                placeholder="Chọn loại yêu cầu"
              >
                <SelectItem key="all" value="all">
                  Tất cả
                </SelectItem>
                <SelectItem key="Reschedule" value="Reschedule">
                  Đổi lịch hẹn
                </SelectItem>
                <SelectItem key="ChangeDoctor" value="ChangeDoctor">
                  Đổi bác sĩ
                </SelectItem>
              </Select>
            </div>
            <Button color="primary" onClick={loadRequests}>
              Lọc
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {requests.filter((r) => r.status === "Pending").length}
            </div>
            <div className="text-sm text-gray-600">Chờ xử lý</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {requests.filter((r) => r.status === "Approved").length}
            </div>
            <div className="text-sm text-gray-600">Đã duyệt</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {requests.filter((r) => r.status === "Rejected").length}
            </div>
            <div className="text-sm text-gray-600">Đã từ chối</div>
          </CardBody>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Danh sách yêu cầu ({totalItems})</h2>
        </CardHeader>
        <CardBody>
          <Table aria-label="Patient requests table">
            <TableHeader>
              <TableColumn>Bệnh nhân</TableColumn>
              <TableColumn>Dịch vụ</TableColumn>
              <TableColumn>Loại yêu cầu</TableColumn>
              <TableColumn>Thông tin hiện tại</TableColumn>
              <TableColumn>Yêu cầu thay đổi</TableColumn>
              <TableColumn>Trạng thái</TableColumn>
              <TableColumn>Ngày tạo</TableColumn>
              <TableColumn>Thao tác</TableColumn>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request._id || Math.random().toString()}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.patientUserId?.fullName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{request.patientUserId?.email || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell>{request.appointmentId?.serviceId?.serviceName || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip color="primary" variant="flat">
                      {getTypeLabel(request.requestType)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">
                        {request.currentData?.doctorUserId?.fullName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">Bác sĩ hiện tại</div>
                      {request.currentData?.timeslotId && (
                        <div className="text-sm text-gray-600 mt-1">
                          <div>{formatDate(request.currentData.startTime)}</div>
                          <div>
                            {formatTime(request.currentData.startTime)} - {formatTime(request.currentData.endTime)}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.requestType === "Reschedule" ? (
                      <div>
                        <div className="font-medium text-gray-900">
                          {request.requestedData?.startTime ? formatDate(request.requestedData.startTime) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Thời gian mới</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {request.requestedData?.startTime && request.requestedData?.endTime 
                            ? `${formatTime(request.requestedData.startTime)} - ${formatTime(request.requestedData.endTime)}`
                            : 'N/A'
                          }
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-gray-900">
                          {request.requestedData?.doctorUserId?.fullName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Bác sĩ mới</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip color={getStatusColor(request.status)} variant="flat">
                      {request.status === "Pending" ? "Chờ xử lý" : 
                       request.status === "Approved" ? "Đã duyệt" : "Đã từ chối"}
                    </Chip>
                  </TableCell>
                  <TableCell>{formatDateTime(request.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onClick={() => openDetailModal(request)}
                      >
                        Xem chi tiết
                      </Button>
                      {request.status === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            color="success"
                            onClick={() => handleApprove(request._id)}
                            isDisabled={processingRequestId === request._id}
                            isLoading={processingRequestId === request._id}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onClick={() => openRejectModal(request)}
                            isDisabled={processingRequestId === request._id}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="2xl">
        <ModalContent>
          <ModalHeader>Chi tiết yêu cầu</ModalHeader>
          <ModalBody>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Bệnh nhân:</label>
                    <p>{selectedRequest.patientUserId.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email:</label>
                    <p>{selectedRequest.patientUserId.email}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Dịch vụ:</label>
                  <p>{selectedRequest.appointmentId.serviceId.serviceName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Loại yêu cầu:</label>
                  <Chip color="primary" variant="flat">
                    {getTypeLabel(selectedRequest.requestType)}
                  </Chip>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Thông tin hiện tại:</label>
                    {selectedRequest.requestType === "Reschedule" ? (
                      <div>
                        <p>Thời gian: {formatDate(selectedRequest.currentData.startTime)}</p>
                        <p>{formatTime(selectedRequest.currentData.startTime)} - {formatTime(selectedRequest.currentData.endTime)}</p>
                      </div>
                    ) : (
                      <p>Bác sĩ: {selectedRequest.currentData.doctorUserId.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Thông tin yêu cầu:</label>
                    {selectedRequest.requestType === "Reschedule" ? (
                      <div>
                        <p>Thời gian: {formatDate(selectedRequest.requestedData.startTime!)}</p>
                        <p>{formatTime(selectedRequest.requestedData.startTime!)} - {formatTime(selectedRequest.requestedData.endTime!)}</p>
                      </div>
                    ) : (
                      <p>Bác sĩ: {selectedRequest.requestedData.doctorUserId?.fullName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Lý do yêu cầu:</label>
                  <p className="bg-gray-50 p-2 rounded">{selectedRequest.requestedData.reason}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Trạng thái:</label>
                  <Chip color={getStatusColor(selectedRequest.status)} variant="flat">
                    {selectedRequest.status === "Pending" ? "Chờ xử lý" : 
                     selectedRequest.status === "Approved" ? "Đã duyệt" : "Đã từ chối"}
                  </Chip>
                </div>

                {selectedRequest.staffResponse && (
                  <div>
                    <label className="text-sm font-medium">Phản hồi của staff:</label>
                    <div className="bg-gray-50 p-2 rounded">
                      <p><strong>Xử lý bởi:</strong> {selectedRequest.staffResponse.staffUserId.fullName}</p>
                      <p><strong>Kết quả:</strong> {selectedRequest.staffResponse.response === "Approved" ? "Duyệt" : "Từ chối"}</p>
                      {selectedRequest.staffResponse.reason && (
                        <p><strong>Lý do:</strong> {selectedRequest.staffResponse.reason}</p>
                      )}
                      <p><strong>Thời gian:</strong> {formatDateTime(selectedRequest.staffResponse.respondedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedRequest?.status === "Pending" && (
              <>
                <Button 
                  color="success" 
                  onClick={() => handleApprove(selectedRequest._id)}
                  isDisabled={processingRequestId === selectedRequest._id}
                  isLoading={processingRequestId === selectedRequest._id}
                >
                  Duyệt
                </Button>
                <Button 
                  color="danger" 
                  variant="flat" 
                  onClick={() => openRejectModal(selectedRequest)}
                  isDisabled={processingRequestId === selectedRequest._id}
                >
                  Từ chối
                </Button>
              </>
            )}
            <Button variant="light" onClick={onDetailClose}>
              Đóng
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose}>
        <ModalContent>
          <ModalHeader>Từ chối yêu cầu</ModalHeader>
          <ModalBody>
            <div>
              <label className="text-sm font-medium mb-2 block">Lý do từ chối *</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối yêu cầu..."
                rows={4}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="danger" 
              onClick={handleReject} 
              isDisabled={!rejectReason.trim() || (selectedRequest && processingRequestId === selectedRequest._id)}
              isLoading={selectedRequest ? processingRequestId === selectedRequest._id : false}
            >
              Từ chối
            </Button>
            <Button 
              variant="light" 
              onClick={onRejectClose}
              isDisabled={selectedRequest ? processingRequestId === selectedRequest._id : false}
            >
              Hủy
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <ModalContent>
          <ModalHeader className="text-green-600">Thành công</ModalHeader>
          <ModalBody>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-700">{successMessage}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="success" onClick={() => setShowSuccessModal(false)}>
              Đóng
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Error Modal */}
      <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)}>
        <ModalContent>
          <ModalHeader className="text-red-600">Lỗi</ModalHeader>
          <ModalBody>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-700">{errorMessage}</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={() => setShowErrorModal(false)}>
              Đóng
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PatientRequests;
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
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import {
  PaperAirplaneIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { complaintApi, appointmentApi } from "@/api";
import type { Complaint } from "@/api/complaint";

interface AppointmentOption {
  _id: string;
  serviceId: {
    serviceName: string;
  };
  doctorUserId: {
    fullName: string;
  };
  timeslotId: {
    date: string;
    startTime: string;
  };
}

const Complaints = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState("");
  const [appointments, setAppointments] = useState<AppointmentOption[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchAppointments(), fetchComplaints()]);
  };

  const fetchAppointments = async () => {
    try {
      const response = await appointmentApi.getMyAppointments();

      if (response.success && response.data) {
        // Chỉ lấy các appointment đã hoàn thành
        const completedAppointments = response.data.filter(
          (apt: any) => apt.status === "Completed",
        );

        setAppointments(completedAppointments);
      }
    } catch {
      // Không hiện lỗi nếu không có appointments
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const response = await complaintApi.getMyComplaints();
      
      // 🔍 DEBUG: Log toàn bộ response
      console.log('📦 Full Response:', response);
      console.log('✅ response.success:', response.success);
      console.log('✅ response.status:', (response as any).status);
      console.log('📊 response.data:', response.data);
      console.log('📋 response.data.data:', response.data?.data);

      if ((response.success || (response as any).status) && response.data) {
        const complaintsData = response.data.data || response.data || [];
        console.log('✅ Setting complaints:', complaintsData);
        console.log('📏 Complaints length:', Array.isArray(complaintsData) ? complaintsData.length : 'Not an array');
        setComplaints(complaintsData);
      } else {
        console.log('❌ Condition failed - no data loaded');
        console.log('   - response.success:', response.success);
        console.log('   - response.status:', (response as any).status);
        console.log('   - response.data:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching complaints:', error);
      toast.error("Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");

      return;
    }

    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung");

      return;
    }

    if (!selectedAppointment) {
      toast.error("Vui lòng chọn cuộc hẹn liên quan");

      return;
    }

    try {
      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const normalizeText = (text: string): string => {
        return text.trim().replace(/\s+/g, ' ');
      };

      setSubmitting(true);

      const response = await complaintApi.createComplaint({
        title: normalizeText(title),
        description: normalizeText(content),
        appointmentId: selectedAppointment,
      });

      if (response.success || (response as any).status) {
        toast.success("Gửi khiếu nại thành công!");
        setTitle("");
        setContent("");
        setSelectedAppointment("");
        // Refresh danh sách
        fetchComplaints();
      } else {
        toast.error(response.message || "Không thể gửi khiếu nại");
      }
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi khi gửi khiếu nại");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (
    hasResponse: boolean,
  ): "warning" | "success" => {
    // Chỉ có 2 trạng thái: Đang chờ (warning) hoặc Đã xử lý (success)
    return hasResponse ? "success" : "warning";
  };

  const getStatusText = (hasResponse: boolean): string => {
    // Chỉ hiển thị "Đã xử lý" khi có phản hồi từ manager
    return hasResponse ? "Đã xử lý" : "Đang chờ xử lý";
  };

  const getStatusIcon = (hasResponse: boolean) => {
    // Khi đã xử lý: CheckCircleIcon, khi chờ: ClockIcon
    return hasResponse ? (
      <CheckCircleIcon className="w-4 h-4" />
    ) : (
      <ClockIcon className="w-4 h-4" />
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có";

    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAppointmentLabel = (apt: AppointmentOption) => {
    // ✅ Dùng startTime làm date source
    const dateValue = apt.timeslotId?.startTime || apt.timeslotId?.date;
    
    let date = "Chưa có ngày";
    let time = "";
    
    if (dateValue) {
      try {
        const dateObj = new Date(dateValue);
        if (!isNaN(dateObj.getTime())) {
          date = dateObj.toLocaleDateString("vi-VN");
          time = dateObj.toLocaleTimeString("vi-VN", { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        }
      } catch {
        date = "Chưa có ngày";
      }
    }
    
    const service = apt.serviceId?.serviceName || "Chưa có";
    const doctor = apt.doctorUserId?.fullName || "Chưa có";
  
    return `${date} ${time} - ${service} - BS. ${doctor}`;
  };

  const columns = [
    { key: "title", label: "Tiêu đề" },
    { key: "date", label: "Ngày gửi đơn khiếu nại" },
    { key: "status", label: "Trạng thái" },
    { key: "response", label: "Phản hồi" },
  ];

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Khiếu nại</h1>
          <p className="text-gray-600">Gửi và theo dõi đơn khiếu nại của bạn</p>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Gửi đơn khiếu nại mới
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="appointment"
              >
                Cuộc hẹn liên quan <span className="text-red-500">*</span>
              </label>
              <Select
                id="appointment"
                classNames={{
                  trigger:
                    "border-2 hover:border-[#39BDCC] transition-colors h-12",
                  value: "text-base",
                }}
                placeholder="Chọn cuộc hẹn đã hoàn thành"
                selectedKeys={selectedAppointment ? [selectedAppointment] : []}
                size="lg"
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  setSelectedAppointment(selected);
                }}
              >
                {appointments.length === 0 ? (
                  <SelectItem key="no-appointments" isDisabled>
                    Không có cuộc hẹn nào đã hoàn thành
                  </SelectItem>
                ) : (
                  appointments.map((apt) => (
                    <SelectItem key={apt._id}>
                      {formatAppointmentLabel(apt)}
                    </SelectItem>
                  ))
                )}
              </Select>
              {appointments.length === 0 && (
                <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  Bạn chỉ có thể gửi khiếu nại cho các cuộc hẹn đã hoàn thành
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="title"
              >
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <Input
                fullWidth
                id="title"
                classNames={{
                  input: "text-base",
                  inputWrapper:
                    "border-2 hover:border-[#39BDCC] transition-colors h-12",
                }}
                placeholder="Nhập tiêu đề khiếu nại (VD: Dịch vụ không đúng như cam kết)"
                size="lg"
                value={title}
                variant="bordered"
                onValueChange={setTitle}
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="content"
              >
                Nội dung <span className="text-red-500">*</span>
              </label>
              <Textarea
                fullWidth
                id="content"
                classNames={{
                  input: "text-base",
                  inputWrapper: "border-2 hover:border-[#39BDCC] transition-colors",
                }}
                minRows={6}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                value={content}
                variant="bordered"
                onValueChange={setContent}
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" />
                Mô tả càng chi tiết sẽ giúp chúng tôi xử lý nhanh hơn
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                className="bg-gradient-to-r from-[#39BDCC] to-[#2ca6b5] text-white font-semibold px-10 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                isDisabled={submitting || appointments.length === 0}
                isLoading={submitting}
                size="lg"
                type="submit"
              >
                {submitting ? "Đang gửi..." : "Gửi đơn khiếu nại"}
              </Button>
            </div>
          </form>
        </div>

        {/* Complaints History */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-blue-50">
            <h2 className="text-xl font-semibold text-gray-800">
              Lịch sử khiếu nại
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi trạng thái và phản hồi từ quản lý
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <Spinner color="primary" size="lg" />
              <p className="text-gray-500 mt-4">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <Table
              aria-label="Complaints history table"
              classNames={{
                wrapper: "shadow-none rounded-none",
              }}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.key}
                    className="bg-gray-50 text-gray-700 font-semibold text-sm"
                  >
                    {column.label}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                emptyContent={
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <ExclamationCircleIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">
                      Chưa có khiếu nại nào
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Khiếu nại của bạn sẽ xuất hiện ở đây
                    </p>
                  </div>
                }
                items={complaints}
              >
                {(complaint) => (
                  <TableRow
                    key={complaint._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div className="py-1">
                        <p className="font-semibold text-gray-900">
                          {complaint.title}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {complaint.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        <span className="text-sm">
                          {formatDate(complaint.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        className="font-medium"
                        color={getStatusColor(
                          complaint.managerResponses &&
                          complaint.managerResponses.length > 0
                        )}
                        size="sm"
                        startContent={getStatusIcon(
                          complaint.managerResponses &&
                          complaint.managerResponses.length > 0
                        )}
                        variant="flat"
                      >
                        {getStatusText(
                          complaint.managerResponses &&
                          complaint.managerResponses.length > 0
                        )}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {complaint.managerResponses &&
                      complaint.managerResponses.length > 0 ? (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                          <p className="text-sm text-gray-800 font-medium">
                            {
                              complaint.managerResponses[
                                complaint.managerResponses.length - 1
                              ].responseText
                            }
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Phản hồi lúc{" "}
                            {formatDate(
                              complaint.managerResponses[
                                complaint.managerResponses.length - 1
                              ].respondedAt,
                            )}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic flex items-center gap-2">
                          <ClockIcon className="w-4 h-4" />
                          Đang chờ phản hồi
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Complaints;

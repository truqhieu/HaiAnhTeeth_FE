import { useState } from "react";
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
} from "@heroui/react";

interface Complaint {
  id: number;
  title: string;
  date: string;
  status: "pending" | "processing" | "resolved";
  response: string;
}

const Complaints = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Mock data cho lịch sử khiếu nại
  const complaints: Complaint[] = [
    {
      id: 1,
      title: "Trễ lịch hẹn",
      date: "09/05/2025",
      status: "pending",
      response: "Chưa có phản hồi",
    },
    {
      id: 2,
      title: "Nhân viên không nhiệt tình",
      date: "08/12/2026",
      status: "processing",
      response: "Đang trong quá trình xử lý của quản lý",
    },
    {
      id: 3,
      title: "Hồ sơ khám bệnh lỗi",
      date: "08/28/2026",
      status: "resolved",
      response: "Đã được quản lý xử lý",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle submit complaint
    // eslint-disable-next-line no-console
    console.log("Complaint submitted:", { title, content });
    // Reset form
    setTitle("");
    setContent("");
  };

  const getStatusColor = (
    status: string,
  ): "primary" | "warning" | "success" => {
    switch (status) {
      case "pending":
        return "primary";
      case "processing":
        return "warning";
      case "resolved":
        return "success";
      default:
        return "primary";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "pending":
        return "Đang xử lý";
      case "processing":
        return "Đang chờ";
      case "resolved":
        return "Đã xử lý";
      default:
        return status;
    }
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
          <p className="text-gray-600">
            Gửi và theo dõi đơn khiếu nại của bạn
          </p>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Gửi đơn khiếu nại mới
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="title"
              >
                Tiêu đề
              </label>
              <Input
                fullWidth
                id="title"
                placeholder="Nhập tiêu đề khiếu nại"
                value={title}
                variant="bordered"
                onValueChange={setTitle}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="content"
              >
                Nội dung
              </label>
              <Textarea
                fullWidth
                id="content"
                minRows={6}
                placeholder="Nhập nội dung khiếu nại chi tiết..."
                value={content}
                variant="bordered"
                onValueChange={setContent}
              />
            </div>

            <div className="flex justify-end">
              <Button
                className="bg-[#39BDCC] text-white px-8 hover:bg-[#2ca6b5]"
                size="lg"
                type="submit"
              >
                Gửi đơn khiếu nại
              </Button>
            </div>
          </form>
        </div>

        {/* Complaints History */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              Lịch sử khiếu nại
            </h2>
          </div>

          <Table aria-label="Complaints history table">
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
                  Chưa có khiếu nại nào
                </div>
              }
            >
              {complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">
                    {complaint.title}
                  </TableCell>
                  <TableCell>{complaint.date}</TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(complaint.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(complaint.status)}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {complaint.response}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Complaints;


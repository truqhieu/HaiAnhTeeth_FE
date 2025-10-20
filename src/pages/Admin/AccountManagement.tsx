import { useState } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import AddUserModal from "@/components/AddUserModal";
import EditUserModal from "@/components/EditUserModal";

interface User {
  id: number;
  role: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
}

const AccountManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const itemsPerPage = 10;

  // Mock data
  const [users] = useState<User[]>([
    {
      id: 1,
      role: "Bác sĩ",
      name: "Eve Brooks",
      email: "Hardy@googlemail.com",
      phone: "124456789",
      status: "active",
    },
    {
      id: 2,
      role: "Lễ Tân",
      name: "Deborah Adams",
      email: "Morgan@outlook.com",
      phone: "124456789",
      status: "active",
    },
    {
      id: 3,
      role: "Bệnh nhân",
      name: "Fairy Allen",
      email: "Jesse@sogou.com",
      phone: "124456789",
      status: "inactive",
    },
    {
      id: 4,
      role: "Bác sĩ",
      name: "John Doe",
      email: "john@example.com",
      phone: "987654321",
      status: "active",
    },
    {
      id: 5,
      role: "Điều dưỡng",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "123456789",
      status: "active",
    },
    {
      id: 6,
      role: "Manager",
      name: "Admin Manager",
      email: "manager@example.com",
      phone: "987654321",
      status: "active",
    },
    {
      id: 7,
      role: "Lễ Tân",
      name: "Reception Staff",
      email: "reception@example.com",
      phone: "555555555",
      status: "active",
    },
  ]);


  const statusOptions = [
    { key: "all", label: "Tất cả" },
    { key: "active", label: "Hoạt động" },
    { key: "inactive", label: "Không hoạt động" },
  ];

  // Filter users based on search and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      // Không cho phép chỉnh sửa tài khoản bệnh nhân
      if (user.role === "Bệnh nhân") {
        alert("Không thể chỉnh sửa tài khoản bệnh nhân");
        return;
      }
      setSelectedUser(user);
      setIsEditModalOpen(true);
    }
  };


  const handleAddNew = () => {
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    // TODO: Refresh the user list after successful addition
    console.log("User added successfully, refreshing list...");
  };

  const handleEditSuccess = () => {
    // TODO: Refresh the user list after successful edit
    console.log("User updated successfully, refreshing list...");
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Quản lý tài khoản của người dùng phòng khám
        </h1>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              }
              className="w-full"
              variant="bordered"
            />
          </div>

          {/* Status Filter */}
          <Select
            placeholder="Chọn trạng thái"
            selectedKeys={statusFilter ? [statusFilter] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              setStatusFilter(selectedKey);
            }}
            className="w-48"
            variant="bordered"
          >
            {statusOptions.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Add New Button */}
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2"
          onPress={handleAddNew}
          startContent={<PlusIcon className="w-5 h-5" />}
        >
          Thêm mới tài khoản
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chỉnh sửa
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user.id)}
                      className={`p-1 rounded ${
                        user.role === "Bệnh nhân"
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                      }`}
                      title={
                        user.role === "Bệnh nhân"
                          ? "Không thể chỉnh sửa tài khoản bệnh nhân"
                          : "Chỉnh sửa"
                      }
                      disabled={user.role === "Bệnh nhân"}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {currentUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Không tìm thấy dữ liệu</div>
            <div className="text-gray-400 text-sm mt-2">
              Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} đến {Math.min(endIndex, filteredUsers.length)} trong{" "}
            {filteredUsers.length} kết quả
          </div>

          <div className="flex items-center space-x-2">
            {/* Previous button */}
            <Button
              isDisabled={currentPage === 1}
              variant="bordered"
              size="sm"
              onPress={() => handlePageChange(currentPage - 1)}
            >
              ←
            </Button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "solid" : "bordered"}
                color={currentPage === page ? "primary" : "default"}
                size="sm"
                onPress={() => handlePageChange(page)}
                className="min-w-8"
              >
                {page}
              </Button>
            ))}

            {/* Next button */}
            <Button
              isDisabled={currentPage === totalPages}
              variant="bordered"
              size="sm"
              onPress={() => handlePageChange(currentPage + 1)}
            >
              →
            </Button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default AccountManagement;

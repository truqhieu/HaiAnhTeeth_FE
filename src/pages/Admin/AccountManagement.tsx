import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
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
} from "@heroui/react";
import toast from "react-hot-toast";

import { AddUserModal, EditUserModal } from "@/components";
import { adminApi, AdminUser } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  role: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
}

const AccountManagement = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const itemsPerPage = 10;
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Debug user info
  useEffect(() => {
    console.log("👤 Current User:", currentUser);
    console.log("🔑 User Role:", currentUser?.role);
  }, [currentUser]);

  // Role mapping từ tiếng Anh sang tiếng Việt
  const roleMap: { [key: string]: string } = {
    Doctor: "Bác sĩ",
    Nurse: "Điều dưỡng",
    Staff: "Lễ Tân",
    Patient: "Bệnh nhân",
    Manager: "Manager",
    Admin: "Admin",
  };

  // Fetch accounts from API
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status:
          statusFilter !== "all"
            ? statusFilter === "active"
              ? "Active"
              : "Lock"
            : undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        search: searchTerm || undefined,
      };
      

      const response = await adminApi.getAllAccounts(params);

      // Backend returns 'status' directly in response (not wrapped in data)
      const isSuccess = response.status;


      if (isSuccess && response.data) {
        // Map API data to local User interface
        const mappedUsers: User[] = response.data.map((user: AdminUser) => ({
          id: user._id,
          role: roleMap[user.role] || user.role,
          name: user.fullName,
          email: user.email,
          phone: user.phoneNumber || "",
          status:
            user.status === "Active"
              ? ("active" as const)
              : user.status === "Lock"
                ? ("inactive" as const)
                : ("inactive" as const), // Banned cũng map thành inactive
        }));

        setUsers(mappedUsers);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      } else {
        console.warn("⚠️ Response not successful or no data");
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể tải danh sách tài khoản");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchAccounts();
  }, [currentPage, statusFilter, roleFilter]);

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchAccounts();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const statusOptions = [
    { key: "all", label: "Tất cả trạng thái" },
    { key: "active", label: "Hoạt động" },
    { key: "inactive", label: "Bị khóa" },
  ];

  const roleOptions = [
    { key: "all", label: "Tất cả vai trò" },
    { key: "Manager", label: "Manager" },
    { key: "Doctor", label: "Bác sĩ" },
    { key: "Nurse", label: "Điều dưỡng" },
    { key: "Staff", label: "Lễ Tân" },
    { key: "Patient", label: "Bệnh nhân" },
  ];

  // Pagination info
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, total);
  const currentUsers = users;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (userId: string) => {
    const user = users.find((u) => u.id === userId);

    if (user) {
      // Không cho phép chỉnh sửa tài khoản bệnh nhân
      if (user.role === "Bệnh nhân") {
        toast.error("Không thể chỉnh sửa tài khoản bệnh nhân");

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
    // Refresh the user list after successful addition
    fetchAccounts();
    setIsAddModalOpen(false);
  };

  const handleEditSuccess = () => {
    // Refresh the user list after successful edit
    fetchAccounts();
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const columns = [
    { key: "stt", label: "STT" },
    { key: "role", label: "Vai trò" },
    { key: "name", label: "Tên" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Số điện thoại" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Chỉnh sửa" },
  ];

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
              className="w-full"
              placeholder="Tìm kiếm..."
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
            placeholder="Chọn trạng thái"
            selectedKeys={statusFilter ? [statusFilter] : []}
            variant="bordered"
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;

              setStatusFilter(selectedKey);
              // Reset to page 1 when filter changes
              if (currentPage !== 1) {
                setCurrentPage(1);
              }
            }}
          >
            {statusOptions.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>

          {/* Role Filter */}
          <Select
            className="w-48"
            placeholder="Chọn vai trò"
            selectedKeys={roleFilter ? [roleFilter] : []}
            variant="bordered"
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;

              setRoleFilter(selectedKey);
              // Reset to page 1 when filter changes
              if (currentPage !== 1) {
                setCurrentPage(1);
              }
            }}
          >
            {roleOptions.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Add New Button */}
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={handleAddNew}
        >
          Thêm mới tài khoản
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table
            aria-label="Bảng quản lý tài khoản"
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
              emptyContent="Không tìm thấy tài khoản"
              items={currentUsers}
            >
              {(user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {(currentPage - 1) * itemsPerPage +
                        currentUsers.indexOf(user) +
                        1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      className="bg-blue-100 text-blue-800"
                      size="sm"
                      variant="flat"
                    >
                      {user.role}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900">{user.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900">{user.phone}</span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={user.status === "active" ? "success" : "default"}
                      size="sm"
                      variant="flat"
                    >
                      {user.status === "active"
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <button
                      className={`p-1 rounded ${
                        user.role === "Bệnh nhân"
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                      }`}
                      disabled={user.role === "Bệnh nhân"}
                      title={
                        user.role === "Bệnh nhân"
                          ? "Không thể chỉnh sửa tài khoản bệnh nhân"
                          : "Chỉnh sửa"
                      }
                      onClick={() => handleEdit(user.id)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} đến {endIndex} trong tổng số {total} tài khoản
          </div>

          <div className="flex items-center space-x-2">
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

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default AccountManagement;

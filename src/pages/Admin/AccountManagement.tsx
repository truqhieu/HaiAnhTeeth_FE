import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  LockClosedIcon,
  LockOpenIcon,
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
  Tooltip,
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
  
  // Selection states
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  
  // Bulk action loading
  const [isBulkLocking, setIsBulkLocking] = useState(false);
  const [isBulkUnlocking, setIsBulkUnlocking] = useState(false);

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
        
        // Reset selections when data changes
        setSelectedUserIds(new Set());
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
    { key: "all", label: "Tất cả trạng thái" },
    { key: "active", label: "Hoạt động" },
    { key: "inactive", label: "Bị khóa" },
  ];

  const roleOptions = [
    { key: "all", label: "Tất cả vai trò" },
    { key: "Manager", label: "Quản lý" },
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
  
  // Selection handler using Table's built-in selection
  const handleSelectionChange = (keys: any) => {
    if (keys === "all") {
      // Select all selectable users
      const selectableUsers = currentUsers
        .filter(user => user.role !== "Bệnh nhân" && user.role !== "Patient")
        .map(user => user.id);
      setSelectedUserIds(new Set(selectableUsers));
    } else {
      setSelectedUserIds(new Set(keys));
    }
  };
  
  // Bulk lock/unlock handlers
  const handleBulkLock = async () => {
    if (selectedUserIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một tài khoản");
      return;
    }
    
    // Filter only active users
    const activeUserIds = users
      .filter(user => selectedUserIds.has(user.id) && user.status === "active")
      .map(user => user.id);
    
    if (activeUserIds.length === 0) {
      toast.error("Không có tài khoản đang hoạt động nào được chọn");
      return;
    }
    
    try {
      setIsBulkLocking(true);
      const response = await adminApi.bulkLockAccounts(activeUserIds);
      
      if (response.data?.status || response.success) {
        toast.success(`Đã khóa ${activeUserIds.length} tài khoản`);
        setSelectedUserIds(new Set());
        fetchAccounts();
      } else {
        toast.error(response.data?.message || "Không thể khóa tài khoản");
      }
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi khóa tài khoản");
    } finally {
      setIsBulkLocking(false);
    }
  };
  
  const handleBulkUnlock = async () => {
    if (selectedUserIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một tài khoản");
      return;
    }
    
    // Filter only inactive users
    const inactiveUserIds = users
      .filter(user => selectedUserIds.has(user.id) && user.status === "inactive")
      .map(user => user.id);
    
    if (inactiveUserIds.length === 0) {
      toast.error("Không có tài khoản bị khóa nào được chọn");
      return;
    }
    
    try {
      setIsBulkUnlocking(true);
      const response = await adminApi.bulkUnlockAccounts(inactiveUserIds);
      
      if (response.data?.status || response.success) {
        toast.success(`Đã mở khóa ${inactiveUserIds.length} tài khoản`);
        setSelectedUserIds(new Set());
        fetchAccounts();
      } else {
        toast.error(response.data?.message || "Không thể mở khóa tài khoản");
      }
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi mở khóa tài khoản");
    } finally {
      setIsBulkUnlocking(false);
    }
  };

  const columns = [
    { key: "stt", label: "STT" },
    { key: "role", label: "Vai trò" },
    { key: "name", label: "Tên" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Số điện thoại" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Thao tác" },
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
      <div className="mb-6 flex flex-col gap-4">
        {/* Top row: Filters and Add button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
        
        {/* Bulk actions - Professional floating bar */}
        {selectedUserIds.size > 0 && (() => {
          // Get selected users' statuses
          const selectedUsers = users.filter(user => selectedUserIds.has(user.id));
          const hasActiveUsers = selectedUsers.some(user => user.status === "active");
          const hasInactiveUsers = selectedUsers.some(user => user.status === "inactive");
          
          return (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-6 px-6 py-4">
                  {/* Selection count */}
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedUserIds.size} tài khoản được chọn
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-12 bg-gray-200"></div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    {/* Show Lock button only if there are active users */}
                    {hasActiveUsers && (
                      <Button
                        size="md"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                        startContent={<LockClosedIcon className="w-5 h-5" />}
                        onPress={handleBulkLock}
                        isLoading={isBulkLocking}
                        isDisabled={isBulkLocking || isBulkUnlocking}
                      >
                        Khóa tài khoản
                      </Button>
                    )}
                    
                    {/* Show Unlock button only if there are inactive users */}
                    {hasInactiveUsers && (
                      <Button
                        size="md"
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                        startContent={<LockOpenIcon className="w-5 h-5" />}
                        onPress={handleBulkUnlock}
                        isLoading={isBulkUnlocking}
                        isDisabled={isBulkLocking || isBulkUnlocking}
                      >
                        Mở khóa
                      </Button>
                    )}
                    
                    {/* Cancel button */}
                    <Button
                      size="md"
                      variant="light"
                      className="text-gray-600 hover:bg-gray-100"
                      onPress={() => setSelectedUserIds(new Set())}
                      isDisabled={isBulkLocking || isBulkUnlocking}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
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
            selectionMode="multiple"
            selectedKeys={selectedUserIds}
            onSelectionChange={handleSelectionChange}
            disabledKeys={currentUsers
              .filter(user => user.role === "Bệnh nhân" || user.role === "Patient")
              .map(user => user.id)
            }
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
                    <Tooltip content="Chỉnh sửa">
                      <button
                        className={`p-1 rounded ${
                          user.role === "Bệnh nhân"
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                        }`}
                        disabled={user.role === "Bệnh nhân"}
                        onClick={() => handleEdit(user.id)}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </Tooltip>
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

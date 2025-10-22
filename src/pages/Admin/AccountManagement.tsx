import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Select, SelectItem } from "@heroui/react";
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
    console.log('👤 Current User:', currentUser);
    console.log('🔑 User Role:', currentUser?.role);
  }, [currentUser]);

  // Role mapping từ tiếng Anh sang tiếng Việt
  const roleMap: { [key: string]: string } = {
    'Doctor': 'Bác sĩ',
    'Nurse': 'Điều dưỡng',
    'Staff': 'Lễ Tân',
    'Patient': 'Bệnh nhân',
    'Manager': 'Manager',
    'Admin': 'Admin'
  };

  // Fetch accounts from API
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching accounts with params:', {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? (statusFilter === 'active' ? 'Active' : 'Inactive') : undefined,
        search: searchTerm || undefined,
      });

      const response = await adminApi.getAllAccounts({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? (statusFilter === 'active' ? 'Active' : 'Inactive') : undefined,
        search: searchTerm || undefined,
      });

      console.log('📥 Response received:', response);
      console.log('📊 Response data:', response.data);

      // Backend returns 'status' directly in response (not wrapped in data)
      const isSuccess = response.status;
      console.log('✅ Is success?', isSuccess);
      
      if (isSuccess && response.data) {
        // Map API data to local User interface
        const mappedUsers: User[] = response.data.map((user: AdminUser) => ({
          id: user._id,
          role: roleMap[user.role] || user.role,
          name: user.fullName,
          email: user.email,
          phone: user.phoneNumber || '',
          status: user.status === 'Active' ? 'active' as const : 'inactive' as const,
        }));
        
        console.log('👥 Mapped users:', mappedUsers);
        setUsers(mappedUsers);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      } else {
        console.warn('⚠️ Response not successful or no data');
      }
    } catch (error: any) {
      console.error('❌ Error fetching accounts:', error);
      alert(error.message || 'Không thể tải danh sách tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);


  const statusOptions = [
    { key: "all", label: "Tất cả" },
    { key: "active", label: "Hoạt động" },
    { key: "inactive", label: "Không hoạt động" },
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
              // Reset to page 1 when filter changes
              if (currentPage !== 1) {
                setCurrentPage(1);
              }
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
                  STT
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
              {currentUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(currentPage - 1) * itemsPerPage + index + 1}
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

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Đang tải dữ liệu...</div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && currentUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Không tìm thấy dữ liệu</div>
            <div className="text-gray-400 text-sm mt-2">
              Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} đến {endIndex} trong{" "}
            {total} kết quả
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

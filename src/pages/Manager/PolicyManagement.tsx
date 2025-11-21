import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  useDisclosure,
  Tooltip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Pagination,
} from "@heroui/react";
import toast from "react-hot-toast";
import { policyApi, Policy, CreatePolicyData } from "@/api/policy";

const PolicyManagement = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Only use status (Active/Inactive/Draft) per BE model

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form state
  const [formData, setFormData] = useState<CreatePolicyData>({
    title: "",
    description: "",
    active: true,
    status: "Active",
  });

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      const response = await policyApi.getAllPolicies();
      if (response.success && Array.isArray(response.data)) {
        setPolicies(response.data);
      }
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải danh sách chính sách");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Handle open modal for create
  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setFormData({
      title: "",
      description: "",
      active: true,
      status: "Active",
    });
    onOpen();
  };

  // Handle open modal for edit
  const handleOpenEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      description: policy.description,
      active: policy.active,
      status: policy.status,
    });
    onOpen();
  };

  const handleOpenDelete = (policy: Policy) => {
    setSelectedPolicy(policy);
    setIsDeleteOpen(true);
  };

  // Handle submit (create or update)
  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingPolicy) {
        // Update
        const response = await policyApi.updatePolicy(editingPolicy._id, formData);
        if (response.success) {
          toast.success("Cập nhật chính sách thành công");
          fetchPolicies();
          onClose();
        }
      } else {
        // Create
        const response = await policyApi.createPolicy(formData);
        if (response.success) {
          toast.success("Tạo chính sách thành công");
          fetchPolicies();
          onClose();
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (policy: Policy) => {
    try {
      const response = await policyApi.deletePolicy(policy._id);
      if (response.success) {
        toast.success("Xóa chính sách thành công");
        fetchPolicies();
      }
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa chính sách");
    }
  };

  // Get status chip
  const getStatusChip = (status: string) => {
    if (status === "Inactive") {
      return (
        <Chip color="default" size="sm" variant="flat">
          Không hoạt động
        </Chip>
      );
    }
    if (status === "Draft") {
      return (
        <Chip color="warning" size="sm" variant="flat">
          Nháp
        </Chip>
      );
    }
    return (
      <Chip color="success" size="sm" variant="flat" startContent={<CheckCircleIcon className="w-4 h-4" />}>
        Hoạt động
      </Chip>
    );
  };

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch =
      !searchTerm.trim() ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPolicies = filteredPolicies.length;
  const totalPages = Math.max(1, Math.ceil(totalPolicies / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPolicies = filteredPolicies.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const columns = [
    { key: "stt", label: "STT" },
    { key: "title", label: "Tiêu đề" },
    { key: "description", label: "Mô tả" },
    { key: "status", label: "Trạng thái" },
    { key: "dates", label: "Ngày" },
    { key: "actions", label: "Hành động" },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Quản lý chính sách
        </h1>
        <p className="text-sm text-gray-600">
          Quản lý các chính sách và điều khoản của phòng khám
        </p>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            className="w-full sm:max-w-md"
            placeholder="Tìm theo tiêu đề hoặc mô tả..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            variant="bordered"
          />
          <Select
            className="w-44"
            selectedKeys={[statusFilter]}
            onSelectionChange={(keys) =>
              setStatusFilter(Array.from(keys)[0] as string)
            }
            variant="bordered"
            placeholder="Trạng thái"
          >
            <SelectItem key="all">Tất cả trạng thái</SelectItem>
            <SelectItem key="Active">Hoạt động</SelectItem>
            <SelectItem key="Draft">Nháp</SelectItem>
            <SelectItem key="Inactive">Không hoạt động</SelectItem>
          </Select>
        </div>
        <Button
          className="w-full md:w-auto bg-blue-600 text-white hover:bg-blue-700"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={handleOpenCreate}
        >
          Thêm chính sách
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <Table
            aria-label="Bảng chính sách"
            classNames={{ wrapper: "shadow-none" }}
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
              emptyContent="Không có chính sách nào"
              items={paginatedPolicies}
            >
              {(policy) => (
                <TableRow key={policy._id}>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {startIndex + paginatedPolicies.indexOf(policy) + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-gray-900">{policy.title}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {policy.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(policy.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-gray-600">
                      <p>Tạo: {new Date(policy.createdAt).toLocaleDateString("vi-VN")}</p>
                      <p>Cập nhật: {new Date(policy.updatedAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tooltip content="Chỉnh sửa">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-8 h-8 text-blue-600 hover:bg-blue-50"
                          onPress={() => handleOpenEdit(policy)}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Xóa chính sách">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-8 h-8 text-red-600 hover:bg-red-50"
                          onPress={() => handleOpenDelete(policy)}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && totalPolicies > 0 && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-4">
          <p className="text-sm text-gray-500">
            Hiển thị{" "}
            {totalPolicies === 0 ? 0 : startIndex + 1} đến{" "}
            {totalPolicies === 0
              ? 0
              : Math.min(startIndex + paginatedPolicies.length, totalPolicies)}{" "}
            trong tổng số {totalPolicies} chính sách
          </p>
          <Pagination
            page={currentPage}
            total={totalPages}
            onChange={setCurrentPage}
            showControls
            color="primary"
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        isDismissable={false}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        size="2xl"
        scrollBehavior="inside"
        classNames={{ base: "max-h-[90vh] rounded-2xl" }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold">
                  {editingPolicy ? "Chỉnh sửa chính sách" : "Tạo chính sách mới"}
                </h2>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Tiêu đề"
                    placeholder="Nhập tiêu đề chính sách"
                    value={formData.title}
                    onValueChange={(value) =>
                      setFormData({ ...formData, title: value })
                    }
                    isRequired
                    size="lg"
                  />

                  <Textarea
                    label="Mô tả"
                    placeholder="Nhập mô tả chi tiết chính sách"
                    value={formData.description}
                    onValueChange={(value) =>
                      setFormData({ ...formData, description: value })
                    }
                    isRequired
                    minRows={6}
                    size="lg"
                  />

                  <Select
                    label="Trạng thái"
                    placeholder="Chọn trạng thái"
                    selectedKeys={[formData.status || "Active"]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "Active" | "Inactive" | "Draft",
                      })
                    }
                    size="lg"
                  >
                    <SelectItem key="Active">
                      Hoạt động
                    </SelectItem>
                    <SelectItem key="Draft">
                      Nháp
                    </SelectItem>
                    <SelectItem key="Inactive">
                      Không hoạt động
                    </SelectItem>
                  </Select>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                      className="w-4 h-4 text-[#39BDCC] border-gray-300 rounded focus:ring-[#39BDCC]"
                    />
                    <label htmlFor="active" className="text-sm font-medium text-gray-700">
                      Kích hoạt chính sách
                    </label>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Hủy
                </Button>
                <Button
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                >
                  {editingPolicy ? "Cập nhật" : "Tạo mới"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Xóa chính sách
              </ModalHeader>
              <ModalBody>
                {selectedPolicy && (
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      Bạn có chắc chắn muốn xóa chính sách này? Hành động này
                      không thể hoàn tác.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-900">
                        {selectedPolicy.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {selectedPolicy.description}
                      </p>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Hủy
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  onPress={async () => {
                    if (!selectedPolicy) return;
                    await handleDelete(selectedPolicy);
                    setIsDeleteOpen(false);
                    setSelectedPolicy(null);
                  }}
                >
                  Xác nhận xóa
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PolicyManagement;


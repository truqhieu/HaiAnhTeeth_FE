import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import {
  introductionApi,
  type Introduction,
} from "@/api/introduction";
import AddIntroductionModal from "@/components/Manager/AddIntroductionModal";
import EditIntroductionModal from "@/components/Manager/EditIntroductionModal";

const statusMap: Record<Introduction["status"], { label: string; color: "success" | "default" }> = {
  Published: { label: "Đang hiển thị", color: "success" },
  Hidden: { label: "Đang ẩn", color: "default" },
};

const TABLE_COLUMNS = [
  { key: "index", label: "STT" },
  { key: "thumbnail", label: "Ảnh" },
  { key: "title", label: "Tiêu đề" },
  { key: "status", label: "Trạng thái" },
  { key: "createdAt", label: "Ngày tạo" },
  { key: "actions", label: "Hành động" },
];

const PAGE_SIZE = 8;

const IntroductionManagement = () => {
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Introduction["status"]>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedIntroduction, setSelectedIntroduction] = useState<Introduction | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchIntroductions();
  }, [statusFilter, page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (page === 1) {
        fetchIntroductions();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const fetchIntroductions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await introductionApi.getAllIntroductions({
        page,
        limit: PAGE_SIZE,
        sort: "desc",
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchTerm.trim() || undefined,
      });

      if (response.success) {
        setIntroductions(response.data);
        setTotalRecords(response.total);
        setTotalPages(response.totalPages);
      } else {
        toast.error(response.message || "Không thể tải danh sách giới thiệu");
      }
    } catch (err: any) {
      console.error("❌ Error fetching introductions:", err);
      setError(err.message || "Không thể tải danh sách giới thiệu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (introduction: Introduction) => {
    setSelectedIntroduction(introduction);
    setIsEditOpen(true);
  };

  const handleDeleteIntroduction = async () => {
    if (!selectedIntroduction) return;
    try {
      setIsDeleting(true);
      const response = await introductionApi.deleteIntroduction(selectedIntroduction._id);
      if (response.success) {
        toast.success(response.message || "Đã xóa nội dung");
        setIsDeleteOpen(false);
        setSelectedIntroduction(null);
        fetchIntroductions();
      } else {
        toast.error(response.message || "Không thể xóa giới thiệu");
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa giới thiệu");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý giới thiệu</h1>
        <p className="text-gray-600 mt-2">Kiểm soát các nội dung hiển thị tại trang “Giới thiệu”.</p>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1 flex flex-col gap-4 md:flex-row">
              <Input
                className="w-full md:flex-1"
                placeholder="Tìm kiếm theo tiêu đề..."
                startContent={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
                value={searchTerm}
                variant="bordered"
                onValueChange={setSearchTerm}
              />

              <Select
                className="w-full md:w-48"
                placeholder="Trạng thái"
                selectedKeys={[statusFilter]}
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as "all" | Introduction["status"];
                  setStatusFilter(selected);
                }}
              >
                <SelectItem key="all">Tất cả trạng thái</SelectItem>
                <SelectItem key="Published">Đang hiển thị</SelectItem>
                <SelectItem key="Hidden">Đang ẩn</SelectItem>
              </Select>
            </div>

            <Button
              color="primary"
              className="w-full lg:w-auto"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={() => setIsAddOpen(true)}
            >
              Thêm giới thiệu
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-xl">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
              </div>
            ) : (
              <Table
                aria-label="Bảng quản lý giới thiệu"
                classNames={{
                  wrapper: "shadow-none",
                  th: "bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wide",
                }}
              >
                <TableHeader columns={TABLE_COLUMNS}>
                  {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody emptyContent="Chưa có nội dung giới thiệu nào" items={introductions}>
                  {(item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">
                          {(page - 1) * PAGE_SIZE + introductions.indexOf(item) + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs space-y-1">
                          <p className="font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-2">{item.summary}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={statusMap[item.status].color}
                          size="sm"
                          variant="flat"
                          className="text-xs"
                        >
                          {statusMap[item.status].label}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatDate(item.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Chỉnh sửa">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="min-w-8 h-8 text-blue-600 hover:bg-blue-50"
                              onPress={() => handleOpenEdit(item)}
                            >
                              <PencilIcon className="w-5 h-5" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Xóa">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="text-red-600"
                              onPress={() => {
                                setSelectedIntroduction(item);
                                setIsDeleteOpen(true);
                              }}
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

          {!loading && totalRecords > 0 && (
            <div className="flex justify-between items-center flex-wrap gap-4 pt-4">
              <p className="text-sm text-gray-500">
                Hiển thị {totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} đến{" "}
                {totalRecords === 0
                  ? 0
                  : Math.min((page - 1) * PAGE_SIZE + introductions.length, totalRecords)}{" "}
                trong tổng số {totalRecords} nội dung
              </p>
              <Pagination
                page={page}
                total={totalPages}
                onChange={setPage}
                showControls
                color="primary"
              />
            </div>
          )}
        </CardBody>
      </Card>

      <AddIntroductionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => fetchIntroductions()}
      />

      <EditIntroductionModal
        isOpen={isEditOpen}
        introduction={selectedIntroduction}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => fetchIntroductions()}
      />

      <Modal isOpen={isDeleteOpen} onClose={() => !isDeleting && setIsDeleteOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold text-gray-900">Xóa giới thiệu</h3>
            <p className="text-sm text-gray-500">Hành động không thể hoàn tác.</p>
          </ModalHeader>
          <ModalBody>
            <p>
              Bạn chắc chắn muốn xóa nội dung{" "}
              <span className="font-semibold text-gray-900">{selectedIntroduction?.title}</span>?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsDeleteOpen(false)} isDisabled={isDeleting}>
              Hủy
            </Button>
            <Button color="danger" onPress={handleDeleteIntroduction} isLoading={isDeleting}>
              Xóa
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default IntroductionManagement;




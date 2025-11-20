import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/solid";
import { Input, Button, Textarea, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import toast from "react-hot-toast";
import { blogApi, type Blog } from "@/api/blog";
import VietnameseDateInput from "@/components/Common/VietnameseDateInput";

interface EditBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: Blog | null;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { value: "News", label: "Tin tức" },
  { value: "Health Tips", label: "Mẹo sức khỏe" },
  { value: "Medical Services", label: "Dịch vụ y tế" },
  { value: "Promotions", label: "Khuyến mãi" },
  { value: "Patient Stories", label: "Câu chuyện bệnh nhân" },
  { value: "Recruitment", label: "Tuyển dụng" },
];

const EditBlogModal: React.FC<EditBlogModalProps> = ({
  isOpen,
  onClose,
  blog,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "News",
    status: "Published",
    startDate: "",
    endDate: "",
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title,
        content: blog.content,
        category: blog.category,
        status: blog.status,
        startDate: blog.startDate || "",
        endDate: blog.endDate || "",
      });
      setExistingThumbnail(blog.thumbnailUrl);
      setThumbnailPreview(null);
      setThumbnailFile(null);
    }
  }, [blog]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      setThumbnailFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validation
  const isTitleInvalid =
    showValidation && (!formData.title || formData.title.trim().length === 0);
  const isContentInvalid =
    showValidation &&
    (!formData.content || formData.content.trim().length === 0);

  const handleSubmit = async () => {
    if (!blog) return;

    setShowValidation(true);

    // Check if there are any errors
    const hasErrors =
      !formData.title.trim() ||
      !formData.content.trim();

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        status: formData.status,
      };

      // Only include thumbnail if a new file is selected
      if (thumbnailFile) {
        updateData.thumbnailFile = thumbnailFile;
      }

      // Chỉ thêm startDate và endDate nếu category là "Promotions"
      if (formData.category === "Promotions") {
        if (formData.startDate) {
          updateData.startDate = formData.startDate;
        } else {
          updateData.startDate = null; // Xóa nếu không có giá trị
        }
        if (formData.endDate) {
          updateData.endDate = formData.endDate;
        } else {
          updateData.endDate = null; // Xóa nếu không có giá trị
        }
      } else {
        // Xóa dates nếu đổi category khác "Promotions"
        updateData.startDate = null;
        updateData.endDate = null;
      }

      const response = await blogApi.updateBlog(blog._id, updateData);

      if (response.success) {
        toast.success("Cập nhật blog thành công");
        onSuccess?.();
        handleClose();
      } else {
        toast.error(response.message || "Đã xảy ra lỗi khi cập nhật blog");
      }
    } catch (error: any) {
      console.error("❌ Error updating blog:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi cập nhật blog");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setShowValidation(false);
    onClose();
  };

  if (!isOpen || !blog) return null;

  const displayImage = thumbnailPreview || existingThumbnail;

  return (
    <Modal
      isOpen={isOpen}
      isDismissable={false}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      size="3xl"
      scrollBehavior="outside"
      classNames={{ base: "max-h-[90vh] rounded-2xl" }}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <img
                alt="Logo"
                className="h-8 w-auto object-contain"
                src="/logo1.png"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa blog</h2>
                <p className="text-sm text-gray-600">{blog?.title}</p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="px-6 py-4 space-y-4">
            {/* Title */}
            <Input
              fullWidth
              id="title"
              label={
                <>
                  Tiêu đề <span className="text-red-500">*</span>
                </>
              }
              placeholder="Ví dụ: 5 mẹo chăm sóc răng miệng hiệu quả"
              value={formData.title}
              variant="bordered"
              isInvalid={isTitleInvalid}
              errorMessage={isTitleInvalid ? "Vui lòng nhập tiêu đề" : ""}
              onValueChange={(value) => handleInputChange("title", value)}
            />

            {/* Summary */}
            <Textarea
              fullWidth
              id="content"
              label={
                <>
                  Nội dung <span className="text-red-500">*</span>
                </>
              }
              minRows={3}
              placeholder="Viết nội dung chi tiết về blog..."
              value={formData.content}
              variant="bordered"
              isInvalid={isContentInvalid}
              errorMessage={isContentInvalid ? "Vui lòng nhập nội dung" : ""}
              onValueChange={(value) => handleInputChange("content", value)}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <Select
                className="w-full"
                id="category"
                label={
                  <>
                    Thể loại <span className="text-red-500">*</span>
                  </>
                }
                selectedKeys={[formData.category]}
                variant="bordered"
                disallowEmptySelection
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleInputChange("category", selected);
                  if (selected !== "Promotions") {
                    handleInputChange("startDate", "");
                    handleInputChange("endDate", "");
                  }
                }}
              >
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value}>{cat.label}</SelectItem>
                ))}
              </Select>

              {/* Status */}
              <Select
                className="w-full"
                id="status"
                label={
                  <>
                    Trạng thái <span className="text-red-500">*</span>
                  </>
                }
                selectedKeys={[formData.status]}
                variant="bordered"
                disallowEmptySelection
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleInputChange("status", selected);
                }}
              >
                <SelectItem key="Published">Xuất bản</SelectItem>
                <SelectItem key="Hidden">Ẩn</SelectItem>
              </Select>
            </div>

            {/* Date Range - Chỉ hiển thị khi category là "Promotions" */}
            {formData.category === "Promotions" && (
              <div className="grid grid-cols-2 gap-4">
                <VietnameseDateInput
                  id="startDate"
                  label="Ngày bắt đầu"
                  value={formData.startDate}
                  placeholder="dd/mm/yyyy"
                  onChange={(value) => handleInputChange("startDate", value)}
                />
                <VietnameseDateInput
                  id="endDate"
                  label="Ngày kết thúc"
                  value={formData.endDate}
                  minDate={formData.startDate || undefined}
                  placeholder="dd/mm/yyyy"
                  onChange={(value) => handleInputChange("endDate", value)}
                />
              </div>
            )}

            {/* Thumbnail Upload */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Ảnh đại diện {thumbnailPreview && <span className="text-xs text-gray-500">(Ảnh mới sẽ thay thế ảnh hiện tại)</span>}
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!displayImage ? (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors border-gray-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    Nhấp để chọn ảnh hoặc kéo thả vào đây
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF (tối đa 5MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative inline-block w-full">
                    <img
                      src={displayImage}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {thumbnailPreview && (
                      <Button
                        isIconOnly
                        size="sm"
                        className="absolute top-2 right-2 bg-red-500 text-white"
                        onPress={handleRemoveImage}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {!thumbnailPreview && (
                    <Button
                      size="sm"
                      variant="bordered"
                      onPress={() => fileInputRef.current?.click()}
                    >
                      Thay đổi ảnh
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-4 w-full">
              <Button
                variant="bordered"
                onPress={handleClose}
                isDisabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                isLoading={isSubmitting}
                onPress={handleSubmit}
              >
                Cập nhật
              </Button>
            </div>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default EditBlogModal;


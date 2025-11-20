import React, { useState, useRef } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/solid";
import { Input, Button, Textarea, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import toast from "react-hot-toast";
import { blogApi } from "@/api/blog";
import VietnameseDateInput from "@/components/Common/VietnameseDateInput";

interface AddBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const AddBlogModal: React.FC<AddBlogModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category: "News",
    status: "Published",
    startDate: "",
    endDate: "",
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const isSummaryInvalid =
    showValidation && (!formData.summary || formData.summary.trim().length === 0);
  const isContentInvalid =
    showValidation &&
    (!formData.content || formData.content.trim().length === 0);
  const isThumbnailInvalid = showValidation && !thumbnailFile;

  const handleSubmit = async () => {
    setShowValidation(true);

    // Check if there are any errors
    const hasErrors =
      !formData.title.trim() ||
      !formData.summary.trim() ||
      !formData.content.trim() ||
      !thumbnailFile;

    if (hasErrors) {
      if (!thumbnailFile) {
        toast.error("Vui lòng chọn ảnh đại diện");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const createData: any = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        category: formData.category,
        status: formData.status,
        thumbnailFile: thumbnailFile,
      };

      // Chỉ thêm startDate và endDate nếu category là "Promotions"
      if (formData.category === "Promotions") {
        if (formData.startDate) {
          createData.startDate = formData.startDate;
        }
        if (formData.endDate) {
          createData.endDate = formData.endDate;
        }
      }

      const response = await blogApi.createBlog(createData);

      if (response.success) {
        toast.success("Tạo blog thành công");
        onSuccess?.();
        handleClose();
      } else {
        toast.error(response.message || "Đã xảy ra lỗi khi tạo blog");
      }
    } catch (error: any) {
      console.error("❌ Error creating blog:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi tạo blog");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    // Reset form
    setFormData({
      title: "",
      summary: "",
      content: "",
      category: "News",
      status: "Published",
      startDate: "",
      endDate: "",
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setShowValidation(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  if (!isOpen) return null;

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
                <h2 className="text-2xl font-bold text-gray-900">Thêm blog mới</h2>
                <p className="text-sm text-gray-600">Tạo bài viết blog mới</p>
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
              id="summary"
              label={
                <>
                  Tóm tắt <span className="text-red-500">*</span>
                </>
              }
              minRows={2}
              placeholder="Viết tóm tắt ngắn gọn về blog..."
              value={formData.summary}
              variant="bordered"
              isInvalid={isSummaryInvalid}
              errorMessage={isSummaryInvalid ? "Vui lòng nhập tóm tắt" : ""}
              onValueChange={(value) => handleInputChange("summary", value)}
            />

            {/* Content */}
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
                Ảnh đại diện <span className="text-red-500">*</span>
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!thumbnailPreview ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                    isThumbnailInvalid ? "border-red-500" : "border-gray-300"
                  }`}
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
                <div className="relative inline-block">
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    className="absolute top-2 right-2 bg-red-500 text-white"
                    onPress={handleRemoveImage}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {isThumbnailInvalid && (
                <p className="text-xs text-red-500 mt-2">
                  Vui lòng chọn ảnh đại diện
                </p>
              )}
            </div>
          </ModalBody>

          <ModalFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
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
              Tạo blog
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default AddBlogModal;


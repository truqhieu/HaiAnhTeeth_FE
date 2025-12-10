import { useRef, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Button,
} from "@heroui/react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { introductionApi, type Introduction } from "@/api/introduction";

interface AddIntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (introduction: Introduction) => void;
}

const AddIntroductionModal: React.FC<AddIntroductionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"Published" | "Hidden">("Published");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle("");
    setSummary("");
    setStatus("Published");
    setThumbnailFile(null);
    setPreview(null);
    setShowValidation(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }

    setThumbnailFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setShowValidation(true);
    if (!title.trim() || !summary.trim() || !thumbnailFile) {
      if (!thumbnailFile) toast.error("Vui lòng chọn ảnh");
      return;
    }

    try {
      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const normalizeText = (text: string): string => {
        return text.trim().replace(/\s+/g, ' ');
      };

      setSubmitting(true);
      const response = await introductionApi.createIntroduction({
        title: normalizeText(title),
        summary: normalizeText(summary),
        status,
        thumbnailFile,
      });

      if (response.success) {
        toast.success(response.message || "Tạo giới thiệu thành công");
        onSuccess?.(response.data as Introduction);
        handleClose();
      } else {
        toast.error(response.message || "Không thể tạo giới thiệu");
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo giới thiệu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" scrollBehavior="outside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Thêm nội dung mới</h2>
          <p className="text-sm text-gray-500">Chia sẻ câu chuyện, giá trị của phòng khám</p>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Input
            label="Tiêu đề"
            placeholder="Nhập tiêu đề"
            value={title}
            onValueChange={setTitle}
            isInvalid={showValidation && !title.trim()}
            errorMessage={showValidation && !title.trim() ? "Vui lòng nhập tiêu đề" : ""}
          />
          <Textarea
            label="Nội dung"
            placeholder="Viết nội dung giới thiệu..."
            value={summary}
            onValueChange={setSummary}
            minRows={4}
            isInvalid={showValidation && !summary.trim()}
            errorMessage={showValidation && !summary.trim() ? "Vui lòng nhập nội dung" : ""}
          />
          <Select
            label="Trạng thái hiển thị"
            selectedKeys={[status]}
            onChange={(event) => setStatus(event.target.value as "Published" | "Hidden")}
          >
            <SelectItem key="Published">Hiển thị</SelectItem>
            <SelectItem key="Hidden">Ẩn</SelectItem>
          </Select>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              Ảnh đại diện <span className="text-red-500">*</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {!preview ? (
              <button
                type="button"
                className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-10 ${
                  showValidation && !thumbnailFile ? "border-red-500 text-red-500" : "border-gray-300 text-gray-500"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <PhotoIcon className="w-10 h-10" />
                <p className="font-medium">Chọn ảnh</p>
                <p className="text-xs">PNG / JPG / JPEG (tối đa 5MB)</p>
              </button>
            ) : (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-56 object-cover rounded-xl border border-gray-200"
                />
                <Button
                  size="sm"
                  color="danger"
                  className="absolute top-3 right-3"
                  onPress={() => {
                    setThumbnailFile(null);
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Xóa ảnh
                </Button>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={submitting}>
            Hủy
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={submitting}>
            Thêm giới thiệu
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddIntroductionModal;



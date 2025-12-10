import { useEffect, useRef, useState } from "react";
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

import {
  introductionApi,
  type Introduction,
} from "@/api/introduction";

interface EditIntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  introduction: Introduction | null;
  onSuccess?: (introduction: Introduction) => void;
}

const EditIntroductionModal: React.FC<EditIntroductionModalProps> = ({
  isOpen,
  onClose,
  introduction,
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

  useEffect(() => {
    if (!introduction) return;
    setTitle(introduction.title);
    setSummary(introduction.summary);
    setStatus(introduction.status);
    setThumbnailFile(null);
    setPreview(introduction.thumbnailUrl || null);
    setShowValidation(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [introduction, isOpen]);

  const handleClose = () => {
    if (submitting) return;
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
    if (!introduction) return;

    setShowValidation(true);
    if (!title.trim() || !summary.trim()) return;

    try {
      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const normalizeText = (text: string): string => {
        return text.trim().replace(/\s+/g, ' ');
      };

      setSubmitting(true);
      const response = await introductionApi.updateIntroduction(introduction._id, {
        title: normalizeText(title),
        summary: normalizeText(summary),
        status,
        thumbnailFile: thumbnailFile ?? undefined,
      });

      if (response.success) {
        toast.success(response.message || "Cập nhật giới thiệu thành công");
        onSuccess?.((response.data as Introduction) ?? introduction);
        handleClose();
      } else {
        toast.error(response.message || "Không thể cập nhật giới thiệu");
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật giới thiệu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" scrollBehavior="outside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Chỉnh sửa giới thiệu</h2>
          <p className="text-sm text-gray-500">
            Điều chỉnh nội dung hiển thị trên trang giới thiệu
          </p>
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
            label="Trạng thái"
            selectedKeys={[status]}
            onChange={(event) => setStatus(event.target.value as "Published" | "Hidden")}
          >
            <SelectItem key="Published">Hiển thị</SelectItem>
            <SelectItem key="Hidden">Ẩn</SelectItem>
          </Select>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Ảnh đại diện</p>
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
                className="w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 py-10 text-gray-500"
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
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="bordered"
                    onPress={() => fileInputRef.current?.click()}
                  >
                    Đổi ảnh
                  </Button>
                  {thumbnailFile && (
                    <Button
                      size="sm"
                      color="danger"
                      onPress={() => {
                        setThumbnailFile(null);
                        setPreview(introduction?.thumbnailUrl || null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      Hủy
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={submitting}>
            Hủy
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={submitting}>
            Cập nhật giới thiệu
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditIntroductionModal;



import { forwardRef, useState, useEffect, useRef } from "react";
import { Input, Button, Select, SelectItem, Avatar } from "@heroui/react";
import {
  EyeIcon,
  EyeSlashIcon,
  CameraIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import DatePicker, { registerLocale } from "react-datepicker";
import viLocale from "date-fns/locale/vi";
import toast from "react-hot-toast";

import { authApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import "react-datepicker/dist/react-datepicker.css";

interface UserProfileFormProps {
  title?: string;
  description?: string;
  showEmergencyContact?: boolean;
}

const genderOptions = [
  { key: "Male", label: "Nam" },
  { key: "Female", label: "Nữ" },
  { key: "Other", label: "Khác" },
];

const relationshipOptions = [
  { key: "Father", label: "Cha" },
  { key: "Mother", label: "Mẹ" },
  { key: "Brother", label: "Anh trai/Em trai" },
  { key: "Sister", label: "Chị gái/Em gái" },
  { key: "Spouse", label: "Vợ/Chồng" },
  { key: "Friend", label: "Bạn bè" },
  { key: "Other", label: "Khác" },
];

const PROFILE_DATE_PICKER_PORTAL_ID = "profile-date-picker-portal";

const ensureProfileDatePickerPortal = () => {
  if (typeof document === "undefined") return;
  if (!document.getElementById(PROFILE_DATE_PICKER_PORTAL_ID)) {
    const portalRoot = document.createElement("div");
    portalRoot.id = PROFILE_DATE_PICKER_PORTAL_ID;
    portalRoot.style.position = "relative";
    portalRoot.style.zIndex = "9999";
    document.body.appendChild(portalRoot);
  }
};

registerLocale("vi", viLocale);

const formatDateToISO = (date: Date | null) => {
  if (!date) return "";
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().split("T")[0];
};

const parseDateValue = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

interface BirthDateInputProps {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
  onClear?: () => void;
}

const BirthDateInput = forwardRef<HTMLInputElement, BirthDateInputProps>(
  ({ value, onClick, placeholder, onClear }, ref) => (
    <Input
      ref={ref}
      value={value || ""}
      readOnly
      onClick={onClick}
      placeholder={placeholder}
      label="Ngày sinh"
      labelPlacement="outside"
      variant="bordered"
      classNames={{
        base: "w-full",
        input: "bg-gray-100",
        inputWrapper: "bg-gray-100 border-gray-300 cursor-pointer",
      }}
      startContent={<CalendarIcon className="w-5 h-5 text-gray-400" />}
      endContent={
        value ? (
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClear?.();
            }}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        ) : null
      }
    />
  ),
);

BirthDateInput.displayName = "BirthDateInput";

const UserProfileForm = ({
  title = "Hồ sơ cá nhân",
  description = "Quản lý thông tin, địa chỉ liên lạc của bạn",
  showEmergencyContact = false,
}: UserProfileFormProps) => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    ensureProfileDatePickerPortal();
  }, []);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    setEmail(user.email || "");
    setPhone(user.phone || user.phoneNumber || "");
    setAddress(user.address || "");
    setGender(user.gender || "");
    if (user.dateOfBirth || user.dob) {
      const dob = new Date(user.dateOfBirth || user.dob || "");
      if (!isNaN(dob.getTime())) {
        setBirthDate(dob.toISOString().split("T")[0]);
      }
    }
    if (showEmergencyContact) {
      const emergencyContact = (user as any).emergencyContact;
      setEmergencyName(emergencyContact?.name || "");
      setEmergencyPhone(emergencyContact?.phone || "");
      setEmergencyRelationship(emergencyContact?.relationship || "");
    }
    setAvatarPreview(user.avatar || null);
  }, [user, showEmergencyContact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }
    const phoneRegex = /^[0-9]*$/;
    if (phone.trim() && !phoneRegex.test(phone.trim())) {
      toast.error("Số điện thoại chỉ được nhập số");
      return;
    }
    if (showEmergencyContact && emergencyPhone.trim() && !phoneRegex.test(emergencyPhone.trim())) {
      toast.error("Số điện thoại người liên hệ khẩn cấp chỉ được nhập số");
      return;
    }
    if (phone.trim() && (phone.trim().length < 10 || phone.trim().length > 11)) {
      toast.error("Số điện thoại phải có 10-11 chữ số");
      return;
    }
    if (
      showEmergencyContact &&
      emergencyPhone.trim() &&
      (emergencyPhone.trim().length < 10 || emergencyPhone.trim().length > 11)
    ) {
      toast.error("Số điện thoại người liên hệ khẩn cấp phải có 10-11 chữ số");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      formData.append("phoneNumber", phone.trim());
      formData.append("address", address.trim());
      if (gender) {
        formData.append("gender", gender);
      }
      if (birthDate) {
        formData.append("dob", birthDate);
      }

      if (showEmergencyContact) {
        if (
          emergencyName.trim() &&
          emergencyPhone.trim() &&
          emergencyRelationship.trim()
        ) {
          formData.append(
            "emergencyContact",
            JSON.stringify({
              name: emergencyName.trim(),
              phone: emergencyPhone.trim(),
              relationship: emergencyRelationship.trim(),
            }),
          );
        } else if (
          emergencyName.trim() ||
          emergencyPhone.trim() ||
          emergencyRelationship.trim()
        ) {
          toast.error(
            "Vui lòng điền đầy đủ thông tin liên hệ khẩn cấp hoặc bỏ trống cả 3 trường.",
          );
          setIsLoading(false);
          return;
        }
      }

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      let passwordChangeSuccess = true;
      if (newPassword.trim()) {
        if (!currentPassword.trim()) {
          toast.error("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu");
          setIsLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
          setIsLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("Mật khẩu xác nhận không khớp");
          setIsLoading(false);
          return;
        }
        try {
          const passwordResponse = await authApi.changePassword({
            currentPassword: currentPassword.trim(),
            newPassword: newPassword.trim(),
          });
          if (!passwordResponse.success) {
            toast.error(passwordResponse.message || "Không thể đổi mật khẩu");
            passwordChangeSuccess = false;
          }
        } catch (passwordError: any) {
          toast.error(passwordError.message || "Không thể đổi mật khẩu.");
          passwordChangeSuccess = false;
        }
      }

      const response = await authApi.updateProfile(formData, true);
      if (response.success && response.data) {
        const userData = response.data.user;
        if (userData && user) {
          const updatedUser = {
            ...user,
            ...userData,
            _id: userData.id || userData._id || user._id,
          };
          updateUser(updatedUser as any);
        }
        if (newPassword.trim() && passwordChangeSuccess) {
          toast.success("Cập nhật thông tin và đổi mật khẩu thành công!");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          toast.success(response.message || "Cập nhật thông tin thành công!");
        }
      } else {
        toast.error(response.message || "Có lỗi xảy ra khi cập nhật");
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật thông tin");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordField = (
    label: string,
    value: string,
    setValue: (val: string) => void,
    field: "current" | "new" | "confirm",
  ) => (
    <Input
      classNames={{
        input: "bg-gray-100",
        inputWrapper: "bg-gray-100 border-gray-300",
      }}
      label={label}
      labelPlacement="outside"
      placeholder="••••••"
      type={isPasswordVisible[field] ? "text" : "password"}
      value={value}
      variant="bordered"
      onValueChange={setValue}
      endContent={
        <button
          type="button"
          className="focus:outline-none"
          onClick={() =>
            setIsPasswordVisible((prev) => ({ ...prev, [field]: !prev[field] }))
          }
        >
          {isPasswordVisible[field] ? (
            <EyeSlashIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <EyeIcon className="w-4 h-4 text-gray-500" />
          )}
        </button>
      }
    />
  );

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 text-lg mt-1">{description}</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Thông tin tài khoản
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Cập nhật ảnh đại diện và thông tin cá nhân của bạn
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar
                    className="w-24 h-24 text-2xl"
                    src={avatarPreview || user?.avatar || undefined}
                    name={user?.fullName || "User"}
                  />
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-200 hover:bg-gray-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CameraIcon className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Ảnh sẽ xuất hiện trên trang cá nhân và phần đầu trang.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Hỗ trợ PNG, JPG (tối đa 2MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        toast.error("Vui lòng chọn file ảnh hợp lệ");
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Dung lượng ảnh tối đa 2MB");
                        return;
                      }
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  isRequired
                  classNames={{
                    input: "bg-gray-100",
                    inputWrapper: "bg-gray-100 border-gray-300",
                  }}
                  label="Họ và tên"
                  labelPlacement="outside"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  variant="bordered"
                  onValueChange={setFullName}
                />
              </div>

              <div className="w-full md:max-w-sm md:justify-self-start">
                <DatePicker
                  selected={parseDateValue(birthDate)}
                  onChange={(date) => setBirthDate(formatDateToISO(date))}
                  dateFormat="dd/MM/yyyy"
                  locale="vi"
                  calendarStartDay={1}
                  showPopperArrow={false}
                  popperPlacement="bottom-start"
                  popperClassName="z-[9999]"
                  popperProps={{
                    strategy: "fixed",
                  }}
                  portalId={PROFILE_DATE_PICKER_PORTAL_ID}
                  wrapperClassName="w-full"
                  customInput={
                    <BirthDateInput
                      placeholder="dd/mm/yyyy"
                      onClear={() => setBirthDate("")}
                    />
                  }
                />
              </div>

              <div className="w-full md:max-w-sm md:justify-self-start">
                <Select
                  classNames={{
                    trigger: "bg-gray-100 border-gray-300",
                    value: "bg-gray-100",
                  }}
                  label="Giới tính"
                  labelPlacement="outside"
                  placeholder="Chọn giới tính"
                  selectedKeys={gender ? [gender] : []}
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setGender(selectedKey);
                  }}
                >
                  {genderOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>
              </div>

              <div className="md:col-span-2">
                <Input
                  classNames={{
                    input: "bg-gray-100",
                    inputWrapper: "bg-gray-100 border-gray-300",
                  }}
                  label="Địa chỉ"
                  labelPlacement="outside"
                  placeholder="Nhập địa chỉ"
                  value={address}
                  variant="bordered"
                  onValueChange={setAddress}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Địa chỉ liên lạc
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                classNames={{
                  input: "bg-gray-100",
                  inputWrapper: "bg-gray-100 border-gray-300",
                }}
                label="Số điện thoại"
                labelPlacement="outside"
                maxLength={11}
                placeholder="Nhập số điện thoại (10-11 số)"
                type="tel"
                value={phone}
                variant="bordered"
                onValueChange={(value) => {
                  const numericValue = value.replace(/[^0-9]/g, "");
                  setPhone(numericValue);
                }}
              />

              <Input
                isDisabled
                classNames={{
                  input: "bg-gray-200",
                  inputWrapper: "bg-gray-200 border-gray-300",
                }}
                label="Email"
                labelPlacement="outside"
                placeholder="Email"
                type="email"
                value={email}
                variant="bordered"
              />
            </div>
          </div>

          {showEmergencyContact && (
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Thông tin liên hệ khẩn cấp
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Người thân hoặc bạn bè có thể liên hệ trong trường hợp khẩn cấp
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  classNames={{
                    input: "bg-gray-100",
                    inputWrapper: "bg-gray-100 border-gray-300",
                  }}
                  label="Họ và tên"
                  labelPlacement="outside"
                  placeholder="Nhập họ tên"
                  value={emergencyName}
                  variant="bordered"
                  onValueChange={setEmergencyName}
                />

                <Input
                  classNames={{
                    input: "bg-gray-100",
                    inputWrapper: "bg-gray-100 border-gray-300",
                  }}
                  label="Số điện thoại"
                  labelPlacement="outside"
                  maxLength={11}
                  placeholder="Nhập số điện thoại"
                  type="tel"
                  value={emergencyPhone}
                  variant="bordered"
                  onValueChange={(value) => {
                    const numericValue = value.replace(/[^0-9]/g, "");
                    setEmergencyPhone(numericValue);
                  }}
                />

                <Select
                  classNames={{
                    trigger: "bg-gray-100 border-gray-300",
                    value: "bg-gray-100",
                  }}
                  label="Mối quan hệ"
                  labelPlacement="outside"
                  placeholder="Chọn mối quan hệ"
                  selectedKeys={
                    emergencyRelationship ? [emergencyRelationship] : []
                  }
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setEmergencyRelationship(selectedKey);
                  }}
                >
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Đổi mật khẩu
                </h2>
                <p className="text-sm text-gray-500">
                  Để trống nếu bạn không muốn đổi mật khẩu
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderPasswordField(
                "Mật khẩu hiện tại",
                currentPassword,
                setCurrentPassword,
                "current",
              )}
              {renderPasswordField(
                "Mật khẩu mới",
                newPassword,
                setNewPassword,
                "new",
              )}
              {renderPasswordField(
                "Xác nhận mật khẩu mới",
                confirmPassword,
                setConfirmPassword,
                "confirm",
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button size="lg" variant="light">
              Hủy
            </Button>
            <Button
              className="bg-[#39BDCC] text-white"
              isLoading={isLoading}
              size="lg"
              type="submit"
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default UserProfileForm;




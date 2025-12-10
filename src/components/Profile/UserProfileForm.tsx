import { forwardRef, useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Select, SelectItem, Avatar, Textarea } from "@heroui/react";
import {
  CameraIcon,
  CalendarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import toast from "react-hot-toast";
import viLocale from "@/utils/viLocale";

import { authApi, doctorApi } from "@/api";
import type { DoctorProfileInfo } from "@/api";
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

registerLocale("vi", viLocale as any);
setDefaultLocale("vi");

const MAX_CERT_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const isLikelyImageUrl = (url?: string | null) => {
  if (!url) return false;
  const normalized = url.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(normalized);
};

const extractDoctorProfileId = (profile?: DoctorProfileInfo | null) => {
  if (!profile) return "";
  if (typeof profile.doctorUserId === "string") {
    return profile.doctorUserId;
  }
  const nested = profile.doctorUserId as { _id?: string; id?: string } | undefined;
  return nested?._id || nested?.id || "";
};

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

// Format date to dd/mm/yyyy for display
const formatDateToDisplay = (date: Date | null) => {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format input to automatically add "/" between dd, mm, yyyy
const formatDateInput = (input: string | undefined | null): string => {
  // Handle null/undefined/empty input
  if (!input || typeof input !== 'string') {
    return "";
  }
  
  // Remove all non-digit characters
  const digitsOnly = input.replace(/\D/g, "");
  
  // Limit to 8 digits (ddmmyyyy)
  const limitedDigits = digitsOnly.slice(0, 8);
  
  // Add slashes automatically
  let formatted = "";
  
  if (limitedDigits.length > 0) {
    formatted += limitedDigits.slice(0, 2); // Day
  }
  if (limitedDigits.length > 2) {
    formatted += "/" + limitedDigits.slice(2, 4); // Month
  }
  if (limitedDigits.length > 4) {
    formatted += "/" + limitedDigits.slice(4, 8); // Year
  }
  
  return formatted;
};

// Parse dd/mm/yyyy format from user input
const parseDateFromInput = (input: string): Date | null => {
  if (!input || input.trim() === "") return null;
  
  // Remove any extra spaces
  const cleaned = input.trim();
  
  // Match dd/mm/yyyy or d/m/yyyy formats
  const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleaned.match(datePattern);
  
  if (!match) return null;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
  const year = parseInt(match[3], 10);
  
  // Validate date
  const date = new Date(year, month, day);
  
  // Check if the date is valid and matches the input
  if (
    date.getDate() === day &&
    date.getMonth() === month &&
    date.getFullYear() === year &&
    date.getTime() <= new Date().getTime() // Not in the future
  ) {
    return date;
  }
  
  return null;
};

interface BirthDateInputProps {
  value?: string;
  onClick?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  onClear?: () => void;
}

const BirthDateInput = forwardRef<HTMLInputElement, BirthDateInputProps>(
  ({ value, onClick, onChange, placeholder, onClear }, ref) => {
    // React-datepicker passes the formatted value here - use it directly
    const displayValue = value !== undefined && value !== null ? String(value) : "";
    const hasValue = displayValue && displayValue.trim().length > 0;
    
    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      // Call react-datepicker's onClick to open calendar
      if (onClick) {
        onClick();
      }
    };
    
    const handleButtonClick = () => {
      // Call react-datepicker's onClick to open calendar
      if (onClick) {
        onClick();
      }
    };
    
    const handleFocus = () => {
      // Call react-datepicker's onClick to open calendar on focus
      if (onClick) {
        onClick();
      }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        // Simply pass through to react-datepicker's onChange
        // React-datepicker will handle the value updates
        // Formatting for manual typing is handled in onChangeRaw
        onChange(e);
      }
    };
    
    return (
      <Input
        ref={ref}
        value={displayValue}
        placeholder={placeholder || "dd/mm/yyyy"}
        onClick={handleClick}
        onChange={handleChange}
        onFocus={handleFocus}
        label="Ngày sinh"
        labelPlacement="outside"
        variant="bordered"
        classNames={{
          base: "w-full",
          input: "bg-gray-100 cursor-pointer",
          inputWrapper: "bg-gray-100 border-gray-300 cursor-pointer",
        }}
        startContent={
          <button
            type="button"
            onClick={handleButtonClick}
            className="cursor-pointer"
            tabIndex={-1}
          >
            <CalendarIcon className="w-5 h-5 text-gray-400" />
          </button>
        }
        endContent={
          hasValue ? (
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
    );
  },
);

BirthDateInput.displayName = "BirthDateInput";

const UserProfileForm = ({
  title = "Hồ sơ cá nhân",
  description = "Quản lý thông tin, địa chỉ liên lạc của bạn",
  showEmergencyContact = false,
}: UserProfileFormProps) => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const isDoctor = user?.role === "doctor";
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const certificateInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateDisplay, setBirthDateDisplay] = useState("");
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
  const [doctorCertificateUrl, setDoctorCertificateUrl] = useState<string | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [doctorProfileLoading, setDoctorProfileLoading] = useState(false);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const [specialization, setSpecialization] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [summary, setSummary] = useState("");
  const [savingProfessionalInfo, setSavingProfessionalInfo] = useState(false);
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
        const isoDate = dob.toISOString().split("T")[0];
        setBirthDate(isoDate);
        setBirthDateDisplay(formatDateToDisplay(dob));
      }
    } else {
      setBirthDate("");
      setBirthDateDisplay("");
    }
    if (showEmergencyContact) {
      const emergencyContact = (user as any).emergencyContact;
      setEmergencyName(emergencyContact?.name || "");
      setEmergencyPhone(emergencyContact?.phone || "");
      setEmergencyRelationship(emergencyContact?.relationship || "");
    }
    setAvatarPreview(user.avatar || null);
  }, [user, showEmergencyContact]);

  useEffect(() => {
    return () => {
      if (certificatePreview && certificatePreview.startsWith("blob:")) {
        URL.revokeObjectURL(certificatePreview);
      }
    };
  }, [certificatePreview]);

  useEffect(() => {
    if (!isDoctor || !user?._id) {
      setDoctorCertificateUrl(null);
      return;
    }

    let isMounted = true;

    const loadDoctorProfile = async () => {
      setDoctorProfileLoading(true);
      try {
        const response = await doctorApi.getDoctorInfoList();
        if (!isMounted) return;

        if (response.success && Array.isArray(response.data)) {
          const doctorRecord = response.data.find((profile) => {
            const profileId = extractDoctorProfileId(profile);
            const currentId = user._id || (user as any).id;
            return profileId && currentId && profileId.toString() === currentId.toString();
          });
          setDoctorCertificateUrl(doctorRecord?.certificate || null);
          setSpecialization(doctorRecord?.specialization || "");
          setYearsOfExperience(doctorRecord?.yearsOfExperience?.toString() || "");
          setSummary(doctorRecord?.summary || "");
        } else {
          toast.error(response.message || "Không thể tải thông tin bác sĩ");
        }
      } catch (error: any) {
        console.error("Error loading doctor profile:", error);
        if (isMounted) {
          toast.error(error.message || "Không thể tải thông tin bác sĩ");
        }
      } finally {
        if (isMounted) {
          setDoctorProfileLoading(false);
        }
      }
    };

    loadDoctorProfile();

    return () => {
      isMounted = false;
    };
  }, [isDoctor, user?._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted", { showEmergencyContact, emergencyName, emergencyPhone, emergencyRelationship });
    
    // Allow avatar-only updates - if avatar is being updated, don't require other fields
    // Otherwise, require fullName for other profile updates
    if (!avatarFile && !fullName.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }
    const phoneRegex = /^[0-9]*$/;
    if (phone.trim() && !phoneRegex.test(phone.trim())) {
      toast.error("Số điện thoại chỉ được nhập số");
      return;
    }
    // Validate emergency phone only if it's filled (it's optional)
    if (showEmergencyContact && emergencyPhone.trim() && !phoneRegex.test(emergencyPhone.trim())) {
      toast.error("Số điện thoại người liên hệ khẩn cấp chỉ được nhập số");
      return;
    }
    // Validate phone only if it's filled (it's optional)
    if (phone.trim() && (phone.trim().length < 10 || phone.trim().length > 11)) {
      toast.error("Số điện thoại phải có 10-11 chữ số");
      return;
    }
    // Validate emergency phone length only if it's filled (it's optional)
    if (
      showEmergencyContact &&
      emergencyPhone.trim() &&
      (emergencyPhone.trim().length < 10 || emergencyPhone.trim().length > 11)
    ) {
      toast.error("Số điện thoại người liên hệ khẩn cấp phải có 10-11 chữ số");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const normalizeText = (text: string): string => {
        return text.trim().replace(/\s+/g, ' ');
      };

      const formData = new FormData();
      
      // Only append fields that have values (allow partial updates)
      if (fullName.trim()) {
        formData.append("fullName", normalizeText(fullName));
      }
      if (phone.trim()) {
        formData.append("phoneNumber", phone.trim());
      }
      if (address.trim()) {
        formData.append("address", normalizeText(address));
      }
      if (gender) {
        formData.append("gender", gender);
      }
      if (birthDate) {
        formData.append("dob", birthDate);
      }

      if (showEmergencyContact) {
        // Emergency contact is now completely optional - send whatever fields are filled
        // If all fields are empty, send empty object to clear existing data
        const emergencyContactData = {
          name: normalizeText(emergencyName) || "",
          phone: emergencyPhone.trim() || "",
          relationship: emergencyRelationship.trim() || "",
        };
        
        // Debug: log emergency contact data
        console.log("Emergency Contact Data:", emergencyContactData);
        formData.append("emergencyContact", JSON.stringify(emergencyContactData));
        
        // Debug: verify FormData
        console.log("FormData emergencyContact:", formData.get("emergencyContact"));
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
            confirmPassword: confirmPassword.trim(),
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

      // Debug: log all FormData before sending
      console.log("Submitting form with emergencyContact:", showEmergencyContact);
      
      const response = await authApi.updateProfile(formData, true);
      console.log("Update profile response:", response);
      
      if (response.success && response.data) {
        const userData = response.data.user;
        console.log("Updated user data:", userData);
        console.log("Emergency contact in response:", userData?.emergencyContact);
        
        if (userData && user) {
          // Get the emergency contact data we sent - this is what we want to preserve
          const sentEmergencyContact = showEmergencyContact ? {
            name: emergencyName.trim() || "",
            phone: emergencyPhone.trim() || "",
            relationship: emergencyRelationship.trim() || "",
          } : null;
          
          // Create updated user, but exclude emergencyContact from userData spread
          // We'll handle emergencyContact separately
          const { emergencyContact: backendEmergencyContact, ...userDataWithoutEmergencyContact } = userData;
          
          const updatedUser = {
            ...user,
            ...userDataWithoutEmergencyContact,
            _id: userData.id || userData._id || user._id,
          };
          
          // Handle emergencyContact - prioritize what we sent over backend response
          // Backend might only return partial data, so we merge intelligently
          if (showEmergencyContact && sentEmergencyContact) {
            // Use what we sent as the source of truth
            // If backend returned something, merge it (but our sent data takes priority for missing fields)
            const backendContact = backendEmergencyContact && typeof backendEmergencyContact === 'object' 
              ? backendEmergencyContact 
              : {};
            
            (updatedUser as any).emergencyContact = {
              name: sentEmergencyContact.name || (backendContact as any).name || "",
              phone: sentEmergencyContact.phone || (backendContact as any).phone || "",
              relationship: sentEmergencyContact.relationship || (backendContact as any).relationship || "",
            };
          }
          
          console.log("Final user data being updated:", updatedUser);
          console.log("Final emergency contact:", (updatedUser as any).emergencyContact);
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
        
        // Clear avatar file state after successful save
        if (avatarFile) {
          setAvatarFile(null);
        }
      } else {
        toast.error(response.message || "Có lỗi xảy ra khi cập nhật");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Không thể cập nhật thông tin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCertificateSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!(file.type === "application/pdf" || file.type.startsWith("image/"))) {
      toast.error("Vui lòng chọn file ảnh hoặc PDF hợp lệ");
      return;
    }

    if (file.size > MAX_CERT_FILE_SIZE) {
      toast.error("Dung lượng chứng chỉ tối đa 5MB");
      return;
    }

    if (certificatePreview && certificatePreview.startsWith("blob:")) {
      URL.revokeObjectURL(certificatePreview);
    }

    setCertificateFile(file);
    setCertificatePreview(URL.createObjectURL(file));
  };

  const handleClearCertificateSelection = () => {
    if (certificatePreview && certificatePreview.startsWith("blob:")) {
      URL.revokeObjectURL(certificatePreview);
    }
    setCertificateFile(null);
    setCertificatePreview(null);
    if (certificateInputRef.current) {
      certificateInputRef.current.value = "";
    }
  };

  const handleUploadCertificate = async () => {
    if (!isDoctor) {
      toast.error("Chỉ bác sĩ mới có thể cập nhật chứng chỉ");
      return;
    }
    if (!certificateFile) {
      toast.error("Vui lòng chọn file chứng chỉ trước khi lưu");
      return;
    }

    setCertificateUploading(true);
    try {
      const formData = new FormData();
      formData.append("certificate", certificateFile);

      const response = await doctorApi.updateProfile(formData);
      if (response.success && response.data) {
        setDoctorCertificateUrl(response.data.certificate || null);
        toast.success("Đã cập nhật chứng chỉ bác sĩ");
        handleClearCertificateSelection();
      } else {
        toast.error(response.message || "Không thể cập nhật chứng chỉ");
      }
    } catch (error: any) {
      console.error("Error uploading certificate:", error);
      toast.error(error.message || "Không thể cập nhật chứng chỉ");
    } finally {
      setCertificateUploading(false);
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
          type="password"
          value={value}
          variant="bordered"
          onValueChange={setValue}
        />
  );

  const activeCertificateUrl = certificatePreview || doctorCertificateUrl;
  const shouldShowImagePreview = certificateFile
    ? certificateFile.type.startsWith("image/")
    : isLikelyImageUrl(activeCertificateUrl);

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
                    label: "group-data-[required=true]:after:content-['*'] group-data-[required=true]:after:text-red-500 group-data-[required=true]:after:ml-0.5",
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
                  onChange={(date) => {
                    // Handle calendar selection - this is called when user clicks a date in calendar
                    if (date && date instanceof Date && !isNaN(date.getTime())) {
                      const isoDate = formatDateToISO(date);
                      const displayDate = formatDateToDisplay(date);
                      setBirthDate(isoDate);
                      setBirthDateDisplay(displayDate);
                    } else if (date === null) {
                      // Clear when date is cleared
                      setBirthDate("");
                      setBirthDateDisplay("");
                    }
                  }}
                  onSelect={(date) => {
                    // This fires immediately when a date is selected from calendar
                    if (date && date instanceof Date && !isNaN(date.getTime())) {
                      const isoDate = formatDateToISO(date);
                      const displayDate = formatDateToDisplay(date);
                      setBirthDate(isoDate);
                      setBirthDateDisplay(displayDate);
                    }
                  }}
                  strictParsing={false}
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
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  maxDate={new Date()}
                  allowSameDay
                  onChangeRaw={(e) => {
                    // Handle manual typing - format as user types
                    // Only format if it's not already in the correct format (to avoid interfering with calendar selection)
                    if (!e || !e.target) {
                      return;
                    }
                    
                    const inputValue = (e.target as HTMLInputElement).value;
                    
                    // Safety check
                    if (inputValue === undefined || inputValue === null) {
                      return;
                    }
                    
                    // Check if value is already in dd/MM/yyyy format (from calendar selection)
                    if (inputValue && typeof inputValue === 'string' && inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                      // Already formatted from calendar, just update display
                      setBirthDateDisplay(inputValue);
                      const parsedDate = parseDateFromInput(inputValue);
                      if (parsedDate) {
                        setBirthDate(formatDateToISO(parsedDate));
                      }
                      return;
                    }
                    
                    // Manual typing - format it
                    const formatted = formatDateInput(inputValue);
                    
                    // Update the input value with formatted version
                    if (inputValue !== formatted) {
                      const inputElement = e.target as HTMLInputElement;
                      const cursorPos = inputElement.selectionStart || 0;
                      inputElement.value = formatted;
                      const lengthDiff = formatted.length - (inputValue?.length || 0);
                      const newCursorPos = Math.max(0, Math.min(cursorPos + lengthDiff, formatted.length));
                      inputElement.setSelectionRange(newCursorPos, newCursorPos);
                    }
                    
                    // Update state for manual typing
                    setBirthDateDisplay(formatted);
                    
                    // Parse and update the actual date value
                    const parsedDate = parseDateFromInput(formatted);
                    if (parsedDate) {
                      setBirthDate(formatDateToISO(parsedDate));
                    } else if (formatted === "") {
                      setBirthDate("");
                    }
                  }}
                  customInput={
                    <BirthDateInput
                      placeholder="dd/mm/yyyy"
                      onClear={() => {
                        setBirthDate("");
                        setBirthDateDisplay("");
                      }}
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

          {isDoctor && (
            <>
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 shadow-sm space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Thông tin chuyên môn</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Cập nhật thông tin chuyên môn và kinh nghiệm của bạn
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    classNames={{
                      input: "bg-gray-100",
                      inputWrapper: "bg-gray-100 border-gray-300",
                    }}
                    label="Chuyên môn"
                    labelPlacement="outside"
                    placeholder="Ví dụ: Răng hàm mặt, Nha khoa tổng quát..."
                    value={specialization}
                    variant="bordered"
                    onValueChange={setSpecialization}
                  />

                  <Input
                    classNames={{
                      input: "bg-gray-100",
                      inputWrapper: "bg-gray-100 border-gray-300",
                    }}
                    label="Số năm kinh nghiệm"
                    labelPlacement="outside"
                    placeholder="Ví dụ: 5"
                    type="number"
                    min="0"
                    value={yearsOfExperience}
                    variant="bordered"
                    onValueChange={(value) => {
                      const numValue = value.replace(/[^0-9]/g, "");
                      setYearsOfExperience(numValue);
                    }}
                  />
                </div>

                <Textarea
                  classNames={{
                    input: "bg-gray-100",
                    inputWrapper: "bg-gray-100 border-gray-300",
                  }}
                  label="Tóm tắt kinh nghiệm"
                  labelPlacement="outside"
                  placeholder="Mô tả ngắn gọn về kinh nghiệm và thành tích của bạn..."
                  value={summary}
                  variant="bordered"
                  onValueChange={setSummary}
                  minRows={4}
                />

                <div className="flex justify-end">
                  <Button
                    className="bg-[#39BDCC] text-white"
                    color="primary"
                    isLoading={savingProfessionalInfo}
                    onPress={async () => {
                      setSavingProfessionalInfo(true);
                      try {
                        const formData = new FormData();
                        if (specialization.trim()) {
                          formData.append("specialization", specialization.trim());
                        }
                        if (yearsOfExperience.trim()) {
                          formData.append("yearsOfExperience", yearsOfExperience.trim());
                        }
                        if (summary.trim()) {
                          formData.append("summary", summary.trim());
                        }

                        const response = await doctorApi.updateProfile(formData);
                        if (response.success) {
                          toast.success("Cập nhật thông tin chuyên môn thành công!");
                          // Reload doctor profile to get updated data
                          const profileResponse = await doctorApi.getDoctorInfoList();
                          if (profileResponse.success && Array.isArray(profileResponse.data)) {
                            const doctorRecord = profileResponse.data.find((profile) => {
                              const profileId = extractDoctorProfileId(profile);
                              const currentId = user?._id || (user as any)?.id;
                              return profileId && currentId && profileId.toString() === currentId.toString();
                            });
                            if (doctorRecord) {
                              setSpecialization(doctorRecord?.specialization || "");
                              setYearsOfExperience(doctorRecord?.yearsOfExperience?.toString() || "");
                              setSummary(doctorRecord?.summary || "");
                            }
                          }
                        } else {
                          toast.error(response.message || "Không thể cập nhật thông tin");
                        }
                      } catch (error: any) {
                        console.error("Error updating doctor profile:", error);
                        toast.error(error.message || "Không thể cập nhật thông tin");
                      } finally {
                        setSavingProfessionalInfo(false);
                      }
                    }}
                  >
                    {savingProfessionalInfo ? "Đang lưu..." : "Lưu thông tin chuyên môn"}
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 shadow-sm space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Chứng chỉ hành nghề</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Tải lên file ảnh hoặc PDF (tối đa 5MB) để phòng khám xác thực thông tin của bạn.
                </p>
              </div>

              {doctorProfileLoading ? (
                <p className="text-sm text-gray-500">Đang tải chứng chỉ hiện tại...</p>
              ) : activeCertificateUrl ? (
                shouldShowImagePreview ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-600">Chứng chỉ hiện tại:</p>
                    <img
                      src={activeCertificateUrl}
                      alt="Chứng chỉ bác sĩ"
                      className="rounded-lg border border-gray-200 shadow-sm max-w-sm object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-600">Chứng chỉ hiện tại:</p>
                    <a
                      href={activeCertificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#39BDCC] font-semibold hover:underline"
                    >
                      Mở chứng chỉ
                    </a>
                  </div>
                )
              ) : (
                <p className="text-sm text-gray-500">Chưa có chứng chỉ nào được lưu.</p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="bordered" onPress={() => certificateInputRef.current?.click()}>
                  Chọn chứng chỉ
                </Button>
                <input
                  ref={certificateInputRef}
                  accept="image/*,.pdf"
                  className="hidden"
                  type="file"
                  onChange={handleCertificateSelect}
                />
                {certificateFile && (
                  <Button color="danger" variant="light" onPress={handleClearCertificateSelection}>
                    Xóa tệp đã chọn
                  </Button>
                )}
              </div>

              {certificateFile && (
                <p className="text-sm text-gray-600">
                  Tệp đã chọn:{" "}
                  <span className="font-medium">{certificateFile.name}</span>{" "}
                  ({(certificateFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  className="bg-[#39BDCC] text-white"
                  color="primary"
                  isDisabled={!certificateFile}
                  isLoading={certificateUploading}
                  onPress={handleUploadCertificate}
                >
                  {certificateUploading ? "Đang tải..." : "Lưu chứng chỉ"}
                </Button>
              </div>
            </div>
            </>
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
            <Button 
              size="lg" 
              variant="light"
              onPress={() => navigate("/")}
            >
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




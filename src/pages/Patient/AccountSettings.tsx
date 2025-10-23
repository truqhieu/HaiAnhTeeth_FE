import { useState, useEffect } from "react";
import { Input, Button, Select, SelectItem } from "@heroui/react";
import toast from "react-hot-toast";
import { authApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

const AccountSettings = () => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Account Information
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  // Contact Information
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");

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

  // Load user data from context
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhone(user.phone || user.phoneNumber || "");
      setAddress(user.address || "");
      setGender(user.gender || "");
      
      // Format date for input type="date" (YYYY-MM-DD)
      if (user.dateOfBirth || user.dob) {
        const dob = new Date(user.dateOfBirth || user.dob || "");
        if (!isNaN(dob.getTime())) {
          const formattedDate = dob.toISOString().split('T')[0];
          setBirthDate(formattedDate);
        }
      }

      // Load emergency contact
      const emergencyContact = (user as any).emergencyContact;
      if (emergencyContact) {
        setEmergencyName(emergencyContact.name || "");
        setEmergencyPhone(emergencyContact.phone || "");
        setEmergencyRelationship(emergencyContact.relationship || "");
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }

    // Validate phone number - chỉ cho phép số
    const phoneRegex = /^[0-9]*$/;
    if (phone.trim() && !phoneRegex.test(phone.trim())) {
      toast.error("Số điện thoại chỉ được nhập số");
      return;
    }

    if (emergencyPhone.trim() && !phoneRegex.test(emergencyPhone.trim())) {
      toast.error("Số điện thoại người liên hệ khẩn cấp chỉ được nhập số");
      return;
    }

    // Validate phone length (optional - thường là 10-11 số)
    if (phone.trim() && (phone.trim().length < 10 || phone.trim().length > 11)) {
      toast.error("Số điện thoại phải có 10-11 chữ số");
      return;
    }

    if (emergencyPhone.trim() && (emergencyPhone.trim().length < 10 || emergencyPhone.trim().length > 11)) {
      toast.error("Số điện thoại người liên hệ khẩn cấp phải có 10-11 chữ số");
      return;
    }

    setIsLoading(true);

    try {
      const updateData: any = {
        fullName: fullName.trim(),
      };

      // Only add fields if they have values
      if (phone.trim()) {
        updateData.phoneNumber = phone.trim();
      }
      
      if (address.trim()) {
        updateData.address = address.trim();
      }
      
      if (gender) {
        updateData.gender = gender;
      }

      if (birthDate) {
        updateData.dob = birthDate;
      }

      // Add emergency contact chỉ khi CẢ 3 fields đều có giá trị (backend require all)
      if (emergencyName.trim() && emergencyPhone.trim() && emergencyRelationship.trim()) {
        updateData.emergencyContact = {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relationship: emergencyRelationship.trim()
        };
      } else if (emergencyName.trim() || emergencyPhone.trim() || emergencyRelationship.trim()) {
        // Nếu chỉ điền 1-2 field → warning
        toast.error("Vui lòng điền đầy đủ thông tin liên hệ khẩn cấp (Họ tên, SĐT, Mối quan hệ) hoặc bỏ trống tất cả");
        setIsLoading(false);
        return;
      }

      const response = await authApi.updateProfile(updateData);

      if (response.success && response.data) {
        // Ensure _id is present for AuthUser type
        const userData = response.data.user;
        if (userData && user) {
          const updatedUser = {
            ...userData,
            _id: userData.id || userData._id || user._id
          };
          updateUser(updatedUser);
        }
        toast.success(response.message || "Cập nhật thông tin thành công!");
      } else {
        toast.error(response.message || "Có lỗi xảy ra khi cập nhật");
      }
    } catch (error: any) {
      console.error("Lỗi cập nhật profile:", error);
      toast.error(error.message || "Không thể cập nhật thông tin. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Hồ sơ cá nhân
        </h1>
        <p className="text-gray-600 mb-8">
          Quản lý thông tin, địa chỉ liên lạc của bạn
        </p>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Thông tin tài khoản */}
          <div className="bg-white shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Thông tin tài khoản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  isRequired
                  label="Họ và tên"
                  labelPlacement="outside"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  variant="bordered"
                  onValueChange={setFullName}
                />
              </div>

              <Input
                label="Ngày sinh"
                labelPlacement="outside"
                placeholder="DD/MM/YYYY"
                type="date"
                value={birthDate}
                variant="bordered"
                onValueChange={setBirthDate}
              />

              <Select
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

              <div className="md:col-span-2">
                <Input
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

          {/* Địa chỉ liên lạc */}
          <div className="bg-white shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Địa chỉ liên lạc
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Số điện thoại"
                labelPlacement="outside"
                placeholder="Nhập số điện thoại (10-11 số)"
                type="tel"
                value={phone}
                variant="bordered"
                onValueChange={(value) => {
                  // Chỉ cho phép nhập số
                  const numericValue = value.replace(/[^0-9]/g, '');
                  setPhone(numericValue);
                }}
                maxLength={11}
              />

              <Input
                isDisabled
                label="Email"
                labelPlacement="outside"
                placeholder="Email"
                type="email"
                value={email}
                variant="bordered"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              * Email không thể thay đổi
            </p>
          </div>

          {/* Thông tin liên hệ khẩn cấp */}
          <div className="bg-white shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Thông tin liên hệ khẩn cấp
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Người thân hoặc bạn bè có thể liên hệ trong trường hợp khẩn cấp
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Họ và tên"
                labelPlacement="outside"
                placeholder="Nhập họ và tên người liên hệ"
                type="text"
                value={emergencyName}
                variant="bordered"
                onValueChange={setEmergencyName}
              />

              <Input
                label="Số điện thoại"
                labelPlacement="outside"
                placeholder="Nhập số điện thoại (10-11 số)"
                type="tel"
                value={emergencyPhone}
                variant="bordered"
                onValueChange={(value) => {
                  // Chỉ cho phép nhập số
                  const numericValue = value.replace(/[^0-9]/g, '');
                  setEmergencyPhone(numericValue);
                }}
                maxLength={11}
              />

              <Select
                label="Mối quan hệ"
                labelPlacement="outside"
                placeholder="Chọn mối quan hệ"
                selectedKeys={emergencyRelationship ? [emergencyRelationship] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setEmergencyRelationship(selectedKey);
                }}
                variant="bordered"
              >
                {relationshipOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-start">
            <Button
              className="bg-[#39BDCC] text-white px-8 py-2 hover:bg-[#2ca6b5]"
              isLoading={isLoading}
              size="lg"
              type="submit"
            >
              Cập nhật tài khoản
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AccountSettings;

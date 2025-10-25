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
    console.log("🔍 [AccountSettings] User from context:", user);
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
          const formattedDate = dob.toISOString().split("T")[0];

          setBirthDate(formattedDate);
        }
      }

      // Load emergency contact
      const emergencyContact = (user as any).emergencyContact;

      console.log(
        "🔍 [AccountSettings] EmergencyContact from user:",
        emergencyContact,
      );
      if (emergencyContact) {
        console.log("🔍 [AccountSettings] Loading emergency contact fields:", {
          name: emergencyContact.name,
          phone: emergencyContact.phone,
          relationship: emergencyContact.relationship,
        });
        setEmergencyName(emergencyContact.name || "");
        setEmergencyPhone(emergencyContact.phone || "");
        setEmergencyRelationship(emergencyContact.relationship || "");
      } else {
        console.log(
          "🔍 [AccountSettings] No emergencyContact found, clearing fields",
        );
        setEmergencyName("");
        setEmergencyPhone("");
        setEmergencyRelationship("");
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
    if (
      phone.trim() &&
      (phone.trim().length < 10 || phone.trim().length > 11)
    ) {
      toast.error("Số điện thoại phải có 10-11 chữ số");

      return;
    }

    if (
      emergencyPhone.trim() &&
      (emergencyPhone.trim().length < 10 || emergencyPhone.trim().length > 11)
    ) {
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
      if (
        emergencyName.trim() &&
        emergencyPhone.trim() &&
        emergencyRelationship.trim()
      ) {
        updateData.emergencyContact = {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relationship: emergencyRelationship.trim(),
        };
      } else if (
        emergencyName.trim() ||
        emergencyPhone.trim() ||
        emergencyRelationship.trim()
      ) {
        // Nếu chỉ điền 1-2 field → warning
        toast.error(
          "Vui lòng điền đầy đủ thông tin liên hệ khẩn cấp (Họ tên, SĐT, Mối quan hệ) hoặc bỏ trống tất cả",
        );
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
            _id: userData.id || userData._id || user._id,
          };

          updateUser(updatedUser);
        }
        toast.success(response.message || "Cập nhật thông tin thành công!");
      } else {
        toast.error(response.message || "Có lỗi xảy ra khi cập nhật");
      }
    } catch (error: any) {
      console.error("Lỗi cập nhật profile:", error);
      toast.error(
        error.message || "Không thể cập nhật thông tin. Vui lòng thử lại",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
              <p className="text-gray-600 mt-1">
                Quản lý thông tin cá nhân và địa chỉ liên lạc của bạn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">

        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Thông tin tài khoản */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Thông tin cá nhân
              </h2>
            </div>

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
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Địa chỉ liên lạc
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Số điện thoại"
                labelPlacement="outside"
                maxLength={11}
                placeholder="Nhập số điện thoại (10-11 số)"
                type="tel"
                value={phone}
                variant="bordered"
                onValueChange={(value) => {
                  // Chỉ cho phép nhập số
                  const numericValue = value.replace(/[^0-9]/g, "");

                  setPhone(numericValue);
                }}
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Thông tin liên hệ khẩn cấp
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Người thân hoặc bạn bè có thể liên hệ trong trường hợp khẩn cấp
                </p>
              </div>
            </div>

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
                maxLength={11}
                placeholder="Nhập số điện thoại (10-11 số)"
                type="tel"
                value={emergencyPhone}
                variant="bordered"
                onValueChange={(value) => {
                  // Chỉ cho phép nhập số
                  const numericValue = value.replace(/[^0-9]/g, "");

                  setEmergencyPhone(numericValue);
                }}
              />

              <Select
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

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              className="px-8 py-3 text-gray-700 border border-gray-300 hover:bg-gray-50"
              size="lg"
              variant="bordered"
              onPress={() => {
                // Reset form to original values
                if (user) {
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
                  
                  const emergencyContact = (user as any).emergencyContact;
                  if (emergencyContact) {
                    setEmergencyName(emergencyContact.name || "");
                    setEmergencyPhone(emergencyContact.phone || "");
                    setEmergencyRelationship(emergencyContact.relationship || "");
                  }
                }
              }}
            >
              Hủy
            </Button>
            <Button
              className="bg-blue-600 text-white px-8 py-3 hover:bg-blue-700 shadow-lg"
              isLoading={isLoading}
              size="lg"
              type="submit"
            >
              {isLoading ? "Đang cập nhật..." : "Cập nhật tài khoản"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AccountSettings;

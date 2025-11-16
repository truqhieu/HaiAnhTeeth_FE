import { useState, useEffect } from "react";
import { Input, Button, Select, SelectItem } from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
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

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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
          const formattedDate = dob.toISOString().split("T")[0];

          setBirthDate(formattedDate);
        }
      }

      // Load emergency contact
      const emergencyContact = (user as any).emergencyContact;

      if (emergencyContact) {
        setEmergencyName(emergencyContact.name || "");
        setEmergencyPhone(emergencyContact.phone || "");
        setEmergencyRelationship(emergencyContact.relationship || "");
      } else {
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

      // Phone number: allow clearing to null when user removes value
      updateData.phoneNumber = phone.trim() ? phone.trim() : null;

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

      // Handle password change if new password is provided
      let passwordChangeSuccess = true;
      if (newPassword.trim()) {
        // Validate password change fields
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
          toast.error(
            passwordError.message || "Không thể đổi mật khẩu. Vui lòng thử lại",
          );
          passwordChangeSuccess = false;
        }
      }

      // Update profile
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

        // Show success message
        if (newPassword.trim() && passwordChangeSuccess) {
          toast.success("Cập nhật thông tin và đổi mật khẩu thành công!");
          // Reset password fields
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
      toast.error(
        error.message || "Không thể cập nhật thông tin. Vui lòng thử lại",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Title moved closer to the cards */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Hồ sơ cá nhân
          </h1>
          <p className="text-gray-600 text-lg mt-1">
            Quản lý thông tin, địa chỉ liên lạc của bạn
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Thông tin tài khoản */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Thông tin tài khoản
            </h2>

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

              <Input
                classNames={{
                  input: "bg-gray-100",
                  inputWrapper: "bg-gray-100 border-gray-300",
                }}
                label="Ngày sinh"
                labelPlacement="outside"
                placeholder="DD/MM/YYYY"
                type="date"
                value={birthDate}
                variant="bordered"
                onValueChange={setBirthDate}
              />

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

          {/* Địa chỉ liên lạc */}
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
                  // Chỉ cho phép nhập số
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

          {/* Thông tin liên hệ khẩn cấp */}
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
                placeholder="Nhập họ và tên người liên hệ"
                type="text"
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

          {/* Password Change Section */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 shadow-sm">
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Đổi mật khẩu (không bắt buộc)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  classNames={{
                    input: "bg-gray-100",
                    inputWrapper: "bg-gray-100 border-gray-300",
                  }}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() =>
                        setIsPasswordVisible((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                    >
                      {isPasswordVisible.current ? (
                        <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  }
                  label="Mật khẩu hiện tại"
                  labelPlacement="outside"
                  placeholder="Nhập mật khẩu hiện tại"
                  type={isPasswordVisible.current ? "text" : "password"}
                  value={currentPassword}
                  variant="bordered"
                  onValueChange={setCurrentPassword}
                />

                <Input
                  classNames={{
                    input: "bg-gray-100",
                    inputWrapper: "bg-gray-100 border-gray-300",
                  }}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() =>
                        setIsPasswordVisible((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                    >
                      {isPasswordVisible.new ? (
                        <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  }
                  label="Mật khẩu mới"
                  labelPlacement="outside"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  type={isPasswordVisible.new ? "text" : "password"}
                  value={newPassword}
                  variant="bordered"
                  onValueChange={setNewPassword}
                />

                <Input
                  classNames={{
                    input: "bg-gray-100",
                    inputWrapper: "bg-gray-100 border-gray-300",
                  }}
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() =>
                        setIsPasswordVisible((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                    >
                      {isPasswordVisible.confirm ? (
                        <EyeSlashIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  }
                  label="Xác nhận mật khẩu mới"
                  labelPlacement="outside"
                  placeholder="Nhập lại mật khẩu mới"
                  type={isPasswordVisible.confirm ? "text" : "password"}
                  value={confirmPassword}
                  variant="bordered"
                  onValueChange={setConfirmPassword}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Để trống nếu không muốn đổi mật khẩu
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              className="bg-[#39BDCC] text-white px-10 py-3 hover:bg-[#2ca6b5] shadow-lg hover:shadow-xl transition-all duration-200"
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

import { useState } from "react";
import { Input, Button, Select, SelectItem } from "@heroui/react";

const AccountSettings = () => {
  // Account Information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  // Contact Information
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const genderOptions = [
    { key: "male", label: "Nam" },
    { key: "female", label: "Nữ" },
    { key: "other", label: "Khác" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    // eslint-disable-next-line no-console
    console.log("Account settings updated");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Cài đặt tài khoản
        </h1>
        <p className="text-gray-600 mb-8">
          Quản lý thông tin, địa chỉ liên lạc của bạn
        </p>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Thông tin tài khoản */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Thông tin tài khoản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Họ"
                labelPlacement="outside"
                placeholder="Nhập họ"
                value={firstName}
                variant="bordered"
                onValueChange={setFirstName}
              />

              <Input
                label="Tên"
                labelPlacement="outside"
                placeholder="Nhập tên"
                value={lastName}
                variant="bordered"
                onValueChange={setLastName}
              />

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
                placeholder="Select"
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
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Địa chỉ liên lạc
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Số điện thoại"
                labelPlacement="outside"
                placeholder="Nhập số điện thoại"
                type="tel"
                value={phone}
                variant="bordered"
                onValueChange={setPhone}
              />

              <Input
                label="Email"
                labelPlacement="outside"
                placeholder="Nhập email"
                type="email"
                value={email}
                variant="bordered"
                onValueChange={setEmail}
              />
            </div>
          </div>

          {/* Đổi mật khẩu */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Đổi mật khẩu
            </h2>

            <div className="max-w-md space-y-4">
              <Input
                label="Mật khẩu cũ"
                labelPlacement="outside"
                placeholder="Nhập mật khẩu cũ"
                type="password"
                value={oldPassword}
                variant="bordered"
                onValueChange={setOldPassword}
              />

              <Input
                label="Mật khẩu mới"
                labelPlacement="outside"
                placeholder="Nhập mật khẩu mới"
                type="password"
                value={newPassword}
                variant="bordered"
                onValueChange={setNewPassword}
              />

              <Input
                label="Xác nhận thay đổi mật khẩu"
                labelPlacement="outside"
                placeholder="Nhập lại mật khẩu mới"
                type="password"
                value={confirmPassword}
                variant="bordered"
                onValueChange={setConfirmPassword}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-start">
            <Button
              className="bg-[#39BDCC] text-white px-8 py-2 hover:bg-[#2ca6b5]"
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

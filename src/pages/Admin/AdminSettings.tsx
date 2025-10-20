import React, { useState } from "react";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    clinicName: "Phòng khám Nha khoa Hải Anh",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    phone: "0123456789",
    email: "info@haiAnhTeeth.com",
    workingHours: "08:00 - 17:00",
    timezone: "Asia/Ho_Chi_Minh",
    language: "vi",
    maxAppointmentsPerDay: 50,
    appointmentDuration: 30,
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    systemAlerts: true,
  });

  const timezoneOptions = [
    { key: "Asia/Ho_Chi_Minh", label: "Việt Nam (GMT+7)" },
    { key: "UTC", label: "UTC (GMT+0)" },
  ];

  const languageOptions = [
    { key: "vi", label: "Tiếng Việt" },
    { key: "en", label: "English" },
  ];

  const handleInputChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Saving settings:", { settings, notifications });
    alert("Cài đặt đã được lưu thành công!");
  };

  const handleReset = () => {
    // TODO: Implement reset functionality
    if (confirm("Bạn có chắc chắn muốn đặt lại cài đặt?")) {
      console.log("Resetting settings");
      alert("Cài đặt đã được đặt lại!");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cài đặt hệ thống</h1>
        <p className="text-gray-600 mt-2">
          Quản lý cài đặt chung và thông báo của hệ thống
        </p>
      </div>

      <div className="max-w-4xl space-y-8">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Cài đặt chung
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Tên phòng khám"
              labelPlacement="outside"
              placeholder="Nhập tên phòng khám"
              value={settings.clinicName}
              onValueChange={(value) => handleInputChange("clinicName", value)}
              variant="bordered"
            />

            <Input
              label="Số điện thoại"
              labelPlacement="outside"
              placeholder="Nhập số điện thoại"
              value={settings.phone}
              onValueChange={(value) => handleInputChange("phone", value)}
              variant="bordered"
            />

            <Input
              label="Email"
              labelPlacement="outside"
              placeholder="Nhập email"
              type="email"
              value={settings.email}
              onValueChange={(value) => handleInputChange("email", value)}
              variant="bordered"
            />

            <Input
              label="Giờ làm việc"
              labelPlacement="outside"
              placeholder="VD: 08:00 - 17:00"
              value={settings.workingHours}
              onValueChange={(value) => handleInputChange("workingHours", value)}
              variant="bordered"
            />

            <div className="md:col-span-2">
              <Textarea
                label="Địa chỉ"
                labelPlacement="outside"
                placeholder="Nhập địa chỉ phòng khám"
                value={settings.address}
                onValueChange={(value) => handleInputChange("address", value)}
                variant="bordered"
                minRows={3}
              />
            </div>

            <Select
              label="Múi giờ"
              labelPlacement="outside"
              selectedKeys={settings.timezone ? [settings.timezone] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                handleInputChange("timezone", selectedKey);
              }}
              variant="bordered"
            >
              {timezoneOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="Ngôn ngữ"
              labelPlacement="outside"
              selectedKeys={settings.language ? [settings.language] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                handleInputChange("language", selectedKey);
              }}
              variant="bordered"
            >
              {languageOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Input
              label="Số cuộc hẹn tối đa mỗi ngày"
              labelPlacement="outside"
              type="number"
              value={settings.maxAppointmentsPerDay.toString()}
              onValueChange={(value) =>
                handleInputChange("maxAppointmentsPerDay", parseInt(value))
              }
              variant="bordered"
            />

            <Input
              label="Thời gian mỗi cuộc hẹn (phút)"
              labelPlacement="outside"
              type="number"
              value={settings.appointmentDuration.toString()}
              onValueChange={(value) =>
                handleInputChange("appointmentDuration", parseInt(value))
              }
              variant="bordered"
            />
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Cài đặt thông báo
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">
                  Thông báo qua Email
                </h3>
                <p className="text-sm text-gray-500">
                  Gửi thông báo qua email cho người dùng
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={(e) =>
                    handleNotificationChange("emailNotifications", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">
                  Thông báo qua SMS
                </h3>
                <p className="text-sm text-gray-500">
                  Gửi thông báo qua tin nhắn SMS
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.smsNotifications}
                  onChange={(e) =>
                    handleNotificationChange("smsNotifications", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">
                  Nhắc nhở cuộc hẹn
                </h3>
                <p className="text-sm text-gray-500">
                  Gửi nhắc nhở trước cuộc hẹn
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.appointmentReminders}
                  onChange={(e) =>
                    handleNotificationChange("appointmentReminders", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">
                  Cảnh báo hệ thống
                </h3>
                <p className="text-sm text-gray-500">
                  Nhận thông báo về sự cố hệ thống
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.systemAlerts}
                  onChange={(e) =>
                    handleNotificationChange("systemAlerts", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="bordered"
            onPress={handleReset}
            className="px-6 py-2"
          >
            Đặt lại
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2"
            onPress={handleSave}
          >
            Lưu cài đặt
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

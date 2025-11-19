import UserProfileForm from "@/components/Profile/UserProfileForm";

const AccountSettings = () => {
  return (
    <UserProfileForm
      description="Quản lý thông tin, địa chỉ liên lạc và liên hệ khẩn cấp của bạn"
      showEmergencyContact
      title="Hồ sơ cá nhân"
    />
  );
};

export default AccountSettings;



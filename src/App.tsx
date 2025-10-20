import { Route, Routes } from "react-router-dom";

import { Navbar, LoginModal, SignupModal, ForgotPasswordModal } from "@/components";

import DefaultLayout from "@/layouts/default";
import IndexPage from "@/pages/Public/index";
import AboutPage from "@/pages/Public/about";
import ResetPassword from "@/pages/Public/reset-password";
import VerifyEmail from "@/pages/Public/verify-email";
import Dashboard from "@/pages/Patient/Dashboard";
import AccountSettings from "@/pages/Patient/AccountSettings";
import Complaints from "@/pages/Patient/Complaints";
import Appointments from "@/pages/Patient/Appointments";
import MedicalRecords from "@/pages/Patient/MedicalRecords";
import AccountManagement from "@/pages/Admin/AccountManagement";
import AdminSettings from "@/pages/Admin/AdminSettings";
import AdminLayout from "@/layouts/AdminLayout";
import ServiceManagement from "@/pages/Manager/ServiceManagement";
import RoomManagement from "@/pages/Manager/RoomManagement";
import ScheduleManagement from "@/pages/Manager/ScheduleManagement";
import ManagerLayout from "@/layouts/ManagerLayout";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { AuthProvider } from "@/contexts/AuthContext";

// --- THÊM IMPORT MỚI ---
import { BookingModalProvider } from "@/contexts/BookingModalContext";

function App() {
  return (
    <AuthProvider>
      <AuthModalProvider>
        {/* Bọc BookingModalProvider ở đây, bên ngoài <Routes>
          giống như cách bạn làm với AuthModalProvider.
          Điều này đảm bảo các modal có thể được gọi từ bất kỳ đâu.
        */}
        <BookingModalProvider>
          <Routes>
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AdminLayout>
                <Routes>
                  <Route
                    element={<AccountManagement />}
                    path="accounts"
                  />
                  <Route element={<AdminSettings />} path="settings" />
                </Routes>
              </AdminLayout>
            }
          />

          {/* Manager Routes */}
          <Route
            path="/manager/*"
            element={
              <ManagerLayout>
                <Routes>
                  <Route element={<ServiceManagement />} path="services" />
                  <Route element={<RoomManagement />} path="rooms" />
                  <Route element={<ScheduleManagement />} path="schedules" />
                  <Route element={<ServiceManagement />} path="" />
                </Routes>
              </ManagerLayout>
            }
          />

          {/* Public Routes */}
          <Route
            path="/*"
            element={
              <>
                {/* Navbar hiển thị trên tất cả các trang */}
                <Navbar />

                {/* DefaultLayout bao bọc tất cả routes - có Footer */}
                <DefaultLayout>
                  <Routes>
                    <Route element={<IndexPage />} path="/" />
                    <Route element={<AboutPage />} path="/about" />
                    <Route element={<VerifyEmail />} path="/verify-email" />
                    <Route element={<ResetPassword />} path="/reset-password" />

                    {/* Patient Routes */}
                    <Route element={<Dashboard />} path="/patient/dashboard" />
                    <Route element={<Appointments />} path="/patient/appointments" />
                    <Route element={<MedicalRecords />} path="/patient/medical-records" />
                    <Route element={<Complaints />} path="/patient/complaints" />
                    <Route
                      element={<AccountSettings />}
                      path="/patient/account-settings"
                    />
                  </Routes>
                </DefaultLayout>

                {/* Auth Modals - hiển thị ở mọi nơi */}
                <LoginModal />
                <SignupModal />
                <ForgotPasswordModal />
                
                {/* Bạn KHÔNG cần render <BookingConsultation>
                  hay <PaymentModal> ở đây nữa, vì chúng
                  đã được render bên trong BookingModalProvider.
                */}
              </>
            }
          />
          </Routes>
        </BookingModalProvider>
      </AuthModalProvider>
    </AuthProvider>
  );
}

export default App;
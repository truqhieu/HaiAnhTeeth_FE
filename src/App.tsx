import { Route, Routes } from "react-router-dom";

import Navbar from "./components/navbar";

import DefaultLayout from "@/layouts/default";
import IndexPage from "@/pages/Public/index";
import AboutPage from "@/pages/Public/about";
import ResetPassword from "@/pages/Public/reset-password";
import Dashboard from "@/pages/Patient/Dashboard";
import AccountSettings from "@/pages/Patient/AccountSettings";
import Complaints from "@/pages/Patient/Complaints";
import AccountManagement from "@/pages/Admin/AccountManagement";
import AdminSettings from "@/pages/Admin/AdminSettings";
import AdminLayout from "@/layouts/AdminLayout";
import ServiceManagement from "@/pages/Manager/ServiceManagement";
import RoomManagement from "@/pages/Manager/RoomManagement";
import ScheduleManagement from "@/pages/Manager/ScheduleManagement";
import ManagerLayout from "@/layouts/ManagerLayout";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

function App() {
  return (
    <AuthModalProvider>
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
                  <Route element={<ResetPassword />} path="/reset-password" />

                  {/* Patient Routes */}
                  <Route element={<Dashboard />} path="/patient/dashboard" />
                  <Route
                    element={<AccountSettings />}
                    path="/patient/account-settings"
                  />
                  <Route element={<Complaints />} path="/patient/complaints" />
                </Routes>
              </DefaultLayout>

              {/* Auth Modals - hiển thị ở mọi nơi */}
              <LoginModal />
              <SignupModal />
              <ForgotPasswordModal />
            </>
          }
        />
      </Routes>
    </AuthModalProvider>
  );
}

export default App;

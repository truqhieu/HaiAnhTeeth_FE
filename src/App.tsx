import { Route, Routes } from "react-router-dom";

import Navbar from "./components/navbar";

import DefaultLayout from "@/layouts/default";
import IndexPage from "@/pages/Public/index";
import AboutPage from "@/pages/Public/about";
import Dashboard from "@/pages/Patient/Dashboard";
import AccountSettings from "@/pages/Patient/AccountSettings";
import Complaints from "@/pages/Patient/Complaints";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";

function App() {
  return (
    <AuthModalProvider>
      {/* Navbar hiển thị trên tất cả các trang */}
      <Navbar />

      {/* DefaultLayout bao bọc tất cả routes - có Footer */}
      <DefaultLayout>
        <Routes>
          {/* Public Routes */}
          <Route element={<IndexPage />} path="/" />
          <Route element={<AboutPage />} path="/about" />

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
    </AuthModalProvider>
  );
}

export default App;

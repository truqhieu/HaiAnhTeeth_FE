import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { Navbar } from "@/components";
import DefaultLayout from "@/layouts/default";
import IndexPage from "@/pages/Public/index";
import AboutPage from "@/pages/Public/about";
import LoginPage from "@/pages/Public/LoginPage";
import SignupPage from "@/pages/Public/SignupPage";
import ForgotPassWord from "@/pages/Public/ForgorPasswordPage";
import ResetPassword from "@/pages/Public/reset-password";
import VerifyEmail from "@/pages/Public/verify-email";
import AccountSettings from "@/pages/Patient/AccountSettings";
import Complaints from "@/pages/Patient/Complaints";
import Appointments from "@/pages/Patient/Appointments";
import MedicalRecords from "@/pages/Patient/MedicalRecords";
import PaymentPage from "@/pages/Patient/PaymentPage";
import Dashboard from "@/pages/Patient/Dashboard";
import AccountManagement from "@/pages/Admin/AccountManagement";
import AdminLayout from "@/layouts/AdminLayout";
import ServiceManagement from "@/pages/Manager/ServiceManagement";
import RoomManagement from "@/pages/Manager/RoomManagement";
import ScheduleManagement from "@/pages/Manager/ScheduleManagement";
import ComplaintManagement from "@/pages/Manager/ComplaintManagement";
import LeaveRequestManagement from "@/pages/Manager/LeaveRequestManagement";
import PromotionManagement from "@/pages/Manager/PromotionManagement";
import ManagerLayout from "@/layouts/ManagerLayout";
import StaffLayout from "@/layouts/StaffLayout";
import StaffDashboard from "@/pages/Staff/Dashboard";
import DoctorLayout from "@/layouts/DoctorLayout";
import { DoctorSchedule } from "@/pages/Doctor";
import NurseLayout from "@/layouts/NurseLayout";
import NurseSchedule from "@/pages/Nurse/NurseSchedule";
import LeaveRequest from "@/pages/Common/LeaveRequest";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingModalProvider } from "@/contexts/BookingModalContext";
import MedicalRecordPage from "@/pages/MedicalRecord/MedicalRecordPage";
function App() {
  return (
    <AuthProvider>
      <BookingModalProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff",
              color: "#363636",
              fontSize: "14px",
              padding: "16px",
              borderRadius: "8px",
            },
          }}
        />

        {/* 👇 Routes configuration */}
        <Routes>
          {/* Auth Pages */}
          <Route element={<LoginPage />} path="/login" />
          <Route element={<SignupPage />} path="/signup" />
          <Route element={<ForgotPassWord />} path="/forgot-password" />
          <Route element={<ResetPassword />} path="/reset-password" />
          {/* Admin */}
          <Route
            element={
              <AdminLayout>
                <Routes>
                  <Route element={<AccountManagement />} path="accounts" />
                </Routes>
              </AdminLayout>
            }
            path="/admin/*"
          />

          {/* Manager */}
          <Route
            element={
              <ManagerLayout>
                <Routes>
                  <Route element={<ServiceManagement />} path="services" />
                  <Route element={<RoomManagement />} path="rooms" />
                  <Route element={<ScheduleManagement />} path="schedules" />
                  <Route element={<ComplaintManagement />} path="complaints" />
                  <Route
                    element={<LeaveRequestManagement />}
                    path="leave-requests"
                  />
                  <Route
                    element={<PromotionManagement />}
                    path="promotions"
                  />
                </Routes>
              </ManagerLayout>
            }
            path="/manager/*"
          />

          {/* Staff */}
          <Route
            element={
              <StaffLayout>
                <Routes>
                  <Route element={<StaffDashboard />} path="dashboard" />
                  <Route element={<LeaveRequest />} path="leave-requests" />
                </Routes>
              </StaffLayout>
            }
            path="/staff/*"
          />

          {/* Doctor */}
          <Route
            element={
              <DoctorLayout>
                <Routes>
                  <Route element={<DoctorSchedule />} path="schedule" />
                  <Route element={<LeaveRequest />} path="leave-requests" />
                  <Route
                    element={<MedicalRecordPage />}
                    path="medical/record/:patientId"
                  />
                </Routes>
              </DoctorLayout>
            }
            path="/doctor/*"
          />

          {/* Nurse */}
          <Route
            element={
              <NurseLayout>
                <Routes>
                  <Route element={<NurseSchedule />} path="schedule" />
                  <Route element={<LeaveRequest />} path="leave-requests" />
                  <Route
                    element={<MedicalRecordPage />}
                    path="medical/record/:patientId"
                  />
                </Routes>
              </NurseLayout>
            }
            path="/nurse/*"
          />

          {/* Public and Patient Routes with Navbar and Footer */}
          <Route
            element={
              <>
                <Navbar />
                <DefaultLayout>
                  <Routes>
                    <Route element={<IndexPage />} path="/" />
                    <Route element={<AboutPage />} path="/about" />
                    <Route element={<VerifyEmail />} path="/verify-email" />
                    <Route element={<Dashboard />} path="/patient/dashboard" />
                    <Route
                      element={<Appointments />}
                      path="/patient/appointments"
                    />
                    <Route
                      element={<MedicalRecords />}
                      path="/patient/medical-records"
                    />
                    <Route
                      element={<Complaints />}
                      path="/patient/complaints"
                    />
                    <Route
                      element={<AccountSettings />}
                      path="/patient/account-settings"
                    />
                    <Route
                      element={<PaymentPage />}
                      path="/patient/payment/:paymentId"
                    />
                  </Routes>
                </DefaultLayout>
              </>
            }
            path="/*"
          />
        </Routes>
      </BookingModalProvider>
    </AuthProvider>
  );
}

export default App;

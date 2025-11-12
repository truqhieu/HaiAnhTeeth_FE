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
import PatientMedicalRecord from "@/pages/Patient/PatientMedicalRecord";
import AIBooking from "@/pages/Patient/AIBooking";
import PaymentPage from "@/pages/Patient/PaymentPage";
import Dashboard from "@/pages/Patient/Dashboard";
import Chat from "@/pages/Patient/Chat";
import AccountManagement from "@/pages/Admin/AccountManagement";
import AdminLayout from "@/layouts/AdminLayout";
import ServiceManagement from "@/pages/Manager/ServiceManagement";
import RoomManagement from "@/pages/Manager/RoomManagement";
import ScheduleManagement from "@/pages/Manager/ScheduleManagement";
import ComplaintManagement from "@/pages/Manager/ComplaintManagement";
import LeaveRequestManagement from "@/pages/Manager/LeaveRequestManagement";
import PromotionManagement from "@/pages/Manager/PromotionManagement";
import DeviceManagement from "@/pages/Manager/DeviceManagement";
import BlogManagement from "@/pages/Manager/BlogManagement";
import PolicyManagement from "@/pages/Manager/PolicyManagement";
import ManagerDashboard from "@/pages/Manager/Dashboard";
import ManagerLayout from "@/layouts/ManagerLayout";
import StaffLayout from "@/layouts/StaffLayout";
import StaffDashboard from "@/pages/Staff/Dashboard";
import PatientRequests from "@/pages/Staff/PatientRequests";
import DoctorLayout from "@/layouts/DoctorLayout";
import { DoctorSchedule, DoctorChat } from "@/pages/Doctor";
import NurseLayout from "@/layouts/NurseLayout";
import NurseSchedule from "@/pages/Nurse/NurseSchedule";
import LeaveRequest from "@/pages/Common/LeaveRequest";
import NotificationsPage from "@/pages/Common/Notifications";
import NurseMedicalRecord from "@/pages/Nurse/NurseMedicalRecord";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingModalProvider } from "@/contexts/BookingModalContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import MedicalRecordPage from "@/pages/MedicalRecord/MedicalRecordPage";
import DoctorMedicalRecord from "@/pages/Doctor/DoctorMedicalRecord";
import FloatingAIAssistant from "@/components/Common/FloatingAIAssistant";
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
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
                  <Route element={<ManagerDashboard />} path="dashboard" />
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
                  <Route element={<DeviceManagement />} path="devices" />
                  <Route element={<BlogManagement />} path="blogs" />
                  <Route element={<PolicyManagement />} path="policies" />
                  <Route element={<NotificationsPage />} path="notifications" />
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
                  <Route element={<PatientRequests />} path="patient-requests" />
                  <Route element={<NotificationsPage />} path="notifications" />
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
                  <Route element={<DoctorChat />} path="chat" />
                  <Route element={<LeaveRequest />} path="leave-requests" />
                  <Route
                    element={<DoctorMedicalRecord />}
                    path="medical-record/:appointmentId"
                  />
                  <Route element={<NotificationsPage />} path="notifications" />
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
                    element={<NurseMedicalRecord />}
                    path="medical-record/:appointmentId"
                  />
                  <Route path="medical-record/:appointmentId" element={<NurseMedicalRecord />} />
                  <Route element={<NotificationsPage />} path="notifications" />
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
                    <Route element={<AIBooking />} path="/patient/ai-booking" />
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
                      element={<Chat />}
                      path="/patient/chat"
                    />
                    <Route
                      element={<AccountSettings />}
                      path="/patient/account-settings"
                    />
                    <Route
                      element={<PaymentPage />}
                      path="/patient/payment/:paymentId"
                    />
                    <Route
                      element={<NotificationsPage />}
                      path="/patient/notifications"
                    />
                    <Route
                      element={<PatientMedicalRecord />}
                      path="/patient/medical-record/:appointmentId"
                    />
                  </Routes>
                </DefaultLayout>
                <FloatingAIAssistant />
              </>
            }
            path="/*"
          />
        </Routes>
        </BookingModalProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

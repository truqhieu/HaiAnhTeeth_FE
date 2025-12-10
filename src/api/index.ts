export {
  API_BASE_URL,
  apiCall,
  authenticatedApiCall,
  type ApiResponse,
  type ApiError,
} from "./client";

// Export auth API
export { authApi } from "./auth";
// Export appointment API
export { appointmentApi } from "./appointment";
// Export payment API
export { paymentApi } from "./payment";
// Export availableSlot API
export { availableSlotApi, getDoctorScheduleRange, validateAppointmentTime } from "./availableSlot";
// Export policy API
export { policyApi } from "./policy";

// Export admin API
export { adminApi } from "./admin";

// Export manager API
export { managerApi } from "./manager";

// Export complaint API
export { complaintApi } from "./complaint";

// Export leaveRequest API
export { leaveRequestApi } from "./leaveRequest";

// Export chat API
export { chatApi } from "./chat";

// Export notification API
export { notificationApi } from "./notification";
export { consultationInfoApi } from "./consultationInfo";

// Export types
// Lấy kiểu User từ auth.ts và thêm thuộc tính _id
import type { User } from "./auth";
export type AuthUser = User & { _id: string };

export type {
  RegisterData,
  LoginData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthResponse,
} from "./auth";
export type { AppointmentCreationData, Relative } from "./appointment";
export type {
  PaymentInfo,
  AppointmentInfo,
  CheckPaymentStatusResponse,
} from "./payment";
export type {
  GetAvailableSlotsParams,
  AvailableSlotsData,
  GetAvailableStartTimesResponse,
  CheckStartTimeResponse,
} from "./availableSlot";
export { serviceApi } from "./service";
export type { Service } from "./service";
export { availableDoctorApi } from "./availableDoctor";
export type { AvailableDoctor } from "./availableDoctor";
export { generateByDateApi } from "./generateByDate";
export type { GeneratedSlot } from "./generateByDate";
export { doctorApi } from "./doctor";
export type { DoctorAppointment, AppointmentDetail, PatientDetail, DoctorProfileInfo } from "./doctor";
export { nurseApi } from "./nurse";
export type { NurseAppointment, NurseAppointmentDetail, NursePatientDetail } from "./nurse";
export { introductionApi } from "./introduction";
export type { Introduction } from "./introduction";
export type {
  AdminUser,
  CreateUserData,
  UpdateUserData,
  ChangePasswordData,
  GetAccountsParams,
  GetAccountsResponse,
} from "./admin";
export type {
  ManagerService,
  CreateServiceData,
  UpdateServiceData,
  GetServicesParams,
  GetServicesResponse,
  ManagerClinic,
  ManagerDoctor,
  CreateClinicData,
  UpdateClinicData,
  GetClinicsParams,
  GetClinicsResponse,
  ManagerSchedule,
  CreateScheduleData,
  UpdateScheduleData,
  GetSchedulesParams,
  GetSchedulesResponse,
} from "./manager";
export type {
  Complaint,
  ComplaintListResponse,
  ComplaintDetailResponse,
  HandleComplaintRequest,
} from "./complaint";
export type { ConsultationForm } from "./consultationInfo";
export type {
  LeaveRequest,
  LeaveRequestListResponse,
  CreateLeaveRequestData,
} from "./leaveRequest";
export type {
  Doctor,
  Message,
  Conversation,
} from "./chat";






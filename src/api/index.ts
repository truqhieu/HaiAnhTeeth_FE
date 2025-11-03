// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://haianhteethbe-production.up.railway.app/api";

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// API Error Types
export interface ApiError {
  message: string;
  status?: number;
}

// Generic API call function
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log("🚀 Fetching:", url);

    console.log("🔍 [API Call] Full request details:", {
      url,
      method: options.method || "GET",
      headers: options.headers,
      body: options.body,
      credentials: options.credentials,
    });

    const response = await fetch(url, {
      ...options,
      credentials: options.credentials || "include", // Always include credentials for CORS
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    console.log("🔍 [API Call] Response headers:", Object.fromEntries(response.headers.entries()));

    console.log("📡 Response status:", response.status, response.statusText);

    const result = await response.json();

    console.log("📦 Response body:", result);

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`,
      );
    }

    return result;
  } catch (error: any) {
    console.error("💥 API Call Error:", error);
    console.error("💥 Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    
    // Check if it's a CORS error
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      console.error("🌐 [CORS Error] This is likely a CORS issue. Check:");
      console.error("   1. Backend CORS config allows this origin");
      console.error("   2. Backend is running and accessible");
      console.error("   3. Request URL:", url);
      console.error("   4. Origin:", typeof window !== 'undefined' ? window.location.origin : 'N/A');
      
      throw new Error(
        `Lỗi CORS: Không thể kết nối đến server. Vui lòng kiểm tra:\n` +
        `- Backend đang chạy không?\n` +
        `- CORS config có cho phép origin: ${typeof window !== 'undefined' ? window.location.origin : 'N/A'}?\n` +
        `- Kiểm tra console để xem log chi tiết`
      );
    }
    
    throw new Error(error.message || "Lỗi kết nối đến server");
  }
};

// Authenticated API call function
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  // Get token from sessionStorage
  const token = sessionStorage.getItem("authToken");

  console.log("🔐 Auth check - Token exists?", !!token);

  if (!token) {
    console.error("❌ No token found in sessionStorage");
    throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
  }

  console.log("✅ Token found, adding to headers");

  return apiCall<T>(endpoint, {
    ...options,
    credentials: "include", // Include credentials for CORS
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

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
export type { AppointmentCreationData } from "./appointment";
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
export { doctorApi } from './doctor';
export type { DoctorAppointment, AppointmentDetail, PatientDetail } from './doctor';
export { nurseApi } from './nurse';
export type { NurseAppointment, NurseAppointmentDetail, NursePatientDetail } from './nurse';
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
export type {
  LeaveRequest,
  LeaveRequestListResponse,
  CreateLeaveRequestData,
} from "./leaveRequest";


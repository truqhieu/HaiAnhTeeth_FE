import { apiCall, authenticatedApiCall, ApiResponse, API_BASE_URL } from "./client";

export interface DoctorAppointment {
  appointmentId: string;
  serviceName: string;
  additionalServiceNames?: string[]; // ⭐ THÊM: Danh sách tên các dịch vụ bổ sung (cho follow-up với nhiều services)
  patientName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  mode: string;
  medicalRecordStatus?: "Draft" | "Finalized" | null; // Status của medical record: Draft = chưa duyệt, Finalized = đã duyệt, null = chưa có hồ sơ
  noTreatment?: boolean;
  createdAt?: string; // ⭐ Thời gian tạo để sắp xếp
  updatedAt?: string; // ⭐ Thời gian cập nhật để sắp xếp
}

export interface AppointmentDetail {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  serviceName: string;
  serviceDescription: string;
  type: string;
  status: string;
  mode: string;
  appointmentDate: string;
  startTime: string | null; // ISO string
  startTimeFormatted?: string; // Formatted time string (HH:mm) for display
  endTime: string | null; // ISO string
  endTimeFormatted?: string; // Formatted time string (HH:mm) for display
  noTreatment?: boolean;
}

export interface PatientDetail {
  patientId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  status: string;
  emergencyContact: any;
}

export interface PatientAppointmentBrief {
  appointmentId: string;
  serviceName: string;
  status: string;
  startTime: string;
  endTime: string;
}

export interface ServiceSummary {
  _id: string;
  serviceName: string;
  price: number;
  category: string;
  isPrepaid: boolean | string;
  durationMinutes: number;
}

export interface DoctorProfileInfo {
  doctorUserId: string | { _id?: string };
  fullName?: string | null;
  avatar?: string | null;
  specialization?: string | null;
  yearsOfExperience?: number | null;
  certificate?: string | null;
  summary?: string | null;
}

export const doctorApi = {
  // Lấy lịch khám của bác sĩ (2 tuần mặc định, hoặc theo date range)
  getAppointmentsSchedule: async (
    startDate?: string | null,
    endDate?: string | null
  ): Promise<
    ApiResponse<DoctorAppointment[]>
  > => {
    // Tạo query params nếu có date range
    const queryParams = new URLSearchParams();
    if (startDate) {
      queryParams.append("startDate", startDate);
    }
    if (endDate) {
      queryParams.append("endDate", endDate);
    }

    const query = queryParams.toString();
    const endpoint = query
      ? `/doctor/appointments-schedule?${query}`
      : `/doctor/appointments-schedule`;

    return authenticatedApiCall<DoctorAppointment[]>(
      endpoint,
      {
        method: "GET",
      },
    );
  },

  // Lấy chi tiết một lịch hẹn
  getAppointmentDetail: async (
    appointmentId: string,
  ): Promise<ApiResponse<AppointmentDetail>> => {
    return authenticatedApiCall<AppointmentDetail>(
      `/doctor/appointments/${appointmentId}`,
      {
        method: "GET",
      },
    );
  },

  // Lấy thông tin chi tiết bệnh nhân
  getPatientDetail: async (
    patientId: string,
  ): Promise<ApiResponse<PatientDetail>> => {
    return authenticatedApiCall<PatientDetail>(
      `/doctor/patients/${patientId}`,
      {
        method: "GET",
      },
    );
  },

  // Lấy danh sách lịch hẹn của một bệnh nhân (thuộc bác sĩ hiện tại)
  getAppointmentsOfPatient: async (
    patientId: string,
  ): Promise<ApiResponse<PatientAppointmentBrief[]>> => {
    return authenticatedApiCall(`/doctor/patients/${patientId}/appointments`, {
      method: "GET",
    });
  },

  // Danh sách dịch vụ (dropdown) cho Bác sĩ chọn thêm dịch vụ bổ sung
  getActiveServices: async (): Promise<ApiResponse<ServiceSummary[]>> => {
    return authenticatedApiCall<ServiceSummary[]>(`/doctor/services`, {
      method: "GET",
    });
  },

  // Cập nhật dịch vụ bổ sung vào hồ sơ (ghi đè danh sách)
  updateAdditionalServices: async (
    appointmentId: string,
    serviceIds: string[],
  ): Promise<ApiResponse<any>> => {
    return authenticatedApiCall(`/doctor/medical-records/${appointmentId}/additional-services`, {
      method: "PATCH",
      body: JSON.stringify({ serviceIds }),
    });
  },

  getDoctorInfoList: async (): Promise<ApiResponse<DoctorProfileInfo[]>> => {
    return apiCall<DoctorProfileInfo[]>("/doctor/info", {
      method: "GET",
    });
  },

  updateProfile: async (
    formData: FormData,
  ): Promise<ApiResponse<DoctorProfileInfo>> => {
    const response = await fetch(`${API_BASE_URL}/doctor/profile`, {
      method: "PATCH",
      body: formData,
      credentials: "include",
    });

    const result = (await response.json()) as ApiResponse<DoctorProfileInfo>;
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Không thể cập nhật thông tin bác sĩ");
    }

    return result;
  },
};

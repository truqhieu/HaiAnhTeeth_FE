import { authenticatedApiCall, ApiResponse } from "./index";

export interface DoctorAppointment {
  appointmentId: string;
  serviceName: string;
  patientName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  mode: string;
  medicalRecordStatus?: "Draft" | "Finalized" | null; // Status của medical record: Draft = chưa duyệt, Finalized = đã duyệt, null = chưa có hồ sơ
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
  startTime: string;
  endTime: string;
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
};

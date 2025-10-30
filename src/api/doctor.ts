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
  // Lấy lịch khám của bác sĩ (2 tuần)
  getAppointmentsSchedule: async (): Promise<
    ApiResponse<DoctorAppointment[]>
  > => {
    return authenticatedApiCall<DoctorAppointment[]>(
      "/doctor/appointments-schedule",
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

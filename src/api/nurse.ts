import { authenticatedApiCall, ApiResponse } from './index';

export interface NurseAppointment {
  appointmentId: string;
  patientId: string;
  doctorName: string;
  doctorUserId?: string | null; // ⭐ Thêm doctorUserId để check leave
  doctorStatus?: string | null; // ⭐ Status của doctor: 'Available', 'Busy', 'On Leave', 'Inactive'
  serviceName: string;
  patientName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  mode: string;
  doctorApproved?: boolean;
}

export interface NurseAppointmentDetail {
  appointmentId: string;
  patientId: string;
  doctorName: string;
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

export interface NursePatientDetail {
  patientId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  status: string;
  emergencyContact: any;
  lastVisitDate: string;
}

export const nurseApi = {
  // Lấy lịch khám của tất cả bác sĩ (2 tuần mặc định, hoặc theo date range)
  getAppointmentsSchedule: async (
    startDate?: string | null,
    endDate?: string | null
  ): Promise<ApiResponse<NurseAppointment[]>> => {
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
      ? `/nurse/appointments-schedule?${query}`
      : `/nurse/appointments-schedule`;
    
    return authenticatedApiCall<NurseAppointment[]>(endpoint, {
      method: 'GET',
    });
  },

  // Lấy chi tiết một lịch hẹn
  getAppointmentDetail: async (appointmentId: string): Promise<ApiResponse<NurseAppointmentDetail>> => {
    return authenticatedApiCall<NurseAppointmentDetail>(`/nurse/appointments/${appointmentId}`, {
      method: 'GET',
    });
  },

  // Lấy thông tin chi tiết bệnh nhân
  getPatientDetail: async (patientId: string): Promise<ApiResponse<NursePatientDetail>> => {
    return authenticatedApiCall<NursePatientDetail>(`/nurse/patients/${patientId}`, {
      method: 'GET',
    });
  },

  // Lấy danh sách tất cả bác sĩ
  getAllDoctors: async (): Promise<ApiResponse<Array<{ _id: string; fullName: string }>>> => {
    return authenticatedApiCall<Array<{ _id: string; fullName: string }>>('/nurse/doctors', {
      method: 'GET',
    });
  },
};

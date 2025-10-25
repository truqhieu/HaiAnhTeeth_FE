import { authenticatedApiCall, ApiResponse } from './index';

export interface NurseAppointment {
  appointmentId: string;
  patientId: string;
  doctorName: string;
  serviceName: string;
  patientName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  mode: string;
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
  // Lấy lịch khám của tất cả bác sĩ (2 tuần)
  getAppointmentsSchedule: async (): Promise<ApiResponse<NurseAppointment[]>> => {
    return authenticatedApiCall<NurseAppointment[]>('/nurse/appointments-schedule', {
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
};

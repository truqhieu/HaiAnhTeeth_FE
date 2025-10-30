import { authenticatedApiCall, ApiResponse } from "./index";

export interface MedicalRecordDisplay {
  patientName: string;
  patientAge: number | null;
  patientDob?: string | null;
  address: string;
  doctorName: string;
  additionalServices?: Array<{ _id: string; serviceName?: string; price?: number }>;
  email?: string;
  phoneNumber?: string;
  gender?: string;
}

export interface MedicalRecord {
  _id: string;
  appointmentId: string;
  doctorUserId: string;
  patientUserId?: string | null;
  customerId?: string | null;
  nurseId: string;
  patientAge?: number | null;
  address?: string;
  nurseNote?: string;
  additionalServiceIds?: Array<{ _id: string; serviceName?: string; price?: number }>;
  status: "Draft" | "InProgress" | "Finalized";
  createdAt: string;
  updatedAt: string;
}

export const medicalRecordApi = {
  getOrCreateByAppointment: async (
    appointmentId: string
  ): Promise<ApiResponse<{ record: MedicalRecord; display: MedicalRecordDisplay }>> => {
    return authenticatedApiCall(`/nurse/medical-records/${appointmentId}`, {
      method: "GET",
    });
  },

  updateNurseNote: async (
    appointmentId: string,
    nurseNote: string
  ): Promise<ApiResponse<MedicalRecord>> => {
    return authenticatedApiCall(`/nurse/medical-records/${appointmentId}/nurse-note`, {
      method: "PATCH",
      body: JSON.stringify({ nurseNote }),
    });
  },
};



import { authenticatedApiCall, ApiResponse } from "./index";

export interface MedicalRecordDisplay {
  patientName: string;
  patientAge: number | null;
  patientDob?: string | null;
  address: string;
  doctorName: string;
  additionalServices?: Array<{ _id: string; serviceName?: string; price?: number; finalPrice?: number; discountAmount?: number }>;
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
  diagnosis?: string;
  conclusion?: string;
  prescription?: {
    medicine?: string;
    dosage?: string;
    duration?: string;
  };
  additionalServiceIds?: Array<{ _id: string; serviceName?: string; price?: number; finalPrice?: number; discountAmount?: number }>;
  status: "Draft" | "Finalized";
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecordRolePermission {
  canEdit: boolean;
  reason?: string | null;
}

export interface MedicalRecordPermissions {
  appointmentStatus: string;
  recordStatus: string;
  nurse: MedicalRecordRolePermission;
  doctor: MedicalRecordRolePermission;
}

export interface MedicalRecordResponsePayload {
  record: MedicalRecord;
  display: MedicalRecordDisplay;
  permissions?: MedicalRecordPermissions;
}

export const medicalRecordApi = {
  getOrCreateByAppointment: async (
    appointmentId: string,
    userRole?: string
  ): Promise<ApiResponse<MedicalRecordResponsePayload>> => {
    // Sử dụng endpoint phù hợp với role (backend check role với chữ cái đầu hoa)
    const endpoint = userRole?.toLowerCase() === 'doctor' 
      ? `/doctor/medical-records/${appointmentId}`
      : `/nurse/medical-records/${appointmentId}`;
    return authenticatedApiCall(endpoint, {
      method: "GET",
    });
  },

  updateNurseNote: async (
    appointmentId: string,
    nurseNote: string
  ): Promise<ApiResponse<MedicalRecord>> => {
    // Nurse note chỉ có endpoint của nurse
    return authenticatedApiCall(`/nurse/medical-records/${appointmentId}/nurse-note`, {
      method: "PATCH",
      body: JSON.stringify({ nurseNote }),
    });
  },

  updateMedicalRecordForNurse: async (
    appointmentId: string,
    updateData: {
      diagnosis?: string;
      conclusion?: string;
      prescription?: {
        medicine?: string;
        dosage?: string;
        duration?: string;
      };
      nurseNote?: string;
      patientAge?: number | null;
      address?: string;
    }
  ): Promise<ApiResponse<MedicalRecord>> => {
    return authenticatedApiCall(`/nurse/medical-records/${appointmentId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  },

  updateMedicalRecordForDoctor: async (
    appointmentId: string,
    updateData: {
      diagnosis?: string;
      conclusion?: string;
      prescription?: {
        medicine?: string;
        dosage?: string;
        duration?: string;
      };
      nurseNote?: string;
      approve?: boolean;
    }
  ): Promise<ApiResponse<MedicalRecord>> => {
    return authenticatedApiCall(`/doctor/medical-records/${appointmentId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  },

  approveMedicalRecordByDoctor: async (
    appointmentId: string
  ): Promise<ApiResponse<MedicalRecord>> => {
    return authenticatedApiCall(`/doctor/medical-records/${appointmentId}/approve`, {
      method: "POST",
    });
  },

  getActiveServicesForDoctor: async (): Promise<ApiResponse<Array<{ _id: string; serviceName: string; price: number; finalPrice?: number; discountAmount?: number; category?: string }>>> => {
    return authenticatedApiCall(`/doctor/services`, {
      method: "GET",
    });
  },

  getActiveServicesForNurse: async (): Promise<ApiResponse<Array<{ _id: string; serviceName: string; price: number; finalPrice?: number; discountAmount?: number; category?: string }>>> => {
    return authenticatedApiCall(`/nurse/services`, {
      method: "GET",
    });
  },

  updateAdditionalServicesForDoctor: async (
    appointmentId: string,
    serviceIds: string[]
  ): Promise<ApiResponse<MedicalRecord>> => {
    return authenticatedApiCall(`/doctor/medical-records/${appointmentId}/additional-services`, {
      method: "PATCH",
      body: JSON.stringify({ serviceIds }),
    });
  },

  updateAdditionalServicesForNurse: async (
    appointmentId: string,
    serviceIds: string[]
  ): Promise<ApiResponse<MedicalRecord>> => {
    return authenticatedApiCall(`/nurse/medical-records/${appointmentId}/additional-services`, {
      method: "PATCH",
      body: JSON.stringify({ serviceIds }),
    });
  },

  getMedicalRecordForPatient: async (
    appointmentId: string
  ): Promise<ApiResponse<{ record: MedicalRecord; display: MedicalRecordDisplay }>> => {
    return authenticatedApiCall(`/appointments/${appointmentId}/medical-record`, {
      method: "GET",
    });
  },

  getPatientMedicalRecordsList: async (): Promise<ApiResponse<Array<{
    _id: string;
    appointmentId: string;
    doctorName: string;
    serviceName: string;
    date: string;
    hasDiagnosis: boolean;
    hasPrescription: boolean;
    prescription?: {
      medicine?: string;
      dosage?: string;
      duration?: string;
    } | null;
    diagnosis?: string | null;
    conclusion?: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>>> => {
    return authenticatedApiCall(`/appointments/medical-records`, {
      method: "GET",
    });
  },
};



import { apiCall, authenticatedApiCall, ApiResponse } from "./client";

export interface ConsultationForm {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  createdAt: string;
}

export const consultationInfoApi = {
  create: async (data: {
    fullName: string;
    phoneNumber: string;
    email: string;
  }): Promise<ApiResponse<{ success: boolean; message: string; data: ConsultationForm }>> => {
    return apiCall("/consultation-informations/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  listAll: async (): Promise<ApiResponse<{ success: boolean; message: string; data: ConsultationForm[] }>> => {
    return authenticatedApiCall(`/consultation-informations/all?t=${Date.now()}`, {
      method: "GET",
    });
  },

  delete: async (formId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return authenticatedApiCall(`/consultation-informations/${formId}`, {
      method: "DELETE",
    });
  },
};




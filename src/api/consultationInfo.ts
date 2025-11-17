import { apiCall, authenticatedApiCall, ApiResponse } from "./index";

export interface ConsultationForm {
  _id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
}

export const consultationInfoApi = {
  create: async (data: {
    name: string;
    phone: string;
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




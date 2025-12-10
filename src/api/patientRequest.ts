import { authenticatedApiCall } from "./client";

export interface PatientRequest {
  _id: string;
  appointmentId: {
    _id: string;
    serviceId: {
      _id: string;
      serviceName: string;
    };
    patientUserId: string;
    doctorUserId: string;
    timeslotId: string;
    status: string;
  };
  patientUserId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  requestType: 'Reschedule' | 'ChangeDoctor';
  currentData: {
    doctorUserId: {
      _id: string;
      fullName: string;
    };
    timeslotId: {
      _id: string;
      startTime: string;
      endTime: string;
    };
    startTime: string;
    endTime: string;
  };
  requestedData: {
    doctorUserId?: {
      _id: string;
      fullName: string;
    };
    timeslotId?: {
      _id: string;
      startTime: string;
      endTime: string;
    };
    startTime?: string;
    endTime?: string;
    reason: string;
  };
  status: 'Pending' | 'Approved' | 'Rejected';
  staffResponse?: {
    staffUserId: {
      _id: string;
      fullName: string;
    };
    response: 'Approved' | 'Rejected';
    reason?: string;
    respondedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PatientRequestResponse {
  success: boolean;
  data: {
    requests: PatientRequest[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface SingleRequestResponse {
  success: boolean;
  data: PatientRequest;
}

export const patientRequestApi = {
  // Lấy danh sách yêu cầu của bệnh nhân
  getAllRequests: async (
    params?: {
      status?: 'Pending' | 'Approved' | 'Rejected';
      requestType?: 'Reschedule' | 'ChangeDoctor';
      page?: number;
      limit?: number;
    }
  ): Promise<PatientRequestResponse> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.requestType) query.append('requestType', params.requestType);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    return authenticatedApiCall(
      `/patient-requests${queryString ? `?${queryString}` : ''}`,
      {
        method: "GET",
      }
    ) as Promise<PatientRequestResponse>;
  },

  // Lấy chi tiết một yêu cầu
  getRequestById: async (requestId: string): Promise<SingleRequestResponse> => {
    return authenticatedApiCall(`/patient-requests/${requestId}`, {
      method: "GET",
    }) as Promise<SingleRequestResponse>;
  },

  // Duyệt yêu cầu
  approveRequest: async (
    requestId: string
  ): Promise<SingleRequestResponse> => {
    return authenticatedApiCall(`/patient-requests/${requestId}/approve`, {
      method: "PUT",
    }) as Promise<SingleRequestResponse>;
  },

  // Từ chối yêu cầu
  rejectRequest: async (
    requestId: string,
    reason: string
  ): Promise<SingleRequestResponse> => {
    return authenticatedApiCall(`/patient-requests/${requestId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    }) as Promise<SingleRequestResponse>;
  },
};

import { authenticatedApiCall, ApiResponse, API_BASE_URL } from "./index";

// Manager Service Types
export interface ManagerService {
  _id: string;
  serviceName: string;
  description: string;
  price: number;
  isPrepaid: boolean;
  durationMinutes: number;
  status: "Active" | "Inactive";
  category: "Examination" | "Consultation";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceData {
  serviceName: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: "Examination" | "Consultation";
}

export interface UpdateServiceData {
  serviceName?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  category?: "Examination" | "Consultation";
}

export interface GetServicesParams {
  page?: number;
  limit?: number;
  status?: string;
  isPrepaid?: string;
  category?: string;
  search?: string;
}

export interface GetServicesResponse {
  success: boolean;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: ManagerService[];
}

// Manager Clinic Types
export interface ManagerClinic {
  _id: string;
  name: string;
  description: string;
  assignedDoctorId?: string | null;
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagerDoctor {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

export interface CreateClinicData {
  name: string;
  description: string;
}

export interface UpdateClinicData {
  name?: string;
  description?: string;
  status?: "Active" | "Inactive";
}

export interface GetClinicsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface GetClinicsResponse {
  status: boolean;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: ManagerClinic[];
}

// Manager Schedule Types
export interface ManagerSchedule {
  _id: string;
  doctorUserId: any; // Có thể là string hoặc object {_id, fullName} khi populated
  date: string;
  shift: "Morning" | "Afternoon";
  status: "Available" | "Unavailable" | "Booked" | "Cancelled";
  roomId?: any; // Có thể là string hoặc object {_id, name} khi populated
  maxSlots: number;
  workingHours: {
    morningStart: string;
    morningEnd: string;
    afternoonStart: string;
    afternoonEnd: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateScheduleData {
  doctorId: string;
  date: string;
  roomId?: string;
  workingHours: {
    morningStart: string;
    morningEnd: string;
    afternoonStart: string;
    afternoonEnd: string;
  };
}

export interface DoctorWithWorkingHours {
  _id: string;
  fullName: string;
  email: string;
  workingHours: {
    morningStart: string;
    morningEnd: string;
    afternoonStart: string;
    afternoonEnd: string;
  };
  workingHoursUpdatedAt?: string | null;
}

export interface UpdateScheduleData {
  shift?: "Morning" | "Afternoon";
  status?: "Available" | "Unavailable" | "Booked" | "Cancelled";
  roomId?: string;
  workingHours?: {
    morningStart?: string;
    morningEnd?: string;
    afternoonStart?: string;
    afternoonEnd?: string;
  };
}

export interface GetSchedulesParams {
  page?: number;
  limit?: number;
  shift?: string;
  status?: string;
}

export interface GetSchedulesResponse {
  status: boolean;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: ManagerSchedule[];
}

// Manager API Functions
export const managerApi = {
  // Get all services with pagination and filters
  getAllServices: async (
    params?: GetServicesParams,
  ): Promise<GetServicesResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.isPrepaid) queryParams.append("isPrepaid", params.isPrepaid);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = `/manager/services${queryString ? `?${queryString}` : ""}`;

    try {
      const result = await authenticatedApiCall<any>(endpoint, {
        method: "GET",
      });

      return result as unknown as GetServicesResponse;
    } catch (error) {
      console.error("🌐 API Error:", error);
      throw error;
    }
  },

  // Get service detail by ID
  getServiceDetail: async (
    id: string,
  ): Promise<ApiResponse<ManagerService>> => {
    return authenticatedApiCall<ManagerService>(`/manager/services/${id}`, {
      method: "GET",
    });
  },

  // Create new service
  createService: async (
    data: CreateServiceData,
  ): Promise<ApiResponse<{ success: boolean; message: string; data: ManagerService }>> => {
    return authenticatedApiCall<{ success: boolean; message: string; data: ManagerService }>(
      "/manager/services",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
  },

  // Update service
  updateService: async (
    id: string,
    data: UpdateServiceData,
  ): Promise<ApiResponse<{ success: boolean; message: string; data: ManagerService }>> => {
    return authenticatedApiCall<{ success: boolean; message: string; data: ManagerService }>(
      `/manager/services/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
  },

  // Delete service
  deleteService: async (
    id: string,
  ): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return authenticatedApiCall<{ status: boolean; message: string }>(
      `/manager/services/${id}`,
      {
        method: "DELETE",
      },
    );
  },

  // ==================== CLINIC ROOM APIs ====================

  // Get all clinic rooms with pagination and filters
  getAllClinics: async (
    params?: GetClinicsParams,
  ): Promise<GetClinicsResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = `/manager/clinic-rooms${queryString ? `?${queryString}&` : "?"}t=${Date.now()}`;

    try {
      const result = await authenticatedApiCall<any>(endpoint, {
        method: "GET",
      });

      return result as unknown as GetClinicsResponse;
    } catch (error) {
      console.error("🌐 API Error:", error);
      throw error;
    }
  },

  // Get clinic detail by ID
  getClinicDetail: async (
    id: string,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: ManagerClinic }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: ManagerClinic;
    }>(`/manager/clinic-rooms/${id}`, {
      method: "GET",
    });
  },

  // Create new clinic room
  createClinic: async (
    data: CreateClinicData,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: ManagerClinic }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: ManagerClinic;
    }>("/manager/clinic-rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  // Update clinic room
  updateClinic: async (
    id: string,
    data: UpdateClinicData,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: ManagerClinic }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: ManagerClinic;
    }>(`/manager/clinic-rooms/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  // Delete clinic room
  deleteClinic: async (
    id: string,
  ): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return authenticatedApiCall<{ status: boolean; message: string }>(
      `/manager/clinic-rooms/${id}`,
      {
        method: "DELETE",
      },
    );
  },

  // Get list of doctors (available for assignment)
  getAvailableDoctors: async (): Promise<
    ApiResponse<{ status: boolean; message: string; data: ManagerDoctor[] }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: ManagerDoctor[];
    }>("/manager/clinic-rooms/doctor", {
      method: "GET",
    });
  },

  // Assign doctor to clinic
  assignDoctor: async (
    clinicId: string,
    doctorId: string,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: ManagerClinic }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: ManagerClinic;
    }>(`/manager/clinic-rooms/assign-doctor/${clinicId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ doctorId }),
    });
  },

  // Unassign doctor from clinic
  unassignDoctor: async (
    clinicId: string,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: ManagerClinic }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: ManagerClinic;
    }>(`/manager/clinic-rooms/unssign-doctor/${clinicId}`, {
      method: "PATCH",
    });
  },

  // ==================== SCHEDULE APIs ====================

  // Get available doctors (doctors có ít hơn 2 ca trong ngày)
  getAvailableDoctorsForSchedule: async (): Promise<
    ApiResponse<{ status: boolean; message: string; data: ManagerDoctor[] }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: ManagerDoctor[];
    }>("/manager/schedules/doctor-available", {
      method: "GET",
    });
  },

  // Get all schedules with pagination and filters
  getAllSchedules: async (
    params?: GetSchedulesParams,
  ): Promise<GetSchedulesResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.shift) queryParams.append("shift", params.shift);
    if (params?.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    const endpoint = `/manager/schedules${queryString ? `?${queryString}` : ""}`;

    try {
      const result = await authenticatedApiCall<any>(endpoint, {
        method: "GET",
      });

      return result as unknown as GetSchedulesResponse;
    } catch (error) {
      console.error("🌐 API Error:", error);
      throw error;
    }
  },

  // Get schedule detail by ID
  getScheduleDetail: async (
    id: string,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: ManagerSchedule }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: ManagerSchedule;
    }>(`/manager/schedules/${id}`, {
      method: "GET",
    });
  },

  // Create new schedule
  createSchedule: async (
    data: CreateScheduleData,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: ManagerSchedule }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: ManagerSchedule;
    }>("/manager/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  // Update schedule
  updateSchedule: async (
    id: string,
    data: UpdateScheduleData,
  ): Promise<
    ApiResponse<{ status: boolean; message: string; data: ManagerSchedule }>
  > => {
    return authenticatedApiCall<{
      status: boolean;
      message: string;
      data: ManagerSchedule;
    }>(`/manager/schedules/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  // Delete schedule
  deleteSchedule: async (
    id: string,
  ): Promise<ApiResponse<{ status: boolean; message: string }>> => {
    return authenticatedApiCall<{ status: boolean; message: string }>(
      `/manager/schedules/${id}`,
      {
        method: "DELETE",
      },
    );
  },

  // Working Hours Management
  getWorkingHours: async (
    scheduleId: string,
  ): Promise<
    ApiResponse<{
      scheduleId: string;
      doctorUserId: string;
      doctorName: string;
      date: string;
      shift: string;
      workingHours: {
        morningStart: string;
        morningEnd: string;
        afternoonStart: string;
        afternoonEnd: string;
      };
    }>
  > => {
    return authenticatedApiCall(`/schedules/${scheduleId}/working-hours`, {
      method: "GET",
    });
  },

  updateWorkingHours: async (
    scheduleId: string,
    workingHours: {
      morningStart: string;
      morningEnd: string;
      afternoonStart: string;
      afternoonEnd: string;
    },
  ): Promise<
    ApiResponse<{
      scheduleId: string;
      doctorUserId: string;
      date: string;
      shift: string;
      workingHours: {
        morningStart: string;
        morningEnd: string;
        afternoonStart: string;
        afternoonEnd: string;
      };
    }>
  > => {
    return authenticatedApiCall(`/schedules/${scheduleId}/working-hours`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workingHours }),
    });
  },

  updateDoctorWorkingHoursForDate: async (
    doctorId: string,
    date: string,
    workingHours: {
      morningStart: string;
      morningEnd: string;
      afternoonStart: string;
      afternoonEnd: string;
    },
  ): Promise<
    ApiResponse<{
      doctorId: string;
      date: string;
      updatedSchedules: number;
      workingHours: {
        morningStart: string;
        morningEnd: string;
        afternoonStart: string;
        afternoonEnd: string;
      };
    }>
  > => {
    return authenticatedApiCall(`/schedules/doctor/${doctorId}/date/${date}/working-hours`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workingHours }),
    });
  },

  // Get all doctors with working hours
  getDoctorsWithWorkingHours: async (): Promise<
    ApiResponse<DoctorWithWorkingHours[]>
  > => {
    return authenticatedApiCall<DoctorWithWorkingHours[]>(
      `/manager/schedules/doctors-with-working-hours?t=${Date.now()}`,
      {
        method: "GET",
        cache: "no-cache", // ⭐ Tránh 304 Not Modified
      }
    );
  },

  // ⭐ Get all doctors without working hours (chưa được manager tạo lịch làm việc)
  getDoctorsWithoutWorkingHours: async (): Promise<
    ApiResponse<{ _id: string; fullName: string; email: string }[]>
  > => {
    return authenticatedApiCall<{ _id: string; fullName: string; email: string }[]>(
      `/manager/schedules/doctors-without-working-hours?t=${Date.now()}`,
      {
        method: "GET",
        cache: "no-cache",
      }
    );
  },

  // Update doctor working hours for all schedules
  updateDoctorWorkingHours: async (
    doctorId: string,
    workingHours: {
      morningStart: string;
      morningEnd: string;
      afternoonStart: string;
      afternoonEnd: string;
    },
  ): Promise<
    ApiResponse<{
      status: boolean;
      message: string;
      data: {
        doctorId: string;
        updatedSchedules: number;
        workingHours: {
          morningStart: string;
          morningEnd: string;
          afternoonStart: string;
          afternoonEnd: string;
        };
      };
    }>
  > => {
    return authenticatedApiCall(`/manager/schedules/doctor/${doctorId}/working-hours`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workingHours }),
    });
  },

  // ==================== DASHBOARD/STATISTICS APIs ====================

  // Get dashboard statistics
  getDashboardStats: async (
    startDate?: string,
    endDate?: string,
  ): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      result: {
        filterRange: {
          startDate: string;
          endDate: string;
        };
        appointments: {
          total: number;
          examination: number;
          consultation: number;
        };
        revenue: {
          Examination: number;
          Consultation: number;
          total: number;
        };
        patients: {
          total: number;
          newPatients: number;
        };
      };
    }>
  > => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const queryString = queryParams.toString();
    const endpoint = `/appointments/dashboard${queryString ? `?${queryString}` : ""}`;

    return authenticatedApiCall(endpoint, {
      method: "GET",
    });
  },

  // Get monthly revenue comparison
  getMonthlyRevenue: async (
    startDate?: string,
    endDate?: string,
  ): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      result: {
        year: number;
        revenue: number[]; // Array of 12 months (index 0 = January, index 11 = December)
      };
    }>
  > => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const queryString = queryParams.toString();
    const endpoint = `/appointments/dashboard/monthly-revenue${queryString ? `?${queryString}` : ""}`;

    return authenticatedApiCall(endpoint, {
      method: "GET",
    });
  },

  // Get service revenue report
  getServiceRevenueReport: async (
    startDate?: string,
    endDate?: string,
  ): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      result: {
        filterRange: {
          startDate: string;
          endDate: string;
        };
        summary: {
          totalServices: number;
          totalOriginalRevenue: number;
          totalPaidRevenue: number;
          totalRevenue: number;
          totalCount: number;
        };
        services: Array<{
          serviceId: string;
          serviceName: string;
          category: string;
          originalPrice: number;
          paidPrice: number;
          count: number;
          totalOriginalRevenue: number;
          totalPaidRevenue: number;
          totalRevenue: number;
        }>;
      };
    }>
  > => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const queryString = queryParams.toString();
    const endpoint = `/appointments/dashboard/service-revenue-report${queryString ? `?${queryString}` : ""}`;

    return authenticatedApiCall(endpoint, {
      method: "GET",
    });
  },

  // Export service revenue report as PDF
  exportServiceRevenuePDF: async (
    startDate?: string,
    endDate?: string,
  ): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const queryString = queryParams.toString();
    const endpoint = `/appointments/dashboard/service-revenue-report/pdf${queryString ? `?${queryString}` : ""}`;

    const token = sessionStorage.getItem("authToken");
    if (!token) {
      throw new Error("Token không tồn tại. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Lỗi khi xuất PDF" }));
      throw new Error(error.message || "Lỗi khi xuất PDF");
    }

    return response.blob();
  },
};

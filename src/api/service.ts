// src/api/service.ts

export interface Service {
  _id: string;
  serviceName: string;
  description: string;
  price: number;
  isPrepaid: boolean | string;
  durationMinutes: number;
  category: string;
  status: string;
}

export interface GetServicesParams {
  page?: number;
  limit?: number;
  isPrepaid?: string;
  status?: string;
  category?: string;
  search?: string;
}

// Backend trả về object này trực tiếp (success là boolean)
export interface GetServicesResponse {
  success: boolean;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: Service[];
}

export const serviceApi = {
  /**
   * Lấy danh sách dịch vụ (GET /services)
   */
  get: async (params: GetServicesParams = {}): Promise<GetServicesResponse> => {
    try {
      // Convert params to string format for URLSearchParams
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const query = queryParams.toString();
      const endpoint = query
        ? `/manager/services?${query}`
        : "/manager/services";

      // Gọi apiCall và cast response về GetServicesResponse
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}${endpoint}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetServicesResponse = await response.json();

      return data;
    } catch (error: any) {
      console.error("Error fetching services:", error);
      throw error;
    }
  },
};

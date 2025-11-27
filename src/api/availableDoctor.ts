// src/api/availableDoctor.ts
export interface AvailableDoctor {
  doctorId: string;
  doctorScheduleId: string;
  doctorName: string;
  email: string;
  phoneNumber: string;
}

export interface GetAvailableDoctorsParams {
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  appointmentFor?: "self" | "other"; // ⭐ Để backend biết có exclude doctors hay không
  userId?: string; // ⭐ ID của user (để exclude bác sĩ mà user đã đặt)
}

export interface GetAvailableDoctorsResponse {
  success: boolean;
  data: {
    date: string;
    serviceId: string;
    serviceName: string;
    requestedTime: {
      startTime: string;
      endTime: string;
      displayTime: string;
    };
    availableDoctors: AvailableDoctor[];
    totalDoctors: number;
  };
  message?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api";

const fetchJsonWithCacheBypass = async (
  endpoint: string,
): Promise<GetAvailableDoctorsResponse> => {
  const doFetch = async (url: string) =>
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

  let response = await doFetch(`${API_BASE}${endpoint}`);

  if (response.status === 304) {
    const separator = endpoint.includes("?") ? "&" : "?";
    const retryEndpoint = `${endpoint}${separator}_cb=${Date.now()}`;

    response = await doFetch(`${API_BASE}${retryEndpoint}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as GetAvailableDoctorsResponse;
};

export const availableDoctorApi = {
  /**
   * ⭐ NEW: Lấy danh sách bác sĩ có khung giờ rảnh vào một ngày cụ thể
   * (GET /api/available-slots/doctors/list)
   */
  getByDate: async (
    serviceId: string,
    date: string,
  ): Promise<GetAvailableDoctorsResponse> => {
    try {
      const queryParams = new URLSearchParams();

      queryParams.append("serviceId", serviceId);
      queryParams.append("date", date);

      const query = queryParams.toString();
      const endpoint = query
        ? `/available-slots/doctors/list?${query}`
        : "/available-slots/doctors/list";

      const data = await fetchJsonWithCacheBypass(endpoint);

      return data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Lấy danh sách bác sĩ có khung giờ rảnh tại một time-slot cụ thể
   * (GET /api/available-slots/doctors/time-slot)
   */
  getByTimeSlot: async (
    params: GetAvailableDoctorsParams,
  ): Promise<GetAvailableDoctorsResponse> => {
    try {
      // Convert params to query string
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const query = queryParams.toString();
      const endpoint = query
        ? `/available-slots/doctors/time-slot?${query}`
        : "/available-slots/doctors/time-slot";

      // Gọi trực tiếp fetch (giống serviceApi)
      const data = await fetchJsonWithCacheBypass(endpoint);

      return data;
    } catch (error: any) {
      throw error;
    }
  },
};

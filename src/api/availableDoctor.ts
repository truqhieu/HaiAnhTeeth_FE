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

      const data: GetAvailableDoctorsResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error fetching available doctors by date:", error);
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

      const data: GetAvailableDoctorsResponse = await response.json();

      return data;
    } catch (error: any) {
      console.error("Error fetching available doctors:", error);
      throw error;
    }
  },
};

// src/api/availableSlot.ts
export interface GetAvailableSlotsParams {
  doctorUserId?: string;   // có thể bỏ trống nếu FE chỉ cần xem theo ngày
  serviceId: string;
  date: string;            // format: YYYY-MM-DD
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  displayTime?: string;
}

export interface AvailableSlotsData {
  date: string;
  doctorUserId?: string;
  serviceId: string;
  serviceName?: string;
  serviceDuration?: number;
  breakAfterMinutes?: number;
  doctorScheduleId?: string | null;
  totalSlots?: number;
  availableSlots: AvailableSlot[];
  message?: string;
}

export interface GetAvailableSlotsResponse {
  success: boolean;
  data: AvailableSlotsData | null;
  message?: string;
}

/**
 * API lấy danh sách khung giờ trống của bác sĩ theo ngày + dịch vụ
 * Backend endpoint: GET /api/available-slots
 */
export const availableSlotApi = {
  get: async (params: GetAvailableSlotsParams): Promise<GetAvailableSlotsResponse> => {
    try {
      const queryParams = new URLSearchParams();

      // Thêm các tham số có giá trị
      if (params.doctorUserId) queryParams.append("doctorUserId", params.doctorUserId);
      if (params.serviceId) queryParams.append("serviceId", params.serviceId);
      if (params.date) queryParams.append("date", params.date);

      const query = queryParams.toString();
      const endpoint = query ? `/api/available-slots?${query}` : "/api/available-slots";

      const response = await fetch(
        `${import.meta.env.VITE_API1_URL || "http://localhost:9999"}${endpoint}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetAvailableSlotsResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching available slots:", error);
      return {
        success: false,
        data: null,
        message: error.message || "Không thể tải danh sách khung giờ.",
      };
    }
  },
};

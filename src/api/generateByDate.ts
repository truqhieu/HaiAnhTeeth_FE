// src/api/generateByDate.ts

export interface GeneratedSlot {
  startTime: string;
  endTime: string;
  displayTime?: string;
}

export interface GenerateByDateParams {
  serviceId: string;
  date: string; // YYYY-MM-DD
  breakAfterMinutes?: number;
}

export interface GenerateByDateResponse {
  success: boolean;
  data: {
    serviceId: string;
    date: string;
    totalSlots: number;
    slots: GeneratedSlot[];
  };
  message?: string;
}

export const generateByDateApi = {
  /**
   * Lấy danh sách khung giờ trống theo ngày (generate dynamic slots)
   * (GET /api/available-slots/generate?serviceId=xxx&date=YYYY-MM-DD)
   */
  get: async (params: GenerateByDateParams): Promise<GenerateByDateResponse> => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const query = queryParams.toString();
      const endpoint = query
        ? `/api/available-slots/generate?${query}`
        : `/api/available-slots/generate`;

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

      const data: GenerateByDateResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error fetching generated slots by date:", error);
      throw error;
    }
  },
};

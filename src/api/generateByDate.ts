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
  appointmentFor?: 'self' | 'other'; // ⭐ Thêm để backend biết có exclude hay không
  customerFullName?: string; // ⭐ Tên người khác (để validate conflict)
  customerEmail?: string; // ⭐ Email người khác (để validate conflict)
}

export interface GenerateByDateResponse {
  success: boolean;
  data: {
    serviceId: string;
    date: string;
    serviceName?: string;
    serviceDuration?: number;
    totalSlots?: number;
    slots: GeneratedSlot[];
    schedules?: any[];
  };
  message?: string;
}

export const generateByDateApi = {
  /**
   * Lấy danh sách khung giờ trống theo ngày (generate dynamic slots)
   * (GET /api/available-slots/generate?serviceId=xxx&date=YYYY-MM-DD)
   * 
   * ⭐ NOTE: Gửi Authorization header để backend có thể exclude slots user đã đặt
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
        ? `/available-slots/generate?${query}`
        : `/available-slots/generate`;

      // ⭐ Lấy token từ store để gửi Authorization header
      const { store } = await import('../store/index');
      const state = store.getState();
      const token = state.auth.token;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // ⭐ Nếu có token, thêm vào header
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ [generateByDateApi] Gửi Authorization header với token');
      } else {
        console.log('⚠️ [generateByDateApi] Không có token, gửi request as Guest');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}${endpoint}`,
        {
          method: "GET",
          headers,
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

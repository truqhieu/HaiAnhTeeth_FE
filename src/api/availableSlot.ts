// src/api/availableSlot.ts
export interface GetAvailableSlotsParams {
  doctorUserId?: string; // có thể bỏ trống nếu FE chỉ cần xem theo ngày
  serviceId: string;
  date: string; // format: YYYY-MM-DD
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

// ⭐ NEW: Interface cho khoảng thời gian khả dụng
export interface ScheduleRange {
  shift: string; // 'Morning' | 'Afternoon'
  shiftDisplay: string; // 'Buổi sáng' | 'Buổi chiều'
  startTime: string;
  endTime: string;
  displayRange: string; // '08:00 - 12:00'
}

export interface AvailableTimeRangeData {
  date: string;
  doctorId?: string;
  doctorName?: string;
  serviceName?: string;
  serviceDuration?: number;
  doctorScheduleId?: string | null;
  scheduleRanges: ScheduleRange[];
  totalSchedules?: number;
  message?: string;
}

export interface GetAvailableTimeRangeResponse {
  success: boolean;
  data: AvailableTimeRangeData | null;
  message?: string;
}

// ⭐ NEW: Interface cho danh sách start times
export interface StartTimeData {
  startTime: string;
  displayTime: string;
}

export interface AvailableStartTimesData {
  date: string;
  serviceName?: string;
  serviceDuration?: number;
  startTimes: StartTimeData[];
  totalStartTimes: number;
}

export interface GetAvailableStartTimesResponse {
  success: boolean;
  data: AvailableStartTimesData | null;
  message?: string;
}

// ⭐ NEW: Interface cho check start time availability
export interface AvailableDoctor {
  doctorId: string;
  doctorName: string;
  specialization?: string;
  doctorScheduleId?: string;
}

export interface CheckStartTimeData {
  date: string;
  startTime: string;
  endTime: string;
  serviceName?: string;
  serviceDuration?: number;
  availableDoctors: AvailableDoctor[];
  totalDoctors: number;
}

export interface CheckStartTimeResponse {
  success: boolean;
  data: CheckStartTimeData | null;
  message?: string;
}

/**
 * API lấy danh sách khung giờ trống của bác sĩ theo ngày + dịch vụ
 * Backend endpoint: GET /api/available-slots
 */
export const availableSlotApi = {
  get: async (
    params: GetAvailableSlotsParams,
  ): Promise<GetAvailableSlotsResponse> => {
    try {
      const queryParams = new URLSearchParams();

      // Thêm các tham số có giá trị
      if (params.doctorUserId)
        queryParams.append("doctorUserId", params.doctorUserId);
      if (params.serviceId) queryParams.append("serviceId", params.serviceId);
      if (params.date) queryParams.append("date", params.date);

      const query = queryParams.toString();
      const endpoint = query ? `/available-slots?${query}` : "/available-slots";

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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

/**
 * API lấy danh sách start times có sẵn cho một dịch vụ + ngày
 * Backend endpoint: GET /api/available-slots/start-times
 */
export const getAvailableStartTimes = async (
  serviceId: string,
  date: string,
  appointmentFor: "self" | "other" = "self",
): Promise<GetAvailableStartTimesResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("serviceId", serviceId);
    queryParams.append("date", date);
    queryParams.append("appointmentFor", appointmentFor);

    const query = queryParams.toString();
    const endpoint = `/available-slots/start-times?${query}`;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}${endpoint}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: GetAvailableStartTimesResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("❌ Error fetching available start times:", error);
    return {
      success: false,
      data: null,
      message: error.message || "Không thể tải danh sách thời gian.",
    };
  }
};

/**
 * API kiểm tra một start time cụ thể có khả dụng không
 * Backend endpoint: GET /api/available-slots/check-start-time
 */
export const checkStartTimeAvailability = async (
  serviceId: string,
  date: string,
  startTime: string,
  appointmentFor: "self" | "other" = "self",
): Promise<CheckStartTimeResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("serviceId", serviceId);
    queryParams.append("date", date);
    queryParams.append("startTime", startTime);
    queryParams.append("appointmentFor", appointmentFor);

    const query = queryParams.toString();
    const endpoint = `/available-slots/check-start-time?${query}`;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}${endpoint}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: CheckStartTimeResponse = await response.json();

    return data;
  } catch (error: any) {
    console.error("❌ Error checking start time availability:", error);
    return {
      success: false,
      data: null,
      message: error.message || "Không thể kiểm tra thời gian.",
    };
  }
};

/**
 * API lấy khoảng thời gian khả dụng cho một dịch vụ + ngày
 * Backend endpoint: GET /api/available-slots/time-range
 */
export const getAvailableTimeRange = async (
  serviceId: string,
  date: string,
  appointmentFor: "self" | "other" = "self",
): Promise<GetAvailableTimeRangeResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("serviceId", serviceId);
    queryParams.append("date", date);
    queryParams.append("appointmentFor", appointmentFor);

    const query = queryParams.toString();
    const endpoint = `/available-slots/time-range?${query}`;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}${endpoint}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: GetAvailableTimeRangeResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("❌ Error fetching available time range:", error);
    return {
      success: false,
      data: null,
      message: error.message || "Không thể tải khoảng thời gian.",
    };
  }
};

/**
 * API validate thời gian nhập có hợp lệ không
 * Backend endpoint: GET /api/available-slots/validate-time
 */
export const validateAndCheckStartTime = async (
  serviceId: string,
  date: string,
  startTime: string,
  appointmentFor: "self" | "other" = "self",
): Promise<CheckStartTimeResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("serviceId", serviceId);
    queryParams.append("date", date);
    queryParams.append("startTime", startTime);
    queryParams.append("appointmentFor", appointmentFor);

    const query = queryParams.toString();
    const endpoint = `/available-slots/validate-time?${query}`;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}${endpoint}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: CheckStartTimeResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("❌ Error validating start time:", error);
    return {
      success: false,
      data: null,
      message: error.message || "Không thể validate thời gian.",
    };
  }
};

/**
 * API lấy khoảng thời gian khả dụng của một bác sĩ cụ thể
 * Backend endpoint: GET /api/available-slots/doctor-schedule
 */
export const getDoctorScheduleRange = async (
  doctorUserId: string,
  serviceId: string,
  date: string,
  appointmentFor: 'self' | 'other' = 'self',
  customerFullName?: string,
  customerEmail?: string,
  patientUserId?: string // ⭐ THÊM: ID của user đang đặt (để backend loại trừ reserved slots của họ)
): Promise<GetAvailableStartTimesResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("doctorUserId", doctorUserId);
    queryParams.append("serviceId", serviceId);
    queryParams.append("date", date);
    queryParams.append("appointmentFor", appointmentFor);

    if (customerFullName) {
      queryParams.append("customerFullName", encodeURIComponent(customerFullName));
    }
    if (customerEmail) {
      queryParams.append("customerEmail", encodeURIComponent(customerEmail));
    }
    // ⭐ THÊM: Gửi patientUserId để backend loại trừ reserved slots của user này
    if (patientUserId) {
      queryParams.append("patientUserId", patientUserId);
    }

    const query = queryParams.toString();
    const endpoint = `/available-slots/doctor-schedule?${query}`;

    // ⭐ Lấy token từ store để gửi Authorization header
    const { store } = await import("../store/index");
    const state = store.getState();
    const token = state.auth.token;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // ⭐ Nếu có token, thêm vào header
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}${endpoint}`,
      {
        method: "GET",
        headers,
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: GetAvailableStartTimesResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("❌ Error fetching doctor schedule range:", error);
    return {
      success: false,
      data: null,
      message: error.message || "Không thể tải lịch bác sĩ.",
    };
  }
};

/**
 * API lấy khoảng thời gian khả dụng dành riêng cho luồng bác sĩ tạo lịch tái khám
 * Backend endpoint: GET /api/available-slots/doctor-schedule/follow-up
 */
export const getDoctorScheduleRangeForFollowUp = async (
  doctorUserId: string,
  serviceId: string,
  date: string,
  appointmentFor: 'self' | 'other' = 'self',
  patientUserId?: string | null,
): Promise<GetAvailableStartTimesResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("doctorUserId", doctorUserId);
    queryParams.append("serviceId", serviceId);
    queryParams.append("date", date);
    queryParams.append("appointmentFor", appointmentFor);
    if (patientUserId) {
      queryParams.append("patientUserId", patientUserId);
    }

    const query = queryParams.toString();
    const endpoint = `/available-slots/doctor-schedule/follow-up?${query}`;

    const { store } = await import("../store/index");
    const state = store.getState();
    const token = state.auth.token;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}${endpoint}`,
      {
        method: "GET",
        headers,
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: GetAvailableStartTimesResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("❌ Error fetching doctor schedule range (follow-up):", error);
    return {
      success: false,
      data: null,
      message: error.message || "Không thể tải lịch bác sĩ.",
    };
  }
};

/**
 * API validate appointment time
 * Backend endpoint: GET /api/available-slots/validate-appointment-time
 */
export const validateAppointmentTime = async (
  doctorUserId: string,
  serviceId: string,
  date: string,
  startTime: string,
  appointmentFor: 'self' | 'other' = 'self',
  customerFullName?: string,
  customerEmail?: string,
  endTime?: string, // ⭐ THÊM: Cho phép truyền endTime tùy chỉnh (cho follow-up)
): Promise<CheckStartTimeResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("doctorUserId", doctorUserId);
    queryParams.append("serviceId", serviceId);
    queryParams.append("date", date);
    queryParams.append("startTime", startTime);
    queryParams.append("appointmentFor", appointmentFor);

    if (customerFullName) {
      queryParams.append("customerFullName", customerFullName);
    }
    if (customerEmail) {
      queryParams.append("customerEmail", customerEmail);
    }
    // ⭐ THÊM: Truyền endTime nếu có
    if (endTime) {
      queryParams.append("endTime", endTime);
    }

    const query = queryParams.toString();
    const endpoint = `/available-slots/validate-appointment-time?${query}`;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "https://haianhteethbe-production.up.railway.app/api"}${endpoint}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ⭐ Thêm để gửi cookie/auth
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: CheckStartTimeResponse = await response.json();

    return data;
  } catch (error: any) {
    console.error("❌ Error validating appointment time:", error);

    return {
      success: false,
      data: null,
      message: error.message || "Không thể validate thời gian hẹn.",
    };
  }
};

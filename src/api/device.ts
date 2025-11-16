import { authenticatedApiCall, ApiResponse } from "./index";

// Device Interface
export interface Device {
  _id: string;
  name: string;
  description: string;
  purchaseDate: string;
  expireDate: string;
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
}

// Create Device Data
export interface CreateDeviceData {
  name: string;
  description: string;
  purchaseDate: string;
  expireDate: string;
}

// Update Device Data
export interface UpdateDeviceData {
  name?: string;
  description?: string;
  purchaseDate?: string;
  expireDate?: string;
  status?: "Active" | "Inactive";
}

// Get Devices Params
export interface GetDevicesParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}

// Get Devices Response
export interface GetDevicesResponse {
  success: boolean;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  data: Device[];
}

// Device API Functions
export const deviceApi = {
  // Get all devices with pagination and filters
  getAllDevices: async (
    params?: GetDevicesParams,
  ): Promise<GetDevicesResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.sort) queryParams.append("sort", params.sort);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const queryString = queryParams.toString();
    const endpoint = `/manager/devices${queryString ? `?${queryString}` : ""}${queryString ? "&" : "?"}t=${Date.now()}`;

    try {
      const result = await authenticatedApiCall<any>(endpoint, {
        method: "GET",
      });

      return result as unknown as GetDevicesResponse;
    } catch (error) {
      console.error("🌐 API Error:", error);
      throw error;
    }
  },

  // Get device detail by ID
  getDeviceDetail: async (
    id: string,
  ): Promise<
    ApiResponse<{ success: boolean; message: string; data: Device }>
  > => {
    return authenticatedApiCall<{
      success: boolean;
      message: string;
      data: Device;
    }>(`/manager/devices/${id}`, {
      method: "GET",
    });
  },

  // Create new device
  createDevice: async (
    data: CreateDeviceData,
  ): Promise<ApiResponse<{ success: boolean; message: string; data: Device }>> => {
    return authenticatedApiCall<{
      success: boolean;
      message: string;
      data: Device;
    }>("/manager/devices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update device
  updateDevice: async (
    id: string,
    data: UpdateDeviceData,
  ): Promise<ApiResponse<{ success: boolean; message: string; data: Device }>> => {
    return authenticatedApiCall<{
      success: boolean;
      message: string;
      data: Device;
    }>(`/manager/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Delete device
  deleteDevice: async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return authenticatedApiCall<{ success: boolean; message: string }>(
      `/manager/devices/${id}`,
      {
        method: "DELETE",
      },
    );
  },
};


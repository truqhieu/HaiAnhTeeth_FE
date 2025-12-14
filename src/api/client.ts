// Centralized API client helpers to avoid circular imports
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://haianhteethbe-production.up.railway.app/api";

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// API Error Types
export interface ApiError {
  message: string;
  status?: number;
}

// Generic API call function
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    // ⭐ Check if this is likely an auth check (profile endpoint) to reduce logging
    const isAuthCheck = endpoint.includes("/auth/profile");

    if (!isAuthCheck) {
      console.log("🚀 Fetching:", url);
      console.log("🔍 [API Call] Full request details:", {
        url,
        method: options.method || "GET",
        headers: options.headers,
        body: options.body,
        credentials: options.credentials,
      });
    }

    const response = await fetch(url, {
      ...options,
      credentials: options.credentials || "include", // Always include credentials for CORS
      cache: options.cache || "default", // ⭐ Support cache option from caller
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // ⭐ Reduce logging for 401 errors (expected when not authenticated)
    const isUnauthorized = response.status === 401;

    if (!isAuthCheck || !isUnauthorized) {
      console.log("🔍 [API Call] Response headers:", Object.fromEntries(response.headers.entries()));
      console.log("📡 Response status:", response.status, response.statusText);

      // ⭐ IMPORTANT: Check if cookie is being set (for debugging incognito mode issues)
      // Note: Set-Cookie header may not be visible in browser due to security restrictions
      // But we can check if this is an auth endpoint and warn if cookie might not be set
      if (endpoint.includes('/auth/login') || endpoint.includes('/auth/verify-email')) {
        console.log("🍪 [API Call] Auth endpoint detected - cookie should be set by browser automatically");
        console.log("🔐 [API Call] If you're in incognito mode, ensure token is saved to sessionStorage as fallback");
      }
    }


    // ⭐ Xử lý 304 Not Modified - không có body, cần fetch lại với cache-busting
    if (response.status === 304) {
      console.warn("⚠️ [API Call] Received 304 Not Modified, response body is empty. This might cause issues.");
      // Try to fetch again with cache-busting
      const cacheBustingUrl = `${url}${url.includes('?') ? '&' : '?'}_nocache=${Date.now()}`;
      console.log("🔄 [API Call] Retrying with cache-busting:", cacheBustingUrl);
      const retryResponse = await fetch(cacheBustingUrl, {
        ...options,
        credentials: options.credentials || "include",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (retryResponse.ok) {
        const result = await retryResponse.json();
        console.log("📦 [API Call] Retry response body:", result);
        return result;
      } else {
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }
    }

    const result = await response.json();

    // ⭐ Only log response body for non-401 errors to reduce noise
    if (!isUnauthorized) {
      console.log("📦 Response body:", result);
    }

    // ⭐ Handle 401 Unauthorized gracefully - don't throw, return response
    // This is expected when user is not authenticated (e.g., after logout)
    if (isUnauthorized) {
      // Silent handling - no error logging needed
      return {
        success: false,
        message: result.message || "Không có token xác thực",
        data: undefined,
      } as ApiResponse<T>;
    }

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`,
      );
    }

    return result;
  } catch (error: any) {
    console.error("💥 API Call Error:", error);
    console.error("💥 Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    // Check if it's a CORS error
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      console.error("🌐 [CORS Error] This is likely a CORS issue. Check:");
      console.error("   1. Backend CORS config allows this origin");
      console.error("   2. Backend is running and accessible");
      console.error("   4. Origin:", typeof window !== 'undefined' ? window.location.origin : 'N/A');

      throw new Error(
        `Lỗi CORS: Không thể kết nối đến server. Vui lòng kiểm tra:\n` +
        `- Backend đang chạy không?\n` +
        `- CORS config có cho phép origin: ${typeof window !== 'undefined' ? window.location.origin : 'N/A'}?\n` +
        `- Kiểm tra console để xem log chi tiết`
      );
    }

    throw new Error(error.message || "Lỗi kết nối đến server");
  }
};

// Authenticated API call function
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  // ⭐ CRITICAL: Lấy token từ sessionStorage để dùng làm fallback
  // Điều này CỰC KỲ QUAN TRỌNG trong incognito mode vì:
  // 1. Cookie có thể chưa được browser lưu kịp ngay sau login
  // 2. sessionStorage luôn available ngay lập tức
  // 3. Backend hỗ trợ cả cookie và Authorization header
  const token = typeof window !== 'undefined' ? sessionStorage.getItem("authToken") : null;

  // Debug logging để track token availability
  const isAuthCheck = endpoint.includes("/auth/profile");
  if (!isAuthCheck) {
    console.log("🔐 [authenticatedApiCall] Token check:", {
      endpoint,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    });
  }

  // ⭐ Tạo headers object với type phù hợp
  const headersObj: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Merge với headers từ options nếu có
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headersObj[key] = value;
      });
    } else {
      Object.assign(headersObj, options.headers);
    }
  }

  // ⭐ CRITICAL: LUÔN thêm Authorization header nếu có token
  // Điều này đảm bảo request authenticated ngay cả khi cookie chưa sẵn sàng
  // Đặc biệt quan trọng trong incognito mode và ngay sau login
  if (token) {
    headersObj['Authorization'] = `Bearer ${token}`;
    if (!isAuthCheck) {
      console.log("✅ [authenticatedApiCall] Added Authorization header");
    }
  } else if (!isAuthCheck) {
    console.warn("⚠️ [authenticatedApiCall] No token found in sessionStorage, relying on cookie only");
  }

  return apiCall<T>(endpoint, {
    ...options,
    credentials: "include", // để browser tự gửi cookie (primary auth method)
    headers: headersObj as HeadersInit,
  });
};





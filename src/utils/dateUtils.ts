export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Lấy ngày hôm nay theo timezone Việt Nam (UTC+7)
 * @returns {string} - "YYYY-MM-DD" (ví dụ: "2025-11-06")
 */
export const getTodayVN = (): string => {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return dateFormatter.format(now);
};

/**
 * Lấy ngày mai theo timezone Việt Nam (UTC+7)
 * @returns {string} - "YYYY-MM-DD" (ví dụ: "2025-11-07")
 */
export const getTomorrowVN = (): string => {
  const todayStr = getTodayVN();
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
  
  // Tính ngày mai: thêm 1 ngày
  let tomorrowYear = todayYear;
  let tomorrowMonth = todayMonth;
  let tomorrowDay = todayDay + 1;
  
  // Kiểm tra số ngày trong tháng hiện tại
  const daysInMonth = new Date(tomorrowYear, tomorrowMonth - 1, 0).getDate();
  if (tomorrowDay > daysInMonth) {
    tomorrowDay = 1;
    tomorrowMonth++;
    if (tomorrowMonth > 12) {
      tomorrowMonth = 1;
      tomorrowYear++;
    }
  }
  
  return `${tomorrowYear}-${String(tomorrowMonth).padStart(2, '0')}-${String(tomorrowDay).padStart(2, '0')}`;
};

/**
 * Lấy ngày kia theo timezone Việt Nam (UTC+7)
 * @returns {string} - "YYYY-MM-DD"
 */
export const getDayAfterTomorrowVN = (): string => {
  const todayStr = getTodayVN();
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
  
  // Tính ngày kia: thêm 2 ngày
  let dayAfterTomorrowYear = todayYear;
  let dayAfterTomorrowMonth = todayMonth;
  let dayAfterTomorrowDay = todayDay + 2;
  
  // Xử lý chuyển tháng/năm
  while (true) {
    const daysInCurrentMonth = new Date(dayAfterTomorrowYear, dayAfterTomorrowMonth - 1, 0).getDate();
    if (dayAfterTomorrowDay <= daysInCurrentMonth) {
      break;
    }
    dayAfterTomorrowDay -= daysInCurrentMonth;
    dayAfterTomorrowMonth++;
    if (dayAfterTomorrowMonth > 12) {
      dayAfterTomorrowMonth = 1;
      dayAfterTomorrowYear++;
    }
  }
  
  return `${dayAfterTomorrowYear}-${String(dayAfterTomorrowMonth).padStart(2, '0')}-${String(dayAfterTomorrowDay).padStart(2, '0')}`;
};

/**
 * Lấy Date object cho ngày hôm nay theo timezone Việt Nam (UTC+7)
 * @returns {Date} - Date object với timezone VN
 */
export const getTodayDateVN = (): Date => {
  const todayStr = getTodayVN();
  const [year, month, day] = todayStr.split('-').map(Number);
  // Tạo Date object với timezone VN (giả sử 12:00 VN time để tránh timezone issues)
  return new Date(Date.UTC(year, month - 1, day, 12 - 7, 0, 0)); // 12:00 VN = 05:00 UTC
};

/**
 * Lấy Date object cho ngày mai theo timezone Việt Nam (UTC+7)
 * @returns {Date} - Date object với timezone VN
 */
export const getTomorrowDateVN = (): Date => {
  const tomorrowStr = getTomorrowVN();
  const [year, month, day] = tomorrowStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12 - 7, 0, 0));
};
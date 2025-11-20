import { vi } from "date-fns/locale";

const viLocale = {
  ...vi,
  localize: {
    ...vi.localize,
    day: (n: number) => {
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return days[n];
    },
    month: (n: number) => {
      const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
      return months[n];
    },
  },
  months: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
  monthsShort: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
  weekdays: ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"],
  weekdaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  weekdaysMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  options: {
    ...vi.options,
    weekStartsOn: 1,
  },
};

export default viLocale;


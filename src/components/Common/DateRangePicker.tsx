import React, { useState, useRef, useEffect } from 'react';
import { Button, Input } from '@heroui/react';
import { CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onDateChange: (startDate: string | null, endDate: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  labelPlacement?: 'inside' | 'outside';
}

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  placeholder = "Chọn khoảng thời gian",
  className = "",
  disabled = false,
  label,
  labelPlacement = 'inside'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<string | null>(endDate);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'start' | 'end'>('start');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isAbove, setIsAbove] = useState<boolean>(true);

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Update temp dates when props change
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  // Position the calendar to always stick below the input
  useEffect(() => {
    const updatePosition = () => {
      if (!isOpen || !dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Width: not smaller than input, but never exceed viewport minus margins
      const margin = 8;
      const maxWidth = Math.min(360, viewportWidth - margin * 2);
      const width = Math.min(Math.max(rect.width, 280), maxWidth);

      // Horizontal positioning - align with input
      let left = rect.left;
      if (left + width > viewportWidth - margin) {
        left = viewportWidth - width - margin;
      }
      if (left < margin) {
        left = margin;
      }

      // Always position below the input
      const top = rect.bottom + margin;
      
      setPanelStyle({ top, left, width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      return `Từ ${formatDate(startDate)}`;
    } else if (endDate) {
      return `Đến ${formatDate(endDate)}`;
    }
    return placeholder;
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = formatDateValue(date);
    
    if (viewMode === 'start') {
      setTempStartDate(dateStr);
      // If end date is before start date, clear it
      if (tempEndDate && dateStr > tempEndDate) {
        setTempEndDate(null);
      }
      setViewMode('end');
    } else {
      // If start date is not selected, set it first
      if (!tempStartDate) {
        setTempStartDate(dateStr);
        setViewMode('end');
        return;
      }
      
      // If selected date is before start date, swap them
      if (dateStr < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(dateStr);
      } else {
        setTempEndDate(dateStr);
      }
    }
  };

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    onDateChange(null, null);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDateObj = tempStartDate ? new Date(tempStartDate) : null;
    const endDateObj = tempEndDate ? new Date(tempEndDate) : null;
    
    const days = [];
    const startWeekday = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const dateStr = formatDateValue(currentDate);
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const isSelected = (startDateObj && dateStr === tempStartDate) || (endDateObj && dateStr === tempEndDate);
      const isInRange = startDateObj && endDateObj && dateStr > tempStartDate! && dateStr < tempEndDate!;
      const isDisabled = false; // Allow selecting past dates for filtering
      
      let className = "h-10 w-10 flex items-center justify-center text-xs sm:text-sm rounded-lg cursor-pointer transition-all duration-200 font-medium ";
      
      if (isSelected) {
        className += "bg-blue-500 text-white font-bold shadow-md";
      } else if (isInRange) {
        className += "bg-blue-100 text-blue-700 font-semibold";
      } else if (isToday) {
        className += "bg-gray-200 text-gray-800 font-bold border-2 border-gray-400";
      } else if (isDisabled) {
        className += "text-gray-300 cursor-not-allowed";
      } else {
        className += "hover:bg-gray-100 text-gray-700 hover:shadow-sm";
      }
      
      days.push(
        <button
          key={day}
          type="button"
          className={className}
          onClick={() => !isDisabled && handleDateSelect(currentDate)}
          disabled={isDisabled}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Input
        label={label}
        labelPlacement={label ? labelPlacement : undefined}
        value={getDisplayText()}
        placeholder={placeholder}
        readOnly
        onClick={() => {
          if (disabled) return;
          if (!isOpen) {
            // Always start with selecting the start date when opening
            setViewMode('start');
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        }}
        startContent={<CalendarIcon className="w-5 h-5 text-gray-400" />}
        endContent={
          (startDate || endDate) && !disabled ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          ) : null
        }
        className="cursor-pointer"
        variant="bordered"
        size="lg"
        isDisabled={disabled}
      />
      
      {isOpen && (
        <div className="fixed inset-0 z-[9999]">
          {/* Click-catcher for outside click */}
          <div 
            className="absolute inset-0" 
            onClick={() => setIsOpen(false)}
          />
          {/* Calendar panel positioned below input */}
          <div
            ref={panelRef}
            className="absolute bg-white border border-gray-200 rounded-xl shadow-2xl p-3 sm:p-4 animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              top: panelStyle.top,
              left: panelStyle.left,
              width: panelStyle.width || 360
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-bold text-gray-800 select-none">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {dayNames.map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5 mb-4">
            {generateCalendarDays()}
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-700 mb-3 text-center font-medium">
            {viewMode === 'start' ? 'Chọn ngày bắt đầu' : 'Chọn ngày kết thúc'}
          </div>

          {/* Selected dates display */}
          {(tempStartDate || tempEndDate) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-blue-800">
                {tempStartDate && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Từ:</span>
                    <span>{formatDate(tempStartDate)}</span>
                  </div>
                )}
                {tempEndDate && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Đến:</span>
                    <span>{formatDate(tempEndDate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <Button
              size="sm"
              variant="light"
              onClick={handleCancel}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              variant="light"
              onClick={handleClear}
              className="flex-1"
            >
              Xóa
            </Button>
            <Button
              size="sm"
              color="primary"
              onClick={handleApply}
              className="flex-1"
              isDisabled={!tempStartDate || !tempEndDate}
            >
              Áp dụng
            </Button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;

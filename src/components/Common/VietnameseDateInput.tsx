import {
  forwardRef,
  ReactNode,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Input } from "@heroui/react";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import viLocale from "@/utils/viLocale";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("vi", viLocale as any);
setDefaultLocale("vi");

const DATE_PICKER_PORTAL_ID = "react-datepicker-portal";

const ensurePortalContainer = () => {
  if (typeof document === "undefined") return;
  if (!document.getElementById(DATE_PICKER_PORTAL_ID)) {
    const portalRoot = document.createElement("div");
    portalRoot.id = DATE_PICKER_PORTAL_ID;
    portalRoot.style.position = "relative";
    portalRoot.style.zIndex = "9999";
    document.body.appendChild(portalRoot);
  }
};

const formatToISO = (date: Date | null) => {
  if (!date) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISO = new Date(date.getTime() - tzOffset).toISOString();
  return localISO.split("T")[0];
};

const parseDateValue = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const toDate = (value?: string | Date) => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const formatDisplayDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Validate date components
const validateDateComponents = (day: number, month: number, year: number): { isValid: boolean; errorMessage?: string } => {
  // Validate year (must be 4 digits and reasonable range)
  if (year < 1900 || year > 2100) {
    return { isValid: false, errorMessage: "Năm phải từ 1900 đến 2100" };
  }
  
  // Validate month (1-12)
  if (month < 1 || month > 12) {
    return { isValid: false, errorMessage: "Tháng phải từ 01 đến 12" };
  }
  
  // Validate day (1-31, but depends on month and year)
  if (day < 1 || day > 31) {
    return { isValid: false, errorMessage: "Ngày phải từ 01 đến 31" };
  }
  
  // Check if the date is valid (e.g., Feb 30 is invalid)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) {
    return { isValid: false, errorMessage: `Tháng ${month} chỉ có ${daysInMonth} ngày` };
  }
  
  return { isValid: true };
};

const parseDDMMYYYY = (input: string, validateRanges = true): Date | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/[^0-9]/).filter(Boolean);
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    parts[2].length !== 4
  ) {
    return null;
  }

  // Validate ranges if requested
  if (validateRanges) {
    const validation = validateDateComponents(day, month, year);
    if (!validation.isValid) {
      return null;
    }
  }

  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getDate() !== day ||
    candidate.getMonth() !== month - 1 ||
    candidate.getFullYear() !== year
  ) {
    return null;
  }

  return candidate;
};

// Validate date while typing (less strict - allows partial input)
const validatePartialDate = (input: string): { isValid: boolean; errorMessage?: string } => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: true };
  }

  const parts = trimmed.split(/[^0-9]/).filter(Boolean);
  
  // Validate day if provided
  if (parts.length >= 1 && parts[0]) {
    const day = Number(parts[0]);
    if (!Number.isNaN(day) && (day < 1 || day > 31)) {
      return { isValid: false, errorMessage: "Ngày phải từ 01 đến 31" };
    }
  }
  
  // Validate month if provided
  if (parts.length >= 2 && parts[1]) {
    const month = Number(parts[1]);
    if (!Number.isNaN(month) && (month < 1 || month > 12)) {
      return { isValid: false, errorMessage: "Tháng phải từ 01 đến 12" };
    }
  }
  
  // Validate year if provided
  if (parts.length >= 3 && parts[2]) {
    const yearStr = parts[2];
    if (yearStr.length === 4) {
      const year = Number(yearStr);
      if (!Number.isNaN(year) && (year < 1900 || year > 2100)) {
        return { isValid: false, errorMessage: "Năm phải từ 1900 đến 2100" };
      }
      
      // If we have all three parts, validate the full date
      if (parts.length === 3) {
        const day = Number(parts[0]);
        const month = Number(parts[1]);
        const fullValidation = validateDateComponents(day, month, year);
        if (!fullValidation.isValid) {
          return fullValidation;
        }
      }
    }
  }
  
  return { isValid: true };
};

// Format input to automatically add "/" between dd, mm, yyyy
// Also validates and blocks invalid numbers as user types
const formatDateInput = (input: string | undefined | null): string => {
  // Handle null/undefined/empty input
  if (!input || typeof input !== 'string') {
    return "";
  }
  
  // Remove all non-digit characters
  const digitsOnly = input.replace(/\D/g, "");
  
  // Limit to 8 digits (ddmmyyyy)
  const limitedDigits = digitsOnly.slice(0, 8);
  
  if (limitedDigits.length === 0) {
    return "";
  }
  
  // Validate and block invalid values as user types
  let validatedDigits = "";
  
  // Day validation (first 2 digits)
  if (limitedDigits.length >= 1) {
    const firstDayDigit = Number(limitedDigits[0]);
    // First digit must be 0-3 (for days 01-39)
    if (firstDayDigit > 3) {
      // Block invalid first digit
      return "";
    }
    validatedDigits += limitedDigits[0];
    
    if (limitedDigits.length >= 2) {
      const day = Number(limitedDigits.slice(0, 2));
      // Day must be 01-31
      if (day >= 1 && day <= 31) {
        validatedDigits += limitedDigits[1];
      } else {
        // Block invalid day (00, 32-99)
        return validatedDigits; // Return only first digit
      }
    }
  }
  
  // Month validation (next 2 digits)
  if (limitedDigits.length > 2 && validatedDigits.length >= 2) {
    const firstMonthDigit = limitedDigits[2];
    
    if (limitedDigits.length === 3) {
      // Only first digit of month entered
      // Allow 0-1 (for 01-19), or if they type "1" allow it (could become 10-12)
      if (firstMonthDigit === "0" || firstMonthDigit === "1") {
        validatedDigits += firstMonthDigit;
      } else {
        // Block invalid first digit (2-9 cannot start valid month)
        return validatedDigits; // Return only day part
      }
    } else if (limitedDigits.length >= 4) {
      // Both month digits entered
      const month = Number(limitedDigits.slice(2, 4));
      // Month must be 01-12
      if (month >= 1 && month <= 12) {
        validatedDigits += limitedDigits[2];
        validatedDigits += limitedDigits[3];
      } else {
        // Block invalid month (00, 13-99)
        // Check if first digit is valid, keep it if so
        if (firstMonthDigit === "0" || firstMonthDigit === "1") {
          validatedDigits += firstMonthDigit;
        }
        return validatedDigits; // Return only day and possibly first month digit
      }
    }
  }
  
  // Year validation (next 4 digits)
  if (limitedDigits.length > 4 && validatedDigits.length >= 4) {
    const firstYearDigit = limitedDigits[4];
    // First digit must be 1 or 2 (for years 1900-2999)
    if (firstYearDigit !== "1" && firstYearDigit !== "2") {
      // Block invalid first digit
      return validatedDigits; // Return only day/month part
    }
    validatedDigits += firstYearDigit;
    
    if (limitedDigits.length >= 6) {
      const firstTwoYear = Number(limitedDigits.slice(4, 6));
      // First two digits must be 19, 20, or 21 (for years 1900-2199)
      if (firstTwoYear >= 19 && firstTwoYear <= 21) {
        validatedDigits += limitedDigits[5];
      } else {
        // Block invalid first two digits
        return validatedDigits; // Return only up to first year digit
      }
    }
    
    if (limitedDigits.length >= 7) {
      const firstThreeYear = Number(limitedDigits.slice(4, 7));
      // Validate reasonable range
      if (firstThreeYear >= 190 && firstThreeYear <= 210) {
        validatedDigits += limitedDigits[6];
      } else {
        // Block if outside reasonable range
        return validatedDigits; // Return only up to first two year digits
      }
    }
    
    if (limitedDigits.length >= 8) {
      const year = Number(limitedDigits.slice(4, 8));
      // Full year must be 1900-2100
      if (year >= 1900 && year <= 2100) {
        validatedDigits += limitedDigits[7];
      } else {
        // Block invalid year
        return validatedDigits; // Return only up to first three year digits
      }
    }
  }
  
  // Build formatted string with slashes
  let formatted = "";
  
  if (validatedDigits.length > 0) {
    formatted += validatedDigits.slice(0, 2); // Day
  }
  if (validatedDigits.length > 2) {
    formatted += "/" + validatedDigits.slice(2, 4); // Month
  }
  if (validatedDigits.length > 4) {
    formatted += "/" + validatedDigits.slice(4, 8); // Year
  }
  
  return formatted;
};

interface CalendarInputProps {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  isDisabled?: boolean;
  onClear?: () => void;
  id?: string;
  label?: ReactNode;
  className?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  displayValue?: string;
  onManualValueChange?: (value: string) => void;
  onManualBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onManualKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  size?: "sm" | "md" | "lg";
}

const CalendarInput = forwardRef<HTMLInputElement, CalendarInputProps>(
  (
    {
      value,
      onClick,
      placeholder,
      isInvalid,
      errorMessage,
      isDisabled,
      onClear,
      id,
      label,
      className,
      inputWrapperClassName,
      inputClassName,
      displayValue,
      onManualValueChange,
      onManualBlur,
      onManualKeyDown,
      onBlur,
      onKeyDown,
      size = "md",
    },
    ref,
  ) => {
  const triggerCalendar = () => {
    if (onClick && !isDisabled) {
      onClick();
    }
  };
  
  const handleClick = () => {
    triggerCalendar();
  };
    
    // React-datepicker passes 'value' prop when using customInput  
    // We need to ensure placeholder shows when value is empty
    // displayValue takes priority for manual typing state
    // Try using undefined for empty values so placeholder shows properly
    const hasDisplayValue = displayValue !== undefined && displayValue !== null && displayValue !== "";
    const hasReactDatepickerValue = value !== undefined && value !== null && value !== "" && String(value).trim() !== "";
    
    const finalValue = hasDisplayValue 
      ? displayValue 
      : (hasReactDatepickerValue ? String(value) : undefined);
    
    return (
      <Input
        id={id}
        ref={ref}
        value={finalValue ?? ""}
        placeholder={placeholder || "dd/mm/yyyy"}
        onClick={handleClick}
        variant="bordered"
        size={size}
        isInvalid={isInvalid}
        errorMessage={errorMessage}
        label={label}
        classNames={{
          base: className || "w-full",
          inputWrapper: `cursor-pointer ${inputWrapperClassName || ""}`,
          input: `${inputClassName || ""} cursor-pointer`,
        }}
        startContent={
          <button
            type="button"
            onClick={isDisabled ? undefined : handleClick}
            className="cursor-pointer"
            tabIndex={-1}
          >
            <CalendarIcon className="w-5 h-5 text-gray-400" />
          </button>
        }
        endContent={
          value && onClear && !isDisabled ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          ) : null
        }
        isDisabled={isDisabled}
        onValueChange={(val) => onManualValueChange?.(val)}
        onBlur={(event) => {
          onManualBlur?.(event);
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          onManualKeyDown?.(event);
          onKeyDown?.(event);
        }}
      />
    );
  }
);

CalendarInput.displayName = "CalendarInput";

interface VietnameseDateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  minDate?: string | Date;
  maxDate?: string | Date;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  id?: string;
  label?: ReactNode;
  className?: string;
  inputWrapperClassName?: string;
  labelOutside?: boolean;
  inputClassName?: string;
  outsideLabelClassName?: string;
  size?: "sm" | "md" | "lg";
}

const VietnameseDateInput: React.FC<VietnameseDateInputProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "dd/mm/yyyy",
  isInvalid,
  errorMessage,
  disabled,
  id,
  label,
  className,
  inputWrapperClassName,
  labelOutside = false,
  inputClassName,
  outsideLabelClassName,
  size = "lg",
}) => {
  useEffect(() => {
    ensurePortalContainer();
  }, []);

  const [internalValue, setInternalValue] = useState("");
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const lastValueRef = useRef<string>("");
  const datePickerRef = useRef<any>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (!value) {
      setInternalValue("");
      setValidationError(undefined);
      lastValueRef.current = "";
      return;
    }

    if (value === lastValueRef.current) return;

    const parsedValue = parseDateValue(value);
    if (parsedValue) {
      setInternalValue(formatDisplayDate(parsedValue));
      setValidationError(undefined);
      lastValueRef.current = value;
    } else {
      setValidationError(undefined);
      setInternalValue("");
    }
  }, [value]);

  // Add global click listener to close calendar when a date is selected
  useEffect(() => {
    const handleGlobalClick = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check if clicked element is a date in the calendar
      if (target && target.classList && target.classList.contains('react-datepicker__day') && 
          !target.classList.contains('react-datepicker__day--disabled') &&
          !target.classList.contains('react-datepicker__day--outside-month')) {
        // Close the calendar after the date is selected
        setTimeout(() => {
          if (datePickerRef.current && datePickerRef.current.setOpen) {
            datePickerRef.current.setOpen(false);
          }
        }, 50);
      }
    };
    
    // Add listener to document with capture phase to ensure it runs even in modals
    document.addEventListener('click', handleGlobalClick, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  const commitManualValue = () => {
    const trimmed = internalValue.trim();

    if (!trimmed) {
      setValidationError(undefined);
      if (value) {
        onChange?.("");
        lastValueRef.current = "";
      }
      return;
    }

    // Validate the date
    const validation = validatePartialDate(trimmed);
    if (!validation.isValid) {
      setValidationError(validation.errorMessage);
      return;
    }

    const parsed = parseDDMMYYYY(trimmed);
    if (!parsed) {
      // Try to get more specific error
      const parts = trimmed.split(/[^0-9]/).filter(Boolean);
      if (parts.length === 3) {
        const day = Number(parts[0]);
        const month = Number(parts[1]);
        const year = Number(parts[2]);
        if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
          const componentValidation = validateDateComponents(day, month, year);
          if (!componentValidation.isValid) {
            setValidationError(componentValidation.errorMessage);
            return;
          }
        }
      }
      setValidationError("Ngày không hợp lệ");
      return;
    }

    // Check against minDate and maxDate if provided
    if (minDate) {
      const min = toDate(minDate);
      if (min) {
        // Clone and set to midnight to compare dates only
        const minDateOnly = new Date(min);
        minDateOnly.setHours(0, 0, 0, 0);
        
        const parsedDateOnly = new Date(parsed);
        parsedDateOnly.setHours(0, 0, 0, 0);
        
        if (parsedDateOnly < minDateOnly) {
          setValidationError("Ngày không được trước ngày tối thiểu cho phép");
          return;
        }
      }
    }
    if (maxDate) {
      const max = toDate(maxDate);
      if (max) {
        // Clone and set to midnight to compare dates only
        const maxDateOnly = new Date(max);
        maxDateOnly.setHours(0, 0, 0, 0);
        
        const parsedDateOnly = new Date(parsed);
        parsedDateOnly.setHours(0, 0, 0, 0);
        
        if (parsedDateOnly > maxDateOnly) {
          setValidationError("Ngày không được sau ngày tối đa cho phép");
          return;
        }
      }
    }

    setValidationError(undefined);
    const isoString = formatToISO(parsed);
    lastValueRef.current = isoString;
    if (isoString !== value) {
      onChange?.(isoString);
    } else {
      setInternalValue(formatDisplayDate(parsed));
    }
  };

  const handleManualValueChange = (nextValue: string) => {
    // Auto-format the input as user types
    const formatted = formatDateInput(nextValue);
    setInternalValue(formatted);
    
    // Validate as user types (show errors only for complete or obviously invalid input)
    if (formatted && formatted.trim() !== "") {
      const validation = validatePartialDate(formatted);
      if (!validation.isValid) {
        setValidationError(validation.errorMessage);
      } else {
        // Clear error if validation passes, but don't commit yet (wait for blur)
        setValidationError(undefined);
      }
    } else {
      setValidationError(undefined);
    }
  };

  const handleManualBlur = (_event: FocusEvent<HTMLInputElement>) => {
    commitManualValue();
  };

  const handleManualKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      commitManualValue();
    }
  };

  const selected = parseDateValue(value);

  const inputComponent = (
    <DatePicker
      ref={datePickerRef}
      selected={selected}
      onChange={(date) => {
        onChange?.(formatToISO(date));
        // Update internal value when date is selected from calendar
        if (date && date instanceof Date && !isNaN(date.getTime())) {
          setInternalValue(formatDisplayDate(date));
          setValidationError(undefined); // Clear validation error when valid date selected
          // Close calendar with a flag to prevent re-opening
          isClosingRef.current = true;
          setTimeout(() => {
            if (datePickerRef.current && datePickerRef.current.setOpen) {
              datePickerRef.current.setOpen(false);
            }
            // Reset flag after a delay
            setTimeout(() => {
              isClosingRef.current = false;
            }, 300);
          }, 100);
        } else if (date === null) {
          setInternalValue("");
          setValidationError(undefined);
        }
      }}
      onSelect={(date) => {
        // This fires when a date is clicked in the calendar
        if (date && date instanceof Date && !isNaN(date.getTime())) {
          // Close calendar with a flag to prevent re-opening
          isClosingRef.current = true;
          setTimeout(() => {
            if (datePickerRef.current && datePickerRef.current.setOpen) {
              datePickerRef.current.setOpen(false);
            }
            // Reset flag after a delay
            setTimeout(() => {
              isClosingRef.current = false;
            }, 300);
          }, 100);
        }
      }}
      onInputClick={() => {
        // Prevent opening if we're in the process of closing
        if (isClosingRef.current) {
          return false;
        }
      }}
      strictParsing={false}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      locale="vi"
      minDate={toDate(minDate)}
      maxDate={toDate(maxDate)}
      calendarStartDay={1}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      scrollableYearDropdown
      yearDropdownItemNumber={100}
      allowSameDay
      onChangeRaw={(e) => {
        // Handle manual typing - format as user types
        const inputEl = e?.target instanceof HTMLInputElement ? e.target : null;
        if (!inputEl) {
          return;
        }
        const inputValue = inputEl.value ?? "";
        
        // Check if value is already in dd/MM/yyyy format (from calendar selection)
        if (inputValue && typeof inputValue === 'string' && inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          // Already formatted from calendar, validate and update
          const validation = validatePartialDate(inputValue);
          if (!validation.isValid) {
            setValidationError(validation.errorMessage);
            setInternalValue(inputValue);
            return;
          }
          
          const parsedDate = parseDDMMYYYY(inputValue);
          if (parsedDate) {
            setValidationError(undefined);
            setInternalValue(inputValue);
            const isoDate = formatToISO(parsedDate);
            onChange?.(isoDate);
          } else {
            setValidationError("Ngày không hợp lệ");
            setInternalValue(inputValue);
          }
          return;
        }
        
        // Manual typing - format it
        const formatted = formatDateInput(inputValue);
        
        // Update the input value with formatted version
        if (inputValue !== formatted) {
          const cursorPos = inputEl.selectionStart ?? 0;
          inputEl.value = formatted;
          const lengthDiff = formatted.length - (inputValue?.length || 0);
          const newCursorPos = Math.max(0, Math.min(cursorPos + lengthDiff, formatted.length));
          inputEl.setSelectionRange(newCursorPos, newCursorPos);
        }
        
        // Update internal value for manual typing
        setInternalValue(formatted);
        
        // Validate as user types
        if (formatted && formatted.trim() !== "") {
          const validation = validatePartialDate(formatted);
          if (!validation.isValid) {
            setValidationError(validation.errorMessage);
            onChange?.("");
            return;
          }
          
          // Try to parse the date
          const parsedDate = parseDDMMYYYY(formatted);
          if (parsedDate) {
            setValidationError(undefined);
            const isoDate = formatToISO(parsedDate);
            onChange?.(isoDate);
          } else if (formatted.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            // Full format but invalid date
            const parts = formatted.split(/[^0-9]/).filter(Boolean);
            if (parts.length === 3) {
              const day = Number(parts[0]);
              const month = Number(parts[1]);
              const year = Number(parts[2]);
              const componentValidation = validateDateComponents(day, month, year);
              if (!componentValidation.isValid) {
                setValidationError(componentValidation.errorMessage);
              } else {
                setValidationError("Ngày không hợp lệ");
              }
            }
            onChange?.("");
          } else {
            // Partial input, clear error for now
            setValidationError(undefined);
            onChange?.("");
          }
        } else {
          setValidationError(undefined);
          onChange?.("");
        }
      }}
      customInput={
        <CalendarInput
          id={id}
          placeholder={placeholder}
          isInvalid={isInvalid || !!validationError}
          errorMessage={labelOutside ? undefined : (errorMessage || validationError)}
          label={labelOutside ? undefined : label}
          onClear={() => {
            onChange?.("");
            setInternalValue("");
            setValidationError(undefined);
          }}
          isDisabled={disabled}
          className={className}
          inputWrapperClassName={inputWrapperClassName}
          inputClassName={inputClassName}
          displayValue={internalValue}
          onManualValueChange={handleManualValueChange}
          onManualBlur={handleManualBlur}
          onManualKeyDown={handleManualKeyDown}
          size={size}
        />
      }
      shouldCloseOnSelect
      showPopperArrow={false}
      popperPlacement="bottom-start"
      popperClassName="z-[9999]"
      popperProps={{
        strategy: "fixed",
      }}
      portalId={DATE_PICKER_PORTAL_ID}
      disabled={disabled}
    />
  );

  if (!labelOutside) {
    return inputComponent;
  }

  return (
    <div className="w-full">
      {label && (
        <label
          className={
            outsideLabelClassName ||
            "block text-sm font-medium text-gray-900 mb-2"
          }
          htmlFor={id}
        >
          {label}
        </label>
      )}
      {inputComponent}
      {(errorMessage || validationError) && (
        <p className="text-xs text-danger mt-1">{errorMessage || validationError}</p>
      )}
    </div>
  );
};

export default VietnameseDateInput;


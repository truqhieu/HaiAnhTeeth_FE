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

const parseDDMMYYYY = (input: string): Date | null => {
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

// Format input to automatically add "/" between dd, mm, yyyy
const formatDateInput = (input: string | undefined | null): string => {
  // Handle null/undefined/empty input
  if (!input || typeof input !== 'string') {
    return "";
  }
  
  // Remove all non-digit characters
  const digitsOnly = input.replace(/\D/g, "");
  
  // Limit to 8 digits (ddmmyyyy)
  const limitedDigits = digitsOnly.slice(0, 8);
  
  // Add slashes automatically
  let formatted = "";
  
  if (limitedDigits.length > 0) {
    formatted += limitedDigits.slice(0, 2); // Day
  }
  if (limitedDigits.length > 2) {
    formatted += "/" + limitedDigits.slice(2, 4); // Month
  }
  if (limitedDigits.length > 4) {
    formatted += "/" + limitedDigits.slice(4, 8); // Year
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
    },
    ref,
  ) => {
    const handleClick = (e: MouseEvent<HTMLInputElement>) => {
      // Call react-datepicker's onClick to open calendar
      if (onClick && !isDisabled) {
        onClick(e as any);
      }
    };
    
    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
      // Open calendar on focus (when input is clicked)
      if (onClick && !isDisabled) {
        onClick(e as any);
      }
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
        onFocus={handleFocus}
        variant="bordered"
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
}) => {
  useEffect(() => {
    ensurePortalContainer();
  }, []);

  const [internalValue, setInternalValue] = useState("");
  const lastValueRef = useRef<string>("");

  useEffect(() => {
    if (!value) {
      setInternalValue("");
      lastValueRef.current = "";
      return;
    }

    if (value === lastValueRef.current) return;

    const parsedValue = parseDateValue(value);
    if (parsedValue) {
      setInternalValue(formatDisplayDate(parsedValue));
      lastValueRef.current = value;
    }
  }, [value]);

  const commitManualValue = () => {
    const trimmed = internalValue.trim();

    if (!trimmed) {
      if (value) {
        onChange?.("");
        lastValueRef.current = "";
      }
      return;
    }

    const parsed = parseDDMMYYYY(trimmed);
    if (!parsed) {
      return;
    }

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
      selected={selected}
      onChange={(date) => {
        onChange?.(formatToISO(date));
        // Update internal value when date is selected from calendar
        if (date && date instanceof Date && !isNaN(date.getTime())) {
          setInternalValue(formatDisplayDate(date));
        } else if (date === null) {
          setInternalValue("");
        }
      }}
      onSelect={(date) => {
        // This fires immediately when a date is selected from calendar
        if (date && date instanceof Date && !isNaN(date.getTime())) {
          const isoDate = formatToISO(date);
          onChange?.(isoDate);
          setInternalValue(formatDisplayDate(date));
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
        const inputValue = e.target?.value;
        
        // Safety check
        if (!e.target || inputValue === undefined || inputValue === null) {
          return;
        }
        
        // Check if value is already in dd/MM/yyyy format (from calendar selection)
        if (inputValue && typeof inputValue === 'string' && inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          // Already formatted from calendar, just update internal value
          setInternalValue(inputValue);
          const parsedDate = parseDDMMYYYY(inputValue);
          if (parsedDate) {
            const isoDate = formatToISO(parsedDate);
            onChange?.(isoDate);
          }
          return;
        }
        
        // Manual typing - format it
        const formatted = formatDateInput(inputValue);
        
        // Update the input value with formatted version
        if (inputValue !== formatted) {
          const cursorPos = e.target.selectionStart || 0;
          e.target.value = formatted;
          const lengthDiff = formatted.length - (inputValue?.length || 0);
          const newCursorPos = Math.max(0, Math.min(cursorPos + lengthDiff, formatted.length));
          e.target.setSelectionRange(newCursorPos, newCursorPos);
        }
        
        // Update internal value for manual typing
        setInternalValue(formatted);
        
        // Parse and update the actual date value
        const parsedDate = parseDDMMYYYY(formatted);
        if (parsedDate) {
          const isoDate = formatToISO(parsedDate);
          onChange?.(isoDate);
        } else if (formatted === "") {
          onChange?.("");
        }
      }}
      customInput={
        <CalendarInput
          id={id}
          placeholder={placeholder}
          isInvalid={isInvalid}
          errorMessage={labelOutside ? undefined : errorMessage}
          label={labelOutside ? undefined : label}
          onClear={() => {
            onChange?.("");
            setInternalValue("");
          }}
          isDisabled={disabled}
          className={className}
          inputWrapperClassName={inputWrapperClassName}
          inputClassName={inputClassName}
          displayValue={internalValue}
          onManualValueChange={handleManualValueChange}
          onManualBlur={handleManualBlur}
          onManualKeyDown={handleManualKeyDown}
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
      {errorMessage && (
        <p className="text-xs text-danger mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default VietnameseDateInput;


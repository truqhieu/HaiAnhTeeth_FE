import {
  forwardRef,
  ReactNode,
  FocusEvent,
  KeyboardEvent,
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
  ) => (
    <Input
      id={id}
      ref={ref}
      value={displayValue ?? value ?? ""}
      placeholder={placeholder}
      onClick={isDisabled ? undefined : onClick}
      variant="bordered"
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      label={label}
      classNames={{
        base: className || "w-full",
        inputWrapper: `cursor-pointer ${inputWrapperClassName || ""}`,
        input: inputClassName,
      }}
      startContent={<CalendarIcon className="w-5 h-5 text-gray-400" />}
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
  )
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
  placeholder = "DD/MM/YYYY",
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
    setInternalValue(nextValue);
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
      }}
      dateFormat="dd/MM/yyyy"
      locale="vi"
      minDate={toDate(minDate)}
      maxDate={toDate(maxDate)}
      calendarStartDay={1}
      customInput={
        <CalendarInput
          id={id}
          placeholder={placeholder}
          isInvalid={isInvalid}
          errorMessage={labelOutside ? undefined : errorMessage}
          label={labelOutside ? undefined : label}
          onClear={() => onChange?.("")}
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


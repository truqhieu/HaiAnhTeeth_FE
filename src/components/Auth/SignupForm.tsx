import React, { forwardRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import {
  Input,
  Button,
  Form,
  Select,
  SelectItem,
} from "@heroui/react";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import viLocale from "@/utils/viLocale";
import { authApi } from "@/api";

registerLocale("vi", viLocale as any);
setDefaultLocale("vi");

const SIGNUP_DATE_PICKER_PORTAL_ID = "signup-date-picker-portal";

const ensureSignupDatePickerPortal = () => {
  if (typeof document === "undefined") return;
  if (!document.getElementById(SIGNUP_DATE_PICKER_PORTAL_ID)) {
    const portalRoot = document.createElement("div");
    portalRoot.id = SIGNUP_DATE_PICKER_PORTAL_ID;
    portalRoot.style.position = "relative";
    portalRoot.style.zIndex = "9999";
    document.body.appendChild(portalRoot);
  }
};

const formatDateToISO = (date: Date | null) => {
  if (!date) return "";
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().split("T")[0];
};

const parseDateValue = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Format date to dd/mm/yyyy for display
const formatDateToDisplay = (date: Date | null) => {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
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

// Parse dd/mm/yyyy format from user input
const parseDateFromInput = (input: string): Date | null => {
  if (!input || input.trim() === "") return null;
  
  // Remove any extra spaces
  const cleaned = input.trim();
  
  // Match dd/mm/yyyy or d/m/yyyy formats
  const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleaned.match(datePattern);
  
  if (!match) return null;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
  const year = parseInt(match[3], 10);
  
  // Validate date
  const date = new Date(year, month, day);
  
  // Check if the date is valid and matches the input
  if (
    date.getDate() === day &&
    date.getMonth() === month &&
    date.getFullYear() === year &&
    date.getTime() <= new Date().getTime() // Not in the future
  ) {
    return date;
  }
  
  return null;
};

interface BirthdateInputProps {
  value?: string;
  onClick?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: React.ReactNode;
  onClear?: () => void;
}

const BirthdateInput = forwardRef<HTMLInputElement, BirthdateInputProps>(
  ({ value, onClick, onChange, placeholder, isInvalid, errorMessage, onClear }, ref) => {
    // React-datepicker passes the formatted value here - use it directly
    const displayValue = value !== undefined && value !== null ? String(value) : "";
    const hasValue = displayValue && displayValue.trim().length > 0;
    
    
    const handleClick = () => {
      // Call react-datepicker's onClick to open calendar
      if (onClick) {
        onClick();
      }
    };
    
    const handleButtonClick = () => {
      // Call react-datepicker's onClick to open calendar
      if (onClick) {
        onClick();
      }
    };
    
    const handleFocus = () => {
      // Call react-datepicker's onClick to open calendar on focus
      if (onClick) {
        onClick();
      }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        // Simply pass through to react-datepicker's onChange
        // React-datepicker will handle the value updates
        // Formatting for manual typing is handled in onChangeRaw
        onChange(e);
      }
    };
    
    return (
      <Input
        ref={ref}
        value={displayValue}
        placeholder={placeholder || "dd/mm/yyyy"}
        onClick={handleClick}
        onChange={handleChange}
        onFocus={handleFocus}
        label={
          <>
            Ngày sinh <span className="text-red-500">*</span>
          </>
        }
        labelPlacement="inside"
        variant="bordered"
        isInvalid={isInvalid}
        errorMessage={errorMessage}
        classNames={{
          label: "text-base text-gray-700",
          input: "bg-white cursor-pointer",
          inputWrapper: "bg-gray-100 cursor-pointer",
        }}
        size="lg"
        startContent={
          <button
            type="button"
            onClick={handleButtonClick}
            className="cursor-pointer"
            tabIndex={-1}
          >
            <CalendarIcon className="w-5 h-5 text-gray-400" />
          </button>
        }
        endContent={
          hasValue ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClear?.();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          ) : null
        }
      />
    );
  },
);

BirthdateInput.displayName = "BirthdateInput";

const SignupForm = () => {
  const navigate = useNavigate();

  // --- States ---
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [birthdate, setBirthdate] = React.useState<string>("");
  const [birthdateDisplay, setBirthdateDisplay] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitted, setSubmitted] = React.useState<any>(null);
  const [showValidation, setShowValidation] = React.useState(false);
  const datePickerRef = React.useRef<any>(null);

  useEffect(() => {
    ensureSignupDatePickerPortal();
    
    // Add global click listener to close calendar when a date is selected
    const handleGlobalClick = (e: MouseEvent) => {
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
    
    // Add listener to document
    document.addEventListener('click', handleGlobalClick);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // Sync display value when birthdate changes (from calendar selection)
  useEffect(() => {
    if (birthdate) {
      const formatted = formatDateToDisplay(parseDateValue(birthdate));
      if (formatted && formatted !== birthdateDisplay) {
        setBirthdateDisplay(formatted);
      }
    } else if (!birthdate && birthdateDisplay) {
      // Clear display when birthdate is cleared
      setBirthdateDisplay("");
    }
  }, [birthdate]);

  // --- Validation ---
  const validateEmail = (value: string): boolean =>
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);

  const getPasswordErrors = (): string[] => {
    const errors: string[] = [];

    if (password.length < 4) errors.push("Mật khẩu phải có ít nhất 4 ký tự.");
    if (!/[A-Z]/.test(password)) errors.push("Phải có ít nhất 1 chữ hoa.");
    if (!/[^a-zA-Z0-9]/.test(password))
      errors.push("Phải có ít nhất 1 ký tự đặc biệt.");

    return errors;
  };

  const isNameInvalid = showValidation && !name;
  const isEmailInvalid = showValidation && (!email || !validateEmail(email));
  const isGenderInvalid = showValidation && !gender;
  const isBirthdateInvalid = showValidation && !birthdate;
  const isPasswordInvalid =
    showValidation && (!password || getPasswordErrors().length > 0);
  const isConfirmPasswordInvalid =
    showValidation && (!confirmPassword || confirmPassword !== password);

  // --- Submit handler ---
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowValidation(true);
    setError("");

    const hasErrors =
      !name ||
      !email ||
      !validateEmail(email) ||
      !gender ||
      !birthdate ||
      !password ||
      getPasswordErrors().length > 0 ||
      !confirmPassword ||
      confirmPassword !== password;

    if (hasErrors) return;

    setIsLoading(true);
    try {
      const formattedBirthdate = birthdate
        ? new Date(birthdate).toISOString()
        : "";

      const genderMap: Record<string, string> = { Nam: "Male", Nữ: "Female" };

      // Normalize text: trim và chỉ giữ 1 khoảng trắng giữa các từ
      const normalizeText = (text: string): string => {
        return text.trim().replace(/\s+/g, ' ');
      };

      const response = await authApi.register({
        fullName: normalizeText(name),
        email: email.trim(),
        gender: genderMap[gender] || gender,
        dateOfBirth: formattedBirthdate,
        password,
      });

      if (response.success) {
        setSubmitted({ name, email });
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.message || "Đăng ký thất bại");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối đến máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  // Render content chung
  const renderFormContent = () => (
    <>
      {/* Header */}
      <div className="flex flex-col items-center mb-6 md:mb-8">
        <img
          alt="Logo"
          className="h-16 md:h-20 w-auto mb-3 md:mb-4 object-contain"
          src="/logo1.png"
        />
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800">Đăng ký</h2>
        <p className="text-gray-500 text-base md:text-lg mt-2 text-center">
          Tạo tài khoản mới để sử dụng hệ thống nha khoa
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 p-4 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <Form autoComplete="off" className="space-y-5" onSubmit={onSubmit}>
        <Input
          fullWidth
          autoComplete="off"
          errorMessage={isNameInvalid ? "Vui lòng nhập họ và tên" : ""}
          isInvalid={isNameInvalid}
          label={
            <>
              Họ và tên <span className="text-red-500">*</span>
            </>
          }
          placeholder="Nhập họ và tên của bạn"
          size="lg"
          value={name}
          onValueChange={setName}
        />

        <Input
          fullWidth
          autoComplete="off"
          errorMessage={
            isEmailInvalid
              ? email === ""
                ? "Vui lòng nhập email"
                : "Vui lòng nhập email hợp lệ"
              : ""
          }
          isInvalid={isEmailInvalid}
          label={
            <>
              Email <span className="text-red-500">*</span>
            </>
          }
          placeholder="Nhập email của bạn"
          size="lg"
          type="email"
          value={email}
          onValueChange={setEmail}
        />

        <Select
          fullWidth
          className="text-base"
          errorMessage={isGenderInvalid ? "Vui lòng chọn giới tính" : ""}
          isInvalid={isGenderInvalid}
          label={
            <>
              Giới tính <span className="text-red-500">*</span>
            </>
          }
          placeholder="Chọn giới tính"
          selectedKeys={gender ? [gender] : []}
          size="lg"
          onSelectionChange={(keys) => setGender(Array.from(keys)[0] as string)}
        >
          <SelectItem key="Nam">Nam</SelectItem>
          <SelectItem key="Nữ">Nữ</SelectItem>
        </Select>

        <div className="w-full">
          <DatePicker
            ref={datePickerRef}
            selected={parseDateValue(birthdate)}
            onChange={(date) => {
              // Handle calendar selection - this is called when user clicks a date in calendar
              if (date && date instanceof Date && !isNaN(date.getTime())) {
                const isoDate = formatDateToISO(date);
                const displayDate = formatDateToDisplay(date);
                setBirthdate(isoDate);
                setBirthdateDisplay(displayDate);
              } else if (date === null) {
                // Clear when date is cleared
                setBirthdate("");
                setBirthdateDisplay("");
              }
            }}
            strictParsing={false}
            dateFormat="dd/MM/yyyy"
            locale="vi"
            calendarStartDay={1}
            maxDate={new Date()}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            allowSameDay
            showPopperArrow={false}
            popperPlacement="bottom-start"
            popperClassName="z-[9999]"
            popperProps={{
              strategy: "fixed",
            }}
            portalId={SIGNUP_DATE_PICKER_PORTAL_ID}
            wrapperClassName="w-full"
            onChangeRaw={(e) => {
              // Handle manual typing - format as user types
              // Only format if it's not already in the correct format (to avoid interfering with calendar selection)
              if (!e || !e.target) {
                return;
              }
              
              const inputValue = (e.target as HTMLInputElement).value;
              
              // Safety check
              if (inputValue === undefined || inputValue === null) {
                return;
              }
              
              // Check if value is already in dd/MM/yyyy format (from calendar selection)
              if (inputValue && typeof inputValue === 'string' && inputValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                // Already formatted from calendar, just update display
                setBirthdateDisplay(inputValue);
                const parsedDate = parseDateFromInput(inputValue);
                if (parsedDate) {
                  setBirthdate(formatDateToISO(parsedDate));
                }
                return;
              }
              
              // Manual typing - format it
              const formatted = formatDateInput(inputValue);
              
              // Update the input value with formatted version
              if (inputValue !== formatted) {
                const inputElement = e.target as HTMLInputElement;
                const cursorPos = inputElement.selectionStart || 0;
                inputElement.value = formatted;
                const lengthDiff = formatted.length - (inputValue?.length || 0);
                const newCursorPos = Math.max(0, Math.min(cursorPos + lengthDiff, formatted.length));
                inputElement.setSelectionRange(newCursorPos, newCursorPos);
              }
              
              // Update state for manual typing
              setBirthdateDisplay(formatted);
              
              // Parse and update the actual date value
              const parsedDate = parseDateFromInput(formatted);
              if (parsedDate) {
                setBirthdate(formatDateToISO(parsedDate));
              } else if (formatted === "") {
                setBirthdate("");
              }
            }}
            customInput={
              <BirthdateInput
                placeholder="dd/mm/yyyy"
                isInvalid={isBirthdateInvalid}
                errorMessage={
                  isBirthdateInvalid ? "Vui lòng nhập ngày sinh (dd/mm/yyyy)" : undefined
                }
                onClear={() => {
                  setBirthdate("");
                  setBirthdateDisplay("");
                }}
              />
            }
          />
        </div>

        <Input
          fullWidth
          autoComplete="new-password"
          errorMessage={
            isPasswordInvalid
              ? getPasswordErrors().map((e, i) => <div key={i}>{e}</div>)
              : ""
          }
          isInvalid={isPasswordInvalid}
          label={
            <>
              Mật khẩu <span className="text-red-500">*</span>
            </>
          }
          placeholder="Nhập mật khẩu"
          size="lg"
          type="password"
          value={password}
          onValueChange={setPassword}
        />

        <Input
          fullWidth
          autoComplete="new-password"
          errorMessage={
            isConfirmPasswordInvalid
              ? !confirmPassword
                ? "Vui lòng xác nhận mật khẩu"
                : "Mật khẩu không khớp."
              : ""
          }
          isInvalid={isConfirmPasswordInvalid}
          label={
            <>
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </>
          }
          placeholder="Nhập lại mật khẩu"
          size="lg"
          type="password"
          value={confirmPassword}
          onValueChange={setConfirmPassword}
        />

        <Button
          className="w-full py-4 text-lg font-semibold text-white bg-[#39BDCC] hover:bg-[#2ca6b5] transition-all duration-300 rounded-xl shadow-md hover:shadow-lg"
          isDisabled={isLoading}
          isLoading={isLoading}
          type="submit"
        >
          {!isLoading && <UserIcon className="w-6 h-6 mr-2" />}
          {isLoading ? "Đang đăng ký..." : "Đăng ký"}
        </Button>
      </Form>

      {submitted && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg text-sm text-green-700">
          ✅ Đăng ký thành công!
          <br />
          Kiểm tra email <strong>{submitted.email}</strong> để kích hoạt tài
          khoản.
        </div>
      )}

      {/* Back to Home */}
      <div className="mt-6 flex flex-col items-center space-y-2">
        <div className="mt-8 flex justify-center">
          <Button
            color="default"
            variant="flat"
            size="lg"
            onPress={() => navigate("/")}
            className="flex items-center gap-2 font-semibold text-gray-700 hover:text-[#39BDCC] transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Trở về trang chủ
          </Button>
        </div>

        <p className="text-sm md:text-base text-gray-600">
          Đã có tài khoản?{" "}
          <button
            className="text-[#39BDCC] hover:underline font-semibold"
            onClick={() => navigate("/login")}
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </>
  );

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#b3f0f5] via-[#d9fafa] to-[#e0fdfd] p-4">
      <div className="bg-white shadow-2xl rounded-3xl px-8 py-8 md:px-10 md:py-10 w-full max-w-lg relative">
        {renderFormContent()}
      </div>
    </div>
  );
};

export default SignupForm;

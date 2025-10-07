import React from "react";
import { UserIcon } from "@heroicons/react/24/solid";
import { DatePicker, Input, Button, Form } from "@heroui/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/dropdown";

const Signup = () => {
  const [value, setValue] = React.useState<string>("");

  // Xác thực email
  const validateEmail = (value: string): boolean =>
    value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;

  const isInvalid = React.useMemo(() => {
    if (value === "") return false;

    return validateEmail(value) ? false : true;
  }, [value]);

  const [gender, setGender] = React.useState("Giới tính");

  // Xác thực mật khẩu
  const [submitted, setSubmitted] = React.useState<any>(null);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const errors: string[] = [];

  if (password.length < 4) {
    errors.push("Mật khẩu phải có ít nhất 4 ký tự.");
  }
  if ((password.match(/[A-Z]/g) || []).length < 1) {
    errors.push("Mật khẩu phải có ít nhất 1 chữ cái viết hoa.");
  }
  if ((password.match(/[^a-z0-9]/gi) || []).length < 1) {
    errors.push("Mật khẩu phải có ít nhất 1 ký tự đặc biệt.");
  }
  if (confirmPassword && password !== confirmPassword) {
    errors.push("Mật khẩu không khớp.");
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));

    setSubmitted(data);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng ký</h2>

        <Form className="space-y-4" onSubmit={onSubmit}>
          <Input fullWidth label="Họ và tên" name="name" type="text" />

          <Input
            fullWidth
            color={isInvalid ? "danger" : "success"}
            errorMessage="Vui lòng nhập email hợp lệ"
            isInvalid={isInvalid}
            label="Email"
            name="email"
            type="email"
            value={value}
            variant="bordered"
            onValueChange={setValue}
          />

          <Dropdown>
            <DropdownTrigger>
              <Button className="w-full" variant="bordered">
                {gender}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Chọn giới tính"
              onAction={(key) => setGender(String(key))}
            >
              <DropdownItem key="Nam">Nam</DropdownItem>
              <DropdownItem key="Nữ">Nữ</DropdownItem>
              <DropdownItem key="Khác">Khác</DropdownItem>
              <DropdownSection>
                <DropdownItem key="Không muốn tiết lộ">
                  Không muốn tiết lộ
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>

          <DatePicker fullWidth label="Ngày sinh" name="birthdate" />

          <Input
            fullWidth
            errorMessage={() => (
              <ul>
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            )}
            isInvalid={errors.length > 0}
            label="Mật khẩu"
            labelPlacement="outside"
            name="password"
            placeholder="Nhập mật khẩu"
            type="password"
            value={password}
            onValueChange={setPassword}
          />

          <Input
            fullWidth
            errorMessage={
              confirmPassword.length > 0 && password !== confirmPassword
                ? "Mật khẩu không khớp."
                : ""
            }
            isInvalid={
              confirmPassword.length > 0 && password !== confirmPassword
            }
            label="Xác nhận mật khẩu"
            labelPlacement="outside"
            name="confirm-password"
            placeholder="Nhập lại mật khẩu"
            type="password"
            value={confirmPassword}
            onValueChange={setConfirmPassword}
          />

          <Button
            className="w-full flex items-center justify-center text-white bg-[#39BDCC] hover:bg-[#2ca6b5]"
            type="submit"
            variant="solid"
          >
            <UserIcon className="w-5 h-5 mr-2" />
            Đăng ký
          </Button>
        </Form>

        {submitted && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Bạn đã gửi: <code>{JSON.stringify(submitted)}</code>
          </div>
        )}

        <p className="mt-4 text-center text-sm">
          Bạn đã có tài khoản?{" "}
          <a className="text-blue-500 hover:underline" href="/login">
            Đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;

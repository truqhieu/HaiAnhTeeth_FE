import React from "react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { Input, Button, Form } from "@heroui/react";

const Login = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const validateEmail = (value: string): boolean =>
    value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;

  const isInvalidEmail = React.useMemo(() => {
    if (email === "") return false;
    return validateEmail(email) ? false : true;
  }, [email]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = { email, password };
    console.log("Đăng nhập đã gửi:", data);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>

        <Form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onValueChange={setEmail}
            isInvalid={isInvalidEmail}
            errorMessage={isInvalidEmail ? "Vui lòng nhập email hợp lệ" : ""}
            fullWidth
          />

          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            onValueChange={setPassword}
            fullWidth
          />

          <Button
            type="submit"
            variant="solid"
            className="w-full flex items-center justify-center text-white bg-[#39BDCC] hover:bg-[#2ca6b5]"
          >
            <LockClosedIcon className="w-5 h-5 mr-2" />
            Đăng nhập
          </Button>
        </Form>

        <p className="mt-4 text-center text-sm">
          Bạn chưa có tài khoản?{" "}
          <a href="/signup" className="text-blue-500 hover:underline">
            Đăng ký
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
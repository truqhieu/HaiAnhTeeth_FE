import React from "react";
import { UserIcon } from "@heroicons/react/24/solid";
import { DatePicker } from "@heroui/react";
import { Input } from "@heroui/react";
const Signup = () => {
  const [value, setValue] = React.useState<string>("");

const validateEmail = (value: string): boolean =>
  value.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;

const isInvalid = React.useMemo(() => {
  if (value === "") return false;

  return validateEmail(value) ? false : true;
}, [value]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
        <form className="space-y-4">
          <div>
            <Input label="Name" type="text" />
          </div>
          <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
            <Input
            className="max-w-xs"
            color={isInvalid ? "danger" : "success"}
            errorMessage="Please enter a valid email"
            isInvalid={isInvalid}
            label="Email"
            type="email"
            value={value}
            variant="bordered"
            onValueChange={setValue}
          />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <DatePicker className="max-w-[284px]" label="Birth date" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-2"
              htmlFor="confirm-password"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Re-enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            <UserIcon className="w-5 h-5 mr-2" />
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
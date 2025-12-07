import { useNavigate } from "react-router-dom";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <ShieldExclamationIcon className="mx-auto h-24 w-24 text-red-500 mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Không có quyền truy cập
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Bạn không có quyền truy cập trang này.
        </p>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg"
          size="lg"
          onPress={() => navigate("/")}
        >
          Về trang chủ
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;

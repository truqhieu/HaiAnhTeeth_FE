import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "@/components/Auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role && user.role.toLowerCase() !== "patient") {
      const role = user.role.toLowerCase();
      if (role === "admin") navigate("/admin/accounts");
      else if (role === "manager") navigate("/manager/dashboard");
      else if (role === "staff") navigate("/staff/dashboard");
      else if (role === "doctor") navigate("/doctor/schedule");
      else if (role === "nurse") navigate("/nurse/schedule");
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <LoginModal />
    </div>
  );
}

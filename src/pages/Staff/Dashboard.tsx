import React from "react";
import AllAppointments from "./AllAppointments";

const StaffDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Staff Dashboard</h1>
      <AllAppointments />
    </div>
  );
};

export default StaffDashboard;
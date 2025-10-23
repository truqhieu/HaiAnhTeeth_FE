import React from "react";
import TodayAppointments from "./TodayAppointments";
import PendingAppointments from "./PendingAppointments";

const StaffDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Staff Dashboard</h1>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <TodayAppointments />
        </div>
        <div>
          <PendingAppointments />
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

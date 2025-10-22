import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Service interface for Manager
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: string;
  status: "active" | "inactive";
}

// Room/Clinic interface for Manager
export interface Room {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  assignedDoctorId?: string | null;
  assignedDoctorName?: string;
}
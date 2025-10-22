import { authenticatedApiCall, ApiResponse } from './index';

export interface AppointmentCreationData {
  fullName: string;
  email: string;
  phoneNumber: string;
  appointmentFor: 'self' | 'other';
  serviceId: string;
  doctorUserId: string;
  doctorScheduleId: string;
  selectedSlot: { startTime: string; endTime: string };
  notes?: string;
}

// The actual response data from the backend controller
export interface AppointmentResponseData {
  appointmentId: string;
  service: string;
  doctor: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  mode: string;
  requirePayment: boolean;
  payment?: {
    paymentId: string;
    amount: number;
    method: string;
    status: string;
    expiresAt: string;
    QRurl: string;
  };
}

export const appointmentApi = {
  create: async (data: AppointmentCreationData): Promise<ApiResponse<AppointmentResponseData>> => {
    return authenticatedApiCall('/appointments/consultation/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
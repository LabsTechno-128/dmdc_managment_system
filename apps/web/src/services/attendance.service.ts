import { api } from '../lib/api';

export interface Attendance {
  id: string;
  employeeId: string;
  employee?: any;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  workingMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  notes?: string;
  markedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  status?: string;
  department?: string;
  designation?: string;
}

export const attendanceService = {
  getAttendance: async (params: AttendanceQueryParams) => {
    const response = await api.get('/attendance', { params });
    return {
      data: response.data,
      meta: (response as any).meta,
    };
  },
  getTodayAttendance: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  },
  getDailyReport: async (date?: string) => {
    const response = await api.get('/attendance/report/daily', { params: { date } });
    return response.data;
  },
  getMonthlyReport: async (employeeId: string, year: number, month: number) => {
    const response = await api.get('/attendance/report/monthly', {
      params: { employeeId, year, month },
    });
    return response.data;
  },
  getEmployeeAttendance: async (employeeId: string, params: AttendanceQueryParams) => {
    const response = await api.get(`/attendance/employee/${employeeId}`, { params });
    return {
      data: response.data,
      meta: (response as any).meta,
    };
  },
  checkIn: async (data: { employeeId: string; checkInTime?: string; notes?: string }) => {
    const response = await api.post('/attendance/check-in', data);
    return response.data;
  },
  checkOut: async (data: { employeeId: string; checkOutTime?: string; notes?: string }) => {
    const response = await api.post('/attendance/check-out', data);
    return response.data;
  },
  markAttendance: async (data: {
    employeeId: string;
    date: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
  }) => {
    const response = await api.post('/attendance/mark', data);
    return response.data;
  },
};

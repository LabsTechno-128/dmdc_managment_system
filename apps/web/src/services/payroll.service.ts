import { api } from '../lib/api';

export interface Payroll {
  id: string;
  employeeId: string;
  employee: any;
  month: number;
  year: number;
  monthlySalary: number;
  dailyRate: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  fridayOffDays: number;
  deductibleDays: number;
  totalDeduction: number;
  netSalary: number;
  status: string;
  generatedAt: string;
}

export interface PayrollQueryParams {
  page?: number;
  limit?: number;
  month?: string;
  year?: string;
  employeeId?: string;
  department?: string;
}

export const payrollService = {
  getPayrolls: async (params: PayrollQueryParams) => {
    const response = await api.get('/payroll', { params });
    return {
      data: response.data,
      meta: (response as any).meta,
    };
  },
  getPayrollDetail: async (employeeId: string, year: number, month: number) => {
    const response = await api.get(`/payroll/${employeeId}/${year}/${month}`);
    return response.data;
  },
  getMonthlyReport: async (year: number, month: number) => {
    const response = await api.get('/payroll/report/monthly', { params: { year, month } });
    return response.data;
  },
  generatePayroll: async (data: { year: number; month: number; employeeId?: string }) => {
    const response = await api.post('/payroll/generate', data);
    return response.data;
  },
  exportExcel: async (year: number, month: number, department?: string) => {
    const response = await api.get('/payroll/export/excel', {
      params: { year, month, department },
      responseType: 'blob',
    });
    return response.data;
  },
};

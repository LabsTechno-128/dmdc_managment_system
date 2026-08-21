import { api } from '../lib/api';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  designation?: string;
  department?: string;
  monthlySalary: number;
  joiningDate: string;
  isActive: boolean;
  user?: any;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
  department?: string;
  designation?: string;
}

export const employeeService = {
  getEmployees: async (params: EmployeeQueryParams) => {
    const response = await api.get('/employees', { params });
    return {
      data: response.data,
      meta: (response as any).meta,
    };
  },
  getEmployee: async (id: string) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },
  createEmployee: async (data: any) => {
    const response = await api.post('/employees', data);
    return response.data;
  },
  updateEmployee: async (id: string, data: any) => {
    const response = await api.patch(`/employees/${id}`, data);
    return response.data;
  },
  updateEmployeeStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/employees/${id}/status`, { isActive });
    return response.data;
  },
  deleteEmployee: async (id: string) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },
};

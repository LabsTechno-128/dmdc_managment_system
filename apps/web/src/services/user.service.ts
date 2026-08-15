import { api } from '../lib/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: string;
}

export const userService = {
  getUsers: async (params: UserQueryParams) => {
    const response = await api.get('/users', { params });
    return {
      data: response.data,
      meta: (response as any).meta,
    };
  },
  createUser: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
  updateUserRole: async (id: string, role: string) => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },
  updateUserStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return response.data;
  },
  updateUserPassword: async (id: string, password: string) => {
    const response = await api.patch(`/users/${id}/password`, { password });
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

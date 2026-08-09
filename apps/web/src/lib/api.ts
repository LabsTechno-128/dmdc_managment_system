import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.thinkhive.net/api',
});
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const res = response.data;

    if (res.success !== undefined && !res.success) {
      return Promise.reject(res);
    }

    // Return only the useful part
    return {
      ...response,
      data: res.data !== undefined ? res.data : res,
      meta: res.meta,
      message: res.message,
    };
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }

    return Promise.reject({
      success: false,
      message: error.message,
      error,
    });
  }
);
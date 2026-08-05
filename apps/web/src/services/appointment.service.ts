import { api } from '../lib/api';
import type {
    Appointment,
    CreateAppointmentRequest,
    UpdateAppointmentRequest,
    AppointmentQueryParams,
} from '../types/appointment';

export const appointmentService = {
    getAppointments: async (params?: AppointmentQueryParams) => {
        const { data } = await api.get('/appointments', { params });
        return data;
    },

    getAppointmentById: async (id: string): Promise<Appointment> => {
        const { data } = await api.get(`/appointments/${id}`);
        return data as Appointment;
    },

    createAppointment: async (data: CreateAppointmentRequest): Promise<Appointment> => {
        const response = await api.post('/appointments', data);
        return response as unknown as Appointment;
    },

    updateAppointment: async (id: string, data: UpdateAppointmentRequest): Promise<Appointment> => {
        const response = await api.patch(`/appointments/${id}`, data);
        return response as unknown as Appointment;
    },

    deleteAppointment: async (id: string): Promise<void> => {
        await api.delete(`/appointments/${id}`);
    },

    getDoctorAppointments: async (doctorId: string): Promise<Appointment[]> => {
        const { data } = await api.get(`/appointments/doctor/${doctorId}`);
        return data as Appointment[];
    },

    getPatientAppointments: async (patientId: string): Promise<Appointment[]> => {
        const { data } = await api.get(`/appointments/patient/${patientId}`);
        return data as Appointment[];
    },

    getTodayAppointments: async (): Promise<Appointment[]> => {
        const { data } = await api.get('/appointments/today');
        return data as Appointment[];
    },

    getUpcomingAppointments: async (): Promise<Appointment[]> => {
        const { data } = await api.get('/appointments/upcoming');
        return data as Appointment[];
    },
};
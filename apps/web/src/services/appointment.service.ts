import { api } from '../lib/api';
import type {
    Appointment,
    CreateAppointmentRequest,
    UpdateAppointmentRequest,
    AppointmentQueryParams,
} from '../types/appointment';

export const appointmentService = {
    getAppointments: async (params?: AppointmentQueryParams) => {
        const response = await api.get('/appointments', { params });
        return {
            data: response.data,
            meta: (response as any).meta,
        };
    },

    getAppointmentById: async (id: string): Promise<Appointment> => {
        const { data } = await api.get(`/appointments/${id}`);
        return data as Appointment;
    },

    createAppointment: async (data: CreateAppointmentRequest): Promise<Appointment> => {
        const { data: responseData } = await api.post('/appointments', data);
        return responseData as Appointment;
    },

    updateAppointment: async (id: string, data: UpdateAppointmentRequest): Promise<Appointment> => {
        const { data: responseData } = await api.patch(`/appointments/${id}`, data);
        return responseData as Appointment;
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
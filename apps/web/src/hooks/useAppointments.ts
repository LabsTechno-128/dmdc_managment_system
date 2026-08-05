import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../services/appointment.service';
import type {
    CreateAppointmentRequest,
    UpdateAppointmentRequest,
    AppointmentQueryParams,
} from '../types/appointment';

export const appointmentKeys = {
    all: ['appointments'] as const,
    lists: () => [...appointmentKeys.all, 'list'] as const,
    list: (params: AppointmentQueryParams) => [...appointmentKeys.lists(), params] as const,
    details: () => [...appointmentKeys.all, 'detail'] as const,
    detail: (id: string) => [...appointmentKeys.details(), id] as const,
    doctor: (doctorId: string) => [...appointmentKeys.all, 'doctor', doctorId] as const,
    patient: (patientId: string) => [...appointmentKeys.all, 'patient', patientId] as const,
    today: () => [...appointmentKeys.all, 'today'] as const,
    upcoming: () => [...appointmentKeys.all, 'upcoming'] as const,
};

export function useAppointments(params?: AppointmentQueryParams) {
    return useQuery({
        queryKey: appointmentKeys.list(params ?? {}),
        queryFn: () => appointmentService.getAppointments(params),
    });
}

export function useAppointment(id: string) {
    return useQuery({
        queryKey: appointmentKeys.detail(id),
        queryFn: () => appointmentService.getAppointmentById(id),
        enabled: !!id,
    });
}

export function useCreateAppointment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAppointmentRequest) => appointmentService.createAppointment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: appointmentKeys.today() });
            queryClient.invalidateQueries({ queryKey: appointmentKeys.upcoming() });
        },
    });
}

export function useUpdateAppointment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentRequest }) =>
            appointmentService.updateAppointment(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: appointmentKeys.today() });
            queryClient.invalidateQueries({ queryKey: appointmentKeys.upcoming() });
        },
    });
}

export function useDeleteAppointment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => appointmentService.deleteAppointment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
            queryClient.invalidateQueries({ queryKey: appointmentKeys.today() });
            queryClient.invalidateQueries({ queryKey: appointmentKeys.upcoming() });
        },
    });
}

export function useDoctorAppointments(doctorId: string) {
    return useQuery({
        queryKey: appointmentKeys.doctor(doctorId),
        queryFn: () => appointmentService.getDoctorAppointments(doctorId),
        enabled: !!doctorId,
    });
}

export function usePatientAppointments(patientId: string) {
    return useQuery({
        queryKey: appointmentKeys.patient(patientId),
        queryFn: () => appointmentService.getPatientAppointments(patientId),
        enabled: !!patientId,
    });
}

export function useTodayAppointments() {
    return useQuery({
        queryKey: appointmentKeys.today(),
        queryFn: () => appointmentService.getTodayAppointments(),
    });
}

export function useUpcomingAppointments() {
    return useQuery({
        queryKey: appointmentKeys.upcoming(),
        queryFn: () => appointmentService.getUpcomingAppointments(),
    });
}
export const AppointmentStatus = {
    Pending: 'Pending',
    Confirmed: 'Confirmed',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
    NoShow: 'NoShow',
} as const;

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AppointmentType = {
    New: 'New',
    FollowUp: 'FollowUp',
    Emergency: 'Emergency',
} as const;

export type AppointmentType = (typeof AppointmentType)[keyof typeof AppointmentType];

export const AppointmentBookingType = {
    LIVE: 'LIVE',
    FUTURE: 'FUTURE',
} as const;

export type AppointmentBookingType = (typeof AppointmentBookingType)[keyof typeof AppointmentBookingType];

export interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
    availability?: string;
}

export interface Patient {
    id: string;
    patientId?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    email?: string;
    age?: number;
    gender?: string;
    weight?: number;
    bloodPresure?: string;

}

export interface Appointment {
    id: string;
    doctorId: string;
    patientId: string;
    doctor?: Doctor;
    patient?: Patient;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: AppointmentType;
    bookingType: AppointmentBookingType;
    status: AppointmentStatus;
    visitReason?: string;
    notes?: string;
    consultationFee: number;
    createdAt: string;
    updatedAt: string;

}

export interface CreateAppointmentRequest {
    doctorId: string;
    bookingType: AppointmentBookingType;
    existingPatientId?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    name?: string;
    age?: number;
    gender?: string;
    weight?: number;
    bloodPresure?: string;
    phone?: string;
    visitReason?: string;
    notes?: string;
}

export interface UpdateAppointmentRequest {
    doctorId?: string;
    patientId?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentType?: AppointmentType;
    status?: AppointmentStatus;
    visitReason?: string;
    notes?: string;
    consultationFee?: number;
}

export interface AppointmentQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: AppointmentStatus;
    appointmentType?: AppointmentType;
    bookingType?: AppointmentBookingType;
    doctorId?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedAppointmentResponse {
    data: Appointment[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
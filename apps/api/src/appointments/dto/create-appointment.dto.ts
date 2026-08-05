import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { AppointmentType, AppointmentStatus } from '@hospital/database';

export class CreateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    doctorId!: string;

    @IsString()
    @IsNotEmpty()
    patientId!: string;

    @IsDateString()
    @IsNotEmpty()
    appointmentDate!: string;

    @IsString()
    @IsNotEmpty()
    appointmentTime!: string;

    @IsEnum(AppointmentType)
    @IsOptional()
    appointmentType?: AppointmentType;

    @IsEnum(AppointmentStatus)
    @IsOptional()
    status?: AppointmentStatus;

    @IsString()
    @IsOptional()
    visitReason?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    consultationFee?: number;
}
import {
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    MinLength,
} from 'class-validator';
import { AppointmentType, AppointmentStatus, Gender, AppointmentBookingType } from '@hospital/database';

export class CreateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    doctorId!: string;

    @IsEnum(AppointmentBookingType)
    @IsOptional()
    bookingType?: AppointmentBookingType;

    @IsString()
    @IsOptional()
    existingPatientId?: string;

    @IsString()
    @IsOptional()
    appointmentDate?: string;

    @IsString()
    @IsOptional()
    appointmentTime?: string;

    @IsString()
    @MinLength(2)
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    age?: number;

    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    @IsNumber()
    @IsOptional()
    weight?: number;

    @IsString()
    @IsOptional()
    bloodPresure?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}
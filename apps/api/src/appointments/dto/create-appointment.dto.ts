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
import { AppointmentType, AppointmentStatus, Gender } from '@hospital/database';

export class CreateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    doctorId!: string;

    @IsString()
    @MinLength(2)
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
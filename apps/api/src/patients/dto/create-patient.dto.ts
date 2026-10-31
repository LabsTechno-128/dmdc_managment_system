import { Gender, PatientType } from '@hospital/database';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePatientDto {

    @IsEnum(PatientType)
    @IsOptional()
    patientType?: PatientType;

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

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    bloodGroup?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    referredBy?: string | null;

    @IsOptional()
    @Transform(({ value }) => (value === '' ? null : value))
    @IsUUID('all', { message: 'Referred by doctor ID must be a valid UUID' })
    referredByDoctorId?: string | null;

}

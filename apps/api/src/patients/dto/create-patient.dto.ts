import { Gender, PatientType } from '@hospital/database';
import { IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

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

}

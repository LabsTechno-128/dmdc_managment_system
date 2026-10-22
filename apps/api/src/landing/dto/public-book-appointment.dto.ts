import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    MinLength,
    Matches,
} from 'class-validator';

export class PublicBookAppointmentDto {
    @IsString()
    @IsNotEmpty({ message: 'Please select a doctor' })
    doctorId!: string;

    @IsString()
    @IsNotEmpty({ message: 'Appointment date is required' })
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Appointment date must be in YYYY-MM-DD format' })
    appointmentDate!: string;

    @IsString()
    @IsNotEmpty({ message: 'Appointment time slot is required' })
    appointmentTime!: string;

    @IsString()
    @MinLength(2, { message: 'Patient name must be at least 2 characters' })
    @IsNotEmpty({ message: 'Patient name is required' })
    name!: string;

    @IsString()
    @MinLength(7, { message: 'Valid phone number is required' })
    @IsNotEmpty({ message: 'Phone number is required' })
    phone!: string;

    @IsNumber({}, { message: 'Age must be a number' })
    @Min(0, { message: 'Age cannot be negative' })
    @IsOptional()
    age?: number;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsString()
    @IsOptional()
    visitReason?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

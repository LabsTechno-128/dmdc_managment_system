import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBillingDto {
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString({ message: 'Test availability note must be a string' })
    @MaxLength(2000, { message: 'Test availability note cannot exceed 2000 characters' })
    testAvailabilityNote?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Referred by cannot exceed 255 characters' })
    referredBy?: string | null;

    @IsOptional()
    @Transform(({ value }) => (value === '' ? null : value))
    @IsUUID('all', { message: 'Referred by doctor ID must be a valid UUID' })
    referredByDoctorId?: string | null;

    @IsOptional()
    @IsString()
    paymentStatus?: string;
}


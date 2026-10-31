import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class BillingItemDto {
    @IsNotEmpty({ message: 'Test ID is required' })
    testId!: string | number;

    @IsOptional()
    @IsInt({ message: 'Price must be a valid integer' })
    @Min(0, { message: 'Price cannot be negative' })
    @Type(() => Number)
    price?: number;

    @IsOptional()
    @IsString()
    name?: string;
}

export class CreateBillingDto {
    @IsNotEmpty({ message: 'Patient ID is required' })
    @IsString()
    patientId!: string;

    @IsArray({ message: 'Billing items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => BillingItemDto)
    items!: BillingItemDto[];

    @IsOptional()
    @IsEnum(['PERCENTAGE', 'FIXED'], { message: 'Discount type must be either PERCENTAGE or FIXED' })
    discountType?: 'PERCENTAGE' | 'FIXED';

    @IsOptional()
    @IsInt({ message: 'Discount must be a valid integer' })
    @Min(0, { message: 'Discount cannot be negative' })
    @Type(() => Number)
    discount?: number;

    @IsOptional()
    @IsInt({ message: 'VAT rate must be a valid integer' })
    @Min(0, { message: 'VAT rate cannot be negative' })
    @Type(() => Number)
    vatRate?: number;

    @IsOptional()
    @IsInt({ message: 'Additional charges must be a valid integer' })
    @Min(0, { message: 'Additional charges cannot be negative' })
    @Type(() => Number)
    additionalCharges?: number;

    @IsOptional()
    @IsInt({ message: 'Paid amount must be a valid integer' })
    @Min(0, { message: 'Paid amount cannot be negative' })
    @Type(() => Number)
    paidAmount?: number;

    @IsOptional()
    @IsBoolean()
    paymentDone?: boolean;

    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @IsOptional()
    @IsString()
    paymentStatus?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Referred by cannot exceed 255 characters' })
    referredBy?: string | null;

    @IsOptional()
    @Transform(({ value }) => (value === '' ? null : value))
    @IsUUID('all', { message: 'Referred by doctor ID must be a valid UUID' })
    referredByDoctorId?: string | null;

    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString({ message: 'Test availability note must be a string' })
    @MaxLength(2000, { message: 'Test availability note cannot exceed 2000 characters' })
    testAvailabilityNote?: string | null;

    @IsOptional()
    musakChallanNumber?: string;

    @IsOptional()
    notes?: string;

    @IsOptional()
    receivedById?: string;
}

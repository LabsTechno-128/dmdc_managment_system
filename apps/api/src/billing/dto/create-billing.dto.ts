import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
    referredBy?: string;

    @IsOptional()
    musakChallanNumber?: string;

    @IsOptional()
    notes?: string;

    @IsOptional()
    receivedById?: string;
}

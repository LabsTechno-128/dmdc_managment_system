import { IsOptional, IsString, IsNumber, Min, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum TestStatus {
    PENDING = 'Pending',
    SAMPLE_COLLECTED = 'Sample Collected',
    IN_PROGRESS = 'In Progress',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
    WAITING = 'Waiting', // Adding Waiting as it is the default in the entity
}

export class PatientTestQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(TestStatus, { message: 'Invalid test status' })
    status?: string;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    paymentStatus?: string;
}

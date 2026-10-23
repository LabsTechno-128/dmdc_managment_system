import { IsEnum, IsOptional, IsString, IsArray, ValidateNested, IsInt, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { SampleStatus } from '@hospital/database';

export class InventoryItemUsageDto {
    @IsString()
    @IsNotEmpty()
    itemId!: string;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    quantity!: number;
}

export class UpdateSampleStatusDto {
    @IsEnum(SampleStatus)
    status!: SampleStatus;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InventoryItemUsageDto)
    items?: InventoryItemUsageDto[];
}

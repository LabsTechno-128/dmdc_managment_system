import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { ExpenseType } from '@hospital/database';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
    @IsEnum(ExpenseType)
    @IsNotEmpty()
    expenseType!: ExpenseType;

    @IsNumber()
    @Min(0.01)
    @Type(() => Number)
    amount!: number;

    @IsNotEmpty()
    @IsString()
    expenseDate!: string;

    @ValidateIf(o => o.expenseType === ExpenseType.OTHER)
    @IsNotEmpty({ message: 'Description is required when expense type is OTHER' })
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    referenceNumber?: string;
}

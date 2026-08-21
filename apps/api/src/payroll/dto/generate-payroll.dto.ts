import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class GeneratePayrollDto {
  @IsNumber()
  @IsNotEmpty()
  month!: number;

  @IsNumber()
  @IsNotEmpty()
  year!: number;

  @IsUUID()
  @IsOptional()
  employeeId?: string;
}

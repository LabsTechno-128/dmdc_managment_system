import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CheckOutDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @IsDateString()
  @IsOptional()
  checkOutTime?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

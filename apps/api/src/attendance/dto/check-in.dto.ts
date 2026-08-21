import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CheckInDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @IsDateString()
  @IsOptional()
  checkInTime?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

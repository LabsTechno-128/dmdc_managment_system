import { IsOptional, IsString, IsEnum, IsBooleanString } from 'class-validator';
import { UserRole } from '@hospital/database';

export class QueryUsersDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}

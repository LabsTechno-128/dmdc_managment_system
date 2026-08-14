import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@hospital/database';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}

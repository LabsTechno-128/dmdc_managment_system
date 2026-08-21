import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateEmployeeStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  isActive!: boolean;
}

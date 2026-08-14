import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() updateUserRoleDto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, updateUserRoleDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateUserStatusDto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, updateUserStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

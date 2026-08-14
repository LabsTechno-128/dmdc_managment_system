import { Injectable, NotFoundException, BadRequestException, OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ILike, FindOptionsWhere } from 'typeorm';
import { User, UserRole } from '@hospital/database';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(private readonly databaseService: DatabaseService) {}

  async onApplicationBootstrap() {
    await this.seedSuperAdmin();
  }

  private async seedSuperAdmin() {
    const email = 'superadmin@example.com';
    const existingAdmin = await this.databaseService.repoUser().findOne({ where: { email } });
    
    if (existingAdmin) {
      return;
    }

    const hashedPassword = await bcrypt.hash('superadmin123', 10);

    const superadmin = this.databaseService.repoUser().create({
      firstName: 'Super',
      lastName: 'Admin',
      email,
      phone: Date.now().toString().slice(-10),
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });

    await this.databaseService.repoUser().save(superadmin);
    console.log('Superadmin created automatically on app bootstrap!');
  }

  async create(createUserDto: CreateUserDto) {
    const { email, phone, password, ...rest } = createUserDto;

    const existingUser = await this.databaseService.repoUser().findOne({ 
      where: [{ email }, phone ? { phone } : {}] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new BadRequestException('User with this email already exists');
      }
      if (existingUser.phone === phone) {
        throw new BadRequestException('User with this phone number already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.databaseService.repoUser().create({
      ...rest,
      email,
      phone,
      password: hashedPassword,
    });

    await this.databaseService.repoUser().save(user);
    const { password: _, ...result } = user;
    return result;
  }

  async findAll(query: QueryUsersDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<User>[] | FindOptionsWhere<User> = [];
    const activeCondition = query.isActive !== undefined && query.isActive !== '' ? { isActive: query.isActive === 'true' } : {};
    const roleCondition = query.role ? { role: query.role } : {};

    if (query.search) {
      where.push(
        { firstName: ILike(`%${query.search}%`), ...roleCondition, ...activeCondition },
        { lastName: ILike(`%${query.search}%`), ...roleCondition, ...activeCondition },
        { email: ILike(`%${query.search}%`), ...roleCondition, ...activeCondition }
      );
    } else {
      const condition: FindOptionsWhere<User> = { ...roleCondition, ...activeCondition };
      if (Object.keys(condition).length > 0) where.push(condition);
    }

    const [data, total] = await this.databaseService.repoUser().findAndCount({
      where: where.length > 0 ? where : undefined,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.databaseService.repoUser().findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    
    // Do not allow updating password or role through this general endpoint
    delete (updateUserDto as any).password;
    delete (updateUserDto as any).role;
    
    Object.assign(user, updateUserDto);
    return this.databaseService.repoUser().save(user);
  }

  async updateRole(id: string, updateUserRoleDto: UpdateUserRoleDto) {
    const user = await this.findOne(id);
    user.role = updateUserRoleDto.role;
    return this.databaseService.repoUser().save(user);
  }

  async updateStatus(id: string, updateUserStatusDto: UpdateUserStatusDto) {
    const user = await this.findOne(id);
    user.isActive = updateUserStatusDto.isActive;
    return this.databaseService.repoUser().save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.databaseService.repoUser().softRemove(user);
    return { success: true, message: 'User deleted successfully' };
  }
}

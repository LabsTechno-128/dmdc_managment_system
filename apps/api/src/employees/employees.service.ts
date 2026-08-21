import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Employee } from '@hospital/database';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { ILike, FindOptionsWhere } from 'typeorm';

@Injectable()
export class EmployeesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { employeeId, userId, joiningDate, ...rest } = createEmployeeDto;

    // Check if employeeId exists
    const existingEmpId = await this.databaseService.repoEmployee().findOne({
      where: { employeeId },
    });
    if (existingEmpId) {
      throw new BadRequestException(`Employee with ID ${employeeId} already exists`);
    }

    // Check if phone exists (if provided)
    if (rest.phone) {
      const existingPhone = await this.databaseService.repoEmployee().findOne({
        where: { phone: rest.phone },
      });
      if (existingPhone) {
        throw new BadRequestException(`Employee with phone ${rest.phone} already exists`);
      }
    }

    const employee = this.databaseService.repoEmployee().create({
      ...rest,
      employeeId,
      joiningDate: new Date(joiningDate),
    });

    if (userId) {
      const user = await this.databaseService.repoUser().findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      employee.user = user;
    }

    return this.databaseService.repoEmployee().save(employee);
  }

  async findAll(query: QueryEmployeesDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Employee>[] | FindOptionsWhere<Employee> = [];
    const activeCondition = query.isActive !== undefined && query.isActive !== '' ? { isActive: query.isActive === 'true' } : {};
    const deptCondition = query.department ? { department: query.department } : {};
    const desgCondition = query.designation ? { designation: query.designation } : {};

    const baseCondition = { ...activeCondition, ...deptCondition, ...desgCondition };

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      where.push(
        { firstName: ILike(searchPattern), ...baseCondition },
        { lastName: ILike(searchPattern), ...baseCondition },
        { employeeId: ILike(searchPattern), ...baseCondition },
        { email: ILike(searchPattern), ...baseCondition }
      );
    } else {
      if (Object.keys(baseCondition).length > 0) {
        where.push(baseCondition);
      }
    }

    const [data, total] = await this.databaseService.repoEmployee().findAndCount({
      where: where.length > 0 ? where : undefined,
      relations: { user: true },
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
    const employee = await this.databaseService.repoEmployee().findOne({
      where: { id },
      relations: { user: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);
    const { employeeId, userId, joiningDate, ...rest } = updateEmployeeDto;

    if (employeeId && employeeId !== employee.employeeId) {
      const existing = await this.databaseService.repoEmployee().findOne({ where: { employeeId } });
      if (existing) {
        throw new BadRequestException(`Employee with ID ${employeeId} already exists`);
      }
      employee.employeeId = employeeId;
    }

    if (joiningDate) {
      employee.joiningDate = new Date(joiningDate);
    }

    if (userId !== undefined) {
      if (userId === null) {
        employee.user = undefined;
      } else {
        const user = await this.databaseService.repoUser().findOne({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
        employee.user = user;
      }
    }

    Object.assign(employee, rest);
    return this.databaseService.repoEmployee().save(employee);
  }

  async updateStatus(id: string, updateEmployeeStatusDto: UpdateEmployeeStatusDto) {
    const employee = await this.findOne(id);
    employee.isActive = updateEmployeeStatusDto.isActive;
    return this.databaseService.repoEmployee().save(employee);
  }

  async remove(id: string) {
    const employee = await this.findOne(id);
    await this.databaseService.repoEmployee().remove(employee);
    return { success: true, message: 'Employee deleted successfully' };
  }
}

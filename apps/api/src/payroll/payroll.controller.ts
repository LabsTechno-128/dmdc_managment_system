import { Controller, Get, Post, Body, Param, UseGuards, Query, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { QueryPayrollDto } from './dto/query-payroll.dto';
import { Response } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('generate')
  generate(@Body() generatePayrollDto: GeneratePayrollDto) {
    return this.payrollService.generate(generatePayrollDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('report/monthly')
  getMonthlyReport(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.payrollService.getMonthlyReport(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('export/excel')
  async exportExcel(
    @Res() res: Response,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('department') department?: string,
  ) {
    return this.payrollService.exportExcel(
      res,
      parseInt(year, 10),
      parseInt(month, 10),
      department,
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':employeeId/:year/:month')
  findOne(
    @Param('employeeId') employeeId: string,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.payrollService.findOne(
      employeeId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryPayrollDto) {
    return this.payrollService.findAll(query);
  }
}

import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Post('check-in')
  checkIn(@Request() req: any, @Body() checkInDto: CheckInDto) {
    const userName = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System';
    return this.attendanceService.checkIn(checkInDto, userName);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Post('check-out')
  checkOut(@Request() req: any, @Body() checkOutDto: CheckOutDto) {
    const userName = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System';
    return this.attendanceService.checkOut(checkOutDto, userName);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('mark')
  mark(@Request() req: any, @Body() markAttendanceDto: MarkAttendanceDto) {
    const userName = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System';
    return this.attendanceService.mark(markAttendanceDto, userName);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('today')
  getTodayAttendance() {
    return this.attendanceService.getTodayAttendance();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('report/daily')
  getDailyReport(@Query('date') date?: string) {
    return this.attendanceService.getDailyReport(date);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('report/monthly')
  getMonthlyReport(
    @Query('employeeId') employeeId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.attendanceService.getMonthlyReport(
      employeeId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get('employee/:employeeId')
  findOneByEmployee(@Param('employeeId') employeeId: string, @Query() filter: AttendanceFilterDto) {
    return this.attendanceService.findOneByEmployee(employeeId, filter);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Get()
  findAll(@Query() filter: AttendanceFilterDto) {
    return this.attendanceService.findAll(filter);
  }
}

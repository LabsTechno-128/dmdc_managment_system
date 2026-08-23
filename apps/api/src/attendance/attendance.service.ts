import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Attendance, AttendanceStatus, Employee } from '@hospital/database';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
import { Between, FindOptionsWhere, ILike } from 'typeorm';

@Injectable()
export class AttendanceService {
  constructor(private readonly databaseService: DatabaseService) {}

  private getLocalDateString(d: Date = new Date()): string {
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  private isDateFriday(dateStr: string): boolean {
    // getDay() returns 5 for Friday.
    // Date constructor parsed in local timezone or UTC depending on formatting.
    // Since YYYY-MM-DD is parsed as UTC by default in ES6, we append time or split it.
    const parts = dateStr.split('-');
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return date.getDay() === 5;
  }

  async checkIn(checkInDto: CheckInDto, markedByUser?: string) {
    const { employeeId, checkInTime, notes } = checkInDto;

    const employee = await this.databaseService.repoEmployee().findOne({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }
    if (!employee.isActive) {
      throw new BadRequestException('Cannot mark attendance for an inactive employee');
    }

    const checkInDate = checkInTime ? new Date(checkInTime) : new Date();
    const dateStr = this.getLocalDateString(checkInDate);

    // Check for duplicate attendance record
    let attendance = await this.databaseService.repoAttendance().findOne({
      where: { employeeId, date: dateStr },
    });

    if (attendance && attendance.checkIn) {
      throw new BadRequestException('Employee already checked in for today');
    }

    // Default shift start is 09:00 AM local
    const startOfShift = new Date(checkInDate);
    startOfShift.setHours(9, 0, 0, 0);
    const diffMs = checkInDate.getTime() - startOfShift.getTime();
    const lateMinutes = diffMs > 0 ? Math.floor(diffMs / 60000) : 0;

    const isFriday = this.isDateFriday(dateStr);
    const status = isFriday ? AttendanceStatus.FridayOff : AttendanceStatus.Present;

    if (!attendance) {
      attendance = this.databaseService.repoAttendance().create({
        employeeId,
        date: dateStr,
        status,
        checkIn: checkInDate,
        lateMinutes,
        notes,
        markedBy: markedByUser || 'System',
      });
    } else {
      attendance.checkIn = checkInDate;
      attendance.status = status;
      attendance.lateMinutes = lateMinutes;
      if (notes) attendance.notes = notes;
      attendance.markedBy = markedByUser || 'System';
    }

    return this.databaseService.repoAttendance().save(attendance);
  }

  async checkOut(checkOutDto: CheckOutDto, markedByUser?: string) {
    const { employeeId, checkOutTime, notes } = checkOutDto;

    const employee = await this.databaseService.repoEmployee().findOne({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const checkOutDate = checkOutTime ? new Date(checkOutTime) : new Date();
    const dateStr = this.getLocalDateString(checkOutDate);

    const attendance = await this.databaseService.repoAttendance().findOne({
      where: { employeeId, date: dateStr },
    });

    if (!attendance || !attendance.checkIn) {
      throw new BadRequestException('Employee must check in before checking out');
    }

    attendance.checkOut = checkOutDate;

    // Calculate working minutes
    const checkInTimeDate = new Date(attendance.checkIn);
    const diffMs = checkOutDate.getTime() - checkInTimeDate.getTime();
    const workingMinutes = diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
    attendance.workingMinutes = workingMinutes;

    // Overtime after 8 hours (480 minutes)
    const standardMinutes = 480;
    attendance.overtimeMinutes = workingMinutes > standardMinutes ? workingMinutes - standardMinutes : 0;

    if (notes) {
      attendance.notes = attendance.notes ? `${attendance.notes}; ${notes}` : notes;
    }
    if (markedByUser) {
      attendance.markedBy = markedByUser;
    }

    return this.databaseService.repoAttendance().save(attendance);
  }

  async mark(dto: MarkAttendanceDto, markedByUser?: string) {
    const { employeeId, date, status, checkIn, checkOut, notes } = dto;

    const employee = await this.databaseService.repoEmployee().findOne({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    let attendance = await this.databaseService.repoAttendance().findOne({
      where: { employeeId, date },
    });

    if (!attendance) {
      attendance = this.databaseService.repoAttendance().create({
        employeeId,
        date,
        status,
        markedBy: markedByUser || 'System',
      });
    } else {
      attendance.status = status;
      attendance.markedBy = markedByUser || 'System';
    }

    if (notes) attendance.notes = notes;

    // Calculate times if checkIn / checkOut are provided
    if (status === AttendanceStatus.Present || status === AttendanceStatus.HalfDay) {
      if (checkIn) {
        attendance.checkIn = new Date(checkIn);
        // Late minutes from 09:00 AM
        const startOfShift = new Date(attendance.checkIn);
        startOfShift.setHours(9, 0, 0, 0);
        const diffMs = attendance.checkIn.getTime() - startOfShift.getTime();
        attendance.lateMinutes = diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
      }
      if (checkOut) {
        attendance.checkOut = new Date(checkOut);
      }

      if (attendance.checkIn && attendance.checkOut) {
        const diffMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
        const workingMinutes = diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
        attendance.workingMinutes = workingMinutes;

        const standardMinutes = 480;
        attendance.overtimeMinutes = workingMinutes > standardMinutes ? workingMinutes - standardMinutes : 0;
      }
    } else {
      // Clear times for Absent, Leave, Friday Off, Weekly Off, Holiday
      attendance.checkIn = undefined;
      attendance.checkOut = undefined;
      attendance.workingMinutes = 0;
      attendance.lateMinutes = 0;
      attendance.overtimeMinutes = 0;
    }

    return this.databaseService.repoAttendance().save(attendance);
  }

  async getTodayAttendance() {
    const todayStr = this.getLocalDateString();
    const activeEmployees = await this.databaseService.repoEmployee().find({
      where: { isActive: true },
      order: { employeeId: 'ASC' },
    });

    const attendances = await this.databaseService.repoAttendance().find({
      where: { date: todayStr },
      relations: { employee: true },
    });

    return activeEmployees.map(emp => {
      const att = attendances.find(a => a.employeeId === emp.id);
      return {
        employee: emp,
        attendance: att || null,
      };
    });
  }

  async findAll(filter: AttendanceFilterDto) {
    const page = parseInt(filter.page || '1', 10);
    const limit = parseInt(filter.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Attendance> = {};

    if (filter.employeeId) {
      where.employeeId = filter.employeeId;
    }

    if (filter.status) {
      where.status = filter.status as AttendanceStatus;
    }

    if (filter.startDate && filter.endDate) {
      where.date = Between(filter.startDate, filter.endDate) as any;
    } else if (filter.startDate) {
      where.date = Between(filter.startDate, '9999-12-31') as any;
    } else if (filter.endDate) {
      where.date = Between('0001-01-01', filter.endDate) as any;
    }

    const employeeWhere: FindOptionsWhere<Employee> = {};
    if (filter.department) {
      employeeWhere.department = filter.department;
    }
    if (filter.designation) {
      employeeWhere.designation = filter.designation;
    }

    if (Object.keys(employeeWhere).length > 0) {
      where.employee = employeeWhere;
    }

    const [data, total] = await this.databaseService.repoAttendance().findAndCount({
      where,
      relations: { employee: true },
      skip,
      take: limit,
      order: { date: 'DESC', createdAt: 'DESC' },
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

  async findOneByEmployee(employeeId: string, filter: AttendanceFilterDto) {
    filter.employeeId = employeeId;
    return this.findAll(filter);
  }

  async getDailyReport(dateStr?: string) {
    const targetDate = dateStr || this.getLocalDateString();
    
    // Find all active employees at that target date
    const employees = await this.databaseService.repoEmployee().find({
      where: { isActive: true },
    });

    const attendances = await this.databaseService.repoAttendance().find({
      where: { date: targetDate },
      relations: { employee: true },
    });

    const reportDetails = employees.map(emp => {
      const att = attendances.find(a => a.employeeId === emp.id);
      
      // Calculate today's salary rate & deduction
      const dailyRate = Number(emp.monthlySalary) / 24;
      let deduction = 0;
      let statusText = 'Not Marked';

      if (att) {
        statusText = att.status;
        if (att.status === AttendanceStatus.Absent) {
          deduction = dailyRate;
        } else if (att.status === AttendanceStatus.HalfDay) {
          deduction = dailyRate * 0.5;
        }
      } else {
        // If it is Friday, it defaults to Friday Off, otherwise defaults to Not Marked
        if (this.isDateFriday(targetDate)) {
          statusText = AttendanceStatus.FridayOff;
        }
      }

      return {
        id: emp.id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        name: `${emp.firstName} ${emp.lastName}`,
        designation: emp.designation,
        department: emp.department,
        monthlySalary: Number(emp.monthlySalary),
        dailyRate: Number(dailyRate.toFixed(2)),
        status: statusText,
        checkIn: att?.checkIn || null,
        checkOut: att?.checkOut || null,
        workingMinutes: att?.workingMinutes || 0,
        todayDeduction: Number(deduction.toFixed(2)),
        notes: att?.notes || '',
      };
    });

    const total = employees.length;
    const present = reportDetails.filter(r => r.status === AttendanceStatus.Present).length;
    const absent = reportDetails.filter(r => r.status === AttendanceStatus.Absent).length;
    const leave = reportDetails.filter(r => r.status === AttendanceStatus.Leave).length;
    const halfDay = reportDetails.filter(r => r.status === AttendanceStatus.HalfDay).length;
    const fridayOff = reportDetails.filter(r => r.status === AttendanceStatus.FridayOff).length;
    const weeklyOff = reportDetails.filter(r => r.status === AttendanceStatus.WeeklyOff).length;
    const holiday = reportDetails.filter(r => r.status === AttendanceStatus.Holiday).length;
    const unmarked = total - (present + absent + leave + halfDay + fridayOff + weeklyOff + holiday);

    return {
      date: targetDate,
      summary: {
        total,
        present,
        absent,
        leave,
        halfDay,
        fridayOff,
        weeklyOff,
        holiday,
        unmarked,
      },
      details: reportDetails,
    };
  }

  async getMonthlyReport(employeeId: string, year: number, month: number) {
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    // Find last day of month
    const lastDay = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const attendances = await this.databaseService.repoAttendance().find({
      where: {
        employeeId,
        date: Between(startDateStr, endDateStr) as any,
      },
    });

    const presentDays = attendances.filter(a => a.status === AttendanceStatus.Present).length;
    const absentDays = attendances.filter(a => a.status === AttendanceStatus.Absent).length;
    const leaveDays = attendances.filter(a => a.status === AttendanceStatus.Leave).length;
    const halfDays = attendances.filter(a => a.status === AttendanceStatus.HalfDay).length;
    const fridayOffDays = attendances.filter(a => a.status === AttendanceStatus.FridayOff).length;
    const weeklyOffDays = attendances.filter(a => a.status === AttendanceStatus.WeeklyOff).length;
    const holidayDays = attendances.filter(a => a.status === AttendanceStatus.Holiday).length;

    return {
      employeeId,
      year,
      month,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      fridayOffDays,
      weeklyOffDays,
      holidayDays,
      totalRecords: attendances.length,
    };
  }
}

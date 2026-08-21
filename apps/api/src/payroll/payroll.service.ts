import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SalaryCalculationService } from './salary-calculation.service';
import { Payroll, Attendance, AttendanceStatus, Employee } from '@hospital/database';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { QueryPayrollDto } from './dto/query-payroll.dto';
import { Between, FindOptionsWhere } from 'typeorm';
import { Workbook } from 'exceljs';
import { Response } from 'express';

@Injectable()
export class PayrollService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly salaryCalculationService: SalaryCalculationService,
  ) {}

  async generate(dto: GeneratePayrollDto) {
    const { month, year, employeeId } = dto;

    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }

    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let employees: Employee[] = [];
    if (employeeId) {
      const emp = await this.databaseService.repoEmployee().findOne({ where: { id: employeeId } });
      if (!emp) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }
      employees = [emp];
    } else {
      employees = await this.databaseService.repoEmployee().find({ where: { isActive: true } });
    }

    const results: Payroll[] = [];

    for (const emp of employees) {
      // Find all attendance records for this employee in this month
      const attendances = await this.databaseService.repoAttendance().find({
        where: {
          employeeId: emp.id,
          date: Between(startDateStr, endDateStr) as any,
        },
      });

      const calc = this.salaryCalculationService.calculateEmployeeSalary(emp, attendances);

      // Check if payroll already exists
      let payroll = await this.databaseService.repoPayroll().findOne({
        where: { employeeId: emp.id, month, year },
      });

      if (!payroll) {
        payroll = this.databaseService.repoPayroll().create({
          employeeId: emp.id,
          month,
          year,
          status: 'Draft',
        });
      }

      payroll.monthlySalary = calc.monthlySalary;
      payroll.dailyRate = calc.dailyRate;
      payroll.workingDays = this.salaryCalculationService.getSettings().daysInWorkingMonth;
      payroll.presentDays = calc.presentDays;
      payroll.absentDays = calc.absentDays;
      payroll.leaveDays = calc.leaveDays;
      payroll.halfDays = calc.halfDays;
      payroll.fridayOffDays = calc.fridayOffDays;
      payroll.deductibleDays = calc.deductibleDays;
      payroll.totalDeduction = calc.totalDeduction;
      payroll.netSalary = calc.netSalary;
      payroll.generatedAt = new Date();

      const saved = await this.databaseService.repoPayroll().save(payroll);
      results.push(saved);
    }

    return results;
  }

  async findAll(query: QueryPayrollDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Payroll> = {};
    if (query.month) {
      where.month = parseInt(query.month, 10);
    }
    if (query.year) {
      where.year = parseInt(query.year, 10);
    }
    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    const employeeWhere: FindOptionsWhere<Employee> = {};
    if (query.department) {
      employeeWhere.department = query.department;
    }

    if (Object.keys(employeeWhere).length > 0) {
      where.employee = employeeWhere;
    }

    const [data, total] = await this.databaseService.repoPayroll().findAndCount({
      where,
      relations: { employee: true },
      skip,
      take: limit,
      order: { year: 'DESC', month: 'DESC', createdAt: 'DESC' },
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

  async findOne(employeeId: string, year: number, month: number) {
    const payroll = await this.databaseService.repoPayroll().findOne({
      where: { employeeId, year, month },
      relations: { employee: true },
    });

    if (!payroll) {
      throw new NotFoundException(`Payroll record not found for employee ${employeeId} in ${year}-${month}`);
    }

    return payroll;
  }

  async getMonthlyReport(year: number, month: number) {
    const records = await this.databaseService.repoPayroll().find({
      where: { year, month },
      relations: { employee: true },
      order: { netSalary: 'DESC' },
    });

    const totalSalary = records.reduce((sum, r) => sum + Number(r.monthlySalary), 0);
    const totalNet = records.reduce((sum, r) => sum + Number(r.netSalary), 0);
    const totalDeductions = records.reduce((sum, r) => sum + Number(r.totalDeduction), 0);

    return {
      year,
      month,
      summary: {
        totalEmployees: records.length,
        totalSalary: this.salaryCalculationService.round(totalSalary),
        totalDeductions: this.salaryCalculationService.round(totalDeductions),
        totalNetPayable: this.salaryCalculationService.round(totalNet),
      },
      records,
    };
  }

  async exportExcel(res: Response, year: number, month: number, department?: string) {
    const workbook = new Workbook();

    // Fetch data
    const empWhere: FindOptionsWhere<Employee> = { isActive: true };
    if (department) {
      empWhere.department = department;
    }
    const employees = await this.databaseService.repoEmployee().find({ where: empWhere });

    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const payrolls = await this.databaseService.repoPayroll().find({
      where: {
        year,
        month,
        employee: department ? { department } : {},
      },
      relations: { employee: true },
    });

    const attendances = await this.databaseService.repoAttendance().find({
      where: {
        date: Between(startDateStr, endDateStr) as any,
        employee: department ? { department } : {},
      },
      relations: { employee: true },
    });

    // Helper: Style Sheet Header
    const styleHeader = (sheet: any) => {
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' }, // Blue-600
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
    };

    // Helper: Auto-fit column widths
    const autoFitColumns = (sheet: any) => {
      sheet.columns.forEach((col: any) => {
        let maxLen = 0;
        col.eachCell({ includeEmpty: true }, (cell: any) => {
          const val = cell.value ? cell.value.toString() : '';
          maxLen = Math.max(maxLen, val.length);
        });
        col.width = Math.max(maxLen + 4, 12);
      });
    };

    // Sheet 1: Employees
    const empSheet = workbook.addWorksheet('Employees');
    empSheet.columns = [
      { header: 'Employee ID', key: 'employeeId' },
      { header: 'Employee Name', key: 'name' },
      { header: 'Role/Designation', key: 'designation' },
      { header: 'Department', key: 'department' },
      { header: 'Monthly Salary (BDT)', key: 'monthlySalary' },
      { header: 'Daily Rate (BDT)', key: 'dailyRate' },
      { header: 'Join Date', key: 'joiningDate' },
      { header: 'Status', key: 'status' },
    ];
    employees.forEach(emp => {
      const dailyRate = Number(emp.monthlySalary) / 24;
      empSheet.addRow({
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        designation: emp.designation || '',
        department: emp.department || '',
        monthlySalary: Number(emp.monthlySalary),
        dailyRate: Number(dailyRate.toFixed(2)),
        joiningDate: new Date(emp.joiningDate).toLocaleDateString(),
        status: emp.isActive ? 'Active' : 'Inactive',
      });
    });
    styleHeader(empSheet);
    autoFitColumns(empSheet);

    // Sheet 2: Attendance
    const attSheet = workbook.addWorksheet('Attendance');
    attSheet.columns = [
      { header: 'Date', key: 'date' },
      { header: 'Employee ID', key: 'employeeId' },
      { header: 'Employee Name', key: 'name' },
      { header: 'Role/Designation', key: 'designation' },
      { header: 'Status', key: 'status' },
      { header: 'Check In', key: 'checkIn' },
      { header: 'Check Out', key: 'checkOut' },
      { header: 'Working Hours', key: 'workingHours' },
      { header: 'Late Minutes', key: 'lateMinutes' },
      { header: 'Overtime Hours', key: 'overtimeHours' },
      { header: 'Notes', key: 'notes' },
    ];
    attendances.forEach(att => {
      attSheet.addRow({
        date: att.date,
        employeeId: att.employee.employeeId,
        name: `${att.employee.firstName} ${att.employee.lastName}`,
        designation: att.employee.designation || '',
        status: att.status,
        checkIn: att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '',
        checkOut: att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '',
        workingHours: Number((att.workingMinutes / 60).toFixed(2)),
        lateMinutes: att.lateMinutes,
        overtimeHours: Number((att.overtimeMinutes / 60).toFixed(2)),
        notes: att.notes || '',
      });
    });
    styleHeader(attSheet);
    autoFitColumns(attSheet);

    // Sheet 3: Salary Summary
    const paySheet = workbook.addWorksheet('Salary Summary');
    paySheet.columns = [
      { header: 'Month', key: 'month' },
      { header: 'Employee ID', key: 'employeeId' },
      { header: 'Employee Name', key: 'name' },
      { header: 'Monthly Salary (BDT)', key: 'monthlySalary' },
      { header: 'Daily Rate (BDT)', key: 'dailyRate' },
      { header: 'Working Days', key: 'workingDays' },
      { header: 'Present Days', key: 'presentDays' },
      { header: 'Absent Days', key: 'absentDays' },
      { header: 'Leave Days', key: 'leaveDays' },
      { header: 'Half Days', key: 'halfDays' },
      { header: 'Friday Off Days', key: 'fridayOffDays' },
      { header: 'Deductible Days', key: 'deductibleDays' },
      { header: 'Total Deduction (BDT)', key: 'totalDeduction' },
      { header: 'Net Salary (BDT)', key: 'netSalary' },
      { header: 'Generated Date', key: 'generatedAt' },
      { header: 'Status', key: 'status' },
    ];
    payrolls.forEach(p => {
      paySheet.addRow({
        month: `${year}-${String(month).padStart(2, '0')}`,
        employeeId: p.employee.employeeId,
        name: `${p.employee.firstName} ${p.employee.lastName}`,
        monthlySalary: Number(p.monthlySalary),
        dailyRate: Number(p.dailyRate),
        workingDays: p.workingDays,
        presentDays: Number(p.presentDays),
        absentDays: Number(p.absentDays),
        leaveDays: Number(p.leaveDays),
        halfDays: Number(p.halfDays),
        fridayOffDays: Number(p.fridayOffDays),
        deductibleDays: Number(p.deductibleDays),
        totalDeduction: Number(p.totalDeduction),
        netSalary: Number(p.netSalary),
        generatedAt: new Date(p.generatedAt).toLocaleDateString(),
        status: p.status,
      });
    });
    styleHeader(paySheet);
    autoFitColumns(paySheet);

    // Sheet 4: Daily Report
    const dailySheet = workbook.addWorksheet('Daily Report');
    dailySheet.columns = [
      { header: 'Report Date', key: 'date' },
      { header: 'Employee ID', key: 'employeeId' },
      { header: 'Employee Name', key: 'name' },
      { header: 'Monthly Salary (BDT)', key: 'monthlySalary' },
      { header: 'Present', key: 'present' },
      { header: 'Absent', key: 'absent' },
      { header: 'Leave', key: 'leave' },
      { header: 'Half Day', key: 'halfDay' },
      { header: 'Friday Off', key: 'fridayOff' },
      { header: 'Deduction (BDT)', key: 'deduction' },
      { header: 'Remarks', key: 'remarks' },
    ];

    // Generate daily report for all days in the month
    for (let day = 1; day <= lastDay; day++) {
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayFriday = this.isDateFriday(dayStr);

      employees.forEach(emp => {
        const att = attendances.find(a => a.employeeId === emp.id && a.date === dayStr);
        
        let present = 0;
        let absent = 0;
        let leave = 0;
        let halfDay = 0;
        let fridayOff = 0;
        let deduction = 0;
        let remarks = '';
        const dailyRate = Number(emp.monthlySalary) / 24;

        if (att) {
          remarks = att.notes || '';
          if (att.status === AttendanceStatus.Present) present = 1;
          else if (att.status === AttendanceStatus.Absent) {
            absent = 1;
            deduction = dailyRate;
          } else if (att.status === AttendanceStatus.Leave) {
            leave = 1;
          } else if (att.status === AttendanceStatus.HalfDay) {
            halfDay = 1;
            deduction = dailyRate * 0.5;
          } else if (att.status === AttendanceStatus.FridayOff) {
            fridayOff = 1;
          }
        } else {
          if (dayFriday) {
            fridayOff = 1;
          } else {
            // Assume unmarked = not present
            remarks = 'No attendance marked';
          }
        }

        dailySheet.addRow({
          date: dayStr,
          employeeId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          monthlySalary: Number(emp.monthlySalary),
          present,
          absent,
          leave,
          halfDay,
          fridayOff,
          deduction: Number(deduction.toFixed(2)),
          remarks,
        });
      });
    }
    styleHeader(dailySheet);
    autoFitColumns(dailySheet);

    // Setup headers for browser download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=payroll-report-${year}-${String(month).padStart(2, '0')}.xlsx`,
    );

    await workbook.xlsx.write(res);
  }

  private isDateFriday(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date.getDay() === 5;
  }
}

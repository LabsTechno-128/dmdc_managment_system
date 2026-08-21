import { Injectable } from '@nestjs/common';
import { Employee, Attendance, AttendanceStatus } from '@hospital/database';

export interface SalaryCalculationSettings {
  daysInWorkingMonth: number; // default: 24
  halfDayDeductionRate: number; // default: 0.5
  absentDeductionRate: number; // default: 1.0
  paidLeaveDeductionRate: number; // default: 0.0
  unpaidLeaveDeductionRate: number; // default: 1.0
  leaveIsPaidByDefault: boolean; // default: true
}

@Injectable()
export class SalaryCalculationService {
  private settings: SalaryCalculationSettings = {
    daysInWorkingMonth: 24,
    halfDayDeductionRate: 0.5,
    absentDeductionRate: 1.0,
    paidLeaveDeductionRate: 0.0,
    unpaidLeaveDeductionRate: 1.0,
    leaveIsPaidByDefault: true,
  };

  getSettings(): SalaryCalculationSettings {
    return this.settings;
  }

  updateSettings(settings: Partial<SalaryCalculationSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  round(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  calculateDailyRate(monthlySalary: number): number {
    return this.round(monthlySalary / this.settings.daysInWorkingMonth);
  }

  calculateDeductions(dailyRate: number, absentCount: number, halfDayCount: number, leaveCount: number) {
    const halfDayDeduction = halfDayCount * this.settings.halfDayDeductionRate;
    const absentDeduction = absentCount * this.settings.absentDeductionRate;
    const leaveDeduction = this.settings.leaveIsPaidByDefault
      ? leaveCount * this.settings.paidLeaveDeductionRate
      : leaveCount * this.settings.unpaidLeaveDeductionRate;

    const deductibleDays = this.round(absentDeduction + halfDayDeduction + leaveDeduction);
    const totalDeduction = this.round(dailyRate * deductibleDays);

    return {
      deductibleDays,
      totalDeduction,
    };
  }

  calculateNetSalary(monthlySalary: number, totalDeduction: number): number {
    return this.round(Math.max(0, monthlySalary - totalDeduction));
  }

  calculateEmployeeSalary(employee: Employee, attendances: Attendance[]) {
    const monthlySalary = Number(employee.monthlySalary);
    const dailyRate = this.calculateDailyRate(monthlySalary);

    const presentDays = attendances.filter(a => a.status === AttendanceStatus.Present).length;
    const absentDays = attendances.filter(a => a.status === AttendanceStatus.Absent).length;
    const leaveDays = attendances.filter(a => a.status === AttendanceStatus.Leave).length;
    const halfDays = attendances.filter(a => a.status === AttendanceStatus.HalfDay).length;
    const fridayOffDays = attendances.filter(a => a.status === AttendanceStatus.FridayOff).length;

    const { deductibleDays, totalDeduction } = this.calculateDeductions(
      dailyRate,
      absentDays,
      halfDays,
      leaveDays,
    );

    const netSalary = this.calculateNetSalary(monthlySalary, totalDeduction);

    return {
      monthlySalary,
      dailyRate,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      fridayOffDays,
      deductibleDays,
      totalDeduction,
      netSalary,
    };
  }
}

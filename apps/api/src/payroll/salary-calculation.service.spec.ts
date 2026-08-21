import { Test, TestingModule } from '@nestjs/testing';
import { SalaryCalculationService } from './salary-calculation.service';
import { Employee, Attendance, AttendanceStatus } from '@hospital/database';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('SalaryCalculationService', () => {
  let service: SalaryCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalaryCalculationService],
    }).compile();

    service = module.get<SalaryCalculationService>(SalaryCalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateDailyRate', () => {
    it('should calculate daily rate as Monthly Salary / 24, rounded to 2 decimal places', () => {
      // 10000 / 24 = 416.6666667 -> 416.67
      expect(service.calculateDailyRate(10000)).toBe(416.67);
      // 15000 / 24 = 625
      expect(service.calculateDailyRate(15000)).toBe(625.00);
      // 12000 / 24 = 500
      expect(service.calculateDailyRate(12000)).toBe(500.00);
    });
  });

  describe('calculateDeductions', () => {
    it('should calculate correct deductible days and deduction amounts', () => {
      const dailyRate = 416.67;

      // 1 Absent Day -> 1.0 deductible day, 416.67 BDT deduction
      let result = service.calculateDeductions(dailyRate, 1, 0, 0);
      expect(result.deductibleDays).toBe(1.0);
      expect(result.totalDeduction).toBe(416.67);

      // 1 Half Day -> 0.5 deductible day, 208.34 BDT deduction
      result = service.calculateDeductions(dailyRate, 0, 1, 0);
      expect(result.deductibleDays).toBe(0.5);
      expect(result.totalDeduction).toBe(208.34);

      // 2 Absent Days + 1 Half Day -> 2.5 deductible days, 1041.68 BDT deduction
      result = service.calculateDeductions(dailyRate, 2, 1, 0);
      expect(result.deductibleDays).toBe(2.5);
      expect(result.totalDeduction).toBe(1041.68);
    });

    it('should not deduct for paid leaves by default', () => {
      const dailyRate = 500.00;
      const result = service.calculateDeductions(dailyRate, 0, 0, 3); // 3 Leave days
      expect(result.deductibleDays).toBe(0.0);
      expect(result.totalDeduction).toBe(0.0);
    });
  });

  describe('calculateEmployeeSalary', () => {
    it('should compute full salary details correctly from attendance list', () => {
      const employee = {
        monthlySalary: 10000,
        firstName: 'John',
        lastName: 'Doe',
      } as Employee;

      // Mock attendance records for the month
      const attendances = [
        { status: AttendanceStatus.Present } as Attendance,
        { status: AttendanceStatus.Present } as Attendance,
        { status: AttendanceStatus.Present } as Attendance,
        { status: AttendanceStatus.Present } as Attendance,
        { status: AttendanceStatus.Absent } as Attendance, // 1 Absent
        { status: AttendanceStatus.Absent } as Attendance, // 2 Absent
        { status: AttendanceStatus.HalfDay } as Attendance, // 1 Half Day
        { status: AttendanceStatus.Leave } as Attendance, // 1 Leave (paid)
        { status: AttendanceStatus.FridayOff } as Attendance, // 1 Friday off (no deduction)
      ];

      const result = service.calculateEmployeeSalary(employee, attendances);

      expect(result.monthlySalary).toBe(10000);
      expect(result.dailyRate).toBe(416.67);
      expect(result.presentDays).toBe(4);
      expect(result.absentDays).toBe(2);
      expect(result.halfDays).toBe(1);
      expect(result.leaveDays).toBe(1);
      expect(result.fridayOffDays).toBe(1);
      expect(result.deductibleDays).toBe(2.5); // 2 + 1 * 0.5 = 2.5
      expect(result.totalDeduction).toBe(1041.68); // 416.67 * 2.5 = 1041.68
      expect(result.netSalary).toBe(8958.32); // 10000 - 1041.68 = 8958.32
    });
  });
});

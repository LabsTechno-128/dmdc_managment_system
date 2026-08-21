import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { SalaryCalculationService } from './salary-calculation.service';
import { PayrollCronService } from './cron/payroll-cron.service';

@Module({
  controllers: [PayrollController],
  providers: [PayrollService, SalaryCalculationService, PayrollCronService],
  exports: [PayrollService, SalaryCalculationService],
})
export class PayrollModule {}

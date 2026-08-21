import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { PatientsModule } from './patients/patients.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { TestsModule } from './tests/tests.module';
import { BillingModule } from './billing/billing.module';
import { TestCounterModule } from './test-counter/test-counter.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { UsersModule } from './users/users.module';
import { LabTestsModule } from './lab-tests/lab-tests.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PayrollModule } from './payroll/payroll.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    LabTestsModule,
    DatabaseModule,
    PatientsModule,
    AuthModule,
    DoctorsModule,
    TestsModule,
    BillingModule,
    TestCounterModule,
    ReportsModule,
    DashboardModule,
    SettingsModule,
    NotificationsModule,
    AppointmentsModule,
    UsersModule,
    EmployeesModule,
    AttendanceModule,
    PayrollModule
  ],
})
export class AppModule { }

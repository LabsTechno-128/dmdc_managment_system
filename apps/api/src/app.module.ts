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

@Module({
  imports: [DatabaseModule, PatientsModule, AuthModule, DoctorsModule, TestsModule, BillingModule, TestCounterModule, ReportsModule, DashboardModule, SettingsModule, NotificationsModule, AppointmentsModule],
})
export class AppModule { }

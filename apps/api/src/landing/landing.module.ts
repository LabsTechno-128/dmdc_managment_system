import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { LandingController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
    imports: [DatabaseModule, AppointmentsModule],
    controllers: [LandingController],
    providers: [LandingService],
    exports: [LandingService],
})
export class LandingModule {}

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../../database/database.service';
import { AttendanceStatus } from '@hospital/database';

@Injectable()
export class PayrollCronService {
  private readonly logger = new Logger(PayrollCronService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private getLocalDateString(d: Date = new Date()): string {
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  // Runs daily at 11:59 PM (23:59)
  @Cron('59 23 * * *')
  async handleDailyAttendanceProcessing() {
    this.logger.log('⏰ Starting automatic end-of-day attendance processing...');
    
    try {
      const todayStr = this.getLocalDateString();
      
      // Determine if today is Friday (5 is Friday)
      const parts = todayStr.split('-');
      const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const isFriday = date.getDay() === 5;

      // 1. Find all active employees
      const activeEmployees = await this.databaseService.repoEmployee().find({
        where: { isActive: true },
      });

      // 2. Fetch existing attendance logs for today
      const todayAttendances = await this.databaseService.repoAttendance().find({
        where: { date: todayStr },
      });

      let markedFridayOff = 0;
      let markedAbsent = 0;
      let alreadyExists = 0;

      for (const emp of activeEmployees) {
        const hasAttendance = todayAttendances.some(att => att.employeeId === emp.id);
        
        if (hasAttendance) {
          alreadyExists++;
          continue;
        }

        // If no attendance exists, mark based on day of week
        const status = isFriday ? AttendanceStatus.FridayOff : AttendanceStatus.Absent;
        
        const autoAttendance = this.databaseService.repoAttendance().create({
          employeeId: emp.id,
          date: todayStr,
          status,
          notes: 'Auto-marked at end of day',
          markedBy: 'System Cron',
        });

        await this.databaseService.repoAttendance().save(autoAttendance);
        
        if (isFriday) {
          markedFridayOff++;
        } else {
          markedAbsent++;
        }
      }

      this.logger.log(
        `✅ Auto-processing complete for ${todayStr}. Active: ${activeEmployees.length}. Already marked: ${alreadyExists}, Auto-FridayOff: ${markedFridayOff}, Auto-Absent: ${markedAbsent}`,
      );
    } catch (err) {
      this.logger.error('❌ Failed to run automatic end-of-day attendance cron:', err);
    }
  }
}

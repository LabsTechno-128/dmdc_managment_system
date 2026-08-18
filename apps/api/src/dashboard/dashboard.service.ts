import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MoreThanOrEqual, Between } from 'typeorm';

@Injectable()
export class DashboardService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // Fetching existing stats and new billing stats
        const [
            totalBooked, 
            waitingRoom, 
            completed, 
            todayBillings,
            thisMonthBillings,
            lastMonthBillings,
            completePatientBillingCount,
            unpaidBillingCount,
            partialBillingCount,
            totalDoctor,
            totalPatient,
            totalAppointment,
            lastMonthAppointment,
            thisMonthAppointment,
            userListCount
        ] = await Promise.all([
            this.databaseService.repoTestOrder().count({ where: { createdAt: MoreThanOrEqual(today) } }),
            this.databaseService.repoTestOrder().count({ where: { status: 'Waiting' } }),
            this.databaseService.repoTestOrder().count({ where: { status: 'Completed', createdAt: MoreThanOrEqual(today) } }),
            this.databaseService.repoBilling().find({ where: { createdAt: MoreThanOrEqual(today) } }),
            this.databaseService.repoBilling().find({ where: { createdAt: MoreThanOrEqual(firstDayThisMonth) } }),
            this.databaseService.repoBilling().find({ where: { createdAt: Between(firstDayLastMonth, lastDayLastMonth) } }),
            this.databaseService.repoBilling().count({ where: { paymentStatus: 'Paid' } }),
            this.databaseService.repoBilling().count({ where: { paymentStatus: 'Unpaid' } }),
            this.databaseService.repoBilling().count({ where: { paymentStatus: 'Partial' } }),
            this.databaseService.repoDoctor().count(),
            this.databaseService.repoPatients().count(),
            this.databaseService.repoAppointment().count(),
            this.databaseService.repoAppointment().count({ where: { createdAt: Between(firstDayLastMonth, lastDayLastMonth) } }),
            this.databaseService.repoAppointment().count({ where: { createdAt: MoreThanOrEqual(firstDayThisMonth) } }),
            this.databaseService.repoUser().count()
        ]);

        const collection = todayBillings.reduce((sum, bill) => sum + Number(bill.paidAmount || 0), 0);
        const thisMonthIncome = thisMonthBillings.reduce((sum, bill) => sum + Number(bill.paidAmount || 0), 0);
        const lastMonthIncome = lastMonthBillings.reduce((sum, bill) => sum + Number(bill.paidAmount || 0), 0);

        return {
            totalBooked,
            waitingRoom,
            completed,
            collection,
            thisMonthIncome,
            lastMonthIncome,
            completePatientBillingCount,
            unpaidBillingCount,
            partialBillingCount,
            totalDoctor,
            totalPatient,
            totalAppointment,
            lastMonthAppointment,
            thisMonthAppointment,
            userListCount
        };
    }
}

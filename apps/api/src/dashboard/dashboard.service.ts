import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MoreThanOrEqual } from 'typeorm';

@Injectable()
export class DashboardService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Wait for all queries
        const [totalBooked, waitingRoom, completed, billings] = await Promise.all([
            this.databaseService.repoTestOrder().count({ where: { createdAt: MoreThanOrEqual(today) } }),
            this.databaseService.repoTestOrder().count({ where: { status: 'Waiting' } }),
            this.databaseService.repoTestOrder().count({ where: { status: 'Completed', createdAt: MoreThanOrEqual(today) } }),
            this.databaseService.repoBilling().find({ where: { createdAt: MoreThanOrEqual(today) } })
        ]);

        const collection = billings.reduce((sum, bill) => sum + Number(bill.totalAmount), 0);

        return {
            totalBooked,
            waitingRoom,
            completed,
            collection
        };
    }
}

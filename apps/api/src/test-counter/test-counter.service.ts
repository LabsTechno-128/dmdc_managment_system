import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TestCounterService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getQueue() {
        return this.databaseService.repoTestOrder().find({
            relations: { patient: true, test: true },
            order: { createdAt: 'ASC' }
        });
    }

    async updateStatus(id: string, status: string) {
        await this.databaseService.repoTestOrder().update(id, { status });
        
        // If completed, optionally auto-create a draft report
        if (status === 'Completed') {
            const order = await this.databaseService.repoTestOrder().findOne({ where: { id } });
            if (order) {
                const existingReport = await this.databaseService.repoReport().findOne({ where: { testOrderId: id } });
                if (!existingReport) {
                    await this.databaseService.repoReport().save({
                        patientId: order.patientId,
                        testOrderId: order.id,
                        isDelivered: false
                    });
                }
            }
        }
        
        return this.databaseService.repoTestOrder().findOne({ where: { id } });
    }
}

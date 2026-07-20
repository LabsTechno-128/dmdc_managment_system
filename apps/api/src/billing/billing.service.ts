import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Billing, BillingItem, TestOrder } from '@hospital/database';

@Injectable()
export class BillingService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(data: Partial<Billing> & { items: Partial<BillingItem>[] }) {
        const { items, ...billingData } = data;
        
        // Save the main billing record
        const billing = await this.databaseService.repoBilling().save(billingData);
        
        // Save billing items and create corresponding test orders
        if (items && items.length > 0) {
            const billingItemsToSave = items.map(item => ({
                ...item,
                billingId: billing.id
            }));
            await this.databaseService.repoBillingItem().save(billingItemsToSave);

            const testOrdersToSave = items.map(item => ({
                patientId: billing.patientId,
                billingId: billing.id,
                testId: item.testId,
                status: 'Waiting'
            }));
            await this.databaseService.repoTestOrder().save(testOrdersToSave);
        }

        return this.databaseService.repoBilling().findOne({ where: { id: billing.id }, relations: { patient: true } });
    }

    async findAll() {
        return this.databaseService.repoBilling().find({ relations: { patient: true } });
    }

    async findOne(id: string) {
        const billing = await this.databaseService.repoBilling().findOne({ where: { id }, relations: { patient: true } });
        const items = await this.databaseService.repoBillingItem().find({ where: { billingId: id }, relations: { test: true } });
        return { ...billing, items };
    }

    async updateStatus(id: string, paymentStatus: string) {
        await this.databaseService.repoBilling().update(id, { paymentStatus });
        return this.databaseService.repoBilling().findOne({ where: { id } });
    }
}

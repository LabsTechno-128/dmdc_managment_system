import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BillingType } from '@hospital/database';

@Injectable()
export class TestCounterService {
    constructor(private readonly databaseService: DatabaseService) { }

    async getQueue(query?: { page?: string, limit?: string }) {
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.max(1, Number(query?.limit) || 10);

        const [billings, total] = await this.databaseService.repoBilling().findAndCount({
            where: { billingType: BillingType.DIAGNOSTIC },
            relations: { patient: true },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        });

        let samples: any[] = [];
        if (billings.length > 0) {
            samples = await this.databaseService.repoSampleCollection().find({
                where: billings.map(b => ({ billingId: b.id }))
            });
        }

        const data = billings.map(billing => {
            const billingSamples = samples.filter(s => s.billingId === billing.id);
            let status = 'Waiting';
            
            if (billingSamples.length > 0) {
                const hasPending = billingSamples.some(s => s.status === 'PENDING' || s.status === 'RECOLLECTION_REQUIRED');
                const hasCollected = billingSamples.some(s => s.status === 'COLLECTED');
                
                if (hasPending) {
                    status = 'Waiting';
                } else if (hasCollected) {
                    status = 'In Progress';
                } else {
                    status = 'Completed';
                }
            }

            return {
                id: billing.id,
                patientId: billing.patient?.patientId,
                status,
                createdAt: billing.createdAt,
                patient: billing.patient,
                billing: billing.billNumber,
                testCount: billingSamples.length
            };
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async updateStatus(id: string, status: string) {
        // Map old TestOrder statuses back to Sample/LabResult?
        // Let's just return null if they try to update through this legacy endpoint
        return null;
    }
}


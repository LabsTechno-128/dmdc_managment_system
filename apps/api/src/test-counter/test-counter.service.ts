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
        let labResults: any[] = [];
        if (billings.length > 0) {
            samples = await this.databaseService.repoSampleCollection().find({
                where: billings.map(b => ({ billingId: b.id }))
            });
            labResults = await this.databaseService.repoLabResult().find({
                where: billings.map(b => ({ billingId: b.id }))
            });
        }

        const data = billings.map(billing => {
            const billingSamples = samples.filter(s => s.billingId === billing.id);
            const billingResults = labResults.filter(r => r.billingId === billing.id);
            let status = 'Waiting';
            
            if (billingSamples.length > 0) {
                // Total ordered tests can be inferred from billing items, but for now we'll assume it's the number of samples
                const hasPendingSample = billingSamples.some(s => s.status === 'PENDING' || s.status === 'RECOLLECTION_REQUIRED');
                
                // If any result is not COMPLETED/VERIFIED, it's not finished
                const allResultsFinished = billingSamples.every(s => 
                    billingResults.some(r => r.sampleId === s.id && (r.status === 'COMPLETED' || r.status === 'VERIFIED'))
                );

                if (allResultsFinished && billingSamples.length > 0) {
                    status = 'Completed';
                } else if (hasPendingSample) {
                    status = 'Waiting';
                } else {
                    status = 'In Progress'; // Samples are collected, but results are not all finished
                }
            }

            return {
                id: billing.id,
                patientId: billing.patient?.patientId,
                status,
                createdAt: billing.createdAt,
                patient: billing.patient,
                billing: billing.billNumber,
                testCount: billingSamples.length || billing.items?.length || 0
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


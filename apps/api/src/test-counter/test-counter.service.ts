import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TestCounterService {
    constructor(private readonly databaseService: DatabaseService) { }

    async getQueue(query?: { page?: string, limit?: string }) {
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.max(1, Number(query?.limit) || 10);

        const [samples, total] = await this.databaseService.repoSampleCollection().findAndCount({
            relations: { patient: true, test: true, billing: true },
            order: { createdAt: 'ASC' },
            skip: (page - 1) * limit,
            take: limit
        });

        // Map SampleCollection to look like a TestOrder for the frontend
        const data = samples.map(sample => ({
            id: sample.id,
            patientId: sample?.patient?.patientId,
            testId: sample.testId,
            status: sample.status === 'COLLECTED' ? 'In Progress' : (sample.status === 'PENDING' ? 'Waiting' : 'Completed'),
            createdAt: sample.createdAt,
            patient: sample.patient,
            test: sample.test,
            billing: sample.billing.billNumber
        }));
        console.log(data[0])
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

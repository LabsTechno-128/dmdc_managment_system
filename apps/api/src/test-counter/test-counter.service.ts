import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TestCounterService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getQueue() {
        const samples = await this.databaseService.repoSampleCollection().find({
            relations: { patient: true, test: true, billing: true },
            order: { createdAt: 'ASC' }
        });

        // Map SampleCollection to look like a TestOrder for the frontend
        return samples.map(sample => ({
            id: sample.id,
            patientId: sample.patientId,
            testId: sample.testId,
            status: sample.status === 'COLLECTED' ? 'In Progress' : (sample.status === 'PENDING' ? 'Waiting' : 'Completed'),
            createdAt: sample.createdAt,
            patient: sample.patient,
            test: sample.test
        }));
    }

    async updateStatus(id: string, status: string) {
        // Map old TestOrder statuses back to Sample/LabResult?
        // Let's just return null if they try to update through this legacy endpoint
        return null;
    }
}

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Report } from '@hospital/database';

@Injectable()
export class ReportsService {
    constructor(private readonly databaseService: DatabaseService) {}

    async findAll() {
        return this.databaseService.repoReport().find({
            relations: { patient: true, testOrder: { test: true } }
        });
    }

    async findOne(id: string) {
        return this.databaseService.repoReport().findOne({
            where: { id },
            relations: { patient: true, testOrder: { test: true } }
        });
    }

    async update(id: string, data: Partial<Report>) {
        await this.databaseService.repoReport().update(id, data);
        return this.findOne(id);
    }

    async markDelivered(id: string) {
        await this.databaseService.repoReport().update(id, { isDelivered: true });
        return this.findOne(id);
    }
}

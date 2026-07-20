import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DiagnosticTest } from '@hospital/database';

@Injectable()
export class TestsService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(data: Partial<DiagnosticTest>) {
        return this.databaseService.repoDiagnosticTest().save(data);
    }

    async findAll() {
        return this.databaseService.repoDiagnosticTest().find();
    }

    async findOne(id: string) {
        return this.databaseService.repoDiagnosticTest().findOne({ where: { id } });
    }

    async update(id: string, data: Partial<DiagnosticTest>) {
        return this.databaseService.repoDiagnosticTest().update(id, data);
    }

    async remove(id: string) {
        return this.databaseService.repoDiagnosticTest().delete(id);
    }
}

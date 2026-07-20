import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Doctor } from '@hospital/database';

@Injectable()
export class DoctorsService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(data: Partial<Doctor>) {
        return this.databaseService.repoDoctor().save(data);
    }

    async findAll() {
        return this.databaseService.repoDoctor().find();
    }

    async findOne(id: string) {
        return this.databaseService.repoDoctor().findOne({ where: { id } });
    }

    async update(id: string, data: Partial<Doctor>) {
        return this.databaseService.repoDoctor().update(id, data);
    }

    async remove(id: string) {
        return this.databaseService.repoDoctor().delete(id);
    }
}

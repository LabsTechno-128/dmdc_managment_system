import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Doctor } from '@hospital/database';

@Injectable()
export class DoctorsService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(data: Partial<Doctor>) {
        return this.databaseService.repoDoctor().save(data);
    }

    async findAll(page: number = 1, limit: number = 10, search?: string) {
        const qb = this.databaseService.repoDoctor().createQueryBuilder('doctor')
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('doctor.createdAt', 'DESC');

        if (search) {
            qb.where('doctor.firstName ILIKE :search OR doctor.lastName ILIKE :search OR doctor.specialization ILIKE :search', { search: `%${search}%` });
        }

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
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

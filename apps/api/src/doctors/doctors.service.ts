import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Doctor } from '@hospital/database';

export function formatDoctorDisplayName(firstName?: string, lastName?: string): string {
    const full = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim();
    if (!full) return '';
    return /^dr\.?\s+/i.test(full) ? full : `Dr. ${full}`;
}

@Injectable()
export class DoctorsService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(data: Partial<Doctor>) {
        return this.databaseService.repoDoctor().save(data);
    }

    private applyDoctorSearchFilter(qb: any, search?: string) {
        if (search === undefined || search === null) return;
        if (typeof search !== 'string') {
            throw new BadRequestException('Search query must be a string');
        }
        const trimmed = search.trim();
        if (trimmed.length > 100) {
            throw new BadRequestException('Search query cannot exceed 100 characters');
        }
        if (!trimmed) return;

        // Strip optional leading "Dr." or "Dr " prefix so "Dr. Rahman" matches "Rahman"
        const cleaned = trimmed.replace(/^dr\.?\s*/i, '').trim();
        if (!cleaned) return;

        const tokens = cleaned.split(/\s+/).filter(Boolean);
        if (tokens.length === 1) {
            qb.where(
                '(doctor.firstName ILIKE :search OR doctor.lastName ILIKE :search OR doctor.specialization ILIKE :search OR doctor.degree ILIKE :search OR doctor.department ILIKE :search)',
                { search: `%${tokens[0]}%` }
            );
        } else {
            tokens.forEach((token, idx) => {
                const paramName = `search_${idx}`;
                const clause = `(doctor.firstName ILIKE :${paramName} OR doctor.lastName ILIKE :${paramName} OR doctor.specialization ILIKE :${paramName} OR doctor.degree ILIKE :${paramName} OR doctor.department ILIKE :${paramName})`;
                if (idx === 0) {
                    qb.where(clause, { [paramName]: `%${token}%` });
                } else {
                    qb.andWhere(clause, { [paramName]: `%${token}%` });
                }
            });
        }
    }

    async autocomplete(search?: string, limit: number = 10) {
        if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 50)) {
            throw new BadRequestException('Limit must be an integer between 1 and 50');
        }

        const safeLimit = limit || 10;
        const qb = this.databaseService.repoDoctor().createQueryBuilder('doctor')
            .select([
                'doctor.id',
                'doctor.firstName',
                'doctor.lastName',
                'doctor.specialization',
                'doctor.degree',
                'doctor.department',
            ])
            .take(safeLimit)
            .orderBy('doctor.firstName', 'ASC')
            .addOrderBy('doctor.lastName', 'ASC');

        this.applyDoctorSearchFilter(qb, search);

        const doctors = await qb.getMany();
        return doctors.map((doc) => ({
            id: doc.id,
            firstName: doc.firstName,
            lastName: doc.lastName,
            name: formatDoctorDisplayName(doc.firstName, doc.lastName),
            specialization: doc.specialization,
            degree: doc.degree || null,
            department: doc.department || null,
        }));
    }

    async findAll(page: number = 1, limit: number = 10, search?: string) {
        if (!Number.isInteger(page) || page < 1) {
            throw new BadRequestException('Page must be a positive integer');
        }
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new BadRequestException('Limit must be an integer between 1 and 100');
        }

        const qb = this.databaseService.repoDoctor().createQueryBuilder('doctor')
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('doctor.createdAt', 'DESC');

        this.applyDoctorSearchFilter(qb, search);

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

    async getDailyStats(id: string, dateStr?: string) {
        // Default to today if dateStr is not provided
        const targetDate = dateStr ? new Date(dateStr) : new Date();
        const dateString = targetDate.toISOString().split('T')[0];

        // 1. Get Appointments for the day
        const appointments = await this.databaseService.repoAppointment().createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .where('appointment.doctorId = :id', { id })
            .andWhere('DATE(appointment.appointmentDate) = :dateString', { dateString })
            .getMany();

        // 2. Get Billings for the day for this doctor
        const billings = await this.databaseService.repoBilling().createQueryBuilder('billing')
            .where('billing.doctorId = :id', { id })
            .andWhere('DATE(billing.createdAt) = :dateString', { dateString })
            .getMany();

        let totalIncome = 0;
        let totalDiscount = 0;

        billings.forEach(b => {
            totalIncome += Number(b.paidAmount || 0);
            totalDiscount += Number(b.discountAmount || 0); // Assuming discountAmount contains total discount
        });

        // Combine appointments with their billing if available (for UI purposes)
        const patientsSeen = appointments.map(app => {
            const bill = billings.find(b => b.appointmentId === app.id);
            return {
                ...app,
                billing: bill || null
            };
        });

        return {
            date: dateString,
            totalPatients: appointments.length,
            totalIncome,
            totalDiscount,
            patientsSeen
        };
    }
}

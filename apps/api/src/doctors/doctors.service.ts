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

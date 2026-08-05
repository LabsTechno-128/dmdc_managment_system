import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';
import { Appointment, AppointmentStatus, AppointmentType, Patients } from '@hospital/database';
import { Between, MoreThanOrEqual } from 'typeorm';

@Injectable()
export class AppointmentsService {
    constructor(private readonly databaseService: DatabaseService) { }

    async create(createAppointmentDto: CreateAppointmentDto) {
        try {
            const repo = this.databaseService.repoAppointment();
            const doctorRepo = this.databaseService.repoDoctor();
            const patientRepo = this.databaseService.repoPatients();

            // Validate doctor exists
            const doctor = await doctorRepo.findOne({ where: { id: createAppointmentDto.doctorId } });
            if (!doctor) {
                throw new NotFoundException(`Doctor with ID "${createAppointmentDto.doctorId}" not found`);
            }

            // Validate patient exists
            // const patient = await patientRepo.findOne({ where: { id: createAppointmentDto.patientId } });
            // if (!patient) {
            //     throw new NotFoundException(`Patient with ID "${createAppointmentDto.patientId}" not found`);
            // }

            let patient = patientRepo.create({
                name: createAppointmentDto.name,
                age: createAppointmentDto.age,
                gender: createAppointmentDto.gender,
                weight: createAppointmentDto.weight,
                bloodPresure: createAppointmentDto.bloodPresure,
                phone: createAppointmentDto.phone,
            })

            let patientData = await patientRepo.save(patient)


            // Validate appointment date is not in the past
            // const appointmentDate = new Date();
            // const today = new Date();
            // today.setHours(0, 0, 0, 0);
            // if (appointmentDate < today) {
            //     throw new BadRequestException('Appointment date cannot be in the past');
            // }

            // Check for duplicate appointment (same doctor, same date, same time)
            // const existing = await repo.findOne({
            //     where: {
            //         doctorId: createAppointmentDto.doctorId,
            //         appointmentDate: appointmentDate,
            //         appointmentTime: new Date().toISOString(),
            //     },
            // });
            // if (existing) {
            //     throw new ConflictException('An appointment already exists for this doctor at the specified date and time');
            // }

            const appointment = repo.create({
                doctorId: createAppointmentDto.doctorId,
                patientId: patientData.id,
            });

            return repo.save(appointment);
        } catch (error) {
            console.log(error)
        }
    }

    async findAll(query: QueryAppointmentDto) {
        const repo = this.databaseService.repoAppointment();
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const qb = repo.createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .skip(skip)
            .take(limit);

        // Apply where conditions
        if (query.status) {
            qb.andWhere('appointment.status = :status', { status: query.status });
        }
        if (query.appointmentType) {
            qb.andWhere('appointment.appointmentType = :appointmentType', { appointmentType: query.appointmentType });
        }
        if (query.doctorId) {
            qb.andWhere('appointment.doctorId = :doctorId', { doctorId: query.doctorId });
        }
        if (query.patientId) {
            qb.andWhere('appointment.patientId = :patientId', { patientId: query.patientId });
        }
        if (query.startDate && query.endDate) {
            qb.andWhere('appointment.appointmentDate BETWEEN :startDate AND :endDate', {
                startDate: query.startDate,
                endDate: query.endDate,
            });
        } else if (query.startDate) {
            qb.andWhere('appointment.appointmentDate >= :startDate', { startDate: query.startDate });
        } else if (query.endDate) {
            qb.andWhere('appointment.appointmentDate <= :endDate', { endDate: query.endDate });
        }

        // Search
        if (query.search) {
            qb.andWhere(
                '(patient.name ILIKE :search OR patient.phone ILIKE :search OR doctor.firstName ILIKE :search OR doctor.lastName ILIKE :search)',
                { search: `%${query.search}%` }
            );
        }

        // Sorting
        const sortBy = query.sortBy ?? 'appointmentDate';
        const sortOrder = query.sortOrder ?? 'ASC';
        const validSortFields = ['appointmentDate', 'appointmentTime', 'createdAt', 'updatedAt', 'consultationFee', 'status'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'appointmentDate';
        qb.orderBy(`appointment.${sortField}`, sortOrder);

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
        const repo = this.databaseService.repoAppointment();
        const appointment = await repo.findOne({
            where: { id },
            relations: { doctor: true, patient: true },
        });
        if (!appointment) {
            throw new NotFoundException(`Appointment with ID "${id}" not found`);
        }
        return appointment;
    }

    async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
        const repo = this.databaseService.repoAppointment();
        const appointment = await repo.findOne({ where: { id } });
        if (!appointment) {
            throw new NotFoundException(`Appointment with ID "${id}" not found`);
        }

        // If updating date/time, check for conflicts (excluding current appointment)
        // if (updateAppointmentDto.appointmentDate || updateAppointmentDto.appointmentTime) {
        //     const checkDate = updateAppointmentDto.appointmentDate
        //         ? new Date(updateAppointmentDto.appointmentDate)
        //         : appointment.appointmentDate;
        //     const checkTime = updateAppointmentDto.appointmentTime ?? appointment.appointmentTime;
        //     const checkDoctorId = updateAppointmentDto.doctorId ?? appointment.doctorId;

        //     const existing = await repo.findOne({
        //         where: {
        //             doctorId: checkDoctorId,
        //             appointmentDate: checkDate,
        //             appointmentTime: checkTime,
        //         },
        //     });
        //     if (existing && existing.id !== id) {
        //         throw new ConflictException('An appointment already exists for this doctor at the specified date and time');
        //     }
        // }

        // Validate doctor exists if being updated
        // if (updateAppointmentDto.doctorId) {
        //     const doctor = await this.databaseService.repoDoctor().findOne({ where: { id: updateAppointmentDto.doctorId } });
        //     if (!doctor) {
        //         throw new NotFoundException(`Doctor with ID "${updateAppointmentDto.doctorId}" not found`);
        //     }
        // }

        // // Validate patient exists if being updated
        // if (updateAppointmentDto.patientId) {
        //     const patient = await this.databaseService.repoPatients().findOne({ where: { id: updateAppointmentDto.patientId } });
        //     if (!patient) {
        //         throw new NotFoundException(`Patient with ID "${updateAppointmentDto.patientId}" not found`);
        //     }
        // }

        // // Convert date string to Date object if provided
        // const updateData: any = { ...updateAppointmentDto };
        // if (updateAppointmentDto.appointmentDate) {
        //     updateData.appointmentDate = new Date(updateAppointmentDto.appointmentDate);
        // }

        // await repo.update(id, updateData);
        return repo.findOne({ where: { id }, relations: { doctor: true, patient: true } });
    }

    async remove(id: string) {
        const repo = this.databaseService.repoAppointment();
        const appointment = await repo.findOne({ where: { id } });
        if (!appointment) {
            throw new NotFoundException(`Appointment with ID "${id}" not found`);
        }
        await repo.delete(id);
        return { message: 'Appointment deleted successfully' };
    }

    async findByDoctor(doctorId: string) {
        const repo = this.databaseService.repoAppointment();
        const doctor = await this.databaseService.repoDoctor().findOne({ where: { id: doctorId } });
        if (!doctor) {
            throw new NotFoundException(`Doctor with ID "${doctorId}" not found`);
        }
        return repo.find({
            where: { doctorId },
            relations: { patient: true, doctor: true },
            order: { appointmentDate: 'ASC', appointmentTime: 'ASC' },
        });
    }

    async findByPatient(patientId: string) {
        const repo = this.databaseService.repoAppointment();
        const patient = await this.databaseService.repoPatients().findOne({ where: { id: patientId } });
        if (!patient) {
            throw new NotFoundException(`Patient with ID "${patientId}" not found`);
        }
        return repo.find({
            where: { patientId },
            relations: { doctor: true, patient: true },
            order: { appointmentDate: 'ASC', appointmentTime: 'ASC' },
        });
    }

    async findToday() {
        const repo = this.databaseService.repoAppointment();
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        return repo.find({
            where: {
                appointmentDate: Between(startOfDay, endOfDay),
            },
            relations: { doctor: true, patient: true },
            order: { appointmentTime: 'ASC' },
        });
    }

    async findUpcoming() {
        const repo = this.databaseService.repoAppointment();
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        return repo.find({
            where: {
                appointmentDate: MoreThanOrEqual(startOfDay),
                status: AppointmentStatus.Pending,
            },
            relations: { doctor: true, patient: true },
            order: { appointmentDate: 'ASC', appointmentTime: 'ASC' },
        });
    }
}
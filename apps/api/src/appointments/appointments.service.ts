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
import { Appointment, AppointmentStatus, AppointmentType, Patients, AppointmentBookingType } from '@hospital/database';
import { And, Between, LessThan, MoreThanOrEqual } from 'typeorm';

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

            let patientData;

            // Handle Patient
            if (createAppointmentDto.existingPatientId) {
                patientData = await patientRepo.findOne({ where: { id: createAppointmentDto.existingPatientId } });
                if (!patientData) {
                    throw new NotFoundException(`Patient with ID "${createAppointmentDto.existingPatientId}" not found`);
                }
            } else {
                if (!createAppointmentDto.name || !createAppointmentDto.phone) {
                    throw new BadRequestException('Patient name and phone are required for a new patient');
                }
                const patient = patientRepo.create({
                    name: createAppointmentDto.name,
                    age: createAppointmentDto.age,
                    gender: createAppointmentDto.gender,
                    weight: createAppointmentDto.weight,
                    bloodPresure: createAppointmentDto.bloodPresure,
                    phone: createAppointmentDto.phone,
                });
                patientData = await patientRepo.save(patient);
            }

            // Handle Dates and Booking Type
            const bookingType = createAppointmentDto.bookingType || AppointmentBookingType.LIVE;
            let appointmentDate: Date;
            let appointmentTime: string;

            if (bookingType === AppointmentBookingType.LIVE) {
                const now = new Date();
                appointmentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                appointmentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            } else {
                if (!createAppointmentDto.appointmentDate) {
                    throw new BadRequestException('Appointment date is required for FUTURE bookings');
                }
                appointmentDate = new Date(createAppointmentDto.appointmentDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (appointmentDate < today) {
                    throw new BadRequestException('Appointment date cannot be in the past');
                }
                appointmentTime = createAppointmentDto.appointmentTime || '00:00';

                // Check for duplicate future appointment (same doctor, same date, same time)
                const existing = await repo.findOne({
                    where: {
                        doctorId: createAppointmentDto.doctorId,
                        appointmentDate: appointmentDate,
                        appointmentTime: appointmentTime,
                    },
                });
                if (existing) {
                    throw new ConflictException('An appointment already exists for this doctor at the specified date and time');
                }
            }

            const apptType = createAppointmentDto.appointmentType || AppointmentType.New;

            const appointment = repo.create({
                doctorId: createAppointmentDto.doctorId,
                patientId: patientData.id,
                bookingType: bookingType,
                appointmentDate: appointmentDate,
                appointmentTime: appointmentTime,
                appointmentType: apptType,
                paymentStatus: 'Unpaid',
            });

            if (createAppointmentDto.status) {
                appointment.status = createAppointmentDto.status;
            }

            if (createAppointmentDto.consultationFee !== undefined) {
                appointment.consultationFee = createAppointmentDto.consultationFee;
            }

            if (createAppointmentDto.followUpFee !== undefined) {
                appointment.followUpFee = createAppointmentDto.followUpFee;
            }

            const savedAppointment = await repo.save(appointment);



            return savedAppointment;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async findAll(query: QueryAppointmentDto) {
        const repo = this.databaseService.repoAppointment();
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
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
        const validKeys = [
            'doctorId', 'patientId', 'appointmentDate', 'appointmentTime',
            'appointmentType', 'status', 'bookingType', 'visitReason', 'notes',
            'consultationFee', 'followUpFee', 'paymentStatus'
        ];

        const updateData: any = {};
        for (const key of validKeys) {
            if ((updateAppointmentDto as any)[key] !== undefined) {
                updateData[key] = (updateAppointmentDto as any)[key];
            }
        }

        if (updateAppointmentDto.existingPatientId) {
            updateData.patientId = updateAppointmentDto.existingPatientId;
        }

        await repo.update(id, updateData);

        const updatedAppointment = await repo.findOne({ where: { id }, relations: { doctor: true, patient: true } });



        return updatedAppointment;
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
        return repo.find({
            where: { patientId },
            relations: { doctor: true, patient: true },
            order: { appointmentDate: 'DESC', appointmentTime: 'DESC' },
        });
    }

    async getDailyIncome(dateStr?: string) {
        const repo = this.databaseService.repoAppointment();
        const targetDate = dateStr
            ? new Date(`${dateStr}T00:00:00`)
            : new Date();


        targetDate.setHours(0, 0, 0, 0);


        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const appointments = await repo.find({
            where: {
                createdAt: And(
                    MoreThanOrEqual(targetDate),
                    LessThan(nextDate),
                ),
            },
            relations: {
                doctor: true,
                patient: true,
            },
        });

        const doctorRepo = this.databaseService.repoDoctor();
        const allDoctors = await doctorRepo.find();

        const doctorIncomes: Record<string, {
            doctorName: string,
            doctorId: string,
            totalIncome: number,
            consultationIncome: number,
            followUpIncome: number,
            patientCount: number,
            appointmentCount: number,
            appointments: any[],
            uniquePatients: Set<string>,
            date: string
        }> = {};

        const formattedDate = targetDate.toISOString().split('T')[0];

        // Initialize all active doctors with 0 income
        for (const doc of allDoctors) {
            doctorIncomes[doc.id] = {
                doctorId: doc.id,
                doctorName: `${doc.firstName} ${doc.lastName}`,
                totalIncome: 0,
                consultationIncome: 0,
                followUpIncome: 0,
                patientCount: 0,
                appointmentCount: 0,
                appointments: [],
                uniquePatients: new Set<string>(),
                date: formattedDate
            };
        }

        for (const appt of appointments) {
            const docId = appt.doctorId;
            if (!doctorIncomes[docId]) {
                doctorIncomes[docId] = {
                    doctorId: docId,
                    doctorName: appt.doctor ? `${appt.doctor.firstName} ${appt.doctor.lastName}` : 'Unknown',
                    totalIncome: 0,
                    consultationIncome: 0,
                    followUpIncome: 0,
                    patientCount: 0,
                    appointmentCount: 0,
                    appointments: [],
                    uniquePatients: new Set<string>(),
                    date: formattedDate
                };
            }

            const consultationFee = Number(appt.consultationFee || 0);
            const followUpFee = Number(appt.followUpFee || 0);
            const income = consultationFee + followUpFee;

            doctorIncomes[docId].totalIncome += income;
            doctorIncomes[docId].consultationIncome += consultationFee;
            doctorIncomes[docId].followUpIncome += followUpFee;
            doctorIncomes[docId].appointmentCount += 1;

            const patientId = appt.patientId || (appt.patient as any)?.id;
            if (patientId) {
                doctorIncomes[docId].uniquePatients.add(patientId);
            }
            doctorIncomes[docId].patientCount = doctorIncomes[docId].uniquePatients.size;

            doctorIncomes[docId].appointments.push({
                appointmentId: appt.id,
                patientName: appt.patient ? (appt.patient as any).name || (appt.patient as any).firstName || 'Unknown' : 'Unknown',
                appointmentType: appt.appointmentType,
                feeEarned: income,
                consultationFee,
                followUpFee
            });
        }

        const doctorsList = Object.values(doctorIncomes).map(doc => {
            const { uniquePatients, ...rest } = doc;
            return rest;
        });

        const summary = {
            totalIncome: doctorsList.reduce((sum, doc) => sum + doc.totalIncome, 0),
            consultationIncome: doctorsList.reduce((sum, doc) => sum + doc.consultationIncome, 0),
            followUpIncome: doctorsList.reduce((sum, doc) => sum + doc.followUpIncome, 0),
            patientCount: doctorsList.reduce((sum, doc) => sum + doc.patientCount, 0),
            appointmentCount: doctorsList.reduce((sum, doc) => sum + doc.appointmentCount, 0),
            date: formattedDate
        };
        // console.log(doctorsList, "----");
        return {
            summary,
            doctors: doctorsList
        };
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
import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientTestQueryDto } from './dto/patient-test-query.dto';
import { SampleStatus } from '@hospital/database';

@Injectable()
export class PatientsService {
  constructor(private readonly databaseService: DatabaseService) { }

  async create(createPatientDto: CreatePatientDto) {
    try {
      const repo = this.databaseService.repoPatients();
      const payload: Partial<CreatePatientDto> = { ...createPatientDto };
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (payload.referredBy !== undefined && payload.referredBy !== null) {
        if (typeof payload.referredBy !== 'string' || payload.referredBy.trim().length > 255) {
          throw new BadRequestException('Referred by must be a valid string under 255 characters');
        }
        payload.referredBy = payload.referredBy.trim() || null;
      }

      if (payload.referredByDoctorId !== undefined && payload.referredByDoctorId !== null && String(payload.referredByDoctorId).trim() !== '') {
        const docId = String(payload.referredByDoctorId).trim();
        if (!UUID_REGEX.test(docId)) {
          throw new BadRequestException('Invalid referredByDoctorId format');
        }
        const doctor = await this.databaseService.repoDoctor().findOne({ where: { id: docId } });
        if (!doctor) {
          throw new BadRequestException('Referred doctor not found');
        }
        payload.referredByDoctorId = doctor.id;
        const full = `${(doctor.firstName || '').trim()} ${(doctor.lastName || '').trim()}`.trim();
        const formatted = /^dr\.?\s+/i.test(full) ? full : `Dr. ${full}`;
        payload.referredBy = payload.referredBy || formatted;
      } else {
        payload.referredByDoctorId = null;
      }

      const patient = repo.create(payload as any);

      return repo.save(patient);
    } catch (error: any) {

      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const qb = this.databaseService.repoPatients().createQueryBuilder('patient')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('patient.createdAt', 'DESC');

    if (search) {
      qb.where('patient.name ILIKE :search OR patient.phone ILIKE :search OR patient.patientId ILIKE :search', { search: `%${search}%` });
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
    return this.databaseService.repoPatients().findOne({
      where: { id },
      relations: {
        appointments: {
          doctor: true,
        },
        reports: {
          labResult: true,
        },
        billings: true,
      },
      order: {
        appointments: {
          appointmentDate: 'DESC',
        },
        reports: {
          createdAt: 'DESC',
        },
        billings: {
          createdAt: 'DESC',
        },
      },
    });
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    return this.databaseService.repoPatients().update(id, updatePatientDto);
  }

  async getPatientDetails(id: string) {
    const patient = await this.databaseService.repoPatients().findOne({
      where: { id }
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const billings = await this.databaseService.repoBilling().find({
      where: { patientId: id }
    });

    let totalAmount = 0;
    let discountAmount = 0;
    let paidAmount = 0;
    let dueAmount = 0;

    for (const bill of billings) {
      totalAmount += Number(bill.totalAmount) || 0;
      discountAmount += Number(bill.discountAmount) || 0;
      paidAmount += Number(bill.paidAmount) || 0;
      dueAmount += Number(bill.dueAmount) || 0;
    }

    const assignedTests = await this.databaseService.repoSampleCollection().find({
      where: { patientId: id },
      relations: { test: true, billing: true },
      order: { createdAt: 'DESC' },
      take: 5
    });

    const totalTests = await this.databaseService.repoSampleCollection().count({ where: { patientId: id } });
    const completedTests = await this.databaseService.repoSampleCollection().count({ where: { patientId: id, status: SampleStatus.COLLECTED } });
    const pendingTests = await this.databaseService.repoSampleCollection().count({ where: { patientId: id, status: SampleStatus.PENDING } });

    // Timeline logic
    const timeline = [];
    timeline.push({ type: 'PATIENT_CREATED', date: patient.createdAt, details: 'Patient registered' });

    assignedTests.forEach(test => {
      timeline.push({ type: 'TEST_ASSIGNED', date: test.createdAt, details: `${test.test?.name} assigned` });
      if (test.status === 'COLLECTED' && test.updatedAt) {
        timeline.push({ type: 'TEST_COMPLETED', date: test.updatedAt, details: `${test.test?.name} sample collected` });
      }
    });

    const payments = await this.databaseService.repoPaymentTransaction().find({
      where: { patientId: id },
      order: { createdAt: 'DESC' },
      take: 5
    });
    payments.forEach(payment => {
      timeline.push({ type: 'PAYMENT_RECEIVED', date: payment.createdAt, details: `Payment received - ৳${payment.amount}` });
    });

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      patient,
      summary: {
        totalTests,
        completedTests,
        pendingTests,
        totalAmount,
        discountAmount,
        paidAmount,
        dueAmount
      },
      assignedTests: {
        data: assignedTests,
      },
      timeline: timeline.slice(0, 10)
    };
  }

  async getPatientTests(id: string, query: PatientTestQueryDto) {
    const { page = 1, limit = 10, search, status, startDate, endDate, paymentStatus } = query;

    const qb = this.databaseService.repoSampleCollection().createQueryBuilder('sample')
      .leftJoinAndSelect('sample.test', 'test')
      .leftJoinAndSelect('sample.billing', 'billing')
      .where('sample.patientId = :patientId', { patientId: id })
      .orderBy('sample.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('test.name ILIKE :search', { search: `%${search}%` });
    }

    if (status) {
      qb.andWhere('sample.status = :status', { status });
    }

    if (startDate && endDate) {
      qb.andWhere('sample.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    if (paymentStatus) {
      qb.andWhere('billing.paymentStatus = :paymentStatus', { paymentStatus });
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

  async remove(id: string) {
    return this.databaseService.repoPatients().delete(id);
  }
}

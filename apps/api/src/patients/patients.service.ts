import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientTestQueryDto } from './dto/patient-test-query.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly databaseService: DatabaseService) { }

  async create(createPatientDto: CreatePatientDto) {
    try {
      const repo = this.databaseService.repoPatients();
      const patient = repo.create(createPatientDto);

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
          testOrder: true,
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

    const assignedTests = await this.databaseService.repoTestOrder().find({
      where: { patientId: id },
      relations: { test: true, billing: true },
      order: { createdAt: 'DESC' },
      take: 5
    });

    const totalTests = await this.databaseService.repoTestOrder().count({ where: { patientId: id } });
    const completedTests = await this.databaseService.repoTestOrder().count({ where: { patientId: id, status: 'Completed' } });
    const pendingTests = await this.databaseService.repoTestOrder().count({ where: { patientId: id, status: 'Pending' } });

    // Timeline logic
    const timeline = [];
    timeline.push({ type: 'PATIENT_CREATED', date: patient.createdAt, details: 'Patient registered' });
    
    assignedTests.forEach(test => {
        timeline.push({ type: 'TEST_ASSIGNED', date: test.createdAt, details: `${test.test?.name} assigned` });
        if (test.status === 'Completed' && test.updatedAt) {
             timeline.push({ type: 'TEST_COMPLETED', date: test.updatedAt, details: `${test.test?.name} completed` });
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
    
    const qb = this.databaseService.repoTestOrder().createQueryBuilder('testOrder')
      .leftJoinAndSelect('testOrder.test', 'test')
      .leftJoinAndSelect('testOrder.billing', 'billing')
      .where('testOrder.patientId = :patientId', { patientId: id })
      .orderBy('testOrder.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('test.name ILIKE :search', { search: `%${search}%` });
    }

    if (status) {
      qb.andWhere('testOrder.status = :status', { status });
    }

    if (startDate && endDate) {
      qb.andWhere('testOrder.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
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

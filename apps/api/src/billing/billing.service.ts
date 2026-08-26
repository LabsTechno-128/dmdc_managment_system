import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Billing, BillingItem, TestOrder, PatientType, Patients, LabTest, Appointment, PaymentTransaction, PaymentTransactionType, BillingType } from '@hospital/database';

@Injectable()
export class BillingService {
    constructor(private readonly databaseService: DatabaseService) { }

    async create(data: any) {
        const { items, patientId, discountType, discount, additionalCharges, paymentMethod, paidAmount } = data;

        if (!items || items.length === 0) {
            throw new BadRequestException('Billing items are required');
        }

        const dataSource = this.databaseService.getDataSource();
        const queryRunner = dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Verify Patient
            const patient = await queryRunner.manager.findOne(Patients, { where: { id: patientId } });
            if (!patient) {
                throw new BadRequestException('Patient not found');
            }

            // 2. Fetch Tests and Verify Prices
            let subtotal = 0;
            const validItems = [];
            for (const item of items) {
                const test = await queryRunner.manager.findOne(LabTest, { where: { id: Number(item.testId) } });
                if (!test) {
                    throw new BadRequestException(`Test with ID ${item.testId} not found`);
                }
                const testPrice = Number(test.billRate) || 0;
                subtotal += testPrice;
                validItems.push({
                    testId: test.id,
                    price: testPrice
                });
            }

            // 3. Calculate Discount & Total
            const discountValue = Number(discount) || 0;
            let discountAmount = 0;

            if (discountType === 'PERCENTAGE') {
                if (discountValue > 100 || discountValue < 0) throw new BadRequestException('Invalid discount percentage');
                discountAmount = subtotal * (discountValue / 100);
            } else {
                if (discountValue < 0 || discountValue > subtotal) throw new BadRequestException('Invalid discount amount');
                discountAmount = discountValue;
            }

            const additional = Number(additionalCharges) || 0;
            const totalAmount = subtotal - discountAmount + additional;

            if (totalAmount < 0) {
                throw new BadRequestException('Total amount cannot be negative');
            }

            // Determine paidAmount, dueAmount and paymentStatus
            const paid = Number(paidAmount) || 0;
            const due = Math.max(0, totalAmount - paid);

            let status = 'Unpaid';
            if (paid >= totalAmount && totalAmount > 0) {
                status = 'Paid';
            } else if (paid > 0 && paid < totalAmount) {
                status = 'Partial';
            } else if (totalAmount === 0) {
                status = 'Paid';
            }

            // 4. Generate Bill Number
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            // Get count for today to generate sequence
            const countResult = await queryRunner.query(
                `SELECT COUNT(*) FROM billings WHERE DATE("createdAt") = CURRENT_DATE`
            );
            const count = Number(countResult[0].count) || 0;
            const seq = String(count + 1).padStart(4, '0');
            const billNumber = `BILL-${dateStr}-${seq}`;

            // 5. Create Billing Record
            const newBilling = queryRunner.manager.create(Billing, {
                billNumber,
                patientId,
                patientType: patient.patientType,
                subtotal,
                discountType: discountType || 'FIXED',
                discount: discountValue,
                discountAmount,
                additionalCharges: additional,
                totalAmount,
                paidAmount: paid,
                dueAmount: due,
                paymentMethod: paymentMethod || 'Cash',
                paymentStatus: status
            });

            const savedBilling = await queryRunner.manager.save(newBilling);

            // 6. Create Billing Items
            const billingItemsToSave = validItems.map(item => queryRunner.manager.create(BillingItem, {
                billingId: savedBilling.id,
                testId: item.testId,
                price: item.price
            }));
            await queryRunner.manager.save(billingItemsToSave);

            // 7. Create Test Orders
            const testOrdersToSave = validItems.map(item => queryRunner.manager.create(TestOrder, {
                patientId: savedBilling.patientId,
                billingId: savedBilling.id,
                testId: item.testId,
                status: 'Waiting'
            }));
            await queryRunner.manager.save(testOrdersToSave);

            await queryRunner.commitTransaction();

            return this.databaseService.repoBilling().findOne({
                where: { id: savedBilling.id },
                relations: { 
                    patient: { appointments: true },
                    items: { test: true }
                }
            });

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(query?: { page?: string, limit?: string, search?: string }) {
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.max(1, Number(query?.limit) || 10);
        const search = query?.search || '';

        const qb = this.databaseService.repoBilling()
            .createQueryBuilder('billing')
            .leftJoinAndSelect('billing.patient', 'patient')
            .leftJoinAndSelect('billing.items', 'item')
            .leftJoinAndSelect('item.test', 'test')
            .orderBy('billing.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (search) {
            qb.where('billing.billNumber ILIKE :search', { search: `%${search}%` })
                .orWhere('billing.id::text ILIKE :search', { search: `%${search}%` })
                .orWhere('patient.firstName ILIKE :search', { search: `%${search}%` })
                .orWhere('patient.lastName ILIKE :search', { search: `%${search}%` })
                .orWhere('patient.name ILIKE :search', { search: `%${search}%` });
        }

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findOne(id: string) {
        const billing = await this.databaseService.repoBilling().findOne({
            where: { id },
            relations: { patient: true, items: true }
        });
        if (!billing) throw new BadRequestException('Billing not found');

        const items = await this.databaseService.repoBillingItem().find({
            where: { billingId: id },
            relations: { test: true }
        });
        return { ...billing, items };
    }

    async updateStatus(id: string, paymentStatus: string) {
        await this.databaseService.repoBilling().update(id, { paymentStatus });
        return this.databaseService.repoBilling().findOne({ where: { id } });
    }

    async updatePayment(id: string, additionalAmount: number) {
        const billing = await this.databaseService.repoBilling().findOne({ where: { id } });
        if (!billing) throw new BadRequestException('Billing not found');

        const totalAmount = Number(billing.totalAmount);
        const addAmount = Number(additionalAmount) || 0;
        const paid = Number(billing.paidAmount) + addAmount;
        const due = Math.max(0, totalAmount - paid);

        let status = 'Unpaid';
        if (paid >= totalAmount && totalAmount > 0) {
            status = 'Paid';
        } else if (paid > 0 && paid < totalAmount) {
            status = 'Partial';
        } else if (totalAmount === 0) {
            status = 'Paid';
        }

        await this.databaseService.repoBilling().update(id, {
            paidAmount: paid,
            dueAmount: due,
            paymentStatus: status
        });

        return this.databaseService.repoBilling().findOne({ where: { id } });
    }

    async createConsultationBill(appointmentId: string, data: any) {
        const { discountType, discount, additionalCharges, paymentMethod, paidAmount, receivedById } = data;

        const dataSource = this.databaseService.getDataSource();
        const queryRunner = dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Verify Appointment
            const appointment = await queryRunner.manager.findOne(Appointment, {
                where: { id: appointmentId },
                relations: { doctor: true, patient: true }
            });

            if (!appointment) {
                throw new NotFoundException('Appointment not found');
            }

            // check if billing already exists
            const existingBill = await queryRunner.manager.findOne(Billing, { where: { appointmentId } });
            if (existingBill) {
                throw new BadRequestException('A bill already exists for this appointment');
            }

            // 2. Calculate values
            const subtotal = Number(appointment.consultationFee);
            const discountValue = Number(discount) || 0;
            let discountAmount = 0;

            if (discountType === 'PERCENTAGE') {
                if (discountValue > 100 || discountValue < 0) throw new BadRequestException('Invalid discount percentage');
                discountAmount = subtotal * (discountValue / 100);
            } else {
                if (discountValue < 0 || discountValue > subtotal) throw new BadRequestException('Invalid discount amount');
                discountAmount = discountValue;
            }

            const additional = Number(additionalCharges) || 0;
            const totalAmount = subtotal - discountAmount + additional;

            if (totalAmount < 0) {
                throw new BadRequestException('Total amount cannot be negative');
            }

            const paid = Number(paidAmount) || 0;
            const due = Math.max(0, totalAmount - paid);

            let status = 'Unpaid';
            if (paid >= totalAmount && totalAmount > 0) {
                status = 'Paid';
            } else if (paid > 0 && paid < totalAmount) {
                status = 'Partial';
            } else if (totalAmount === 0) {
                status = 'Paid';
            }

            // 3. Generate Bill Number
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const countResult = await queryRunner.query(
                `SELECT COUNT(*) FROM billings WHERE DATE("createdAt") = CURRENT_DATE`
            );
            const count = Number(countResult[0].count) || 0;
            const seq = String(count + 1).padStart(4, '0');
            const billNumber = `CONS-${dateStr}-${seq}`; // distinct prefix for consultation bills

            // 4. Create Billing Record
            const newBilling = queryRunner.manager.create(Billing, {
                billNumber,
                patientId: appointment.patientId,
                appointmentId: appointment.id,
                doctorId: appointment.doctorId,
                billingType: BillingType.CONSULTATION,
                patientType: PatientType.IN_HOUSE,
                subtotal,
                discountType: discountType || 'FIXED',
                discount: discountValue,
                discountAmount,
                additionalCharges: additional,
                totalAmount,
                paidAmount: paid,
                dueAmount: due,
                paymentMethod: paymentMethod || 'Cash',
                paymentStatus: status
            });

            const savedBilling = await queryRunner.manager.save(newBilling);

            // 5. Create Billing Item
            const billingItem = queryRunner.manager.create(BillingItem, {
                billingId: savedBilling.id,
                description: `Consultation Fee - Dr. ${appointment.doctor.lastName}`,
                price: subtotal
            });
            await queryRunner.manager.save(billingItem);

            // 6. Optionally create initial payment transaction if paidAmount > 0
            if (paid > 0) {
                const transaction = queryRunner.manager.create(PaymentTransaction, {
                    billingId: savedBilling.id,
                    patientId: savedBilling.patientId,
                    amount: paid,
                    paymentMethod: paymentMethod || 'Cash',
                    type: PaymentTransactionType.PAYMENT,
                    receivedById: receivedById,
                    status: 'Completed',
                    notes: 'Initial Payment'
                });
                await queryRunner.manager.save(transaction);
            }

            // 7. Sync appointment payment status
            appointment.paymentStatus = status;
            await queryRunner.manager.save(appointment);

            await queryRunner.commitTransaction();

            return this.databaseService.repoBilling().findOne({
                where: { id: savedBilling.id },
                relations: { patient: true, items: true }
            });

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async createPayment(billingId: string, data: any) {
        const { amount, paymentMethod, receivedById, notes } = data;

        const payAmount = Number(amount);
        if (payAmount <= 0) {
            throw new BadRequestException('Payment amount must be greater than zero');
        }

        const dataSource = this.databaseService.getDataSource();
        const queryRunner = dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const billing = await queryRunner.manager.findOne(Billing, { where: { id: billingId } });
            if (!billing) {
                throw new NotFoundException('Billing record not found');
            }

            const totalAmount = Number(billing.totalAmount);
            let currentPaid = Number(billing.paidAmount);
            let currentDue = Number(billing.dueAmount);

            if (payAmount > currentDue) {
                throw new BadRequestException(`Cannot pay more than the due amount. Current due is ${currentDue}`);
            }

            // 1. Create Transaction Record
            const transaction = queryRunner.manager.create(PaymentTransaction, {
                billingId: billing.id,
                patientId: billing.patientId,
                amount: payAmount,
                paymentMethod: paymentMethod || 'Cash',
                type: PaymentTransactionType.PAYMENT,
                receivedById: receivedById,
                status: 'Completed',
                notes: notes
            });
            await queryRunner.manager.save(transaction);

            // 2. Update Billing
            currentPaid += payAmount;
            currentDue = Math.max(0, totalAmount - currentPaid);

            let status = 'Unpaid';
            if (currentPaid >= totalAmount && totalAmount > 0) {
                status = 'Paid';
            } else if (currentPaid > 0 && currentPaid < totalAmount) {
                status = 'Partial';
            } else if (totalAmount === 0) {
                status = 'Paid';
            }

            billing.paidAmount = currentPaid;
            billing.dueAmount = currentDue;
            billing.paymentStatus = status;
            await queryRunner.manager.save(billing);

            // 3. Sync with Appointment if linked
            if (billing.appointmentId) {
                const appointment = await queryRunner.manager.findOne(Appointment, { where: { id: billing.appointmentId } });
                if (appointment) {
                    appointment.paymentStatus = status;
                    await queryRunner.manager.save(appointment);
                }
            }

            await queryRunner.commitTransaction();

            return transaction;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getPayments(billingId: string) {
        return this.databaseService.repoPaymentTransaction().find({
            where: { billingId },
            relations: { receivedBy: true },
            order: { createdAt: 'DESC' }
        });
    }
}

import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SettingsService } from '../settings/settings.service';
import {
    Billing,
    BillingItem,
    PatientType,
    Patients,
    LabTest,
    Appointment,
    PaymentTransaction,
    PaymentTransactionType,
    BillingType,
    UserRole
} from '@hospital/database';

function round(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
}

@Injectable()
export class BillingService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly settingsService: SettingsService,
    ) { }

    async create(data: any, user?: any) {
        const { items, patientId, discountType, discount, additionalCharges, paymentMethod, paidAmount, referredBy, vatRate: reqVatRate } = data;

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
            subtotal = round(subtotal);

            // 3. Calculate Discount
            const discountValue = Number(discount) || 0;
            let discountAmount = 0;

            if (discountType === 'PERCENTAGE') {
                if (discountValue > 100 || discountValue < 0) throw new BadRequestException('Invalid discount percentage');
                discountAmount = round(subtotal * (discountValue / 100));
            } else {
                if (discountValue < 0 || discountValue > subtotal) throw new BadRequestException('Invalid discount amount');
                discountAmount = round(discountValue);
            }

            // 4. Calculate Taxable Amount (Subtotal - Discount)
            const taxableAmount = round(Math.max(0, subtotal - discountAmount));

            // 5. Calculate VAT after Discount
            const hospitalSetting = await this.settingsService.getSettings();
            const vatRate = reqVatRate !== undefined && reqVatRate !== null && reqVatRate !== ''
                ? Math.max(0, round(Number(reqVatRate)))
                : (Number(hospitalSetting.defaultVatRate) || 0);
            const vatAmount = round(taxableAmount * (vatRate / 100));

            // 6. Additional Charges & Final Invoice Total
            const additional = round(Math.max(0, Number(additionalCharges) || 0));
            const totalAmount = round(taxableAmount + vatAmount + additional);

            if (totalAmount < 0) {
                throw new BadRequestException('Total amount cannot be negative');
            }

            // 7. Determine Paid Amount, Due Amount and Payment Status
            const paid = round(Math.max(0, Number(paidAmount) || 0));
            if (paid > totalAmount) {
                throw new BadRequestException('Paid amount cannot exceed total invoice amount');
            }
            const due = round(Math.max(0, totalAmount - paid));

            let status = 'Unpaid';
            if (due === 0) {
                status = 'Paid';
            } else if (paid > 0 && due > 0) {
                status = 'Partial';
            }

            // 8. Generate Bill Number
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const countResult = await queryRunner.query(
                `SELECT COUNT(*) FROM billings WHERE DATE("createdAt") = CURRENT_DATE`
            );
            const count = Number(countResult[0]?.count) || 0;
            const seq = String(count + 1).padStart(4, '0');
            const billNumber = `BILL-${dateStr}-${seq}`;
            const musakChallanNumber = data.musakChallanNumber || billNumber;

            // 9. Create Billing Record with Authorization and Identity
            const newBilling = queryRunner.manager.create(Billing, {
                billNumber,
                patientId,
                patientType: patient.patientType,
                subtotal,
                discountType: discountType || 'FIXED',
                discount: discountValue,
                discountAmount,
                taxableAmount,
                vatRate,
                vatAmount,
                additionalCharges: additional,
                totalAmount,
                paidAmount: paid,
                waivedAmount: 0,
                dueAmount: due,
                paymentMethod: paymentMethod || 'Cash',
                paymentStatus: status,
                referredBy: referredBy || undefined,
                musakChallanNumber,
                createdById: user?.id || undefined,
                authorizedById: user?.id || undefined,
                authorizedAt: user?.id ? new Date() : undefined,
            });

            const savedBilling = await queryRunner.manager.save(newBilling);

            // 10. Create Billing Items
            const billingItemsToSave = validItems.map(item => queryRunner.manager.create(BillingItem, {
                billingId: savedBilling.id,
                testId: item.testId,
                price: item.price
            }));
            await queryRunner.manager.save(billingItemsToSave);

            // 11. Initial Payment Transaction
            if (paid > 0) {
                const transaction = queryRunner.manager.create(PaymentTransaction, {
                    billingId: savedBilling.id,
                    patientId: savedBilling.patientId,
                    amount: paid,
                    paymentMethod: paymentMethod || 'Cash',
                    type: PaymentTransactionType.PAYMENT,
                    receivedById: data.receivedById || user?.id || null,
                    status: 'Completed',
                    notes: data.notes || 'Initial Payment'
                });
                await queryRunner.manager.save(transaction);
            }

            await queryRunner.commitTransaction();

            return this.databaseService.repoBilling().findOne({
                where: { id: savedBilling.id },
                relations: {
                    patient: { appointments: true },
                    items: { test: true },
                    createdBy: true,
                    authorizedBy: true,
                    settledBy: true
                }
            });

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(query?: { page?: string, limit?: string, search?: string }, user?: any) {
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.max(1, Number(query?.limit) || 10);
        const search = query?.search || '';

        const qb = this.databaseService.repoBilling()
            .createQueryBuilder('billing')
            .leftJoinAndSelect('billing.patient', 'patient')
            .leftJoinAndSelect('billing.items', 'item')
            .leftJoinAndSelect('item.test', 'test')
            .leftJoinAndSelect('billing.createdBy', 'createdBy')
            .leftJoinAndSelect('billing.authorizedBy', 'authorizedBy')
            .leftJoinAndSelect('billing.settledBy', 'settledBy')
            .orderBy('billing.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (user && user.role === UserRole.USER) {
            qb.andWhere(
                '(patient.email = :userEmail OR patient.phone = :userPhone)',
                { userEmail: user.email || '', userPhone: user.phone || '' }
            );
        }

        if (search) {
            qb.andWhere(
                '(billing.billNumber ILIKE :search OR billing.id::text ILIKE :search OR patient.patientId ILIKE :search OR patient.name ILIKE :search OR patient.phone ILIKE :search)',
                { search: `%${search}%` }
            );
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

    async findOne(id: string, user?: any) {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!id || !UUID_REGEX.test(id)) {
            throw new BadRequestException('Invalid invoice ID format');
        }

        const billing = await this.databaseService.repoBilling().findOne({
            where: { id },
            relations: {
                patient: true,
                createdBy: true,
                authorizedBy: true,
                settledBy: true
            }
        });
        if (!billing) {
            throw new NotFoundException('Invoice not found');
        }

        // Ownership validation: If the user is a regular patient/user, verify ownership
        if (user && user.role === UserRole.USER) {
            const patient = billing.patient;
            const matchesEmail = user.email && patient?.email && user.email.toLowerCase() === patient.email.toLowerCase();
            const matchesPhone = user.phone && patient?.phone && user.phone.replace(/\D/g, '') === patient.phone.replace(/\D/g, '');
            const matchesId = (user as any).patientId && patient?.id === (user as any).patientId;

            if (!matchesEmail && !matchesPhone && !matchesId) {
                throw new ForbiddenException('You are not authorized to view this invoice');
            }
        }

        const items = await this.databaseService.repoBillingItem().find({
            where: { billingId: id },
            relations: { test: true },
            order: { createdAt: 'ASC' }
        });

        const payments = await this.databaseService.repoPaymentTransaction().find({
            where: { billingId: id },
            relations: { receivedBy: true },
            order: { createdAt: 'DESC' }
        });

        let doctor = null;
        if (billing.doctorId && UUID_REGEX.test(billing.doctorId)) {
            doctor = await this.databaseService.repoDoctor().findOne({
                where: { id: billing.doctorId }
            });
        }

        let clinic = {
            name: 'Dr. Muazzem Medical Diagnostic Center',
            address: '82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka',
            phone: '01234567890, 01234567899',
            email: 'dmdc.contact@gmail.com',
            currency: 'BDT',
            bin: '001234567-0101',
            musakForm: 'Mushak-6.3 (মূসক-৬.৩)',
            defaultVatRate: 0,
        };
        try {
            const hospitalSetting = await this.settingsService.getSettings();
            if (hospitalSetting) {
                clinic = {
                    name: hospitalSetting.centerName || clinic.name,
                    address: hospitalSetting.address || clinic.address,
                    phone: hospitalSetting.phone || clinic.phone,
                    email: hospitalSetting.email || clinic.email,
                    currency: hospitalSetting.currency || clinic.currency,
                    bin: hospitalSetting.bin || clinic.bin,
                    musakForm: hospitalSetting.musakForm || clinic.musakForm,
                    defaultVatRate: Number(hospitalSetting.defaultVatRate) || 0,
                };
            }
        } catch (err) {
            console.warn('[BillingService] Failed to load settings for invoice, using defaults:', err);
        }

        // Backward compatibility safe defaults for legacy invoices
        const subtotalNum = round(Number(billing.subtotal) || 0);
        const discountNum = round(Number(billing.discountAmount) || 0);
        const taxableAmount = billing.taxableAmount !== null && billing.taxableAmount !== undefined
            ? round(Number(billing.taxableAmount))
            : round(Math.max(0, subtotalNum - discountNum));
        const vatRate = Number(billing.vatRate) || 0;
        const vatAmount = Number(billing.vatAmount) || 0;
        const waivedAmount = Number(billing.waivedAmount) || 0;

        return {
            ...billing,
            taxableAmount,
            vatRate,
            vatAmount,
            waivedAmount,
            items,
            payments,
            doctor,
            clinic,
            hospitalSetting: clinic
        };
    }

    async updateStatus(id: string, paymentStatus: string) {
        await this.databaseService.repoBilling().update(id, { paymentStatus });
        return this.databaseService.repoBilling().findOne({ where: { id } });
    }

    async updatePayment(id: string, additionalAmount: number, user?: any) {
        const billing = await this.databaseService.repoBilling().findOne({ where: { id } });
        if (!billing) throw new BadRequestException('Billing not found');

        const addAmount = round(Number(additionalAmount));
        if (addAmount <= 0) {
            throw new BadRequestException('Payment amount must be greater than zero');
        }

        return this.createPayment(id, {
            amount: addAmount,
            paymentMethod: 'Cash',
            notes: 'Update Payment'
        }, user);
    }

    async createConsultationBill(appointmentId: string, data: any, user?: any) {
        const { discountType, discount, additionalCharges, paymentMethod, paidAmount, referredBy, vatRate: reqVatRate } = data;

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

            // Check if billing already exists
            const existingBill = await queryRunner.manager.findOne(Billing, { where: { appointmentId } });
            if (existingBill) {
                throw new BadRequestException('A bill already exists for this appointment');
            }

            // 2. Calculate values
            const subtotal = round(Number(appointment.consultationFee));
            const discountValue = Number(discount) || 0;
            let discountAmount = 0;

            if (discountType === 'PERCENTAGE') {
                if (discountValue > 100 || discountValue < 0) throw new BadRequestException('Invalid discount percentage');
                discountAmount = round(subtotal * (discountValue / 100));
            } else {
                if (discountValue < 0 || discountValue > subtotal) throw new BadRequestException('Invalid discount amount');
                discountAmount = round(discountValue);
            }

            // Taxable Amount (Subtotal - Discount)
            const taxableAmount = round(Math.max(0, subtotal - discountAmount));

            // VAT after Discount
            const hospitalSetting = await this.settingsService.getSettings();
            const vatRate = reqVatRate !== undefined && reqVatRate !== null && reqVatRate !== ''
                ? Math.max(0, round(Number(reqVatRate)))
                : (Number(hospitalSetting.defaultVatRate) || 0);
            const vatAmount = round(taxableAmount * (vatRate / 100));

            const additional = round(Math.max(0, Number(additionalCharges) || 0));
            const totalAmount = round(taxableAmount + vatAmount + additional);

            if (totalAmount < 0) {
                throw new BadRequestException('Total amount cannot be negative');
            }

            const paid = round(Math.max(0, Number(paidAmount) || 0));
            if (paid > totalAmount) {
                throw new BadRequestException('Paid amount cannot exceed total invoice amount');
            }
            const due = round(Math.max(0, totalAmount - paid));

            let status = 'Unpaid';
            if (due === 0) {
                status = 'Paid';
            } else if (paid > 0 && due > 0) {
                status = 'Partial';
            }

            // 3. Generate Bill Number
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const countResult = await queryRunner.query(
                `SELECT COUNT(*) FROM billings WHERE DATE("createdAt") = CURRENT_DATE`
            );
            const count = Number(countResult[0]?.count) || 0;
            const seq = String(count + 1).padStart(4, '0');
            const billNumber = `CONS-${dateStr}-${seq}`;
            const musakChallanNumber = data.musakChallanNumber || billNumber;

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
                taxableAmount,
                vatRate,
                vatAmount,
                additionalCharges: additional,
                totalAmount,
                paidAmount: paid,
                waivedAmount: 0,
                dueAmount: due,
                paymentMethod: paymentMethod || 'Cash',
                paymentStatus: status,
                referredBy: referredBy || undefined,
                musakChallanNumber,
                createdById: user?.id || undefined,
                authorizedById: user?.id || undefined,
                authorizedAt: user?.id ? new Date() : undefined,
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
                    receivedById: data.receivedById || user?.id || null,
                    status: 'Completed',
                    notes: data.notes || 'Initial Payment'
                });
                await queryRunner.manager.save(transaction);
            }

            // 7. Sync appointment payment status
            appointment.paymentStatus = status;
            await queryRunner.manager.save(appointment);

            await queryRunner.commitTransaction();

            return this.databaseService.repoBilling().findOne({
                where: { id: savedBilling.id },
                relations: {
                    patient: true,
                    items: true,
                    createdBy: true,
                    authorizedBy: true,
                    settledBy: true
                }
            });

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async createPayment(billingId: string, data: any, user?: any) {
        const { amount, paymentMethod, notes } = data;

        const payAmount = round(Number(amount));
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

            const totalAmount = round(Number(billing.totalAmount));
            let currentPaid = round(Number(billing.paidAmount));
            const currentWaived = round(Number(billing.waivedAmount || 0));
            const currentDue = round(Math.max(0, totalAmount - currentPaid - currentWaived));

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
                receivedById: data.receivedById || user?.id || null,
                status: 'Completed',
                notes: notes || 'Payment'
            });
            await queryRunner.manager.save(transaction);

            // 2. Update Billing
            currentPaid = round(currentPaid + payAmount);
            const newDue = round(Math.max(0, totalAmount - currentPaid - currentWaived));

            let status = 'Unpaid';
            if (newDue === 0) {
                status = 'Paid';
            } else if (currentPaid > 0 && newDue > 0) {
                status = 'Partial';
            }

            billing.paidAmount = currentPaid;
            billing.dueAmount = newDue;
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

    async settleBalance(billingId: string, data: { amount: number; reason: string }, user?: any) {
        if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN)) {
            throw new ForbiddenException('Only administrators can authorize balance settlements or waivers');
        }

        if (!data || !data.reason || !data.reason.trim()) {
            throw new BadRequestException('A settlement/waiver reason is mandatory');
        }

        const settleAmount = round(Number(data.amount));
        if (isNaN(settleAmount) || settleAmount <= 0) {
            throw new BadRequestException('Settlement amount must be greater than zero');
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

            const totalAmount = round(Number(billing.totalAmount));
            const currentPaid = round(Number(billing.paidAmount));
            const currentWaived = round(Number(billing.waivedAmount || 0));
            const currentDue = round(Math.max(0, totalAmount - currentPaid - currentWaived));

            if (currentDue <= 0) {
                throw new BadRequestException('Invoice has no outstanding balance to settle');
            }

            if (settleAmount > currentDue) {
                throw new BadRequestException(`Settlement amount cannot exceed current due of ${currentDue}`);
            }

            const newWaived = round(currentWaived + settleAmount);
            const newDue = round(Math.max(0, totalAmount - currentPaid - newWaived));

            let status = 'Unpaid';
            if (newDue === 0) {
                status = 'Paid';
            } else if (currentPaid > 0 && newDue > 0) {
                status = 'Partial';
            }

            // Create settlement transaction
            const transaction = queryRunner.manager.create(PaymentTransaction, {
                billingId: billing.id,
                patientId: billing.patientId,
                amount: settleAmount,
                paymentMethod: 'Waiver / Settlement',
                type: PaymentTransactionType.SETTLEMENT,
                receivedById: user.id,
                status: 'Completed',
                notes: `Waived/Settled: ${data.reason.trim()}`
            });
            await queryRunner.manager.save(transaction);

            // Update Billing
            billing.waivedAmount = newWaived;
            billing.dueAmount = newDue;
            billing.paymentStatus = status;
            billing.settlementReason = billing.settlementReason
                ? `${billing.settlementReason}; ${data.reason.trim()}`
                : data.reason.trim();
            billing.settledById = user.id;
            billing.settledAt = new Date();

            await queryRunner.manager.save(billing);

            // Sync with Appointment if linked
            if (billing.appointmentId) {
                const appointment = await queryRunner.manager.findOne(Appointment, { where: { id: billing.appointmentId } });
                if (appointment) {
                    appointment.paymentStatus = status;
                    await queryRunner.manager.save(appointment);
                }
            }

            await queryRunner.commitTransaction();

            return this.databaseService.repoBilling().findOne({
                where: { id: billingId },
                relations: {
                    patient: true,
                    createdBy: true,
                    authorizedBy: true,
                    settledBy: true
                }
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async authorizeInvoice(billingId: string, user?: any) {
        if (!user || !user.id) {
            throw new ForbiddenException('Authentication required to authorize invoice');
        }

        const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT];
        if (!allowedRoles.includes(user.role)) {
            throw new ForbiddenException('You do not have permission to authorize invoices');
        }

        const billing = await this.databaseService.repoBilling().findOne({ where: { id: billingId } });
        if (!billing) {
            throw new NotFoundException('Billing record not found');
        }

        billing.authorizedById = user.id;
        billing.authorizedAt = new Date();

        await this.databaseService.repoBilling().save(billing);

        return this.databaseService.repoBilling().findOne({
            where: { id: billingId },
            relations: {
                patient: true,
                createdBy: true,
                authorizedBy: true,
                settledBy: true
            }
        });
    }

    async getPayments(billingId: string, user?: any) {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!billingId || !UUID_REGEX.test(billingId)) {
            throw new BadRequestException('Invalid invoice ID format');
        }

        const billing = await this.databaseService.repoBilling().findOne({
            where: { id: billingId },
            relations: { patient: true }
        });
        if (!billing) {
            throw new NotFoundException('Invoice not found');
        }

        if (user && user.role === UserRole.USER) {
            const patient = billing.patient;
            const matchesEmail = user.email && patient?.email && user.email.toLowerCase() === patient.email.toLowerCase();
            const matchesPhone = user.phone && patient?.phone && user.phone.replace(/\D/g, '') === patient.phone.replace(/\D/g, '');
            const matchesId = (user as any).patientId && patient?.id === (user as any).patientId;

            if (!matchesEmail && !matchesPhone && !matchesId) {
                throw new ForbiddenException('You are not authorized to view payments for this invoice');
            }
        }

        return this.databaseService.repoPaymentTransaction().find({
            where: { billingId },
            relations: { receivedBy: true },
            order: { createdAt: 'DESC' }
        });
    }
}

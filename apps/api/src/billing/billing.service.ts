import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SettingsService } from '../settings/settings.service';
import {
    Billing,
    BillingItem,
    PatientType,
    Patients,
    Doctor,
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

function isStrictNonNegativeInteger(value: any): boolean {
    if (value === undefined || value === null || value === '') {
        return true;
    }
    if (typeof value === 'number') {
        return Number.isInteger(value) && Number.isFinite(value) && value >= 0;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return true;
        if (!/^\d+$/.test(trimmed)) return false;
        const num = Number(trimmed);
        return Number.isInteger(num) && Number.isFinite(num) && num >= 0;
    }
    return false;
}

function isStrictPositiveInteger(value: any): boolean {
    if (value === undefined || value === null || value === '') {
        return false;
    }
    if (typeof value === 'number') {
        return Number.isInteger(value) && Number.isFinite(value) && value > 0;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!/^\d+$/.test(trimmed)) return false;
        const num = Number(trimmed);
        return Number.isInteger(num) && Number.isFinite(num) && num > 0;
    }
    return false;
}

export const MAX_TEST_AVAILABILITY_NOTE_LENGTH = 2000;

export function normalizeTestAvailabilityNote(value: any): string | null | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        throw new BadRequestException('Test availability note must be a string');
    }
    const trimmed = value.trim();
    if (trimmed.length > MAX_TEST_AVAILABILITY_NOTE_LENGTH) {
        throw new BadRequestException(
            `Test availability note cannot exceed ${MAX_TEST_AVAILABILITY_NOTE_LENGTH} characters`
        );
    }
    return trimmed.length > 0 ? trimmed : null;
}

@Injectable()
export class BillingService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly settingsService: SettingsService,
    ) { }

    private async generateBillNumber(queryRunner: any, prefixType: 'BILL' | 'CONS'): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `${prefixType}-${dateStr}-`;

        const lastBillResult = await queryRunner.query(
            `SELECT "billNumber" FROM billings WHERE "billNumber" LIKE $1 ORDER BY LENGTH("billNumber") DESC, "billNumber" DESC LIMIT 1`,
            [`${prefix}%`]
        );

        let seqNumber = 1;
        if (lastBillResult && lastBillResult.length > 0 && lastBillResult[0]?.billNumber) {
            const parts = String(lastBillResult[0].billNumber).split('-');
            const lastSeq = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastSeq)) {
                seqNumber = lastSeq + 1;
            }

            let seq = String(seqNumber).padStart(4, '0');
            let billNumber = `${prefix}${seq}`;
            let attempts = 0;
            let exists = await queryRunner.query(
                `SELECT 1 FROM billings WHERE "billNumber" = $1 LIMIT 1`,
                [billNumber]
            );
            while (exists && exists.length > 0 && attempts < 100) {
                attempts++;
                seqNumber++;
                seq = String(seqNumber).padStart(4, '0');
                billNumber = `${prefix}${seq}`;
                exists = await queryRunner.query(
                    `SELECT 1 FROM billings WHERE "billNumber" = $1 LIMIT 1`,
                    [billNumber]
                );
            }
            return billNumber;
        } else if (lastBillResult && lastBillResult.length > 0 && lastBillResult[0]?.count !== undefined) {
            const count = Number(lastBillResult[0].count) || 0;
            seqNumber = count + 1;
            const seq = String(seqNumber).padStart(4, '0');
            return `${prefix}${seq}`;
        } else {
            const seq = String(seqNumber).padStart(4, '0');
            return `${prefix}${seq}`;
        }
    }

    async create(data: any, user?: any) {
        const { items, patientId, discountType, discount, additionalCharges, paymentMethod, paidAmount, referredBy, referredByDoctorId, testAvailabilityNote, vatRate: reqVatRate } = data;

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new BadRequestException('Billing items are required');
        }

        // Validate items and their prices
        for (const item of items) {
            if (!item || item.testId === undefined || item.testId === null || item.testId === '') {
                throw new BadRequestException('Valid test item is required');
            }
            if (item.price !== undefined && item.price !== null && item.price !== '') {
                if (!isStrictNonNegativeInteger(item.price)) {
                    throw new BadRequestException('Item price must be a valid non-negative integer');
                }
            }
        }

        // Validate discount
        if (discount !== undefined && discount !== null && discount !== '') {
            if (!isStrictNonNegativeInteger(discount)) {
                throw new BadRequestException('Discount must be a valid non-negative integer');
            }
        }

        // Validate vatRate
        if (reqVatRate !== undefined && reqVatRate !== null && reqVatRate !== '') {
            if (!isStrictNonNegativeInteger(reqVatRate)) {
                throw new BadRequestException('VAT rate must be a valid non-negative integer');
            }
            if (Number(reqVatRate) > 100) {
                throw new BadRequestException('VAT rate cannot exceed 100%');
            }
        }

        // Validate additionalCharges
        if (additionalCharges !== undefined && additionalCharges !== null && additionalCharges !== '') {
            if (!isStrictNonNegativeInteger(additionalCharges)) {
                throw new BadRequestException('Additional charges must be a valid non-negative integer');
            }
        }

        // Validate paidAmount
        if (paidAmount !== undefined && paidAmount !== null && paidAmount !== '') {
            if (!isStrictNonNegativeInteger(paidAmount)) {
                throw new BadRequestException('Paid amount must be a valid non-negative integer');
            }
        }

        // Validate referredBy and referredByDoctorId
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (referredBy !== undefined && referredBy !== null) {
            if (typeof referredBy !== 'string') {
                throw new BadRequestException('Referred by must be a string');
            }
            if (referredBy.trim().length > 255) {
                throw new BadRequestException('Referred by cannot exceed 255 characters');
            }
        }
        if (referredByDoctorId !== undefined && referredByDoctorId !== null && String(referredByDoctorId).trim() !== '') {
            if (!UUID_REGEX.test(String(referredByDoctorId).trim())) {
                throw new BadRequestException('Invalid referredByDoctorId format');
            }
        }

        const resolvedTestAvailabilityNote = normalizeTestAvailabilityNote(testAvailabilityNote) ?? null;

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
            const discountValue = (discount === undefined || discount === null || discount === '') ? 0 : Number(discount);
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
                ? Number(reqVatRate)
                : (Number(hospitalSetting.defaultVatRate) || 0);
            const vatAmount = round(taxableAmount * (vatRate / 100));

            // 6. Additional Charges & Final Invoice Total
            const additional = (additionalCharges === undefined || additionalCharges === null || additionalCharges === '')
                ? 0
                : Number(additionalCharges);
            const totalAmount = round(taxableAmount + vatAmount + additional);

            if (totalAmount < 0) {
                throw new BadRequestException('Total amount cannot be negative');
            }

            // 7. Determine Paid Amount, Due Amount and Payment Status
            const paid = (paidAmount === undefined || paidAmount === null || paidAmount === '')
                ? 0
                : Number(paidAmount);
            if (paid > totalAmount) {
                throw new BadRequestException('Paid amount cannot exceed total invoice amount');
            }

            const isPaymentDone = Boolean((data as any).paymentDone || data.paymentStatus === 'Paid');

            let due = round(Math.max(0, totalAmount - paid));
            let waived = 0;
            let status = 'Unpaid';

            if (isPaymentDone) {
                status = 'Paid';
                waived = due;
                due = 0;
            } else if (due === 0) {
                status = 'Paid';
            } else if (paid > 0 && due > 0) {
                status = 'Partial';
            }

            // 8. Generate Bill Number
            const billNumber = await this.generateBillNumber(queryRunner, 'BILL');
            const musakChallanNumber = data.musakChallanNumber || billNumber;

            // 8b. Resolve Referred By (Existing Doctor vs Manual Referral)
            let resolvedReferredByDoctorId: string | undefined = undefined;
            let resolvedReferredBy: string | undefined = (referredBy && String(referredBy).trim()) ? String(referredBy).trim() : undefined;

            if (referredByDoctorId !== undefined && referredByDoctorId !== null && String(referredByDoctorId).trim() !== '') {
                const docId = String(referredByDoctorId).trim();
                const referringDoctor = await queryRunner.manager.findOne(Doctor, { where: { id: docId } });
                if (!referringDoctor) {
                    throw new BadRequestException('Referred doctor not found');
                }
                resolvedReferredByDoctorId = referringDoctor.id;
                const fullDocName = `${(referringDoctor.firstName || '').trim()} ${(referringDoctor.lastName || '').trim()}`.trim();
                const formattedDocName = /^dr\.?\s+/i.test(fullDocName) ? fullDocName : `Dr. ${fullDocName}`;
                resolvedReferredBy = resolvedReferredBy || formattedDocName;
            }

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
                waivedAmount: waived,
                dueAmount: due,
                paymentMethod: paymentMethod || 'Cash',
                paymentStatus: status,
                settlementReason: waived > 0 ? 'Settled upon creation (Payment Done)' : undefined,
                settledById: waived > 0 ? (user?.id || undefined) : undefined,
                settledAt: waived > 0 ? new Date() : undefined,
                referredBy: resolvedReferredBy,
                referredByDoctorId: resolvedReferredByDoctorId,
                testAvailabilityNote: resolvedTestAvailabilityNote,
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

            // 12. Settlement / Waiver Transaction if settled in full
            if (waived > 0) {
                const settlementTransaction = queryRunner.manager.create(PaymentTransaction, {
                    billingId: savedBilling.id,
                    patientId: savedBilling.patientId,
                    amount: waived,
                    paymentMethod: 'Waiver / Settlement',
                    type: PaymentTransactionType.SETTLEMENT,
                    receivedById: data.receivedById || user?.id || null,
                    status: 'Completed',
                    notes: 'Settled difference upon invoice creation (Payment Done)'
                });
                await queryRunner.manager.save(settlementTransaction);
            }

            await queryRunner.commitTransaction();

            return this.databaseService.repoBilling().findOne({
                where: { id: savedBilling.id },
                relations: {
                    patient: { appointments: true },
                    items: { test: true },
                    referredByDoctor: true,
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
            .leftJoinAndSelect('billing.referredByDoctor', 'referredByDoctor')
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
                referredByDoctor: true,
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
            testAvailabilityNote: billing.testAvailabilityNote ?? null,
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

    async update(id: string, data: any, user?: any) {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!id || !UUID_REGEX.test(id)) {
            throw new BadRequestException('Invalid invoice ID format');
        }

        if (user && user.role === UserRole.USER) {
            throw new ForbiddenException('You are not authorized to update this invoice');
        }

        const billing = await this.databaseService.repoBilling().findOne({ where: { id } });
        if (!billing) {
            throw new NotFoundException('Invoice not found');
        }

        if (data && Object.prototype.hasOwnProperty.call(data, 'testAvailabilityNote')) {
            const normalizedNote = normalizeTestAvailabilityNote(data.testAvailabilityNote);
            billing.testAvailabilityNote = normalizedNote ?? null;
        }

        if (data && Object.prototype.hasOwnProperty.call(data, 'referredBy')) {
            if (data.referredBy !== undefined && data.referredBy !== null && typeof data.referredBy !== 'string') {
                throw new BadRequestException('Referred by must be a string');
            }
            const trimmedRef = data.referredBy ? String(data.referredBy).trim() : '';
            if (trimmedRef.length > 255) {
                throw new BadRequestException('Referred by cannot exceed 255 characters');
            }
            billing.referredBy = trimmedRef || null;
        }

        if (data && Object.prototype.hasOwnProperty.call(data, 'referredByDoctorId')) {
            const rawDocId = data.referredByDoctorId ? String(data.referredByDoctorId).trim() : '';
            if (rawDocId) {
                if (!UUID_REGEX.test(rawDocId)) {
                    throw new BadRequestException('Invalid referredByDoctorId format');
                }
                const referringDoctor = await this.databaseService.repoDoctor().findOne({ where: { id: rawDocId } });
                if (!referringDoctor) {
                    throw new BadRequestException('Referred doctor not found');
                }
                billing.referredByDoctorId = referringDoctor.id;
                const fullDocName = `${(referringDoctor.firstName || '').trim()} ${(referringDoctor.lastName || '').trim()}`.trim();
                const formattedDocName = /^dr\.?\s+/i.test(fullDocName) ? fullDocName : `Dr. ${fullDocName}`;
                if (!billing.referredBy) {
                    billing.referredBy = formattedDocName;
                }
            } else {
                billing.referredByDoctorId = null;
            }
        }

        if (data && typeof data.paymentStatus === 'string' && data.paymentStatus.trim()) {
            billing.paymentStatus = data.paymentStatus.trim();
        }

        await this.databaseService.repoBilling().save(billing);
        return this.findOne(id, user);
    }

    async updateStatus(id: string, paymentStatus: string) {
        await this.databaseService.repoBilling().update(id, { paymentStatus });
        return this.databaseService.repoBilling().findOne({ where: { id } });
    }

    async updatePayment(id: string, additionalAmount: number, user?: any) {
        const billing = await this.databaseService.repoBilling().findOne({ where: { id } });
        if (!billing) throw new BadRequestException('Billing not found');

        if (!isStrictPositiveInteger(additionalAmount)) {
            throw new BadRequestException('Payment amount must be a positive integer');
        }
        const addAmount = Number(additionalAmount);

        return this.createPayment(id, {
            amount: addAmount,
            paymentMethod: 'Cash',
            notes: 'Update Payment'
        }, user);
    }

    async createConsultationBill(appointmentId: string, data: any, user?: any) {
        const { discountType, discount, additionalCharges, paymentMethod, paidAmount, referredBy, vatRate: reqVatRate } = data;

        // Validate numeric fields for consultation billing
        if (discount !== undefined && discount !== null && discount !== '') {
            if (!isStrictNonNegativeInteger(discount)) {
                throw new BadRequestException('Discount must be a valid non-negative integer');
            }
        }
        if (reqVatRate !== undefined && reqVatRate !== null && reqVatRate !== '') {
            if (!isStrictNonNegativeInteger(reqVatRate)) {
                throw new BadRequestException('VAT rate must be a valid non-negative integer');
            }
            if (Number(reqVatRate) > 100) {
                throw new BadRequestException('VAT rate cannot exceed 100%');
            }
        }
        if (additionalCharges !== undefined && additionalCharges !== null && additionalCharges !== '') {
            if (!isStrictNonNegativeInteger(additionalCharges)) {
                throw new BadRequestException('Additional charges must be a valid non-negative integer');
            }
        }
        if (paidAmount !== undefined && paidAmount !== null && paidAmount !== '') {
            if (!isStrictNonNegativeInteger(paidAmount)) {
                throw new BadRequestException('Paid amount must be a valid non-negative integer');
            }
        }

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
            const discountValue = (discount === undefined || discount === null || discount === '') ? 0 : Number(discount);
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
                ? Number(reqVatRate)
                : (Number(hospitalSetting.defaultVatRate) || 0);
            const vatAmount = round(taxableAmount * (vatRate / 100));

            const additional = (additionalCharges === undefined || additionalCharges === null || additionalCharges === '')
                ? 0
                : Number(additionalCharges);
            const totalAmount = round(taxableAmount + vatAmount + additional);

            if (totalAmount < 0) {
                throw new BadRequestException('Total amount cannot be negative');
            }

            const paid = (paidAmount === undefined || paidAmount === null || paidAmount === '')
                ? 0
                : Number(paidAmount);
            if (paid > totalAmount) {
                throw new BadRequestException('Paid amount cannot exceed total invoice amount');
            }

            const isPaymentDone = Boolean((data as any).paymentDone || data.paymentStatus === 'Paid');

            let due = round(Math.max(0, totalAmount - paid));
            let waived = 0;
            let status = 'Unpaid';

            if (isPaymentDone) {
                status = 'Paid';
                waived = due;
                due = 0;
            } else if (due === 0) {
                status = 'Paid';
            } else if (paid > 0 && due > 0) {
                status = 'Partial';
            }

            // 3. Generate Bill Number
            const billNumber = await this.generateBillNumber(queryRunner, 'CONS');
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
                waivedAmount: waived,
                dueAmount: due,
                paymentMethod: paymentMethod || 'Cash',
                paymentStatus: status,
                settlementReason: waived > 0 ? 'Settled upon creation (Payment Done)' : undefined,
                settledById: waived > 0 ? (user?.id || undefined) : undefined,
                settledAt: waived > 0 ? new Date() : undefined,
                referredBy: referredBy || undefined,
                testAvailabilityNote: normalizeTestAvailabilityNote(data.testAvailabilityNote) ?? null,
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

            if (waived > 0) {
                const settlementTransaction = queryRunner.manager.create(PaymentTransaction, {
                    billingId: savedBilling.id,
                    patientId: savedBilling.patientId,
                    amount: waived,
                    paymentMethod: 'Waiver / Settlement',
                    type: PaymentTransactionType.SETTLEMENT,
                    receivedById: data.receivedById || user?.id || null,
                    status: 'Completed',
                    notes: 'Settled difference upon consultation bill creation (Payment Done)'
                });
                await queryRunner.manager.save(settlementTransaction);
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

        if (!isStrictPositiveInteger(amount)) {
            throw new BadRequestException('Payment amount must be a positive integer');
        }
        const payAmount = Number(amount);

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
            let currentWaived = round(Number(billing.waivedAmount || 0));
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
            let newDue = round(Math.max(0, totalAmount - currentPaid - currentWaived));

            const isPaymentDone = Boolean(data.paymentDone);
            let status = 'Unpaid';

            if (isPaymentDone && newDue > 0) {
                const remainingDiff = newDue;
                currentWaived = round(currentWaived + remainingDiff);
                newDue = 0;
                status = 'Paid';

                const settlementTransaction = queryRunner.manager.create(PaymentTransaction, {
                    billingId: billing.id,
                    patientId: billing.patientId,
                    amount: remainingDiff,
                    paymentMethod: 'Waiver / Settlement',
                    type: PaymentTransactionType.SETTLEMENT,
                    receivedById: data.receivedById || user?.id || null,
                    status: 'Completed',
                    notes: notes
                        ? `Settled difference upon payment (Payment Done): ${notes}`
                        : 'Settled difference upon payment (Payment Done)'
                });
                await queryRunner.manager.save(settlementTransaction);

                billing.settlementReason = billing.settlementReason
                    ? `${billing.settlementReason}; Settled upon payment (Payment Done)`
                    : 'Settled upon payment (Payment Done)';
                billing.settledById = user?.id || null;
                billing.settledAt = new Date();
            } else if (newDue === 0) {
                status = 'Paid';
            } else if (currentPaid > 0 && newDue > 0) {
                status = 'Partial';
            }

            billing.paidAmount = currentPaid;
            billing.waivedAmount = currentWaived;
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

            const updatedBilling = await this.databaseService.repoBilling().findOne({
                where: { id: billingId },
                relations: {
                    patient: true,
                    createdBy: true,
                    authorizedBy: true,
                    settledBy: true,
                    items: { test: true },
                    payments: true
                }
            });

            return updatedBilling || transaction;
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

        if (!isStrictPositiveInteger(data.amount)) {
            throw new BadRequestException('Settlement amount must be a positive integer');
        }
        const settleAmount = Number(data.amount);

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

    async searchForLabel(query: string, user?: any): Promise<any> {
        if (!query || typeof query !== 'string' || !query.trim()) {
            throw new BadRequestException('Please provide a Patient ID or Bill ID');
        }

        const raw = query.trim();
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        // 1. Check exact match by Bill Number
        let exactBill = await this.databaseService.repoBilling()
            .createQueryBuilder('billing')
            .leftJoinAndSelect('billing.patient', 'patient')
            .leftJoinAndSelect('billing.items', 'item')
            .leftJoinAndSelect('item.test', 'test')
            .leftJoinAndSelect('billing.referredByDoctor', 'referredByDoctor')
            .where('billing.billNumber ILIKE :num', { num: raw })
            .getOne();

        if (!exactBill && UUID_REGEX.test(raw)) {
            exactBill = await this.databaseService.repoBilling()
                .createQueryBuilder('billing')
                .leftJoinAndSelect('billing.patient', 'patient')
                .leftJoinAndSelect('billing.items', 'item')
                .leftJoinAndSelect('item.test', 'test')
                .leftJoinAndSelect('billing.referredByDoctor', 'referredByDoctor')
                .where('billing.id = :id', { id: raw })
                .getOne();
        }

        if (exactBill && exactBill.patient) {
            const allBills = await this.databaseService.repoBilling()
                .createQueryBuilder('b')
                .leftJoinAndSelect('b.items', 'item')
                .leftJoinAndSelect('item.test', 'test')
                .where('b.patientId = :patientId', { patientId: exactBill.patient.id })
                .orderBy('b.createdAt', 'DESC')
                .getMany();

            return {
                found: true,
                exact: true,
                matchedBy: 'bill',
                patient: {
                    id: exactBill.patient.id,
                    patientId: exactBill.patient.patientId,
                    name: exactBill.patient.name,
                    gender: exactBill.patient.gender,
                    age: exactBill.patient.age,
                    phone: exactBill.patient.phone,
                    address: exactBill.patient.address,
                    bloodGroup: exactBill.patient.bloodGroup,
                    dateOfBirth: exactBill.patient.dateOfBirth,
                    emergencyContactPhone: exactBill.patient.emergencyContactPhone,
                },
                bill: {
                    id: exactBill.id,
                    billNumber: exactBill.billNumber,
                    createdAt: exactBill.createdAt,
                    billingType: exactBill.billingType,
                    totalAmount: exactBill.totalAmount,
                    paidAmount: exactBill.paidAmount,
                    dueAmount: exactBill.dueAmount,
                    paymentStatus: exactBill.paymentStatus,
                    referredBy: exactBill.referredBy || (exactBill.referredByDoctor ? `Dr. ${exactBill.referredByDoctor.firstName} ${exactBill.referredByDoctor.lastName}` : null),
                    tests: (exactBill.items || []).map((it: any) => ({
                        id: it.id,
                        name: it.test?.name || it.description || 'Test',
                        code: it.test?.code || '',
                        category: it.test?.category || '',
                        price: it.price,
                    })),
                },
                allBills: allBills.map((b: any) => ({
                    id: b.id,
                    billNumber: b.billNumber,
                    createdAt: b.createdAt,
                    billingType: b.billingType,
                    totalAmount: b.totalAmount,
                    paidAmount: b.paidAmount,
                    dueAmount: b.dueAmount,
                    tests: (b.items || []).map((it: any) => ({
                        id: it.id,
                        name: it.test?.name || it.description || 'Test',
                        code: it.test?.code || '',
                    })),
                })),
            };
        }

        // 2. Check exact match by Patient ID or UUID
        let patientQuery = this.databaseService.repoPatients()
            .createQueryBuilder('patient');

        let exactPatient: any = null;
        if (UUID_REGEX.test(raw)) {
            exactPatient = await patientQuery.where('patient.id = :id', { id: raw }).getOne();
        } else {
            exactPatient = await patientQuery.where('patient.patientId ILIKE :pid', { pid: raw }).getOne();

            if (!exactPatient && /^\d+$/.test(raw)) {
                const paddedId = `DMDCPTN-${raw.padStart(7, '0')}`;
                exactPatient = await this.databaseService.repoPatients()
                    .createQueryBuilder('patient')
                    .where('patient.patientId ILIKE :pid', { pid: paddedId })
                    .getOne();
            }
        }

        if (exactPatient) {
            const patientBills = await this.databaseService.repoBilling()
                .createQueryBuilder('billing')
                .leftJoinAndSelect('billing.items', 'item')
                .leftJoinAndSelect('item.test', 'test')
                .leftJoinAndSelect('billing.referredByDoctor', 'referredByDoctor')
                .where('billing.patientId = :patientId', { patientId: exactPatient.id })
                .orderBy('billing.createdAt', 'DESC')
                .getMany();

            const latestBill = patientBills[0] || null;

            return {
                found: true,
                exact: true,
                matchedBy: 'patient',
                patient: {
                    id: exactPatient.id,
                    patientId: exactPatient.patientId,
                    name: exactPatient.name,
                    gender: exactPatient.gender,
                    age: exactPatient.age,
                    phone: exactPatient.phone,
                    address: exactPatient.address,
                    bloodGroup: exactPatient.bloodGroup,
                    dateOfBirth: exactPatient.dateOfBirth,
                    emergencyContactPhone: exactPatient.emergencyContactPhone,
                },
                bill: latestBill ? {
                    id: latestBill.id,
                    billNumber: latestBill.billNumber,
                    createdAt: latestBill.createdAt,
                    billingType: latestBill.billingType,
                    totalAmount: latestBill.totalAmount,
                    paidAmount: latestBill.paidAmount,
                    dueAmount: latestBill.dueAmount,
                    paymentStatus: latestBill.paymentStatus,
                    referredBy: latestBill.referredBy || (latestBill.referredByDoctor ? `Dr. ${latestBill.referredByDoctor.firstName} ${latestBill.referredByDoctor.lastName}` : null),
                    tests: (latestBill.items || []).map((it: any) => ({
                        id: it.id,
                        name: it.test?.name || it.description || 'Test',
                        code: it.test?.code || '',
                        category: it.test?.category || '',
                        price: it.price,
                    })),
                } : null,
                allBills: patientBills.map((b: any) => ({
                    id: b.id,
                    billNumber: b.billNumber,
                    createdAt: b.createdAt,
                    billingType: b.billingType,
                    totalAmount: b.totalAmount,
                    paidAmount: b.paidAmount,
                    dueAmount: b.dueAmount,
                    tests: (b.items || []).map((it: any) => ({
                        id: it.id,
                        name: it.test?.name || it.description || 'Test',
                        code: it.test?.code || '',
                    })),
                })),
            };
        }

        // 3. Partial search across bills and patients
        const billsMatching = await this.databaseService.repoBilling()
            .createQueryBuilder('billing')
            .leftJoinAndSelect('billing.patient', 'patient')
            .where('billing.billNumber ILIKE :q', { q: `%${raw}%` })
            .orWhere('patient.patientId ILIKE :q', { q: `%${raw}%` })
            .orWhere('patient.phone ILIKE :q', { q: `%${raw}%` })
            .orWhere('patient.name ILIKE :q', { q: `%${raw}%` })
            .orderBy('billing.createdAt', 'DESC')
            .take(10)
            .getMany();

        const patientsMatching = await this.databaseService.repoPatients()
            .createQueryBuilder('patient')
            .leftJoinAndSelect('patient.billings', 'billing')
            .where('patient.patientId ILIKE :q', { q: `%${raw}%` })
            .orWhere('patient.phone ILIKE :q', { q: `%${raw}%` })
            .orWhere('patient.name ILIKE :q', { q: `%${raw}%` })
            .orderBy('patient.createdAt', 'DESC')
            .take(10)
            .getMany();

        const candidateMap = new Map<string, any>();

        for (const b of billsMatching) {
            if (b.patient && !candidateMap.has(b.patient.id)) {
                candidateMap.set(b.patient.id, {
                    patientId: b.patient.patientId,
                    name: b.patient.name,
                    phone: b.patient.phone,
                    gender: b.patient.gender,
                    age: b.patient.age,
                    latestBillNumber: b.billNumber,
                    billId: b.id,
                    internalPatientId: b.patient.id,
                });
            }
        }

        for (const p of patientsMatching) {
            if (!candidateMap.has(p.id)) {
                const latest = (p.billings || []).sort(
                    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0];
                candidateMap.set(p.id, {
                    patientId: p.patientId,
                    name: p.name,
                    phone: p.phone,
                    gender: p.gender,
                    age: p.age,
                    latestBillNumber: latest?.billNumber || 'N/A',
                    billId: latest?.id || null,
                    internalPatientId: p.id,
                });
            }
        }

        const matches = Array.from(candidateMap.values());

        if (matches.length === 1) {
            const single = matches[0];
            return this.searchForLabel(single.latestBillNumber !== 'N/A' ? single.latestBillNumber : single.patientId, user);
        }

        if (matches.length > 1) {
            return {
                found: true,
                exact: false,
                matches,
                message: `Found ${matches.length} matching records. Please select one.`,
            };
        }

        return {
            found: false,
            exact: false,
            message: `No patient or bill found matching "${raw}".`,
        };
    }
}

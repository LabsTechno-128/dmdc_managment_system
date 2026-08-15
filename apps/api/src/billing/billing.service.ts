import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Billing, BillingItem, TestOrder, PatientType, Patients, LabTest } from '@hospital/database';

@Injectable()
export class BillingService {
    constructor(private readonly databaseService: DatabaseService) {}

    async create(data: any) {
        const { items, patientId, discountType, discount, additionalCharges, paymentMethod, paymentStatus } = data;
        
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
                paymentMethod: paymentMethod || 'Cash',
                paymentStatus: paymentStatus || 'Unpaid'
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
                relations: { patient: { appointments: true } }
            });

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll() {
        return this.databaseService.repoBilling().find({ 
            relations: { patient: true },
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string) {
        const billing = await this.databaseService.repoBilling().findOne({ 
            where: { id }, 
            relations: { patient: true } 
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
}

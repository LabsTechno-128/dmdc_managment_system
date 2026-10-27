import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { DatabaseService } from '../database/database.service';
import { SettingsService } from '../settings/settings.service';
import { PaymentTransactionType, UserRole } from '@hospital/database';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('BillingService', () => {
    let service: BillingService;
    let mockQueryRunner: any;
    let mockDataSource: any;
    let mockDatabaseService: any;
    let mockSettingsService: any;
    let savedBillingStore: any;
    let savedPaymentsStore: any[];

    beforeEach(async () => {
        savedBillingStore = null;
        savedPaymentsStore = [];

        mockQueryRunner = {
            connect: jest.fn<any>().mockResolvedValue(undefined),
            startTransaction: jest.fn<any>().mockResolvedValue(undefined),
            commitTransaction: jest.fn<any>().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn<any>().mockResolvedValue(undefined),
            release: jest.fn<any>().mockResolvedValue(undefined),
            query: jest.fn<any>().mockResolvedValue([{ count: '1' }]),
            manager: {
                findOne: jest.fn<any>().mockImplementation((entity: any, options: any) => {
                    const name = entity?.name || '';
                    if (name === 'Patients') {
                        return Promise.resolve({ id: options?.where?.id || 'pat-1', patientType: 'OUTPATIENT' });
                    }
                    if (name === 'LabTest') {
                        return Promise.resolve({ id: options?.where?.id || 1, billRate: 600 });
                    }
                    if (name === 'Billing') {
                        return Promise.resolve(savedBillingStore);
                    }
                    return Promise.resolve(null);
                }),
                create: jest.fn<any>().mockImplementation((entity: any, plain: any) => {
                    return { ...plain };
                }),
                save: jest.fn<any>().mockImplementation((item: any) => {
                    if (Array.isArray(item)) {
                        return Promise.resolve(item);
                    }
                    if (item.billNumber || item.totalAmount !== undefined) {
                        savedBillingStore = { ...savedBillingStore, ...item };
                        return Promise.resolve(savedBillingStore);
                    }
                    if (item.type || item.paymentMethod) {
                        savedPaymentsStore.push(item);
                        return Promise.resolve(item);
                    }
                    return Promise.resolve(item);
                }),
            },
        };

        mockDataSource = {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        };

        mockDatabaseService = {
            getDataSource: () => mockDataSource,
            repoBilling: () => ({
                findOne: jest.fn<any>().mockImplementation(() => Promise.resolve(savedBillingStore)),
                save: jest.fn<any>().mockImplementation((item: any) => {
                    savedBillingStore = { ...savedBillingStore, ...item };
                    return Promise.resolve(savedBillingStore);
                }),
            }),
            repoPaymentTransaction: () => ({
                create: jest.fn<any>().mockImplementation((plain: any) => ({ ...plain })),
                save: jest.fn<any>().mockImplementation((plain: any) => {
                    savedPaymentsStore.push(plain);
                    return Promise.resolve(plain);
                }),
            }),
        };

        mockSettingsService = {
            getSettings: jest.fn<any>().mockResolvedValue({
                centerName: 'Dr. Muazzem Medical Diagnostic Center',
                address: '82/83 Zoo Road, Mirpur-1, Dhaka',
                bin: '001234567-0101',
                musakForm: 'Mushak-6.3 (মূসক-৬.৩)',
                defaultVatRate: 0,
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingService,
                { provide: DatabaseService, useValue: mockDatabaseService },
                { provide: SettingsService, useValue: mockSettingsService },
            ],
        }).compile();

        service = module.get<BillingService>(BillingService);
    });

    describe('Feature: Post-Discount VAT Billing & Calculations', () => {
        it('Scenario 1: Creates invoice without discount and without VAT, paid in full', async () => {
            const user = { id: 'user-staff-1', role: UserRole.RECEPTIONIST };
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }, { testId: 2 }], // 600 + 600 = 1200
                discountType: 'FIXED',
                discount: 0,
                vatRate: 0,
                paidAmount: 1200,
            };

            await service.create(billData, user);

            expect(savedBillingStore).toBeDefined();
            expect(savedBillingStore.subtotal).toBe(1200);
            expect(savedBillingStore.discountAmount).toBe(0);
            expect(savedBillingStore.taxableAmount).toBe(1200);
            expect(savedBillingStore.vatAmount).toBe(0);
            expect(savedBillingStore.totalAmount).toBe(1200);
            expect(savedBillingStore.paidAmount).toBe(1200);
            expect(savedBillingStore.dueAmount).toBe(0);
            expect(savedBillingStore.paymentStatus).toBe('Paid');
            expect(savedBillingStore.createdById).toBe('user-staff-1');
            expect(savedBillingStore.authorizedById).toBe('user-staff-1');
        });

        it('Scenario 2: Calculates VAT after discount (Example from prompt)', async () => {
            // Prompt: Subtotal ৳2,000, Discount ৳200, Taxable ৳1,800, VAT rate 5% -> VAT ৳90, Final total ৳1,890
            mockQueryRunner.manager.findOne = jest.fn<any>().mockImplementation((entity: any) => {
                const name = entity?.name || '';
                if (name === 'Patients') return Promise.resolve({ id: 'pat-1', patientType: 'OUTPATIENT' });
                if (name === 'LabTest') return Promise.resolve({ id: 1, billRate: 2000 });
                if (name === 'Billing') return Promise.resolve(savedBillingStore);
                return Promise.resolve(null);
            });

            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                discountType: 'FIXED',
                discount: 200,
                vatRate: 5,
                paidAmount: 0,
            };

            await service.create(billData);

            expect(savedBillingStore.subtotal).toBe(2000);
            expect(savedBillingStore.discountAmount).toBe(200);
            expect(savedBillingStore.taxableAmount).toBe(1800);
            expect(savedBillingStore.vatRate).toBe(5);
            expect(savedBillingStore.vatAmount).toBe(90);
            expect(savedBillingStore.totalAmount).toBe(1890);
            expect(savedBillingStore.dueAmount).toBe(1890);
            expect(savedBillingStore.paymentStatus).toBe('Unpaid');
        });
    });

    describe('Feature: Partial Payment & Outstanding Balance Tracking', () => {
        it('Scenario 3 (Example B): Paying ৳999 on ৳1,050 total leaves ৳51 outstanding and remains Partial', async () => {
            mockQueryRunner.manager.findOne = jest.fn<any>().mockImplementation((entity: any) => {
                const name = entity?.name || '';
                if (name === 'Patients') return Promise.resolve({ id: 'pat-1', patientType: 'OUTPATIENT' });
                if (name === 'LabTest') return Promise.resolve({ id: 1, billRate: 1200 });
                if (name === 'Billing') return Promise.resolve(savedBillingStore);
                return Promise.resolve(null);
            });

            // Subtotal 1200, Discount 150 -> Total 1050, Paid 999
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                discountType: 'FIXED',
                discount: 150,
                vatRate: 0,
                paidAmount: 999,
            };

            await service.create(billData);

            expect(savedBillingStore.totalAmount).toBe(1050);
            expect(savedBillingStore.paidAmount).toBe(999);
            expect(savedBillingStore.dueAmount).toBe(51);
            expect(savedBillingStore.paymentStatus).toBe('Partial');
        });

        it('Scenario 4 (Example C): Paying ৳100 on ৳199 invoice leaves ৳99 outstanding', async () => {
            mockQueryRunner.manager.findOne = jest.fn<any>().mockImplementation((entity: any) => {
                const name = entity?.name || '';
                if (name === 'Patients') return Promise.resolve({ id: 'pat-1', patientType: 'OUTPATIENT' });
                if (name === 'LabTest') return Promise.resolve({ id: 1, billRate: 199 });
                if (name === 'Billing') return Promise.resolve(savedBillingStore);
                return Promise.resolve(null);
            });

            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                discountType: 'FIXED',
                discount: 0,
                vatRate: 0,
                paidAmount: 100,
            };

            await service.create(billData);

            expect(savedBillingStore.totalAmount).toBe(199);
            expect(savedBillingStore.paidAmount).toBe(100);
            expect(savedBillingStore.dueAmount).toBe(99);
            expect(savedBillingStore.paymentStatus).toBe('Partial');
        });

        it('Scenario 5: Multiple partial payments update balance correctly until fully paid', async () => {
            savedBillingStore = {
                id: 'bill-123',
                patientId: 'pat-1',
                totalAmount: 1000,
                paidAmount: 0,
                waivedAmount: 0,
                dueAmount: 1000,
                paymentStatus: 'Unpaid',
            };

            // Payment 1: 400
            await service.createPayment('bill-123', { amount: 400, paymentMethod: 'Cash' });
            expect(savedBillingStore.paidAmount).toBe(400);
            expect(savedBillingStore.dueAmount).toBe(600);
            expect(savedBillingStore.paymentStatus).toBe('Partial');

            // Payment 2: 300
            await service.createPayment('bill-123', { amount: 300, paymentMethod: 'Card' });
            expect(savedBillingStore.paidAmount).toBe(700);
            expect(savedBillingStore.dueAmount).toBe(300);
            expect(savedBillingStore.paymentStatus).toBe('Partial');

            // Payment 3: 300 (full remaining)
            await service.createPayment('bill-123', { amount: 300, paymentMethod: 'Cash' });
            expect(savedBillingStore.paidAmount).toBe(1000);
            expect(savedBillingStore.dueAmount).toBe(0);
            expect(savedBillingStore.paymentStatus).toBe('Paid');
        });

        it('Scenario 6: Prevents overpayment beyond current due amount', async () => {
            savedBillingStore = {
                id: 'bill-123',
                patientId: 'pat-1',
                totalAmount: 500,
                paidAmount: 200,
                waivedAmount: 0,
                dueAmount: 300,
                paymentStatus: 'Partial',
            };

            await expect(
                service.createPayment('bill-123', { amount: 350, paymentMethod: 'Cash' })
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('Feature: Balance Settlement / Waiver Action & Audit Trail', () => {
        it('Scenario 7 (Example A): Authorizes balance settlement/waiver, records reason, user & SETTLEMENT transaction', async () => {
            // Example A: Total 1050, Paid 1000, Due 50.
            savedBillingStore = {
                id: 'bill-999',
                patientId: 'pat-1',
                totalAmount: 1050,
                paidAmount: 1000,
                waivedAmount: 0,
                dueAmount: 50,
                paymentStatus: 'Partial',
            };

            const adminUser = { id: 'admin-1', role: UserRole.ADMIN };

            await service.settleBalance('bill-999', { amount: 50, reason: 'Director approved special concession' }, adminUser);

            expect(savedBillingStore.paidAmount).toBe(1000); // Actual cash remains 1000!
            expect(savedBillingStore.waivedAmount).toBe(50); // Waived recorded separately!
            expect(savedBillingStore.dueAmount).toBe(0);
            expect(savedBillingStore.paymentStatus).toBe('Paid');
            expect(savedBillingStore.settledById).toBe('admin-1');
            expect(savedBillingStore.settlementReason).toBe('Director approved special concession');

            // Check transaction created with type SETTLEMENT
            const settleTx = savedPaymentsStore.find(tx => tx.type === PaymentTransactionType.SETTLEMENT);
            expect(settleTx).toBeDefined();
            expect(settleTx.amount).toBe(50);
            expect(settleTx.receivedById).toBe('admin-1');
            expect(settleTx.notes).toContain('Director approved special concession');
        });

        it('Scenario 8: Rejects settlement if attempted by unauthorized role', async () => {
            savedBillingStore = {
                id: 'bill-999',
                patientId: 'pat-1',
                totalAmount: 500,
                paidAmount: 400,
                dueAmount: 100,
                paymentStatus: 'Partial',
            };

            const receptionist = { id: 'rec-1', role: UserRole.RECEPTIONIST };

            await expect(
                service.settleBalance('bill-999', { amount: 100, reason: 'Trying to waive' }, receptionist)
            ).rejects.toThrow(ForbiddenException);
        });

        it('Scenario 9: Rejects settlement without a mandatory reason', async () => {
            savedBillingStore = {
                id: 'bill-999',
                patientId: 'pat-1',
                totalAmount: 500,
                paidAmount: 400,
                dueAmount: 100,
                paymentStatus: 'Partial',
            };

            const adminUser = { id: 'admin-1', role: UserRole.ADMIN };

            await expect(
                service.settleBalance('bill-999', { amount: 100, reason: '' }, adminUser)
            ).rejects.toThrow(BadRequestException);
        });

        it('Scenario 10: Rejects settlement amount exceeding current due', async () => {
            savedBillingStore = {
                id: 'bill-999',
                patientId: 'pat-1',
                totalAmount: 500,
                paidAmount: 450,
                dueAmount: 50,
                paymentStatus: 'Partial',
            };

            const adminUser = { id: 'admin-1', role: UserRole.ADMIN };

            await expect(
                service.settleBalance('bill-999', { amount: 75, reason: 'Excess waiver' }, adminUser)
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('Feature: Invoice Authorization', () => {
        it('Scenario 11: Authorizes invoice and stores authorizing user without changing creator', async () => {
            savedBillingStore = {
                id: 'bill-auth-1',
                createdById: 'original-creator-id',
                authorizedById: null,
                authorizedAt: null,
            };

            const authorizer = { id: 'authorizer-id', role: UserRole.ADMIN };

            await service.authorizeInvoice('bill-auth-1', authorizer);

            expect(savedBillingStore.createdById).toBe('original-creator-id');
            expect(savedBillingStore.authorizedById).toBe('authorizer-id');
            expect(savedBillingStore.authorizedAt).toBeDefined();
        });
    });

    describe('Feature: Strict Non-Negative Integer & Maximum Bill Amount Validation', () => {
        beforeEach(() => {
            mockQueryRunner.manager.findOne = jest.fn<any>().mockImplementation((entity: any, options: any) => {
                const name = entity?.name || '';
                if (name === 'Patients') return Promise.resolve({ id: 'pat-1', patientType: 'OUTPATIENT' });
                if (name === 'LabTest') {
                    const id = options?.where?.id;
                    if (id === 1) return Promise.resolve({ id: 1, billRate: 500 });
                    if (id === 2) return Promise.resolve({ id: 2, billRate: 300 });
                    return Promise.resolve({ id: Number(id) || 1, billRate: 500 });
                }
                if (name === 'Billing') return Promise.resolve(savedBillingStore);
                return Promise.resolve(null);
            });
        });

        it('Case 1: Accepts valid positive integer and zero for all fields', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }], // bill rate: 500
                discountType: 'FIXED',
                discount: 100,
                vatRate: 5,
                additionalCharges: 50,
                paidAmount: 470, // 500 - 100 = 400 taxable; vat 5% = 20; + 50 = 470 total
            };

            await service.create(billData);

            expect(savedBillingStore).toBeDefined();
            expect(savedBillingStore.subtotal).toBe(500);
            expect(savedBillingStore.discountAmount).toBe(100);
            expect(savedBillingStore.vatAmount).toBe(20);
            expect(savedBillingStore.additionalCharges).toBe(50);
            expect(savedBillingStore.totalAmount).toBe(470);
            expect(savedBillingStore.paidAmount).toBe(470);
            expect(savedBillingStore.dueAmount).toBe(0);
            expect(savedBillingStore.paymentStatus).toBe('Paid');
        });

        it('Case 2: Accepts zero where permitted (discount=0, vatRate=0, additionalCharges=0, paidAmount=0)', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                discountType: 'FIXED',
                discount: 0,
                vatRate: 0,
                additionalCharges: 0,
                paidAmount: 0,
            };

            await service.create(billData);

            expect(savedBillingStore.subtotal).toBe(500);
            expect(savedBillingStore.discountAmount).toBe(0);
            expect(savedBillingStore.vatAmount).toBe(0);
            expect(savedBillingStore.additionalCharges).toBe(0);
            expect(savedBillingStore.totalAmount).toBe(500);
            expect(savedBillingStore.paidAmount).toBe(0);
            expect(savedBillingStore.dueAmount).toBe(500);
            expect(savedBillingStore.paymentStatus).toBe('Unpaid');
        });

        it('Case 3: Rejects negative number for discount', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                discount: -10,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 4: Rejects decimal floating-point number for discount (e.g. 10.5)', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                discount: 10.5,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 5: Rejects negative number for vatRate', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                vatRate: -5,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 6: Rejects decimal floating-point number for vatRate (e.g. 7.5)', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                vatRate: 7.5,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 7: Rejects vatRate exceeding 100%', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                vatRate: 105,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 8: Rejects negative number for additionalCharges', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                additionalCharges: -20,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 9: Rejects decimal for additionalCharges (e.g. 10.5)', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                additionalCharges: 10.5,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 10: Rejects negative number for paidAmount', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                paidAmount: -50,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 11: Rejects decimal for paidAmount (e.g. 10.5)', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                paidAmount: 10.5,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 12: Rejects invalid string / NaN / Infinity in API payloads', async () => {
            await expect(service.create({
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                discount: 'invalid-string',
            })).rejects.toThrow(BadRequestException);

            await expect(service.create({
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                paidAmount: Infinity,
            })).rejects.toThrow(BadRequestException);

            await expect(service.create({
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                additionalCharges: 'NaN',
            })).rejects.toThrow(BadRequestException);
        });

        it('Case 13: Enforces maximum discount: original bill 500, dependent discount 501 is rejected', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }], // 500
                discountType: 'FIXED',
                discount: 501,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 14: Enforces maximum discount: original bill 500, dependent discount 500 is accepted', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }], // 500
                discountType: 'FIXED',
                discount: 500,
                paidAmount: 0,
            };

            await service.create(billData);

            expect(savedBillingStore.subtotal).toBe(500);
            expect(savedBillingStore.discountAmount).toBe(500);
            expect(savedBillingStore.taxableAmount).toBe(0);
            expect(savedBillingStore.totalAmount).toBe(0);
            expect(savedBillingStore.dueAmount).toBe(0);
            expect(savedBillingStore.paymentStatus).toBe('Paid');
        });

        it('Case 15: Enforces maximum paidAmount: original bill 500, dependent paidAmount 501 is rejected', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }], // 500 total
                discount: 0,
                vatRate: 0,
                paidAmount: 501,
            };

            await expect(service.create(billData)).rejects.toThrow(BadRequestException);
        });

        it('Case 16: Enforces maximum paidAmount: original bill 500, dependent paidAmount 500 is accepted', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }], // 500 total
                discount: 0,
                vatRate: 0,
                paidAmount: 500,
            };

            await service.create(billData);

            expect(savedBillingStore.totalAmount).toBe(500);
            expect(savedBillingStore.paidAmount).toBe(500);
            expect(savedBillingStore.dueAmount).toBe(0);
            expect(savedBillingStore.paymentStatus).toBe('Paid');
        });

        it('Case 17: Maximum changes dynamically when original bill amount changes', async () => {
            // Bill with 1 test = 500. Attempting to pay 600 is rejected.
            await expect(service.create({
                patientId: 'pat-1',
                items: [{ testId: 1 }], // 500
                paidAmount: 600,
            })).rejects.toThrow(BadRequestException);

            // Same bill with 2 tests = 500 + 300 = 800. Paying 600 is now accepted!
            await service.create({
                patientId: 'pat-1',
                items: [{ testId: 1 }, { testId: 2 }], // 500 + 300 = 800
                paidAmount: 600,
            });

            expect(savedBillingStore.subtotal).toBe(800);
            expect(savedBillingStore.totalAmount).toBe(800);
            expect(savedBillingStore.paidAmount).toBe(600);
            expect(savedBillingStore.dueAmount).toBe(200);
            expect(savedBillingStore.paymentStatus).toBe('Partial');
        });

        it('Case 18: Empty or missing optional values follow existing business defaults', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }],
                // discount, vatRate, additionalCharges, paidAmount are all omitted
            };

            await service.create(billData);

            expect(savedBillingStore.subtotal).toBe(500);
            expect(savedBillingStore.discountAmount).toBe(0);
            expect(savedBillingStore.vatAmount).toBe(0);
            expect(savedBillingStore.additionalCharges).toBe(0);
            expect(savedBillingStore.totalAmount).toBe(500);
            expect(savedBillingStore.paidAmount).toBe(0);
            expect(savedBillingStore.dueAmount).toBe(500);
            expect(savedBillingStore.paymentStatus).toBe('Unpaid');
        });

        it('Case 19: Rejects non-integer payment in subsequent createPayment and updatePayment', async () => {
            savedBillingStore = {
                id: 'bill-123',
                patientId: 'pat-1',
                totalAmount: 500,
                paidAmount: 200,
                dueAmount: 300,
                paymentStatus: 'Partial',
            };

            // Rejects decimal in createPayment
            await expect(
                service.createPayment('bill-123', { amount: 10.5, paymentMethod: 'Cash' })
            ).rejects.toThrow(BadRequestException);

            // Rejects negative in createPayment
            await expect(
                service.createPayment('bill-123', { amount: -10, paymentMethod: 'Cash' })
            ).rejects.toThrow(BadRequestException);

            // Rejects decimal in updatePayment
            await expect(
                service.updatePayment('bill-123', 50.5)
            ).rejects.toThrow(BadRequestException);
        });

        it('Case 20: Rejects non-integer settlement amount in settleBalance', async () => {
            savedBillingStore = {
                id: 'bill-999',
                patientId: 'pat-1',
                totalAmount: 500,
                paidAmount: 400,
                dueAmount: 100,
                paymentStatus: 'Partial',
            };

            const adminUser = { id: 'admin-1', role: UserRole.ADMIN };

            // Decimal rejected
            await expect(
                service.settleBalance('bill-999', { amount: 25.5, reason: 'Special discount' }, adminUser)
            ).rejects.toThrow(BadRequestException);

            // Negative rejected
            await expect(
                service.settleBalance('bill-999', { amount: -25, reason: 'Special discount' }, adminUser)
            ).rejects.toThrow(BadRequestException);
        });

        it('Case 21: Payment Done checkbox marks bill Paid and settles difference as waived', async () => {
            const billData = {
                patientId: 'pat-1',
                items: [{ testId: 1 }], // 500
                paidAmount: 450, // patient gives 450 on 500 bill
                paymentDone: true,
            };

            await service.create(billData, { id: 'user-1' });

            expect(savedBillingStore.totalAmount).toBe(500);
            expect(savedBillingStore.paidAmount).toBe(450);
            expect(savedBillingStore.waivedAmount).toBe(50);
            expect(savedBillingStore.dueAmount).toBe(0);
            expect(savedBillingStore.paymentStatus).toBe('Paid');
            expect(savedBillingStore.settlementReason).toContain('Settled upon creation');

            // Should have recorded both payment of 450 and settlement of 50
            const paymentTx = savedPaymentsStore.find(p => p.type === PaymentTransactionType.PAYMENT);
            const settleTx = savedPaymentsStore.find(p => p.type === PaymentTransactionType.SETTLEMENT);
            expect(paymentTx).toBeDefined();
            expect(paymentTx.amount).toBe(450);
            expect(settleTx).toBeDefined();
            expect(settleTx.amount).toBe(50);
        });
    });
});

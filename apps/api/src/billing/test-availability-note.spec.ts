import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BillingService, normalizeTestAvailabilityNote, MAX_TEST_AVAILABILITY_NOTE_LENGTH } from './billing.service';
import { BillingController } from './billing.controller';
import { DatabaseService } from '../database/database.service';
import { SettingsService } from '../settings/settings.service';
import {
    Billing,
    BillingItem,
    Patients,
    PatientType,
    LabTest,
    Doctor,
    UserRole,
    AddTestAvailabilityNoteToBillings1730400000000,
} from '@hospital/database';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('Billing Module – Test Availability Note (End-to-End Persistence, Validation & Migration)', () => {
    let service: BillingService;
    let controller: BillingController;
    let persistedBillings: Map<string, any>;
    let mockBillingRepo: any;
    let mockQueryRunner: any;

    const samplePatientId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const sampleDoctorId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const sampleInvoiceId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

    const samplePatient = {
        id: samplePatientId,
        patientId: 'PAT-2026-0001',
        name: 'Rahim Uddin',
        phone: '01712345678',
        email: 'rahim@example.com',
        patientType: PatientType.OUTSIDE,
    };

    const sampleDoctor = {
        id: sampleDoctorId,
        firstName: 'Abdur',
        lastName: 'Rahman',
        specialization: 'Cardiology',
    };

    const sampleTest = {
        id: 101,
        name: 'Complete Blood Count (CBC)',
        billRate: 500,
    };

    beforeEach(async () => {
        persistedBillings = new Map<string, any>();

        mockQueryRunner = {
            connect: jest.fn<any>().mockResolvedValue(undefined),
            startTransaction: jest.fn<any>().mockResolvedValue(undefined),
            commitTransaction: jest.fn<any>().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn<any>().mockResolvedValue(undefined),
            release: jest.fn<any>().mockResolvedValue(undefined),
            query: jest.fn<any>().mockResolvedValue([]),
            manager: {
                findOne: jest.fn<any>().mockImplementation(async (entity: any, opts: any) => {
                    if (entity === Patients) {
                        return opts?.where?.id === samplePatientId ? samplePatient : null;
                    }
                    if (entity === LabTest) {
                        return Number(opts?.where?.id) === sampleTest.id ? sampleTest : null;
                    }
                    if (entity === Doctor) {
                        return opts?.where?.id === sampleDoctorId ? sampleDoctor : null;
                    }
                    return null;
                }),
                create: jest.fn<any>().mockImplementation((_entity: any, payload: any) => ({
                    ...payload,
                })),
                save: jest.fn<any>().mockImplementation(async (payload: any) => {
                    if (Array.isArray(payload)) {
                        return payload;
                    }
                    if (payload && payload.billNumber) {
                        const saved = {
                            id: sampleInvoiceId,
                            ...payload,
                            testAvailabilityNote: payload.testAvailabilityNote ?? null,
                            patient: samplePatient,
                            referredByDoctor:
                                payload.referredByDoctorId === sampleDoctorId ? sampleDoctor : null,
                            items: [{ id: 'item-1', testId: sampleTest.id, price: sampleTest.billRate, test: sampleTest }],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        persistedBillings.set(saved.id, saved);
                        return saved;
                    }
                    return payload;
                }),
            },
        };

        mockBillingRepo = {
            findOne: jest.fn<any>().mockImplementation(async (opts: any) => {
                const id = opts?.where?.id;
                return persistedBillings.get(id) || null;
            }),
            save: jest.fn<any>().mockImplementation(async (billing: any) => {
                const existing = persistedBillings.get(billing.id) || {};
                const updated = {
                    ...existing,
                    ...billing,
                    updatedAt: new Date(),
                };
                persistedBillings.set(updated.id, updated);
                return updated;
            }),
            createQueryBuilder: jest.fn<any>().mockImplementation(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn<any>().mockImplementation(async () => {
                    const list = Array.from(persistedBillings.values());
                    return [list, list.length];
                }),
            })),
        };

        const mockDatabaseService = {
            getDataSource: () => ({
                createQueryRunner: () => mockQueryRunner,
            }),
            repoBilling: () => mockBillingRepo,
            repoBillingItem: () => ({
                find: jest.fn<any>().mockResolvedValue([
                    { id: 'item-1', billingId: sampleInvoiceId, testId: sampleTest.id, price: sampleTest.billRate, test: sampleTest },
                ]),
            }),
            repoPaymentTransaction: () => ({
                find: jest.fn<any>().mockResolvedValue([]),
            }),
            repoDoctor: () => ({
                findOne: jest.fn<any>().mockImplementation(async (opts: any) =>
                    opts?.where?.id === sampleDoctorId ? sampleDoctor : null
                ),
            }),
        };

        const mockSettingsService = {
            getSettings: jest.fn<any>().mockResolvedValue({
                centerName: 'DMDC',
                defaultVatRate: 5,
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [BillingController],
            providers: [
                BillingService,
                { provide: DatabaseService, useValue: mockDatabaseService },
                { provide: SettingsService, useValue: mockSettingsService },
            ],
        }).compile();

        service = module.get<BillingService>(BillingService);
        controller = module.get<BillingController>(BillingController);
    });

    describe('1. Creating a billing record with and without Test Availability Note', () => {
        it('creates a billing record with a testAvailabilityNote and trims whitespace', async () => {
            const created = await controller.create(
                {
                    patientId: samplePatientId,
                    items: [{ testId: sampleTest.id, price: 500 }],
                    discountType: 'FIXED',
                    discount: 50,
                    vatRate: 0,
                    additionalCharges: 0,
                    paidAmount: 450,
                    paymentMethod: 'Cash',
                    referredBy: 'Dr. Abdur Rahman',
                    referredByDoctorId: sampleDoctorId,
                    testAvailabilityNote: '  Report will be ready after 24 hours.  \nCollect from Counter 2.  ',
                } as any,
                { user: { id: 'staff-1', role: UserRole.RECEPTIONIST } }
            );

            expect(created).toBeDefined();
            expect(created?.testAvailabilityNote).toBe('Report will be ready after 24 hours.  \nCollect from Counter 2.');
            expect(created?.totalAmount).toBe(450);
            expect(created?.paidAmount).toBe(450);
            expect(created?.paymentStatus).toBe('Paid');
            expect(created?.referredByDoctorId).toBe(sampleDoctorId);
        });

        it('creates a billing record without a testAvailabilityNote (stores null safely)', async () => {
            const created = await controller.create(
                {
                    patientId: samplePatientId,
                    items: [{ testId: sampleTest.id, price: 500 }],
                    discountType: 'FIXED',
                    discount: 0,
                    paidAmount: 0,
                    paymentMethod: 'Cash',
                } as any,
                { user: { id: 'staff-1', role: UserRole.RECEPTIONIST } }
            );

            expect(created).toBeDefined();
            expect(created?.testAvailabilityNote).toBeNull();
        });
    });

    describe('2. Updating, clearing, and retrieving Test Availability Note (Persistence across refresh)', () => {
        it('updates an existing testAvailabilityNote and persists across subsequent GET /billing/:id and GET /billing calls', async () => {
            // Step 1: Create invoice with initial note
            await controller.create(
                {
                    patientId: samplePatientId,
                    items: [{ testId: sampleTest.id, price: 500 }],
                    testAvailabilityNote: 'Test will be available tomorrow.',
                } as any,
                { user: { id: 'staff-1', role: UserRole.RECEPTIONIST } }
            );

            // Step 2: Update the note via PATCH /billing/:id
            const updated = await controller.update(
                sampleInvoiceId,
                {
                    testAvailabilityNote: '  Report expected within 3 working days (5:00 PM).  ',
                },
                { user: { id: 'staff-1', role: UserRole.RECEPTIONIST } }
            );

            expect(updated.testAvailabilityNote).toBe('Report expected within 3 working days (5:00 PM).');

            // Step 3: Simulate page refresh by re-fetching via findOne and findAll
            const fetchedOne = await controller.findOne(sampleInvoiceId, {
                user: { id: 'staff-1', role: UserRole.RECEPTIONIST },
            });
            expect(fetchedOne.testAvailabilityNote).toBe('Report expected within 3 working days (5:00 PM).');

            const fetchedAll = await controller.findAll('1', '10', '', {
                user: { id: 'staff-1', role: UserRole.RECEPTIONIST },
            });
            expect(fetchedAll.data[0].testAvailabilityNote).toBe('Report expected within 3 working days (5:00 PM).');
        });

        it('clears a previously saved testAvailabilityNote when updated with empty string or null', async () => {
            await controller.create(
                {
                    patientId: samplePatientId,
                    items: [{ testId: sampleTest.id, price: 500 }],
                    testAvailabilityNote: 'Test sample collection will be available on Sunday.',
                } as any,
                { user: { id: 'staff-1', role: UserRole.ADMIN } }
            );

            // Clear with whitespace/empty string
            const cleared = await controller.update(
                sampleInvoiceId,
                { testAvailabilityNote: '   ' },
                { user: { id: 'staff-1', role: UserRole.ADMIN } }
            );
            expect(cleared.testAvailabilityNote).toBeNull();

            // Re-set and then clear with explicit null
            await controller.update(
                sampleInvoiceId,
                { testAvailabilityNote: 'Report delivery time: 5:00 PM.' },
                { user: { id: 'staff-1', role: UserRole.ADMIN } }
            );
            const clearedWithNull = await controller.update(
                sampleInvoiceId,
                { testAvailabilityNote: null },
                { user: { id: 'staff-1', role: UserRole.ADMIN } }
            );
            expect(clearedWithNull.testAvailabilityNote).toBeNull();
        });
    });

    describe('3. Validation & Security Boundaries', () => {
        it('rejects non-string testAvailabilityNote values and notes exceeding maximum length', async () => {
            expect(() => normalizeTestAvailabilityNote(12345)).toThrow(BadRequestException);
            expect(() => normalizeTestAvailabilityNote({ note: 'invalid' })).toThrow(BadRequestException);

            const oversizedNote = 'A'.repeat(MAX_TEST_AVAILABILITY_NOTE_LENGTH + 1);
            expect(() => normalizeTestAvailabilityNote(oversizedNote)).toThrow(BadRequestException);

            await expect(
                service.create({
                    patientId: samplePatientId,
                    items: [{ testId: sampleTest.id, price: 500 }],
                    testAvailabilityNote: oversizedNote,
                })
            ).rejects.toThrow(BadRequestException);
        });

        it('prevents unauthorized patient/user role from modifying billing notes or viewing another patient invoice', async () => {
            await controller.create(
                {
                    patientId: samplePatientId,
                    items: [{ testId: sampleTest.id, price: 500 }],
                    testAvailabilityNote: 'Report will be ready after 24 hours.',
                } as any,
                { user: { id: 'staff-1', role: UserRole.RECEPTIONIST } }
            );

            await expect(
                service.update(
                    sampleInvoiceId,
                    { testAvailabilityNote: 'Tampered note' },
                    { id: 'patient-user', role: UserRole.USER }
                )
            ).rejects.toThrow(ForbiddenException);

            await expect(
                service.findOne(sampleInvoiceId, {
                    id: 'other-user',
                    role: UserRole.USER,
                    email: 'stranger@example.com',
                    phone: '01999999999',
                })
            ).rejects.toThrow(ForbiddenException);
        });

        it('throws NotFoundException when updating a non-existent invoice ID', async () => {
            await expect(
                service.update(
                    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
                    { testAvailabilityNote: 'Test currently unavailable.' },
                    { id: 'staff-1', role: UserRole.ADMIN }
                )
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('4. Reversible Database Migration (AddTestAvailabilityNoteToBillings1730400000000)', () => {
        it('adds nullable TEXT column test_availability_note in up() and drops it cleanly in down()', async () => {
            const migration = new AddTestAvailabilityNoteToBillings1730400000000();
            const addColumnMock = jest.fn<any>().mockResolvedValue(undefined);
            const dropColumnMock = jest.fn<any>().mockResolvedValue(undefined);

            const upRunner: any = {
                hasColumn: jest.fn<any>().mockResolvedValue(false),
                addColumn: addColumnMock,
            };
            await migration.up(upRunner);

            expect(upRunner.hasColumn).toHaveBeenCalledWith('billings', 'test_availability_note');
            expect(addColumnMock).toHaveBeenCalledTimes(1);
            const [tableName, columnDef] = addColumnMock.mock.calls[0] as [string, any];
            expect(tableName).toBe('billings');
            expect(columnDef.name).toBe('test_availability_note');
            expect(columnDef.type).toBe('text');
            expect(columnDef.isNullable).toBe(true);

            const downRunner: any = {
                hasColumn: jest.fn<any>().mockResolvedValue(true),
                dropColumn: dropColumnMock,
            };
            await migration.down(downRunner);

            expect(downRunner.hasColumn).toHaveBeenCalledWith('billings', 'test_availability_note');
            expect(dropColumnMock).toHaveBeenCalledWith('billings', 'test_availability_note');
        });
    });
});


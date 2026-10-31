import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DoctorsService, formatDoctorDisplayName } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { DatabaseService } from '../database/database.service';
import { RolesGuard } from '../common/roles.guard';
import { ROLES_KEY } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('DoctorsService & DoctorsController (Autocomplete & Validation)', () => {
    let service: DoctorsService;
    let controller: DoctorsController;
    let mockDoctorRepo: any;
    let mockQb: any;

    const sampleDoctors = [
        {
            id: '11111111-1111-4111-8111-111111111111',
            firstName: 'Abdur',
            lastName: 'Rahman',
            specialization: 'Cardiology',
            degree: 'MBBS, FCPS',
            department: 'Cardiology',
            bio: 'Senior cardiologist',
            consultationFee: 1000,
        },
        {
            id: '22222222-2222-4222-8222-222222222222',
            firstName: 'Nusrat',
            lastName: 'Jahan',
            specialization: 'Neurology',
            degree: 'MBBS, MD',
            department: 'Neurology',
            bio: 'Consultant neurologist',
            consultationFee: 1200,
        },
    ];

    beforeEach(async () => {
        mockQb = {
            select: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn<any>().mockResolvedValue(sampleDoctors),
            getManyAndCount: jest.fn<any>().mockResolvedValue([sampleDoctors, sampleDoctors.length]),
        };

        mockDoctorRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        const mockDatabaseService = {
            repoDoctor: () => mockDoctorRepo,
            repoAppointment: () => ({ createQueryBuilder: jest.fn() }),
            repoBilling: () => ({ createQueryBuilder: jest.fn() }),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [DoctorsController],
            providers: [
                DoctorsService,
                { provide: DatabaseService, useValue: mockDatabaseService },
            ],
        }).compile();

        service = module.get<DoctorsService>(DoctorsService);
        controller = module.get<DoctorsController>(DoctorsController);
    });

    describe('formatDoctorDisplayName', () => {
        it('prefixes Dr. when not present and avoids duplicate Dr. prefix', () => {
            expect(formatDoctorDisplayName('Abdur', 'Rahman')).toBe('Dr. Abdur Rahman');
            expect(formatDoctorDisplayName('Dr. Abdur', 'Rahman')).toBe('Dr. Abdur Rahman');
            expect(formatDoctorDisplayName('', '')).toBe('');
        });
    });

    describe('autocomplete', () => {
        it('returns only required autocomplete fields and formatted doctor name', async () => {
            const results = await service.autocomplete('Rahman', 10);

            expect(mockQb.select).toHaveBeenCalledWith([
                'doctor.id',
                'doctor.firstName',
                'doctor.lastName',
                'doctor.specialization',
                'doctor.degree',
                'doctor.department',
            ]);
            expect(mockQb.take).toHaveBeenCalledWith(10);
            expect(results).toHaveLength(2);
            expect(results[0]).toEqual({
                id: '11111111-1111-4111-8111-111111111111',
                firstName: 'Abdur',
                lastName: 'Rahman',
                name: 'Dr. Abdur Rahman',
                specialization: 'Cardiology',
                degree: 'MBBS, FCPS',
                department: 'Cardiology',
            });
            // Ensure heavy/sensitive fields like bio or consultationFee are not leaked in autocomplete response
            expect((results[0] as any).bio).toBeUndefined();
            expect((results[0] as any).consultationFee).toBeUndefined();
        });

        it('supports case-insensitive partial matching and strips leading "Dr." prefix', async () => {
            await service.autocomplete('Dr. Rahman', 10);

            expect(mockQb.where).toHaveBeenCalledWith(
                expect.stringContaining('doctor.firstName ILIKE :search'),
                { search: '%Rahman%' }
            );
        });

        it('supports multi-token full name search (e.g. "Dr. Abdur Rahman")', async () => {
            await service.autocomplete('Dr. Abdur Rahman', 10);

            expect(mockQb.where).toHaveBeenCalledWith(
                expect.stringContaining(':search_0'),
                { search_0: '%Abdur%' }
            );
            expect(mockQb.andWhere).toHaveBeenCalledWith(
                expect.stringContaining(':search_1'),
                { search_1: '%Rahman%' }
            );
        });

        it('returns empty array when no matching doctor is found', async () => {
            mockQb.getMany.mockResolvedValueOnce([]);
            const results = await service.autocomplete('NonExistentDoctor', 10);
            expect(results).toEqual([]);
        });

        it('validates search query length and limit bounds on server side', async () => {
            await expect(service.autocomplete('a'.repeat(101), 10)).rejects.toThrow(BadRequestException);
            await expect(service.autocomplete('Rahman', 0)).rejects.toThrow(BadRequestException);
            await expect(service.autocomplete('Rahman', -5)).rejects.toThrow(BadRequestException);
            await expect(service.autocomplete('Rahman', 51)).rejects.toThrow(BadRequestException);
        });
    });

    describe('Role & Permission Isolation', () => {
        it('enforces role boundaries on DoctorsController.autocomplete', () => {
            const reflector = new Reflector();
            const allowedRoles = reflector.get<UserRole[]>(ROLES_KEY, controller.autocomplete);
            expect(allowedRoles).toEqual(
                expect.arrayContaining([
                    UserRole.SUPER_ADMIN,
                    UserRole.ADMIN,
                    UserRole.DOCTOR,
                    UserRole.RECEPTIONIST,
                ])
            );
            expect(allowedRoles).not.toContain(UserRole.USER);

            const guard = new RolesGuard(reflector);
            const createContext = (role?: UserRole) =>
                ({
                    getHandler: () => controller.autocomplete,
                    getClass: () => DoctorsController,
                    switchToHttp: () => ({
                        getRequest: () => ({ user: role ? { id: 'u1', role } : undefined }),
                    }),
                }) as any;

            expect(guard.canActivate(createContext(UserRole.RECEPTIONIST))).toBe(true);
            expect(guard.canActivate(createContext(UserRole.ADMIN))).toBe(true);
            expect(guard.canActivate(createContext(UserRole.USER))).toBe(false);
        });
    });
});


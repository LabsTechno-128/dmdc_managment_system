import { Test, TestingModule } from '@nestjs/testing';
import { FinancialReportService } from './financial-report.service';
import { DatabaseService } from '../../database/database.service';
import { PaymentTransactionType } from '@hospital/database';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('FinancialReportService', () => {
    let service: FinancialReportService;
    let mockPaymentTransactionRepo: any;
    let mockExpenseRepo: any;

    beforeEach(async () => {
        const createMockQb = (rawResult: any, manyResult: any[] = []) => ({
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            getRawOne: jest.fn<any>().mockResolvedValue(rawResult),
            getRawMany: jest.fn<any>().mockResolvedValue(manyResult),
            getMany: jest.fn<any>().mockResolvedValue(manyResult),
        });

        mockPaymentTransactionRepo = {
            createQueryBuilder: jest.fn().mockImplementation(() =>
                createMockQb(
                    { total: '5000', count: '10' },
                    [
                        { id: 'pt-1', createdAt: new Date('2026-10-01'), date: '2026-10-01', amount: '2000' },
                        { id: 'pt-2', createdAt: new Date('2026-10-02'), date: '2026-10-02', amount: '3000' }
                    ]
                )
            ),
        };

        mockExpenseRepo = {
            createQueryBuilder: jest.fn().mockImplementation(() =>
                createMockQb(
                    { total: '1500', count: '5' },
                    [
                        { id: 'exp-1', expenseDate: new Date('2026-10-01'), date: '2026-10-01', amount: '500' },
                        { id: 'exp-2', expenseDate: new Date('2026-10-02'), date: '2026-10-02', amount: '1000' }
                    ]
                )
            ),
        };

        const mockDatabaseService = {
            repoPaymentTransaction: () => mockPaymentTransactionRepo,
            repoExpense: () => mockExpenseRepo,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FinancialReportService,
                { provide: DatabaseService, useValue: mockDatabaseService },
            ],
        }).compile();

        service = module.get<FinancialReportService>(FinancialReportService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getReport', () => {
        it('should calculate income, expense, and net profit correctly for monthly period', async () => {
            const report = await service.getReport({ period: 'MONTHLY' });
            expect(report).toBeDefined();
            expect(report.income.total).toBe(5000);
            expect(report.income.transactionCount).toBe(10);
            expect(report.expense.total).toBe(1500);
            expect(report.expense.transactionCount).toBe(5);
            expect(report.profit).toBe(3500);
            expect(report.period.startDate).toBeDefined();
            expect(report.period.endDate).toBeDefined();
        });

        it('should calculate for custom date range properly', async () => {
            const report = await service.getReport({
                period: 'CUSTOM',
                startDate: '2026-10-01',
                endDate: '2026-10-15',
            });
            expect(report.period.startDate).toBe('2026-10-01');
            expect(report.period.endDate).toBe('2026-10-15');
            expect(report.profit).toBe(3500);
        });
    });

    describe('getComparison', () => {
        it('should calculate percentage changes vs previous period', async () => {
            const comparison = await service.getComparison('MONTHLY');
            expect(comparison.current.income).toBe(5000);
            expect(comparison.current.expense).toBe(1500);
            expect(comparison.current.profit).toBe(3500);
            expect(comparison.changes).toBeDefined();
        });
    });

    describe('getChartData', () => {
        it('should return daily breakdown with precision amounts', async () => {
            const chartData = await service.getChartData('2026-10-01', '2026-10-02', 'DAY');
            expect(Array.isArray(chartData)).toBe(true);
            expect(chartData.length).toBe(2);
            expect(chartData[0].dateKey).toBe('2026-10-01');
            expect(chartData[0].income).toBe(2000);
            expect(chartData[0].expense).toBe(500);
            expect(chartData[0].profit).toBe(1500);
        });

        it('should aggregate data when grouped by WEEK', async () => {
            const chartData = await service.getChartData('2026-10-01', '2026-10-07', 'WEEK');
            expect(Array.isArray(chartData)).toBe(true);
            expect(chartData.length).toBeGreaterThan(0);
            expect(chartData[0].period).toContain('Week of');
            expect(typeof chartData[0].income).toBe('number');
            expect(typeof chartData[0].expense).toBe('number');
        });
    });

    describe('getTransactions', () => {
        it('should combine and reconcile transactions accurately', async () => {
            const result = await service.getTransactions({
                period: 'CUSTOM',
                startDate: '2026-10-01',
                endDate: '2026-10-02',
                type: 'ALL',
            });

            expect(result).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.period.startDate).toBe('2026-10-01');
            expect(result.period.endDate).toBe('2026-10-02');
            expect(typeof result.summary.incomeTotal).toBe('number');
            expect(typeof result.summary.expenseTotal).toBe('number');
            expect(result.summary.netTotal).toBe(result.summary.incomeTotal - result.summary.expenseTotal);
        });
    });
});

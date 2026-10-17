import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PaymentTransactionType } from '@hospital/database';

const formatYMD = (d: Date) => {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

const parseYMD = (ymd: string) => {
    const [y, m, d] = ymd.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

@Injectable()
export class FinancialReportService {
    constructor(private readonly databaseService: DatabaseService) { }

    private async getTotalsForDateRange(startDate: Date, endDate: Date, utcStart: Date, utcEnd: Date) {
        const incomeResult = await this.databaseService.repoPaymentTransaction()
            .createQueryBuilder('pt')
            .select("SUM(pt.amount)", "total")
            .addSelect("COUNT(pt.id)", "count")
            .where('pt.type = :type', { type: PaymentTransactionType.PAYMENT })
            .andWhere('pt.status = :status', { status: 'Completed' })
            .andWhere('pt.createdAt >= :startDate', { startDate })
            .andWhere('pt.createdAt <= :endDate', { endDate })
            .getRawOne();

        const expenseResult = await this.databaseService.repoExpense()
            .createQueryBuilder('e')
            .select("SUM(e.amount)", "total")
            .addSelect("COUNT(e.id)", "count")
            .where('e.expenseDate >= :startDate', { startDate: utcStart })
            .andWhere('e.expenseDate <= :endDate', { endDate: utcEnd })
            .getRawOne();

        const incomeTotal = Number(incomeResult?.total || 0);
        const incomeCount = Number(incomeResult?.count || 0);

        const expenseTotal = Number(expenseResult?.total || 0);
        const expenseCount = Number(expenseResult?.count || 0);

        return {
            income: { total: incomeTotal, transactionCount: incomeCount },
            expense: { total: expenseTotal, transactionCount: expenseCount },
            profit: incomeTotal - expenseTotal,
        };
    }

    private getDateRangeForPeriod(period: string, dateStr?: string) {
        const refDate = dateStr ? new Date(dateStr) : new Date();
        const now = refDate;

        let sDate = '';
        let eDate = '';
        let startDate: Date;
        let endDate: Date;

        switch (period) {
            case 'DAILY':
                startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now); endDate.setHours(23, 59, 59, 999);
                sDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                eDate = sDate;
                break;
            case 'WEEKLY':
                startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 6); endDate.setHours(23, 59, 59, 999);
                sDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                eDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                break;
            case 'MONTHLY':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1); startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                sDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                eDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                break;
            default:
                startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now); endDate.setHours(23, 59, 59, 999);
                sDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                eDate = sDate;
        }

        const utcStart = new Date(sDate);
        const utcEnd = new Date(eDate);
        utcEnd.setUTCHours(23, 59, 59, 999);

        return { startDate, endDate, utcStart, utcEnd };
    }

    private resolveDateRange(period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM', startDateStr?: string, endDateStr?: string, dateStr?: string) {
        let startDate: Date;
        let endDate: Date;
        let utcStart: Date;
        let utcEnd: Date;

        if (period === 'CUSTOM') {
            if (!startDateStr || !endDateStr) throw new BadRequestException('startDate and endDate required');
            startDate = parseYMD(startDateStr);
            endDate = parseYMD(endDateStr);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            utcStart = new Date(startDateStr);
            utcEnd = new Date(endDateStr);
            utcEnd.setUTCHours(23, 59, 59, 999);
        } else {
            const range = this.getDateRangeForPeriod(period || 'DAILY', dateStr);
            startDate = range.startDate;
            endDate = range.endDate;
            utcStart = range.utcStart;
            utcEnd = range.utcEnd;
        }

        return { startDate, endDate, utcStart, utcEnd };
    }

    async getReport(queryDto: { period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM', startDate?: string, endDate?: string, date?: string }) {
        const { startDate, endDate, utcStart, utcEnd } = this.resolveDateRange(
            queryDto.period,
            queryDto.startDate,
            queryDto.endDate,
            queryDto.date
        );

        const data = await this.getTotalsForDateRange(startDate, endDate, utcStart, utcEnd);

        return {
            period: {
                startDate: formatYMD(startDate),
                endDate: formatYMD(endDate),
            },
            income: data.income,
            expense: data.expense,
            profit: data.profit,
        };
    }

    async getComparison(period: 'DAILY' | 'WEEKLY' | 'MONTHLY', date?: string) {
        const currentRange = this.getDateRangeForPeriod(period, date);
        const prevRef = new Date(currentRange.startDate);

        if (period === 'DAILY') {
            prevRef.setDate(prevRef.getDate() - 1);
        } else if (period === 'WEEKLY') {
            prevRef.setDate(prevRef.getDate() - 7);
        } else if (period === 'MONTHLY') {
            prevRef.setMonth(prevRef.getMonth() - 1);
        }

        const prevRange = this.getDateRangeForPeriod(period, prevRef.toISOString());

        const current = await this.getTotalsForDateRange(currentRange.startDate, currentRange.endDate, currentRange.utcStart, currentRange.utcEnd);
        const previous = await this.getTotalsForDateRange(prevRange.startDate, prevRange.endDate, prevRange.utcStart, prevRange.utcEnd);

        const calculateChange = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0; // If prev 0, return 100% if current > 0
            return Number((((curr - prev) / prev) * 100).toFixed(2));
        };

        return {
            current: {
                income: current.income.total,
                expense: current.expense.total,
                profit: current.profit
            },
            previous: {
                income: previous.income.total,
                expense: previous.expense.total,
                profit: previous.profit
            },
            changes: {
                income: calculateChange(current.income.total, previous.income.total),
                expense: calculateChange(current.expense.total, previous.expense.total),
                profit: calculateChange(current.profit, previous.profit)
            }
        };
    }

    async getChartData(startStr: string, endStr: string, groupBy: 'DAY' | 'WEEK' | 'MONTH') {
        const startDate = parseYMD(startStr);
        startDate.setHours(0, 0, 0, 0);
        const endDate = parseYMD(endStr);
        endDate.setHours(23, 59, 59, 999);

        const incomeResult = await this.databaseService.repoPaymentTransaction()
            .createQueryBuilder('pt')
            .select("SUM(pt.amount)", "amount")
            .addSelect("DATE(pt.createdAt)", "date")
            .where('pt.type = :type', { type: PaymentTransactionType.PAYMENT })
            .andWhere('pt.status = :status', { status: 'Completed' })
            .andWhere('pt.createdAt >= :startDate', { startDate })
            .andWhere('pt.createdAt <= :endDate', { endDate })
            .groupBy("DATE(pt.createdAt)")
            .getRawMany();

        const expenseResult = await this.databaseService.repoExpense()
            .createQueryBuilder('e')
            .select("SUM(e.amount)", "amount")
            .addSelect("DATE(e.expenseDate)", "date")
            .where('e.expenseDate >= :startDate', { startDate: new Date(startStr) })
            .andWhere('e.expenseDate <= :endDate', { endDate: (() => { const d = new Date(endStr); d.setUTCHours(23, 59, 59, 999); return d; })() })
            .groupBy("DATE(e.expenseDate)")
            .getRawMany();

        const incomeMap = new Map<string, number>();
        const expenseMap = new Map<string, number>();

        incomeResult.forEach(item => {
            const dateKey = typeof item.date === 'string' ? item.date.slice(0, 10) : formatYMD(new Date(item.date));
            incomeMap.set(dateKey, Number(item.amount));
        });

        expenseResult.forEach(item => {
            const dateKey = typeof item.date === 'string' ? item.date.slice(0, 10) : formatYMD(new Date(item.date));
            expenseMap.set(dateKey, Number(item.amount));
        });

        // Generate full date range map
        const data = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            const key = formatYMD(current);
            const income = Math.round((incomeMap.get(key) || 0) * 100) / 100;
            const expense = Math.round((expenseMap.get(key) || 0) * 100) / 100;
            const profit = Math.round((income - expense) * 100) / 100;

            data.push({
                period: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                dateKey: key,
                startDate: key,
                endDate: key,
                income,
                expense,
                profit
            });

            current.setDate(current.getDate() + 1);
        }

        if (groupBy === 'DAY') return data;

        const groupedMap = new Map<string, any>();
        for (const item of data) {
            let groupKey = item.dateKey;
            const d = parseYMD(item.dateKey);
            let startDateStr = item.dateKey;
            let endDateStr = item.dateKey;

            if (groupBy === 'MONTH') {
                groupKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                startDateStr = `${groupKey}-01`;
                const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                endDateStr = `${groupKey}-${String(lastDay).padStart(2, '0')}`;
            } else if (groupBy === 'WEEK') {
                const startOfWeek = new Date(d);
                startOfWeek.setDate(d.getDate() - d.getDay());
                groupKey = formatYMD(startOfWeek);
                startDateStr = groupKey;
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endDateStr = formatYMD(endOfWeek);
            }

            if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, {
                    period: groupKey,
                    dateKey: groupKey,
                    startDate: startDateStr,
                    endDate: endDateStr,
                    income: 0,
                    expense: 0,
                    profit: 0
                });
            }
            const g = groupedMap.get(groupKey);
            g.income = Math.round((g.income + item.income) * 100) / 100;
            g.expense = Math.round((g.expense + item.expense) * 100) / 100;
            g.profit = Math.round((g.profit + item.profit) * 100) / 100;
        }

        return Array.from(groupedMap.values()).map(g => {
            if (groupBy === 'MONTH') {
                const [y, m] = g.dateKey.split('-');
                g.period = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            } else if (groupBy === 'WEEK') {
                const sDate = parseYMD(g.startDate);
                const eDate = parseYMD(g.endDate);
                g.period = `Week of ${sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${eDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            }
            return g;
        });
    }

    async getTransactions(queryDto: {
        period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM',
        startDate?: string,
        endDate?: string,
        date?: string,
        type?: 'ALL' | 'INCOME' | 'EXPENSE',
        search?: string,
        limit?: number,
        page?: number
    }) {
        const { startDate, endDate, utcStart, utcEnd } = this.resolveDateRange(
            queryDto.period || 'DAILY',
            queryDto.startDate,
            queryDto.endDate,
            queryDto.date
        );

        const typeFilter = queryDto.type || 'ALL';
        const search = queryDto.search?.trim().toLowerCase();

        let incomeItems: any[] = [];
        let expenseItems: any[] = [];

        if (typeFilter === 'ALL' || typeFilter === 'INCOME') {
            const incomeQb = this.databaseService.repoPaymentTransaction()
                .createQueryBuilder('pt')
                .leftJoinAndSelect('pt.patient', 'patient')
                .leftJoinAndSelect('pt.billing', 'billing')
                .leftJoinAndSelect('pt.receivedBy', 'receivedBy')
                .where('pt.type = :type', { type: PaymentTransactionType.PAYMENT })
                .andWhere('pt.status = :status', { status: 'Completed' })
                .andWhere('pt.createdAt >= :startDate', { startDate })
                .andWhere('pt.createdAt <= :endDate', { endDate });

            const transactions = await incomeQb.orderBy('pt.createdAt', 'DESC').getMany();

            incomeItems = transactions.map(pt => ({
                id: pt.id,
                date: pt.createdAt,
                type: 'INCOME' as const,
                category: 'Patient Billing',
                description: pt.billing?.billNumber
                    ? `Bill #${pt.billing.billNumber}${pt.patient?.name ? ` - ${pt.patient.name}` : ''}`
                    : (pt.patient?.name ? `Payment from ${pt.patient.name}` : 'Patient Payment'),
                paymentMethod: pt.paymentMethod || 'Cash',
                referenceId: pt.billing?.billNumber || (pt.id ? pt.id.slice(0, 8) : 'N/A'),
                amount: Number(pt.amount),
                patientName: pt.patient?.name || 'Walk-in',
                patientId: pt.patient?.patientId || pt.patient?.id || null,
                receivedBy: pt.receivedBy ? `${pt.receivedBy.firstName || ''} ${pt.receivedBy.lastName || ''}`.trim() : null
            }));
        }

        if (typeFilter === 'ALL' || typeFilter === 'EXPENSE') {
            const expenseQb = this.databaseService.repoExpense()
                .createQueryBuilder('e')
                .leftJoinAndSelect('e.createdBy', 'user')
                .where('e.expenseDate >= :startDate', { startDate: utcStart })
                .andWhere('e.expenseDate <= :endDate', { endDate: utcEnd });

            const expenses = await expenseQb.orderBy('e.expenseDate', 'DESC')
                .addOrderBy('e.createdAt', 'DESC')
                .getMany();

            expenseItems = expenses.map(e => ({
                id: e.id,
                date: e.expenseDate || e.createdAt,
                type: 'EXPENSE' as const,
                category: (e.expenseType || 'OTHER').replace(/_/g, ' '),
                description: e.description || (e.expenseType || 'Expense').replace(/_/g, ' '),
                paymentMethod: 'Cash',
                referenceId: e.referenceNumber || (e.id ? e.id.slice(0, 8) : 'N/A'),
                amount: Number(e.amount),
                createdBy: e.createdBy ? `${e.createdBy.firstName || ''} ${e.createdBy.lastName || ''}`.trim() : null
            }));
        }

        let combined = [...incomeItems, ...expenseItems];

        if (search) {
            combined = combined.filter(item =>
                (item.description && item.description.toLowerCase().includes(search)) ||
                (item.category && item.category.toLowerCase().includes(search)) ||
                (item.referenceId && item.referenceId.toLowerCase().includes(search)) ||
                (item.paymentMethod && item.paymentMethod.toLowerCase().includes(search)) ||
                (item.patientName && item.patientName.toLowerCase().includes(search))
            );
        }

        combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const incomeTotal = Math.round(incomeItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
        const expenseTotal = Math.round(expenseItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
        const netTotal = Math.round((incomeTotal - expenseTotal) * 100) / 100;

        const total = combined.length;
        const page = queryDto.page ? Number(queryDto.page) : 1;
        const limit = queryDto.limit ? Number(queryDto.limit) : combined.length;
        const paginated = (queryDto.limit && queryDto.page)
            ? combined.slice((page - 1) * limit, page * limit)
            : combined;

        return {
            period: {
                startDate: formatYMD(startDate),
                endDate: formatYMD(endDate),
            },
            results: paginated,
            total,
            page,
            limit,
            summary: {
                incomeTotal,
                expenseTotal,
                netTotal,
                incomeCount: incomeItems.length,
                expenseCount: expenseItems.length,
                totalCount: combined.length
            }
        };
    }
}

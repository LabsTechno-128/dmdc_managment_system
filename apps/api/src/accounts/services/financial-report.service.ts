import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PaymentTransactionType } from '@hospital/database';

const formatYMD = (d: Date) => {
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

const parseYMD = (ymd: string) => {
    const [y, m, d] = ymd.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

@Injectable()
export class FinancialReportService {
    constructor(private readonly databaseService: DatabaseService) {}

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
                startDate = new Date(now); startDate.setHours(0,0,0,0);
                endDate = new Date(now); endDate.setHours(23,59,59,999);
                sDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                eDate = sDate;
                break;
            case 'WEEKLY':
                startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0,0,0,0);
                endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 6); endDate.setHours(23,59,59,999);
                sDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                eDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                break;
            case 'MONTHLY':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1); startDate.setHours(0,0,0,0);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                sDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                eDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                break;
            default:
                startDate = new Date(now); startDate.setHours(0,0,0,0);
                endDate = new Date(now); endDate.setHours(23,59,59,999);
                sDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                eDate = sDate;
        }

        const utcStart = new Date(sDate);
        const utcEnd = new Date(eDate);
        utcEnd.setUTCHours(23, 59, 59, 999);

        return { startDate, endDate, utcStart, utcEnd };
    }

    async getReport(queryDto: { period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM', startDate?: string, endDate?: string, date?: string }) {
        let startDate: Date;
        let endDate: Date;
        let utcStart: Date;
        let utcEnd: Date;

        if (queryDto.period === 'CUSTOM') {
            if (!queryDto.startDate || !queryDto.endDate) throw new BadRequestException('startDate and endDate required');
            startDate = parseYMD(queryDto.startDate);
            endDate = parseYMD(queryDto.endDate);
            startDate.setHours(0,0,0,0);
            endDate.setHours(23,59,59,999);
            utcStart = new Date(queryDto.startDate);
            utcEnd = new Date(queryDto.endDate);
            utcEnd.setUTCHours(23, 59, 59, 999);
        } else {
            const range = this.getDateRangeForPeriod(queryDto.period || 'DAILY', queryDto.date);
            startDate = range.startDate;
            endDate = range.endDate;
            utcStart = range.utcStart;
            utcEnd = range.utcEnd;
        }

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
        // Simple manual generation of dates and querying to avoid complex DB grouping differences
        const startDate = parseYMD(startStr);
        startDate.setHours(0,0,0,0);
        const endDate = parseYMD(endStr);
        endDate.setHours(23,59,59,999);

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
            .andWhere('e.expenseDate <= :endDate', { endDate: (() => { const d = new Date(endStr); d.setUTCHours(23,59,59,999); return d; })() })
            .groupBy("DATE(e.expenseDate)")
            .getRawMany();

        const incomeMap = new Map();
        const expenseMap = new Map();

        incomeResult.forEach(item => {
            const dateKey = formatYMD(new Date(item.date));
            incomeMap.set(dateKey, Number(item.amount));
        });

        expenseResult.forEach(item => {
            const dateKey = formatYMD(new Date(item.date));
            expenseMap.set(dateKey, Number(item.amount));
        });

        // Generate full date range map
        const data = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            const key = formatYMD(current);
            const income = incomeMap.get(key) || 0;
            const expense = expenseMap.get(key) || 0;
            const profit = income - expense;

            data.push({
                period: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                dateKey: key,
                income,
                expense,
                profit
            });

            current.setDate(current.getDate() + 1);
        }

        // If grouping by WEEK or MONTH, we need to aggregate the daily `data` array
        if (groupBy === 'DAY') return data;
        
        // Very basic aggregation for WEEK/MONTH (summing adjacent items based on period string matching could work, but lets just return daily for now or group properly)
        const groupedMap = new Map();
        for (const item of data) {
            let groupKey = item.dateKey;
            const d = new Date(item.dateKey);
            if (groupBy === 'MONTH') {
                groupKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            } else if (groupBy === 'WEEK') {
                // simple week grouping: Sunday start
                const startOfWeek = new Date(d);
                startOfWeek.setDate(d.getDate() - d.getDay());
                groupKey = formatYMD(startOfWeek);
            }

            if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, { period: groupKey, income: 0, expense: 0, profit: 0 });
            }
            const g = groupedMap.get(groupKey);
            g.income += item.income;
            g.expense += item.expense;
            g.profit += item.profit;
        }

        return Array.from(groupedMap.values()).map(g => {
            if (groupBy === 'MONTH') {
                const [y, m] = g.period.split('-');
                g.period = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            } else if (groupBy === 'WEEK') {
                g.period = 'Week of ' + new Date(g.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return g;
        });
    }
}

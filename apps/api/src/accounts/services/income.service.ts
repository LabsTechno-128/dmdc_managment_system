import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PaymentTransactionType } from '@hospital/database';

const parseYMD = (ymd: string) => {
    const [y, m, d] = ymd.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

@Injectable()
export class IncomeService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getIncome(query: { startDate?: string, endDate?: string, page?: number, limit?: number }) {
        const { startDate, endDate, page = 1, limit = 10 } = query;
        const qb = this.databaseService.repoPaymentTransaction()
            .createQueryBuilder('pt')
            .leftJoinAndSelect('pt.patient', 'patient')
            .leftJoinAndSelect('pt.billing', 'billing')
            .where('pt.type = :type', { type: PaymentTransactionType.PAYMENT })
            .andWhere('pt.status = :status', { status: 'Completed' }); // Or 'Cash' depending on how status is tracked, wait PaymentTransaction has status='Completed' by default.

        if (startDate && endDate) {
            const start = parseYMD(startDate);
            start.setHours(0,0,0,0);
            const end = parseYMD(endDate);
            end.setHours(23,59,59,999);
            
            qb.andWhere('pt.createdAt >= :startDate', { startDate: start })
              .andWhere('pt.createdAt <= :endDate', { endDate: end });
        }

        qb.orderBy('pt.createdAt', 'DESC');
        
        const [data, total] = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
            
        // Calculate totals for summary cards based on the SAME filters, ignoring pagination
        const totalsQb = this.databaseService.repoPaymentTransaction()
            .createQueryBuilder('pt')
            .select('SUM(pt.amount)', 'total')
            .where('pt.type = :type', { type: PaymentTransactionType.PAYMENT })
            .andWhere('pt.status = :status', { status: 'Completed' });
            
        if (startDate && endDate) {
            const start = parseYMD(startDate);
            start.setHours(0,0,0,0);
            const end = parseYMD(endDate);
            end.setHours(23,59,59,999);
            totalsQb.andWhere('pt.createdAt >= :startDate', { startDate: start })
                    .andWhere('pt.createdAt <= :endDate', { endDate: end });
        }
        const filteredTotalResult = await totalsQb.getRawOne();

        // Specific time periods
        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
        const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
        
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
        
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const getAggregate = async (start: Date, end?: Date) => {
            const q = this.databaseService.repoPaymentTransaction().createQueryBuilder('pt')
                .select('SUM(pt.amount)', 'total')
                .where('pt.type = :type', { type: PaymentTransactionType.PAYMENT })
                .andWhere('pt.status = :status', { status: 'Completed' })
                .andWhere('pt.createdAt >= :start', { start });
            if (end) q.andWhere('pt.createdAt <= :end', { end });
            const res = await q.getRawOne();
            return Number(res?.total || 0);
        };

        const todayTotal = await getAggregate(todayStart, todayEnd);
        const weekTotal = await getAggregate(weekStart);
        const monthTotal = await getAggregate(monthStart);
        const allTimeTotal = await getAggregate(new Date(0));

        return {
            results: data,
            total,
            page,
            limit,
            summary: {
                filteredTotal: Number(filteredTotalResult?.total || 0),
                todayTotal,
                weekTotal,
                monthTotal,
                allTimeTotal
            }
        };
    }
}

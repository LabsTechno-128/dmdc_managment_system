import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { Expense } from '@hospital/database';

const parseYMD = (ymd: string) => {
    const [y, m, d] = ymd.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

@Injectable()
export class ExpenseService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getExpenses(query: { period?: string, startDate?: string, endDate?: string, expenseType?: string, page?: number, limit?: number }) {
        const { period, startDate, endDate, expenseType, page = 1, limit = 10 } = query;
        let start: Date | undefined;
        let end: Date | undefined;

        if (period && period !== 'CUSTOM' && period !== 'ALL') {
            const now = new Date();
            // Generate standard YYYY-MM-DD strings based on local time
            let sDate = '';
            let eDate = '';
            if (period === 'DAILY') {
                sDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                eDate = sDate;
            } else if (period === 'WEEKLY') {
                const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
                sDate = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
                eDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            } else if (period === 'MONTHLY') {
                sDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                eDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
            }
            // new Date('YYYY-MM-DD') parses as UTC midnight, matching how createExpense stores it!
            start = new Date(sDate);
            end = new Date(eDate);
            end.setUTCHours(23, 59, 59, 999);
        } else if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
        }

        const qb = this.databaseService.repoExpense().createQueryBuilder('e')
            .leftJoinAndSelect('e.createdBy', 'user');

        if (expenseType) {
            qb.andWhere('e.expenseType = :expenseType', { expenseType });
        }

        if (start && end) {
            qb.andWhere('e.expenseDate >= :startDate', { startDate: start })
              .andWhere('e.expenseDate <= :endDate', { endDate: end });
        }

        qb.orderBy('e.expenseDate', 'DESC')
          .addOrderBy('e.createdAt', 'DESC');
        
        const [data, total] = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        // Calculate summary for the filtered data
        const totalsQb = this.databaseService.repoExpense().createQueryBuilder('e')
            .select('SUM(e.amount)', 'total');

        if (expenseType) {
            totalsQb.andWhere('e.expenseType = :expenseType', { expenseType });
        }
        if (start && end) {
            totalsQb.andWhere('e.expenseDate >= :startDate', { startDate: start })
                    .andWhere('e.expenseDate <= :endDate', { endDate: end });
        }
        const filteredTotalResult = await totalsQb.getRawOne();
        const filteredTotal = Number(filteredTotalResult?.total || 0);

        return { results: data, total, page, limit, summary: { filteredTotal } };
    }

    async getExpense(id: string) {
        const expense = await this.databaseService.repoExpense().findOne({
            where: { id },
            relations: { createdBy: true }
        });
        if (!expense) throw new NotFoundException('Expense not found');
        return expense;
    }

    async createExpense(dto: CreateExpenseDto, userId: string) {
        const expense = this.databaseService.repoExpense().create({
            ...dto,
            createdById: userId,
            expenseDate: new Date(dto.expenseDate)
        });
        return this.databaseService.repoExpense().save(expense);
    }

    async updateExpense(id: string, dto: Partial<CreateExpenseDto>) {
        const expense = await this.getExpense(id);
        const updateData: Partial<Expense> = {
            expenseType: dto.expenseType,
            amount: dto.amount,
            description: dto.description,
            referenceNumber: dto.referenceNumber
        };
        if (dto.expenseDate) {
            updateData.expenseDate = new Date(dto.expenseDate);
        }
        Object.assign(expense, updateData);
        return this.databaseService.repoExpense().save(expense);
    }

    async deleteExpense(id: string) {
        const expense = await this.getExpense(id);
        await this.databaseService.repoExpense().remove(expense);
        return { success: true };
    }
}

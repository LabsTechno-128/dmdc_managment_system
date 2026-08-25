import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExpenseService } from '../services/expense.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { Request } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('accounts/expenses')
export class ExpenseController {
    constructor(private readonly expenseService: ExpenseService) {}

    @Get()
    getExpenses(@Query() query: any) {
        return this.expenseService.getExpenses({
            startDate: query.startDate,
            endDate: query.endDate,
            expenseType: query.expenseType,
            page: query.page ? parseInt(query.page) : 1,
            limit: query.limit ? parseInt(query.limit) : 10,
        });
    }

    @Get(':id')
    getExpense(@Param('id') id: string) {
        return this.expenseService.getExpense(id);
    }

    @Post()
    createExpense(@Request() req: any, @Body() body: CreateExpenseDto) {
        return this.expenseService.createExpense(body, req.user.id);
    }

    @Patch(':id')
    updateExpense(@Param('id') id: string, @Body() body: Partial<CreateExpenseDto>) {
        return this.expenseService.updateExpense(id, body);
    }

    @Delete(':id')
    deleteExpense(@Param('id') id: string) {
        return this.expenseService.deleteExpense(id);
    }
}

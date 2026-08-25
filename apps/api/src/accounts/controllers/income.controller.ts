import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IncomeService } from '../services/income.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { UserRole } from '@hospital/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('accounts/income')
export class IncomeController {
    constructor(private readonly incomeService: IncomeService) {}

    @Get()
    getIncome(@Query() query: any) {
        return this.incomeService.getIncome({
            startDate: query.startDate,
            endDate: query.endDate,
            page: query.page ? parseInt(query.page) : 1,
            limit: query.limit ? parseInt(query.limit) : 10,
        });
    }
}

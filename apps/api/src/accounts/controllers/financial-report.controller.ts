import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { FinancialReportService } from '../services/financial-report.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { UserRole } from '@hospital/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('accounts/financial-report')
export class FinancialReportController {
    constructor(private readonly financialReportService: FinancialReportService) {}

    @Get()
    getReport(@Query() query: { period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM', startDate?: string, endDate?: string, date?: string }) {
        return this.financialReportService.getReport(query);
    }

    @Get('chart')
    getChart(@Query() query: { groupBy?: 'DAY' | 'WEEK' | 'MONTH', startDate?: string, endDate?: string }) {
        if (!query.startDate || !query.endDate) {
            throw new BadRequestException('startDate and endDate are required for chart data');
        }
        return this.financialReportService.getChartData(query.startDate, query.endDate, query.groupBy || 'DAY');
    }

    @Get('comparison')
    getComparison(@Query() query: { period?: 'DAILY' | 'WEEKLY' | 'MONTHLY', date?: string }) {
        return this.financialReportService.getComparison(query.period || 'MONTHLY', query.date);
    }
}

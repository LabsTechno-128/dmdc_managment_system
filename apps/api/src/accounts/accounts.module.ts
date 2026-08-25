import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { IncomeService } from './services/income.service';
import { ExpenseController } from './controllers/expense.controller';
import { FinancialReportController } from './controllers/financial-report.controller';
import { IncomeController } from './controllers/income.controller';
import { ExpenseService } from './services/expense.service';
import { FinancialReportService } from './services/financial-report.service';

@Module({
    imports: [DatabaseModule],
    controllers: [IncomeController, ExpenseController, FinancialReportController],
    providers: [IncomeService, ExpenseService, FinancialReportService],
})
export class AccountsModule { }

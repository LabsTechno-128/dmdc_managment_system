import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Report } from '@hospital/database';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get()
    findAll() {
        return this.reportsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.reportsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: Partial<Report>) {
        return this.reportsService.update(id, data);
    }

    @Patch(':id/deliver')
    markDelivered(@Param('id') id: string) {
        return this.reportsService.markDelivered(id);
    }
}

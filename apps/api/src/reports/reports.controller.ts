import { Controller, UseGuards, Get, Patch, Param, Body, Post, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { ReportsService } from './reports.service';
import { Report } from '@hospital/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
    findAll(@Query('page') page: string, @Query('limit') limit: string) {
        return this.reportsService.findAll(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 10);
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
    findOne(@Param('id') id: string) {
        return this.reportsService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
    update(@Param('id') id: string, @Body() data: Partial<Report>) {
        return this.reportsService.update(id, data);
    }

    @Patch(':id/deliver')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
    markDelivered(@Param('id') id: string) {
        return this.reportsService.markDelivered(id);
    }

    @Post('finalize/:labResultId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR)
    finalizeReport(@Param('labResultId') labResultId: string) {
        return this.reportsService.finalizeReport(labResultId);
    }

    @Post(':id/publish')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR)
    publishReport(@Param('id') id: string) {
        return this.reportsService.publishReport(id);
    }

    @Get(':id/print')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
    getPrintData(@Param('id') id: string) {
        return this.reportsService.getPrintData(id);
    }
}

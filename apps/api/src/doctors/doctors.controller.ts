import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { DoctorsService } from './doctors.service';
import { Doctor, UserRole } from '@hospital/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
    constructor(private readonly doctorsService: DoctorsService) { }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Post()
    create(@Body() data: Partial<Doctor>) {
        return this.doctorsService.create(data);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
    @Get('autocomplete')
    autocomplete(
        @Query('search') search?: string,
        @Query('limit') limit?: string
    ) {
        return this.doctorsService.autocomplete(search, limit !== undefined ? Number(limit) : 10);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('search') search?: string
    ) {
        return this.doctorsService.findAll(Number(page), Number(limit), search);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
    @Get(':id/daily-stats')
    getDailyStats(
        @Param('id') id: string,
        @Query('date') date?: string
    ) {
        return this.doctorsService.getDailyStats(id, date);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.doctorsService.findOne(id);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Patch(':id')
    update(@Param('id') id: string, @Body() data: Partial<Doctor>) {
        return this.doctorsService.update(id, data);
    }

    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.doctorsService.remove(id);
    }
}

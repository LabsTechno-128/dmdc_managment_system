import { Controller, UseGuards, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { TestCounterService } from './test-counter.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.LAB_TECHNICIAN)
@Controller('test-counter')
export class TestCounterController {
    constructor(private readonly testCounterService: TestCounterService) {}

    @Get()
    getQueue(@Query() query: any) {
        return this.testCounterService.getQueue(query);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.testCounterService.updateStatus(id, status);
    }
}

import { Controller, UseGuards, Get, Patch, Param, Body } from '@nestjs/common';
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
    getQueue() {
        return this.testCounterService.getQueue();
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.testCounterService.updateStatus(id, status);
    }
}

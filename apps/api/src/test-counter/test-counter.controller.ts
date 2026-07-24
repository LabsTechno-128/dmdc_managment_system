import { Controller, UseGuards, Get, Patch, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TestCounterService } from './test-counter.service';

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

import { Controller, UseGuards, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) {}

    @Post()
    create(@Body() data: any) {
        return this.billingService.create(data);
    }

    @Get()
    findAll() {
        return this.billingService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.billingService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('paymentStatus') paymentStatus: string) {
        return this.billingService.updateStatus(id, paymentStatus);
    }
}

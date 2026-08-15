import { Controller, UseGuards, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { BillingService } from './billing.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
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

import { Controller, UseGuards, Get, Post, Body, Patch, Param, Query, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { BillingService } from './billing.service';

import { CreateBillingDto } from './dto/create-billing.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Post()
    create(@Body() data: CreateBillingDto, @Req() req?: any) {
        return this.billingService.create(data, req?.user);
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.USER)
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Req() req?: any
    ) {
        return this.billingService.findAll({ page, limit, search }, req?.user);
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.USER)
    findOne(@Param('id') id: string, @Req() req?: any) {
        return this.billingService.findOne(id, req?.user);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('paymentStatus') paymentStatus: string) {
        return this.billingService.updateStatus(id, paymentStatus);
    }

    @Patch(':id/payment')
    updatePayment(@Param('id') id: string, @Body('paidAmount') paidAmount: number, @Req() req?: any) {
        return this.billingService.updatePayment(id, paidAmount, req?.user);
    }

    @Post('appointment/:appointmentId')
    createConsultationBill(@Param('appointmentId') appointmentId: string, @Body() data: any, @Req() req?: any) {
        return this.billingService.createConsultationBill(appointmentId, data, req?.user);
    }

    @Post(':id/payments')
    createPayment(@Param('id') id: string, @Body() data: any, @Req() req?: any) {
        return this.billingService.createPayment(id, data, req?.user);
    }

    @Post(':id/settle')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    settleBalance(
        @Param('id') id: string,
        @Body() data: { amount: number; reason: string },
        @Req() req: any
    ) {
        return this.billingService.settleBalance(id, data, req?.user);
    }

    @Post(':id/authorize')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT)
    authorizeInvoice(@Param('id') id: string, @Req() req: any) {
        return this.billingService.authorizeInvoice(id, req?.user);
    }

    @Get(':id/payments')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.USER)
    getPayments(@Param('id') id: string, @Req() req?: any) {
        return this.billingService.getPayments(id, req?.user);
    }
}


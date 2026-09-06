import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { LabResultService } from './lab-result.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole, LabResultStatus } from '@hospital/database';

@Controller('api/lab-result')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabResultController {
    constructor(private readonly labResultService: LabResultService) {}

    @Get('billing/:billingId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_TECHNICIAN)
    async getTestsByBillingId(@Param('billingId') billingId: string) {
        return this.labResultService.getTestsByBillingId(billingId);
    }

    @Get('barcode/:barcode')
    @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_TECHNICIAN)
    async getByBarcode(@Param('barcode') barcode: string) {
        return this.labResultService.getByBarcode(barcode);
    }

    @Get('template/:testId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_TECHNICIAN)
    async getTemplate(@Param('testId') testId: string) {
        return this.labResultService.getTemplateByTestId(Number(testId));
    }

    @Post(':sampleId/draft')
    @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_TECHNICIAN)
    async saveDraft(
        @Param('sampleId') sampleId: string,
        @Body() body: { resultData: any, remarks: string },
        @Req() req: any
    ) {
        return this.labResultService.upsertResult(
            sampleId,
            body.resultData,
            LabResultStatus.IN_PROGRESS,
            body.remarks,
            req.user.id
        );
    }

    @Post(':sampleId/submit')
    @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_TECHNICIAN)
    async submitResult(
        @Param('sampleId') sampleId: string,
        @Body() body: { resultData: any, remarks: string },
        @Req() req: any
    ) {
        return this.labResultService.upsertResult(
            sampleId,
            body.resultData,
            LabResultStatus.COMPLETED,
            body.remarks,
            req.user.id
        );
    }

    @Post(':sampleId/recollect')
    @Roles(UserRole.SUPER_ADMIN, UserRole.LAB_TECHNICIAN)
    async recollectSample(@Param('sampleId') sampleId: string) {
        return this.labResultService.recollectSample(sampleId);
    }
}

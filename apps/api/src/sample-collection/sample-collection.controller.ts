import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query, Req } from '@nestjs/common';
import { SampleCollectionService } from './sample-collection.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sample-collection')
export class SampleCollectionController {
    constructor(private readonly sampleCollectionService: SampleCollectionService) {}

    // 1. Search Billings
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Get('search')
    searchBillings(@Query('query') query: string) {
        return this.sampleCollectionService.searchBillings(query);
    }

    // 2. Get samples for a billing (or preview)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Get('billing/:billingId')
    getSamplesForBilling(@Param('billingId') billingId: string) {
        return this.sampleCollectionService.getSamplesForBilling(billingId);
    }

    // 3. Initialize samples for a billing
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Post('billing/:billingId/initialize')
    initializeSamples(@Param('billingId') billingId: string) {
        return this.sampleCollectionService.initializeSamples(billingId);
    }

    // 4. Update sample status
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() body: { status: any, notes?: string },
        @Req() req: any
    ) {
        return this.sampleCollectionService.updateStatus(id, body.status, req.user.id, body.notes);
    }

    // 5. Get sample by barcode
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_TECHNICIAN, UserRole.SAMPLE_COLLECTION)
    @Get('barcode/:barcode')
    getSampleByBarcode(@Param('barcode') barcode: string) {
        return this.sampleCollectionService.getSampleByBarcode(barcode);
    }
}

import { Controller, UseGuards, Get, Patch, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@hospital/database';
import { SettingsService } from './settings.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get()
    @Roles(
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.RECEPTIONIST,
        UserRole.DOCTOR,
        UserRole.ACCOUNTANT,
        UserRole.PHARMACIST,
        UserRole.LAB_TECHNICIAN,
        UserRole.USER
    )
    getSettings() {
        return this.settingsService.getSettings();
    }

    @Patch()
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    updateSettings(@Body() body: any) {
        return this.settingsService.updateSettings(body);
    }
}


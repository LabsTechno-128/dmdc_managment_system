import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { HospitalSetting } from '@hospital/database';

@Injectable()
export class SettingsService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getSettings(): Promise<HospitalSetting> {
        const repo = this.databaseService.repoHospitalSetting();
        const existing = await repo.find({ order: { createdAt: 'ASC' }, take: 1 });
        let setting = existing.length > 0 ? existing[0] : null;
        if (!setting) {
            setting = repo.create({
                centerName: 'Dr. Muazzem Medical Diagnostic Center',
                address: '82/83, 2nd Floor, Assalam Tower, Zoo Road, Mirpur - 1, Dhaka',
                phone: '01234567890, 01234567899',
                email: 'dmdc.contact@gmail.com',
                currency: 'BDT',
                bin: '001234567-0101',
                musakForm: 'Mushak-6.3 (মূসক-৬.৩)',
                defaultVatRate: 0,
            });
            setting = await repo.save(setting);
        }
        return setting;
    }

    async updateSettings(data: Partial<HospitalSetting>): Promise<HospitalSetting> {
        const current = await this.getSettings();
        const repo = this.databaseService.repoHospitalSetting();

        if (data.centerName !== undefined) current.centerName = data.centerName;
        if (data.address !== undefined) current.address = data.address;
        if (data.phone !== undefined) current.phone = data.phone;
        if (data.email !== undefined) current.email = data.email;
        if (data.currency !== undefined) current.currency = data.currency;
        if (data.bin !== undefined) current.bin = data.bin;
        if (data.musakForm !== undefined) current.musakForm = data.musakForm;
        if (data.defaultVatRate !== undefined) {
            const rate = Number(data.defaultVatRate);
            current.defaultVatRate = isNaN(rate) ? 0 : Math.max(0, Math.round(rate * 100) / 100);
        }

        return await repo.save(current);
    }
}


import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
    // For now, settings can be mocked or stored in a separate table
    // In this basic implementation, we just return static settings.
    async getSettings() {
        return {
            centerName: 'Diagnostic Center Pro',
            address: '123 Health Ave, Medical City',
            phone: '+1 234 567 8900',
            email: 'contact@diagnosticpro.com',
            currency: 'BDT'
        };
    }
}

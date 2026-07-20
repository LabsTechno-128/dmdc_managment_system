import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
    constructor(private readonly databaseService: DatabaseService) {}

    async login(email: string) {
        let user = await this.databaseService.repoUser().findOne({ where: { email } });
        if (!user) {
            // Auto-create for demo purposes
            user = await this.databaseService.repoUser().save({
                email,
                name: 'Riya',
                password: 'password123'
            });
        }
        return {
            accessToken: 'mock-jwt-token-123',
            user
        };
    }
}

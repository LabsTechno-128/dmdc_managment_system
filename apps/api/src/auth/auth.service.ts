import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService
    ) { }

    async login(email: string, password?: string) {
        if (!email) email = 'receptionist@diagnosticpro.com';

        let user = await this.databaseService.repoUser().findOne({ where: { email } });

        if (!user) {
            // Auto-create for demo purposes
            const hashedPassword = await bcrypt.hash('password123', 10);
            user = await this.databaseService.repoUser().save({
                email,
                firstName: 'Riya',
                lastName: 'Demo',
                employeeId: 'EMP001',
                phone: '1234567890',
                password: hashedPassword
            });
        }

        // Only check password if provided (for backward compatibility during dev)
        if (password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new UnauthorizedException('Invalid credentials');
            }
        }

        const payload = { sub: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` };
        return {
            accessToken: this.jwtService.sign(payload),
            user: { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email }
        };
    }

    async register(email: string, password: string) {
        try {
            if (!email) email = 'receptionist@diagnosticpro.com';

            let user = await this.databaseService.repoUser().findOne({ where: { email } });

            if (user) {
                throw new UnauthorizedException('User already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            user = await this.databaseService.repoUser().save({
                email,
                firstName: 'Riya',
                lastName: 'Demo',
                employeeId: 'EMP001',
                phone: '1234567890',
                password: hashedPassword
            });

            const payload = { sub: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` };
            return {
                accessToken: this.jwtService.sign(payload),
                user: { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email }
            };
        } catch (error) {
            console.log(error)
        }
    }

    // create user 
    async createUser(user: any) {
        try {
            const newUser = await this.databaseService.repoUser().save(user);
            return newUser;
        } catch (error) {
            console.log(error)
        }
    }
}

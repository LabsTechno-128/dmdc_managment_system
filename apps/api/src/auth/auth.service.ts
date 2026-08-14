import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const user = await this.databaseService.repoUser().findOne({ 
            where: { email },
            select: { id: true, email: true, firstName: true, lastName: true, password: true, role: true, isActive: true }
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('User account is inactive');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, role: user.role };
        return {
            accessToken: this.jwtService.sign(payload),
            user: { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, isActive: user.isActive }
        };
    }

    async register(registerDto: RegisterDto) {
        const { email, password, firstName, lastName, phone } = registerDto;

        const existingUser = await this.databaseService.repoUser().findOne({ where: [{ email }, { phone }] });
        if (existingUser) {
            if (existingUser.email === email) {
                throw new BadRequestException('User with this email already exists');
            }
            if (existingUser.phone === phone) {
                throw new BadRequestException('User with this phone number already exists');
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await this.databaseService.repoUser().save({
            email,
            firstName,
            lastName,
            phone,
            password: hashedPassword
        });

        const payload = { sub: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, role: user.role };
        return {
            accessToken: this.jwtService.sign(payload),
            user: { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role, isActive: user.isActive }
        };
    }

    async getMe(userId: string) {
        const user = await this.databaseService.repoUser().findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (!user.isActive) {
            throw new UnauthorizedException('User account is inactive');
        }
        return user;
    }

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        const user = await this.databaseService.repoUser().findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (updateProfileDto.firstName) user.firstName = updateProfileDto.firstName;
        if (updateProfileDto.lastName) user.lastName = updateProfileDto.lastName;
        if (updateProfileDto.phone) user.phone = updateProfileDto.phone;

        await this.databaseService.repoUser().save(user);
        return user;
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const user = await this.databaseService.repoUser().findOne({ 
            where: { id: userId },
            select: { id: true, password: true } 
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isMatch = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
        if (!isMatch) {
            throw new BadRequestException('Current password is incorrect');
        }

        user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
        await this.databaseService.repoUser().save(user);

        return { message: 'Password changed successfully' };
    }
}

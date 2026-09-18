import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@hospital/database';
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

    async impersonateUser(adminUserId: string, targetUserId: string) {
        if (adminUserId === targetUserId) {
            throw new BadRequestException('Cannot impersonate yourself');
        }

        const admin = await this.databaseService.repoUser().findOne({ where: { id: adminUserId } });
        if (!admin || (admin.role !== UserRole.SUPER_ADMIN && admin.role !== UserRole.ADMIN)) {
            throw new UnauthorizedException('Insufficient permission to impersonate');
        }

        const target = await this.databaseService.repoUser().findOne({ where: { id: targetUserId } });
        if (!target) {
            throw new NotFoundException('Target user not found');
        }
        if (!target.isActive) {
            throw new BadRequestException('Target account cannot be impersonated (inactive)');
        }
        if (target.role === UserRole.SUPER_ADMIN) {
            throw new BadRequestException('Cannot impersonate a super admin');
        }

        console.log(`[AUDIT] IMPERSONATION_STARTED: Admin ${adminUserId} (${admin.email}) started impersonating Target ${targetUserId} (${target.email}) at ${new Date().toISOString()}`);

        const payload = { 
            sub: target.id, 
            email: target.email, 
            name: `${target.firstName} ${target.lastName}`, 
            role: target.role,
            is_impersonating: true,
            original_user_id: admin.id
        };

        return {
            accessToken: this.jwtService.sign(payload, { expiresIn: '30m' }), // Short-lived impersonation token
            user: { id: target.id, name: `${target.firstName} ${target.lastName}`, email: target.email, firstName: target.firstName, lastName: target.lastName, role: target.role, isActive: target.isActive },
            originalUserId: admin.id
        };
    }

    async stopImpersonating(originalUserId: string) {
        const admin = await this.databaseService.repoUser().findOne({ where: { id: originalUserId } });
        if (!admin) {
            throw new UnauthorizedException('Original admin user not found');
        }

        console.log(`[AUDIT] IMPERSONATION_STOPPED: Admin ${originalUserId} (${admin.email}) stopped impersonating at ${new Date().toISOString()}`);

        const payload = { 
            sub: admin.id, 
            email: admin.email, 
            name: `${admin.firstName} ${admin.lastName}`, 
            role: admin.role 
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: { id: admin.id, name: `${admin.firstName} ${admin.lastName}`, email: admin.email, firstName: admin.firstName, lastName: admin.lastName, role: admin.role, isActive: admin.isActive }
        };
    }
}

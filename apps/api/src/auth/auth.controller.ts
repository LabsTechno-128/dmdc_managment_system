import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    login(@Body() body: any) {
        return this.authService.login(body.email, body.password);
    }

    @Post('register')
    register(@Body() body: any) {
        return this.authService.register(body.email, body.password);
    }

    @Post('create-user')
    createUser(@Body() body: any) {
        return this.authService.createUser(body);
    }
}
